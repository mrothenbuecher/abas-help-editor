var sharedb = require('sharedb/lib/client');
var StringBinding = require('sharedb-string-binding');

// Open WebSocket connection to ShareDB server
var socket = new WebSocket('ws://' + window.location.host);
var connection = new sharedb.Connection(socket);

var docName = document.location.pathname.substring(1).split("/")[1];

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
