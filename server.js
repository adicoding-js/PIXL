var express = require("express");
const { realpathSync } = require("fs");
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
    
    socket.on("pixelPlace", function(data) {
        if (data.x < 0 || data.x >= 200 || data.y < 0 || data.y >= 200) return;
        if (typeof data.color != "string") return;
        var VALID = ["#000000","#0000AA","#00AA00","#00AAAA","#AA0000","#AA00AA","#AA5500","#AAAAAA","#555555","#5555FF","#55FF55","#55FFFF","#FF5555","#FF55FF","#FFFF55","#ffffff"];
        if (VALID.indexOf(data.color) < 0) return;
        var idx = data.y * 200 + data.x;
        canvasState[idx] = data.color;
        pixelAuthors[idx] = data.username || "Hack-Clubber";
        socket.broadcast.emit("pixelPlace", {x: data.x, y: data.y, color:data.color, username: data.username});
    });
     socket.on("disconnect", function() {
        console.log("disconnected: " + socket.id);
    });
});

server.listen(3000, function() {
console.log("server started on port 3000");
});