var express = require("express");
var http = require("http");
var socketio = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use(express.static("public"));

server.listen(3000, function() {
console.log("server started on port 3000");
});