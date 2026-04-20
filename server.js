var express = require("express");
const { realpathSync } = require("fs");
var http = require("http");
var socketio = require("socket.io");
const { threadName } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const { json } = require("body-parser");
const { type } = require("os");

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use(express.static("public"));

var maps = {
    "main": { state: Array(40000).fill("#ffffff"), authors: Array(40000).fill(""), theme: "theme-classic"},
    "dark": {state: Array(40000).fill("#555555"), authors: Array(40000).fill(""), theme: "theme-dark"},
    "retro": { state: Array(40000).fill("#FF55FF"), authors: Array(40000).fill(""), theme: "theme-retro"}
};

const canvas_file = path.join(__dirname, "canvas.json");

if (fs.existsSync(canvas_file)) {
    try{
        const data = JSON.parse(fs.readFileSync(canvas_file, "utf8"));
        for (let map in data) if (maps[map]) maps[map] = data[map];
    } catch (e) {}
}

function saveCanvas(sync = false) {
    try {
        if (sync) fs.writeFileSync(canvas_file, JSON.stringify(maps), "utf-8");
        else fs.writeFile(canvas_file, JSON.stringify(maps), "utf8", () => {});
    } catch (e) {}
}
setInterval(() => saveCanvas(false), 30000);
process.on("SIGINT", () => {
    saveCanvas(true);
    process.exit(0);
});

io.on("connection", function(socket) {
    console.log("connected: " + socket.id);
    socket.currentMap = "main";
    socket.username = "HackClubber";
    socket.join("main");
    socket.emit("init", {canvasState: maps["main"].state, authors: maps["main"].authors, theme: maps["main"].theme, mapName: "main" });
    io.emit("userCount", io.engine.clientsCount);
    socket.on("setUsername", function(username) {
    socket.username = username || "HackClubber";
    });
    socket.on("joinMap", function(mapName) {
        if (!maps[mapName]) mapName = "main";
        socket.leave(socket.currentMap);
        socket.join(mapName);
        socket.currentMap = mapName;
        socket.emit("init", { canvasState: maps[mapName].state, theme: maps[mapName].theme, mapName: mapName });

    socket.emit("init", {
        canvasState: maps[mapName].state,
        authors: maps[mapName].authors,
        theme: maps[mapName].theme,
        mapName: mapName
    });
});

    socket.on("pixelPlace", function(data) {
        if (data.x < 0 || data.x >= 200 || data.y < 0 || data.y >= 200) return;
        if (typeof data.color != "string") return;
        var VALID = ["#000000","#0000AA","#00AA00","#00AAAA","#AA0000","#AA00AA","#AA5500","#AAAAAA","#555555","#5555FF","#55FF55","#55FFFF","#FF5555","#FF55FF","#FFFF55","#ffffff"];
        if (VALID.indexOf(data.color) < 0) return;
        var idx = data.y * 200 + data.x;
        var authorName = data.username || socket.username;
        maps[socket.currentMap].state[idx] = data.color;
        maps[socket.currentMap].authors[idx] = authorName;
        io.to(socket.currentMap).emit("pixelPlace", {x: data.x, y: data.y, color:data.color, username: data.username});
    });
     socket.on("disconnect", function() {
        console.log("disconnected: " + socket.id);
        io.emit("userCount", io.engine.clientsCount);
    });

    socket.on("chatMessage", function(msg) {
        if(typeof msg != "string" || msg.trim().length === 0) return;
        var text = msg.substring(0,150);

    io.to(socket.currentMap).emit("chatMessage", {
        username: socket.username,
        text: text,
        time: Date.now()
     });
});
});

server.listen(3000, function() {
console.log("server started on port 3000");
});