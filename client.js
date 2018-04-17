var sharedb = require('sharedb/lib/client');
var StringBinding = require('sharedb-string-binding');

pd = require('pretty-data').pd;

var socket = null;
// Open WebSocket connection to ShareDB server
if (location.protocol != 'https:'){
  socket = new WebSocket('ws://' + window.location.host);
}else{
  socket = new WebSocket('wss://' + window.location.host);
}
var connection = new sharedb.Connection(socket);

docName = document.location.pathname.substring(1).split("/")[1];

if (!docName) {
  docName = "text";
}

// Create local Doc instance mapped to 'examples' collection document with id 'textarea'
var doc = connection.get('abas-help-editor', docName);
doc.subscribe(function(err) {
  if (err) throw err;
  var element = document.getElementById("pad");
  var binding = new StringBinding(element, doc);
  binding.setup();
});

infoDocument = connection.get('abas-help-editor-info', docName);
