var GRID_W = 200;
var GRID_H = 200;
var PIXEL_SIZE = 4;
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var pixelColor = [];
var statusCoords = document.querySelector(".status-coords");
var CGA_PALETTE = ["#000000","#0000AA","#00AA00","#00AAAA","#AA0000","#AA00AA","#AA5500","#AAAAAA","#555555","#5555FF","#55FF55","#55FFFF","#FF5555","#FF55FF","#FFFF55","#ffffff"]
var selectedColor = "#000000";
var isDrawing = false;
var currentTool = "pencil";
var swatches;
var eraserImg = new Image();
eraserImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E";
var crtOn = true;

canvas.width = GRID_W * PIXEL_SIZE;
canvas.height = GRID_H * PIXEL_SIZE;

for (var i = 0; i< 40000; i++) {
pixelColor.push("#ffffff");
}

function drawAll() {
for (var i = 0; i < GRID_H; i++) {
        for (var j = 0; j < GRID_W; j++) {
            ctx.fillStyle = pixelColor[i * GRID_W + j];
            ctx.fillRect(j * PIXEL_SIZE, i * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }

ctx.strokeStyle = "#DDDDDD";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (var x = 0; x <= GRID_W; x++) {
        ctx.moveTo(x * PIXEL_SIZE, 0);
        ctx.lineTo(x * PIXEL_SIZE, canvas.height);
    }
    for (var y = 0; y <= GRID_H; y++) {
        ctx.moveTo(0, y * PIXEL_SIZE);
        ctx.lineTo(canvas.width, y * PIXEL_SIZE);
    }
    ctx.stroke();
}

canvas.addEventListener("mousemove", function(e) {
var rect = canvas.getBoundingClientRect();

var scaleX = canvas.width / rect.width;
var scaleY = canvas.height / rect.height;
var mouseX = (e.clientX - rect.left) * scaleX;
var mouseY = (e.clientY - rect.top) * scaleY;
var pixelX = Math.floor(mouseX / PIXEL_SIZE);
var pixelY = Math.floor(mouseY / PIXEL_SIZE);

if (pixelX >= 0 && pixelX < GRID_W && pixelY >= 0 && pixelY < GRID_H) {
    statusCoords.textContent = "X: " + pixelX + " Y: " + pixelY;
    drawAll();  
    if (currentTool === "eraser") {
        ctx.drawImage(eraserImg, mouseX - 12, mouseY - 12, 24, 24);
    } else {
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
}

if(isDrawing && currentTool != "eyedropper") {
    placePx(pixelX, pixelY);
}
});

function updateCursor() {
    if(currentTool == "pencil") {
        canvas.style.cursor = "crosshair";
    } else if (currentTool == "eraser") {
    canvas.style.cursor = "cell";
    } else if (currentTool == "eyedropper") {
        canvas.style.cursor = "default";
    }
}

function placePx(pixelX, pixelY) {
    var idx = pixelY * GRID_W + pixelX;
    if (currentTool == "eyedropper") {
        selectedColor = pixelColor[idx];
        for (var j = 0; j < swatches.length;j++) {
            swatches[j].className = "swatch inset";
            if (CGA_PALETTE[j] == selectedColor) {
                swatches[j].className = "swatch outset";
            }
        }
        var colordot = document.querySelector(".status-colordot");
        if (colordot) colordot.style.background = selectedColor;
        currentTool = "pencil";
        var toolBtns = document.querySelectorAll(".toolbtn");
        for (var t = 0; t < toolBtns.length; t++) { toolBtns[t].className = "toolbtn outset";}
        pencilBtn.className = "toolbtn inset";
        document.querySelector(".status-tool").textContent = "Tool: Pencil";
        updateCursor();
        return;
    }

    var drawColor = (currentTool === "eraser") ? "#ffffff" : selectedColor;

    if (pixelColor[idx] !== drawColor) {
        pixelColor[idx] = drawColor;
        ctx.fillStyle = drawColor;
        ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)

        if(typeof socket !== "undefined") {
            socket.emit("pixelPlace", {
                x: pixelX,
                y: pixelY,
                color: drawColor
            });
        }
    }
}

canvas.addEventListener("mousedown", function(e) {
    if (e.button == 0) {
    isDrawing = true;
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var mouseX = (e.clientX - rect.left) * scaleX;
        var mouseY = (e.clientY - rect.top) * scaleY;
        var pixelX = Math.floor(mouseX / PIXEL_SIZE);
        var pixelY = Math.floor(mouseY / PIXEL_SIZE);
        if (pixelX >= 0 && pixelX < GRID_W && pixelY >= 0 && pixelY < GRID_H) {
            placePx(pixelX, pixelY);
        }
    }
});
 
document.addEventListener("mouseup", function() {
    isDrawing = false;
});

var toolbar = document.getElementById("toolbar");

var pencilBtn = document.createElement("button");
pencilBtn.className = "toolbtn inset";
pencilBtn.textContent = "p";
pencilBtn.title = "Pencil";
toolbar.appendChild(pencilBtn);

var eraserBtn = document.createElement("button");
eraserBtn.className = "toolbtn outset";
eraserBtn.textContent = "e";
eraserBtn.title = "Eraser";
toolbar.appendChild(eraserBtn);

var eyedropperBtn = document.createElement("button");
eyedropperBtn.className = "toolbtn outset";
eyedropperBtn.textContent = "d";
eyedropperBtn.title = "EyeDropper";
toolbar.appendChild(eyedropperBtn);

var crtBtn = document.createElement("button");
crtBtn.className = "toolbtn outset";
crtBtn.textContent = "CRT";
crtBtn.style.fontSize = "10px";
toolbar.appendChild(crtBtn);

var sep = document.createElement("div");
sep.className = "inset";
sep.style.width = "2px";
sep.style.height = "28px";
sep.style.margin = "0 4px";
toolbar.appendChild(sep);

pencilBtn.onclick =function() {
    currentTool = "pencil";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) { toolBtns[t].className = "toolbtn outset"; }
    pencilBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Pencil";
    updateCursor();
};
eraserBtn.onclick = function() {
    currentTool = "eraser";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) { toolBtns[t].className = "toolbtn outset"; }
    eraserBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Eraser";
    updateCursor();
};

eyedropperBtn.onclick = function() {
    currentTool = "eyedropper";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) {toolBtns[t].className = "toolbtn outset";}
    eyedropperBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Eyedropper";
    updateCursor();
};

crtBtn.onclick = function() {
    crtOn = !crtOn;
    var sl = document.getElementById("scanlines");
    sl.style.display = crtOn ? "block" : "none";
    crtBtn.className = crtOn ? "toolbtn outset" : "toolbtn inset";
};
 
for (var i = 0; i < CGA_PALETTE.length; i++) {
    var sw = document.createElement("div");
    sw.className = "swatch inset";
    sw.style.background = CGA_PALETTE[i];
    sw.setAttribute("data-idx", i);
    toolbar.appendChild(sw);
}
 
swatches = document.querySelectorAll(".swatch");
swatches[0].className = "swatch outset";
 
for (var i = 0; i < swatches.length; i++) {
    swatches[i].onclick = function() {
        var idx = parseInt(this.getAttribute("data-idx"));
        selectedColor = CGA_PALETTE[idx];
        for (var j = 0; j < swatches.length; j++) {
            swatches[j].className = "swatch inset";
        }
        this.className = "swatch outset";
        var colordot = document.querySelector(".status-colordot");
        if (colordot) colordot.style.background = selectedColor;
    };
}

setInterval(function() {
    var d = new Date();
    document.querySelector(".status-clock").textContent = d.toLocaleDateString([], {hour: "2-digit", minute: "2-digit"});
}, 1000);

var ZOOM_LEVELS = [4,8,16,32];
var zoomIdx = 1;

canvas.addEventListener("wheel", function(e) {
    e.preventDefault();
    var sl = document.getElementById("scanlines");
    if (e.deltaY < 0 && zoomIdx < ZOOM_LEVELS.length - 1) {
    zoomIdx++;
    } else if (e.deltaY > 0 && zoomIdx > 0) {
    zoomIdx --;
    }
PIXEL_SIZE = ZOOM_LEVELS[zoomIdx];
canvas.width = GRID_W * PIXEL_SIZE;
canvas.height = GRID_H * PIXEL_SIZE;

canvas.style.width = canvas.width + "px";
canvas.style.height = canvas.height + "px";

sl.style.width = canvas.width + "px";
sl.style.height = canvas.height + "px";

sl.style.background = "100%" + PIXEL_SIZE + "px";

drawAll();
}, {passive: false });
drawAll();
var colordotEl = document.querySelector(".status-colordot");
if (colordotEl) colordotEl.style.background = selectedColor;

var socket = io();

var mapSelect = document.getElementById("mapSelect");
if (mapSelect) {
    mapSelect.addEventListener("change", function() {
        socket.emit("joinMap", this.value);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
}

socket.on("init", function(data) {
    for (var i = 0; i < 40000; i++) {
        pixelColor[i] = data.canvasState[i];
    }
    document.body.className = data.theme || "theme-classic";
    if (mapSelect && data.mapName) {
    mapSelect.value = data.mapName;
}
    drawAll();
    var conn = document.querySelector(".status-conn");
    if (conn) conn.style.background = "#00AA00";
});
socket.on("pixelPlace", function(data) {
    var idx = data.y * GRID_W + data.x;
    pixelColor[idx] = data.color;
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x * PIXEL_SIZE, data.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); 
});
socket.on("userCount", function(count) {
    var userSpan = document.querySelector(".status-users");
    if (userSpan) {
        userSpan.textContent = "Players Online: " + count.toString().padStart(2, "0");
    }
});

socket.on("disconnect", function() {
    var conn = document.querySelector(".status-conn");
    if (conn) conn.style.background = "#AA0000";
});