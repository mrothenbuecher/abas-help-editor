var fs = require('fs');
const ConfigHandler = require('./lib/config.js');
const config = ConfigHandler.getConfig();

init();

function init() {
  if (!fs.existsSync(__dirname + '/' + config.imgupload_dir)) {
    fs.mkdirSync(__dirname + '/' + config.imgupload_dir);
  }
  if (!fs.existsSync(__dirname + '/' + config.fileupload_dir)) {
    fs.mkdirSync(__dirname + '/' + config.fileupload_dir);
  }
  if (!fs.existsSync(__dirname + '/' + config.output_dir_md)) {
    fs.mkdirSync(__dirname + '/' + config.output_dir_md);
  }
  if (!fs.existsSync(__dirname + '/' + config.output_dir_xml)) {
    fs.mkdirSync(__dirname + '/' + config.output_dir_xml);
  }
}

const XmlHandler = require('./lib/xml.js');
const shareDbAccess = require('sharedb-access')
var xmlHandler = new XmlHandler(ConfigHandler);

// xmlHandler.validate();

var http = require('http');
var path = require('path')
var express = require('express');
// express stuff
var bodyParser = require('body-parser');
var session = require('express-session')
var favicon = require('serve-favicon')
const fileUpload = require('express-fileupload');

//shareDB
var ShareDB = require('sharedb');
var ShareDBMingoMemory = require('sharedb-mingo-memory');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

var share = new ShareDB({
  db: new ShareDBMingoMemory()
});
shareDbAccess(share);

createDoc(startServer);


// Create initial document then fire callback
function createDoc(callback, docName, username) {

  if (!docName) {
    docName = "text";
  }

  var connection = share.connect();
  var doc = connection.get('abas-help-editor', docName);
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      var contents = null;
      var path = __dirname + '/' + config.output_dir_md + '/' + docName + '.md';
      if (fs.existsSync(path)) {
        contents = fs.readFileSync(path, 'utf8');
      } else {
        fs.writeFileSync(path, '');
        contents = "";
      }
      if (contents) {
        doc.create(contents, callback);
      } else {
        doc.create('', callback);
      }
      return;
    }
    callback();
  });

  // for caret
  var doc2 = connection.get('abas-help-editor-info', docName);
  doc2.fetch(function(err) {
    if (err) throw err;
    //doc2.type = "ot-json0";
    if (doc2.type === null) {
      var foo = {};
      foo[username] = 0;
      doc2.create([foo], callback);
      return;
    } else {
      var lastOP = {
        p: [username],
        li: 0
      };
      doc2.submitOp([lastOP]);
    }
    callback();
  });

}
var app;

function startServer() {
  if (!app) {
    // Create a web server to serve files and listen to WebSocket connections
    app = express();

    //ejs
    app.set('view engine', 'ejs');
    app.use(express.static(__dirname + '/public'));

    app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
    app.use(fileUpload());

    // bodyParser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    // Session config
    app.use(session({
      secret: config.session_secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 36000000
      }
    }))

    // Login
    app.post('/auth', function(req, res) {
      var response = {
        error: true
      };
      res.setHeader('Content-Type', 'application/json');

      // user already loggedin, logout
      if (req.session.user) {
        req.session.user = null;
        response.error = false;
      } else {
        // auth only with user name
        if (config.auth.length == 0) {
          if (req.body.username) {
            req.session.user = req.body.username;
            response.error = false;
          } else {
            response.reason = "username required";
          }
        // auth with username and password
        } else {
          if (!req.body.username || !req.body.password) {
            response.reason = "username and password required";
          } else {
            var user = req.body.username;
            var pw = req.body.password;
            config.auth.forEach(function(entry, index) {
              if(entry.username === user && entry.password === pw){
                req.session.user = req.body.username;
                response.error = false;
              }
            });
            if(response.error){
              response.reason = "username or password didn't match";
            }
          }
        }
      }
      return res.send(JSON.stringify(response));
    });

    // Main
    app.get('/', function(req, res) {
      if (req.session.user) {
        res.render('main');
      } else {
        var data = {};
        data.auth = (config.auth.length > 0);
        res.render('auth', data);
      }
    });

    // edit a document
    app.get('/edit/(:id)', function(req, res) {
      if (req.session.user) {
        var docName = req.params.id;
        if (docName && docName !== "favicon.ico") {
          createDoc(startServer, docName, req.session.user)
        }
        var data = {
          'docName': docName,
          user: req.session.user
        };
        res.render('pad', data);
      } else {
        var data = {};
        data.auth = (config.auth.length > 0);
        res.render('auth', data);
      }
    });

    // validate xml
    app.post('/validate/xml/', function(req, res) {
      if (!req.session.user) {
        return res.status(403).send('You need to be loggedin.');
      }
      if (req.body.xml) {
        var response = xmlHandler.validate(req.body.xml);
        res.setHeader('Content-Type', 'application/json');
        return res.send(JSON.stringify(response));
      } else {
        return res.status(400).send('No xml was sent');
      }
    });

    // store our xml file
    app.post('/store/xml/(:id)', function(req, res) {
      if (!req.session.user) {
        return res.status(403).send('You need to be loggedin.');
      }
      if (!req.params.id) {
        return res.status(400).send('not document name was given');
      }
      if (req.body.xml) {
        var response = xmlHandler.validate(req.body.xml);
        response.stored = false;
        if (response.xml && response.dtd.length) {
          try {
            fs.writeFileSync(__dirname + '/' + config.output_dir_xml + '/' + req.params.id + ".xml", req.body.xml, {
              flag: 'wx'
            });
            response.stored = true;
          } catch (e) {
            console.error("storeing xml file", (__dirname + '/' + config.output_dir_xml + '/' + req.params.id + ".xml"), " failed", e);
          } finally {

          }
        }
        res.setHeader('Content-Type', 'application/json');
        return res.send(JSON.stringify(response));
      } else {
        return res.status(400).send('No xml was sent');
      }
    });

    // upload File for a document with it id
    app.post('/upload/(:id)', function(req, res) {
      if (!req.session.user) {
        return res.status(403).send('You need to be loggedin.');
      }
      if (!req.files)
        return res.status(400).send('No files were uploaded.');

      var docName = req.params.id;

      // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
      let file = req.files.file;

      let img_regex = /.*png|.*jpg|.*jpeg|.*gif|.*bmp/gi;

      let isImg = true;
      let path = __dirname + '/' + config.imgupload_dir + '/' + docName + '_' + file.name;

      if (!file.mimetype.match(img_regex)) {
        isImg = false;
        path = __dirname + '/' + config.fileupload_dir + '/' + docName + '_' + file.name;
      }

      // Use the mv() method to place the file somewhere on your server
      file.mv(path, function(err) {
        if (err) {
          console.error(err);
          return res.status(500).send(err);
        }
        //TODO logging
        var val = {};
        val.isImg = isImg;
        if (isImg) {
          val.path = config.imgupload_dir;
        } else {
          val.path = config.fileupload_dir;
        }
        res.send(val);
      });
    });

    // get the images
    app.get('/' + config.imgupload_dir + '/:filename', function(req, res) {
      if (!req.session.user) {
        return res.status(403).send('You need to be loggedin.');
      }
      var filename = req.params.filename;
      res.sendFile(__dirname + '/' + config.imgupload_dir + '/' + filename);
    });

    // get the files
    app.get('/' + config.fileupload_dir + '/:filename', function(req, res) {
      if (!req.session.user) {
        return res.status(403).send('You need to be loggedin.');
      }
      var filename = req.params.filename;
      res.sendFile(__dirname + '/' + config.fileupload_dir + '/' + filename);
    });

    //app.use(express.static('static'));
    var server = http.createServer(app);

    // Connect any incoming WebSocket connection to ShareDB
    var wss = new WebSocket.Server({
      server: server
    });
    wss.on('connection', function(ws, req) {
      var stream = new WebSocketJSONStream(ws);
      share.listen(stream);

      share.allowRead('abas-help-editor', function(docId, doc, session) {
        // console.log("session.user", session.user);
        return true;
      });

      // saving md file to filesystem
      share.allowUpdate('abas-help-editor', function(docId, oldDoc, newDoc, ops, session) {
        // console.log("Update on:"+docId,oldDoc, newDoc);
        fs.writeFileSync(__dirname + '/' + config.output_dir_md + '/' + docId + '.md', newDoc);
        //TODO generate XML
        return true;
      });

      // caret position
      share.allowRead('abas-help-editor-info', function(docId, doc, session) {
        // console.log("session.user", session.user);
        return true;
      });

      // caret position
      share.allowUpdate('abas-help-editor-info', function(docId, oldDoc, newDoc, ops, session) {
        // console.log("Update on:"+docId,oldDoc, newDoc);
        return true;
      });

    });

    if (config.public) {
      server.listen(config.port);
      console.log('Listening on http://<public>:' + config.port);
    } else {
      server.listen(config.port, 'localhost');
      console.log('Listening on http://localhost:' + config.port);
    }

  }
}
