var express = require("express");
var http = require("http");
var socketio = require("socket.io");

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use(express.static("public"));

var canvasState = [];
var pixelAuthors = [];
for (var i =0; i < 40000; i++) {
    canvasState.push("#ffffff");
    pixelAuthors.push("");
}

io.on("connection", function(socket) {
    console.log("connected: " + socket.id);
    socket.emit("init", {canvasState: canvasState, pixelAuthors: pixelAuthors});
    
    socket.on("disconnect", function() {
        console.log("disconnected: " + socket.id);
    });
});

server.listen(3000, function() {
console.log("server started on port 3000");
});