var GRID_W = 200;
var GRID_H = 200;
var PIXEL_SIZE = 4;
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var pixelColor = [];
var statusCoords = document.querySelector(".status-coords");
var CGA_PALETTE = ["#000000","#0000AA","#00AA00","#00AAAA","#AA0000","#AA00AA","#AA5500","#AAAAAA","#555555","#5555FF","#55FF55","#55FFFF","#FF5555","#FF55FF","#FFFF55","#FFFFFF"]
var selectedColor = "#000000";
var isDrawing = false;

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
ctx.fillStyle = "rgba(0,0,0,0.2)";
ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);}

if(isDrawing) {
    placePx(pixelX, pixelY);
}
});

function placePx(pixelX, pixelY) {
    var idx = pixelY * GRID_W + pixelX;
    pixelColor[idx] = selectedColor;
    ctx.fillStyle = selectedColor;
    ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
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
 
for (var i = 0; i < CGA_PALETTE.length; i++) {
    var sw = document.createElement("div");
    sw.className = "swatch inset";
    sw.style.background = CGA_PALETTE[i];
    sw.setAttribute("data-idx", i);
    toolbar.appendChild(sw);
}
 
var swatches = document.querySelectorAll(".swatch");
swatches[0].className = "swatch outset";
 
for (var i = 0; i < swatches.length; i++) {
    swatches[i].onclick = function() {
        var idx = parseInt(this.getAttribute("data-idx"));
        selectedColor = CGA_PALETTE[idx];
        for (var j = 0; j < swatches.length; j++) {
            swatches[j].className = "swatch inset";
        }
        this.className = "swatch outset";
    };
}

var ZOOM_LEVELS = [4,8,16,32];
var zoomIdx = 1;

canvas.addEventListener("wheel", function(e) {
    e.preventDefault();
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

drawAll();
}, {passive: false });