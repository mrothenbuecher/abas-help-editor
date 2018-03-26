const config = require('./lib/config.js').getConfig();
const XmlHandler = require('./lib/xml.js');
const shareDbAccess = require('sharedb-access')
var xmlHandler = new XmlHandler(config);

xmlHandler.validate();

var http = require('http');
var path = require('path')
var express = require('express');
// express stuff
var bodyParser = require('body-parser');
var session = require('express-session')
var favicon = require('serve-favicon')

//shareDB
var ShareDB = require('sharedb');
var ShareDBMingoMemory = require('sharedb-mingo-memory');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

var share = new ShareDB({db: new ShareDBMingoMemory()});
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
      doc.create('', callback);
      return;
    }
    callback();
  });

  var doc2 = connection.get('abas-help-editor-info', docName);
  doc2.fetch(function(err) {
    if (err) throw err;
    //doc2.type = "ot-json0";
    if (doc2.type === null) {
      var foo = {};
      foo[username] = 0;
      doc2.create([foo], callback);
      return;
    }else{
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

    // bodyParser
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({
      extended: true
    }));

    // Session config
    app.use(session({
      secret: config.session_secret,
      resave: false,
      saveUninitialized : false,
      cookie: {
        maxAge: 36000000
      }
    }))

    app.post('/auth', function(req, res) {
      var response = {error:true};
      res.setHeader('Content-Type', 'application/json');
      if(req.body.username && !req.session.user){
        req.session.user = req.body.username;
        response.error = false;
      }else if(req.session.user){
        req.session.user = null;
      }
      res.send(JSON.stringify(response));
    });



    // Main
    app.get('/', function(req, res) {
      if (req.session.user) {
        res.render('main');
      } else {
        res.render('auth');
      }
    });
    // edit a document
    app.get('/edit/(:id)', function(req, res) {
      if (req.session.user) {
        var docName = req.params.id;
        if (docName && docName !== "favicon.ico") {
          createDoc(startServer, docName, req.session.user)
        }
        var data = {'docName': docName, user: req.session.user};
        res.render('pad', data);
      } else {
        res.render('auth');
      }
    });

    app.post('/validate/xml/', function(req, res) {
      console.log("Validate xml:", req.body);
      var response = {};
      //TODO
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(response));
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

      share.allowRead('abas-help-editor', function (docId, doc, session)  {
        // console.log("session.user", session.user);
        return true;
      });

      share.allowUpdate('abas-help-editor', function (docId, oldDoc, newDoc, ops, session) {
        // console.log("Update on:"+docId,oldDoc, newDoc);
        return true;
      });

      share.allowRead('abas-help-editor-info', function (docId, doc, session)  {
        // console.log("session.user", session.user);
        return true;
      });

      share.allowUpdate('abas-help-editor-info', function (docId, oldDoc, newDoc, ops, session) {
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
