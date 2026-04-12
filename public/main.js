var GRID_W = 200;
var GRID_H = 200;
var PIXEL_SIZE = 4;
var canvas = document.getElementById("mainCanvas");
var ctx = canvas.getContext("2d");
var pixelColor = [];
var statusCoords = document.querySelector(".status-coords");

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
ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
}
});
drawAll();