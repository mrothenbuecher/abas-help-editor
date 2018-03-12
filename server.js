var http = require('http');
var express = require('express');
var ShareDB = require('sharedb');
var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');

var backend = new ShareDB();


createDoc(startServer);

// Create initial document then fire callback
function createDoc(callback, docName) {

  if (!docName) {
    docName = "text";
  }

  var connection = backend.connect();
  console.log(callback);
  var doc = connection.get('abas-help-editor', docName);
  doc.fetch(function(err) {
    if (err) throw err;
    if (doc.type === null) {
      doc.create('', callback);
      return;
    }
    callback();
  });
}
var app;

function startServer() {
  if (!app) {
    // Create a web server to serve files and listen to WebSocket connections
    app = express();

    app.set('view engine', 'ejs');

    app.use(express.static(__dirname + '/public'));

    // routes for app
    app.get('/', function(req, res) {
      res.render('pad');
    });
    app.get('/(:id)', function(req, res) {
      var docName = req.params.id;
      // console.log("Log - id: ", docName);
      if (docName && docName !== "favicon.ico") {
        createDoc(startServer, docName)
      }
      res.render('pad');
    });

    //app.use(express.static('static'));
    var server = http.createServer(app);

    // Connect any incoming WebSocket connection to ShareDB
    var wss = new WebSocket.Server({
      server: server
    });
    wss.on('connection', function(ws, req) {
      var stream = new WebSocketJSONStream(ws);
      backend.listen(stream);
    });

    server.listen(8000);
    console.log('Listening on http://localhost:8000');
  }
}
