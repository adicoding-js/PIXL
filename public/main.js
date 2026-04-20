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
var showGrid = true;
var pixelAuthors = [];
var tooltip = document.createElement("div");
tooltip.id = "pixelTooltip";
document.body.appendChild(tooltip);
var localHistory = [];
var MAX_HISTORY = 50;
var shapeStartX = 0;
var shapeStartY = 0;

canvas.width = GRID_W * PIXEL_SIZE;
canvas.height = GRID_H * PIXEL_SIZE;

for (var i = 0; i< 40000; i++) {
pixelColor.push("#ffffff");
pixelAuthors.push("");
}

function getShapePixels(tool, x0, y0, x1, y1) {
    var pixels = [];
    if (tool === "line") {
        var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        var err = (dx > dy ? dx : -dy) / 2;
        while (true) {
            pixels.push({x: x0, y: y0});
            if (x0 === x1 && y0 === y1) break;
            var e2 = err;
            if (e2 > -dx) { err -= dy; x0 += sx; }
            if (e2 < dy) { err += dx; y0 += sy; }
        }
    } else if (tool === "rect") {
        var minX = Math.min(x0, x1), maxX = Math.max(x0, x1);
        var minY = Math.min(y0, y1), maxY = Math.max(y0, y1);
        for(var x = minX; x <= maxX; x++) { pixels.push({x: x, y: minY}); pixels.push({x: x, y: maxY}); }
        for(var y = minY + 1; y < maxY; y++) { pixels.push({x: minX, y: y}); pixels.push({x: maxX, y: y}); }
    } else if (tool === "circle") {
        var r = Math.round(Math.sqrt(Math.pow(x1-x0, 2) + Math.pow(y1-y0, 2)));
        var x = r, y = 0, err = 0;
        while (x >= y) {
            pixels.push({x: x0 + x, y: y0 + y}, {x: x0 + y, y: y0 + x}, {x: x0 - y, y: y0 + x}, {x: x0 - x, y: y0 + y},
                        {x: x0 - x, y: y0 - y}, {x: x0 - y, y: y0 - x}, {x: x0 + y, y: y0 - x}, {x: x0 + x, y: y0 - y});
            y += 1;
            err += 1 + 2*y;
            if (2*(err-x) + 1 > 0) { x -= 1; err += 1 - 2*x; }
        }
    }
    return pixels;
}

function drawAll() {
for (var i = 0; i < GRID_H; i++) {
        for (var j = 0; j < GRID_W; j++) {
            ctx.fillStyle = pixelColor[i * GRID_W + j];
            ctx.fillRect(j * PIXEL_SIZE, i * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
if (showGrid) {
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
    updateMinimap();
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

    var hoverIdx = pixelY * GRID_W + pixelX;
    var author = pixelAuthors[hoverIdx];
    if (author && author !== "") {
        tooltip.style.display = "block";
        tooltip.textContent = "Placed by " + author;
        tooltip.style.left = (e.clientX + 15) + "px";
        tooltip.style.top = (e.clientY + 15) + "px";
}   else {
        tooltip.style.display = "none";
}
}   else {
    tooltip.style.display = "none";
}

if(isDrawing) {
    if (["pencil", "eraser"].includes(currentTool)) {
        placePx(pixelX, pixelY);
    } else if (["line", "rect", "circle"].includes(currentTool)) {
        var pixels = getShapePixels(currentTool, shapeStartX, shapeStartY, pixelX, pixelY);
        ctx.fillStyle = selectedColor;
        for (var i = 0; i < pixels.length; i++) {
            var p = pixels[i];
            if (p.x >= 0 && p.x < GRID_W && p.y >= 0 && p.y < GRID_H) {
                ctx.fillRect(p.x * PIXEL_SIZE, p.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }
}
});

canvas.addEventListener("mouseout", function() {
    tooltip.style.display = "none";
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
        localHistory.push({
            x: pixelX,
            y: pixelY,
            prevColor: pixelColor[idx],
            prevAuthor: pixelAuthors[idx]
        });
    if (localHistory.length > MAX_HISTORY) {
        localHistory.shift();
    }
        pixelColor[idx] = drawColor;
        pixelAuthors[idx] = globalUsername;
        ctx.fillStyle = drawColor;
        ctx.fillRect(pixelX * PIXEL_SIZE, pixelY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE)
        updateMinimap();
        if(typeof socket !== "undefined") {
            socket.emit("pixelPlace", {
                x: pixelX,
                y: pixelY,
                color: drawColor,
                username: globalUsername
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
            if (["line", "rect", "circle"].includes(currentTool)) {
                shapeStartX = pixelX;
                shapeStartY = pixelY;
            } else {
                placePx(pixelX, pixelY);
            }
        }
    }
});
 
document.addEventListener("mouseup", function(e) {
    if (isDrawing && ["line", "rect", "circle"].includes(currentTool)) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / rect.width;
        var scaleY = canvas.height / rect.height;
        var mouseX = (e.clientX - rect.left) * scaleX;
        var mouseY = (e.clientY - rect.top) * scaleY;
        var pixelX = Math.floor(mouseX / PIXEL_SIZE);
        var pixelY = Math.floor(mouseY / PIXEL_SIZE);

        pixelX = Math.max(0, Math.min(GRID_W - 1, pixelX));
        pixelY = Math.max(0, Math.min(GRID_H - 1, pixelY));

        var pixels = getShapePixels(currentTool, shapeStartX, shapeStartY, pixelX, pixelY);
        for (var i = 0; i < pixels.length; i++) {
            var p = pixels[i];
            if (p.x >= 0 && p.x < GRID_W && p.y >= 0 && p.y < GRID_H) {
                placePx(p.x, p.y);
            }
        }
    }
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

var lineBtn = document.createElement("button");
lineBtn.className = "toolbtn outset";
lineBtn.textContent = "/";
lineBtn.title = "Line";
toolbar.appendChild(lineBtn);

var rectBtn = document.createElement("button");
rectBtn.className = "toolbtn outset";
rectBtn.textContent = "☐";
rectBtn.title = "Rectangle";
toolbar.appendChild(rectBtn);

var circleBtn = document.createElement("button");
circleBtn.className = "toolbtn outset";
circleBtn.textContent = "◯";
circleBtn.title = "Circle";
toolbar.appendChild(circleBtn);

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

lineBtn.onclick = function() {
    currentTool = "line";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) { if (toolBtns[t].textContent !== "CRT") toolBtns[t].className = "toolbtn outset"; }
    lineBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Line";
    updateCursor();
};

rectBtn.onclick = function() {
    currentTool = "rect";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) { if (toolBtns[t].textContent !== "CRT") toolBtns[t].className = "toolbtn outset"; }
    rectBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Rectangle";
    updateCursor();
};

circleBtn.onclick = function() {
    currentTool = "circle";
    var toolBtns = document.querySelectorAll(".toolbtn");
    for (var t = 0; t < toolBtns.length; t++) { if (toolBtns[t].textContent !== "CRT") toolBtns[t].className = "toolbtn outset"; }
    circleBtn.className = "toolbtn inset";
    document.querySelector(".status-tool").textContent = "Tool: Circle";
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

sl.style.backgroundSize = "100%" + PIXEL_SIZE + "px";

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

        var chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            chatMessages.innerHTML = `<div style="color: #888; font-style: italic;">Joined channel: ${this.options[this.selectedIndex].text}</div>`;
            document.getElementById("chatRoomName").textContent = this.options[this.selectedIndex].text.replace(" Canvas", "");
        }
    });
}

socket.on("init", function(data) {
    for (var i = 0; i < 40000; i++) {
        pixelColor[i] = data.canvasState[i];
        pixelAuthors[i] = data.authors ? data.authors[i] : "";
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
    pixelAuthors[idx] = data.username || "";
    ctx.fillStyle = data.color;
    ctx.fillRect(data.x * PIXEL_SIZE, data.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE); 
    updateMinimap();
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

var minimapCanvas = document.getElementById("minimapCanvas");
var minimapCtx = minimapCanvas.getContext("2d");
var contentDiv = document.getElementById("content");

function updateMinimap() {
    if (!minimapCtx) return;
    
    minimapCtx.imageSmoothingEnabled = false;
    minimapCtx.clearRect(0, 0, 100, 100);
    minimapCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 100, 100);

    var visibleW = contentDiv.clientWidth;
    var visibleH = contentDiv.clientHeight;

    var scaleX = 100 / canvas.width;
    var scaleY = 100 / canvas.height;

    var rectX = contentDiv.scrollLeft * scaleX;
    var rectY = contentDiv.scrollTop * scaleY;
    var rectW = visibleW * scaleX;
    var rectH = visibleH * scaleY;

    if (rectW > 100) rectW = 100;
    if (rectH > 100) rectH = 100;

    minimapCtx.strokeStyle = "red";
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(rectX, rectY, rectW, rectH);
    
    minimapCtx.fillStyle = "rgba(0, 0, 0, 0.4)";
    minimapCtx.fillRect(0, 0, 100, rectY);
    minimapCtx.fillRect(0, rectY + rectH, 100, 100 - (rectY + rectH));
    minimapCtx.fillRect(0, rectY, rectX, rectH);
    minimapCtx.fillRect(rectX + rectW, rectY, 100 - (rectX + rectW), rectH);
}

contentDiv.addEventListener("scroll", updateMinimap);

var isDraggingMinimap = false;

function panFromMinimap(e) {
    var rect = minimapCanvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;

    var targetX = (x / 100) * canvas.width;
    var targetY = (y / 100) * canvas.height;

    contentDiv.scrollLeft = targetX - (contentDiv.clientWidth / 2);
    contentDiv.scrollTop = targetY - (contentDiv.clientHeight / 2);
    
    updateMinimap();
}

minimapCanvas.addEventListener("mousedown", function(e) {
    isDraggingMinimap = true;
    panFromMinimap(e);
});

document.addEventListener("mousemove", function(e) {
    if (isDraggingMinimap) {
        panFromMinimap(e);
    }
});

document.addEventListener("mouseup", function() {
    isDraggingMinimap = false;
});

var isPanning = false;
var startX, startY, startScrollLeft, startScrollTop;

contentDiv.addEventListener("mousedown", function(e) {
    if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        
        startX = e.pageX;
        startY = e.pageY;
        startScrollLeft = contentDiv.scrollLeft;
        startScrollTop = contentDiv.scrollTop;
        
        contentDiv.style.cursor = "grabbing";
    }
});

document.addEventListener("mousemove", function(e) {
    if (!isPanning) return;
    e.preventDefault();
    
    var walkX = e.pageX - startX;
    var walkY = e.pageY - startY;
    
    contentDiv.scrollLeft = startScrollLeft - walkX;
    contentDiv.scrollTop = startScrollTop - walkY;
});

document.addEventListener("mouseup", function(e) {
    if (e.button === 1 && isPanning) {
        isPanning = false;
        contentDiv.style.cursor = "auto"; 
        updateCursor(); 
    }
});

var PAN_SPEED = 40;

document.addEventListener("keydown", function(e) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) > -1) {
        e.preventDefault();
        
        if (e.key === "ArrowUp") contentDiv.scrollTop -= PAN_SPEED;
        if (e.key === "ArrowDown") contentDiv.scrollTop += PAN_SPEED;
        if (e.key === "ArrowLeft") contentDiv.scrollLeft -= PAN_SPEED;
        if (e.key === "ArrowRight") contentDiv.scrollLeft += PAN_SPEED;
    }
});

var menuItems = document.querySelectorAll('.menu-item');
var dropdowns = document.querySelectorAll('.dropdown');

menuItems.forEach(function(item){
  item.addEventListener('mousedown', function(e){
   e.stopPropagation();

   var drop = this.querySelector('.dropdown');
   var isVisible = drop && drop.style.display === 'flex';

   dropdowns.forEach(function(d){
    d.style.display = 'none';
   });

   if(!isVisible && drop){
    drop.style.display = 'flex';
   }
  });
});

document.addEventListener('mousedown', function(){
  dropdowns.forEach(function(d){
   d.style.display = 'none';
  });
});

document.getElementById('btnScreenshot').addEventListener('mousedown', function(e){
  e.stopPropagation();

  dropdowns.forEach(function(d){
   d.style.display = 'none';
  });

  var link = document.createElement('a');
  link.download = 'pixl_masterpiece.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

document.getElementById('btnToggleGrid').addEventListener('mousedown', function(e){
  e.stopPropagation();

  dropdowns.forEach(function(d){
   d.style.display = 'none';
  });

  showGrid = !showGrid;
  document.getElementById('gridCheck').textContent = showGrid ? "✓" : "";

  drawAll();
});

var aboutDialog = document.getElementById('aboutDialog');

document.getElementById('btnAbout').addEventListener('mousedown', function(e){
  e.stopPropagation();

  dropdowns.forEach(function(d){
   d.style.display = 'none';
  });

  aboutDialog.style.display = 'block';
});

document.getElementById('closeAbout').onclick = function(){
  aboutDialog.style.display = 'none';
};

document.getElementById('okAbout').onclick = function(){
  aboutDialog.style.display = 'none';
};

var globalUsername = "Player";
var usernameDialog = document.getElementById("usernameDialog");
var usernameInput = document.getElementById("usernameInput");
var mainAppTitle = document.querySelector(".winTitle");

function submitUsername() {
    var val = usernameInput.value.trim();
    if (val !=="") {
        globalUsername = val;
    }
    usernameDialog.style.display = "none";
    mainAppTitle.textContent = "PIXL - " + globalUsername;

    if (typeof socket !== "undefined") {
        socket.emit("setUsername", globalUsername);
    }
}
document.getElementById("okUsername").addEventListener("click", submitUsername);
document.getElementById("closeUsername").addEventListener("click", function() {
    usernameDialog.style.display = "none";
});
usernameInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") submitUsername();
});

function performUndo() {
    if (localHistory.length === 0) return;

    var lastAction = localHistory.pop();
    var idx = lastAction.y * GRID_W + lastAction.x;

    pixelColor[idx] = lastAction.prevColor;
    pixelAuthors[idx] = lastAction.prevAuthor;

    ctx.fillStyle = lastAction.prevColor;
    ctx.fillRect(
        lastAction.x * PIXEL_SIZE,
        lastAction.y * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
    );
    updateMinimap();
    if (typeof socket !== "undefined") {
        socket.emit("pixelPlace", {
            x: lastAction.x,
            y: lastAction.y,
            color: lastAction.prevColor,
            username: lastAction.prevAuthor
        });
    }
}
var btnUndo = document.getElementById('btnUndo');

if (btnUndo) {
    btnUndo.addEventListener('mousedown', function(e) {
        e.stopPropagation();

        dropdowns.forEach(function(d) {
            d.style.display = 'none';
        });

        performUndo();
    });
}
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        performUndo();
    }
});

var chatWindow = document.getElementById("chatWindow");
var chatMessages = document.getElementById("chatMessages");
var chatInput = document.getElementById("chatInput");
var chatSend = document.getElementById("chatSend");
var chatTitlebar = document.getElementById("chatTitlebar");

socket.on("chatMessage", function(data) {
    var msgDiv = document.createElement("div");
    msgDiv.style.marginBottom = "4px";
    var timeString = new Date(data.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    msgDiv.innerHTML = `<span style="color: #888;">[${timeString}]</span> <b>${data.username}:</b> <span class="msg-text"></span>`;
    msgDiv.querySelector('.msg-text').textContent = data.text;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

function sendChat() {
    var text = chatInput.value.trim();
    if (text !== "") {
        socket.emit("chatMessage", text);
        chatInput.value = "";
    }
}

chatSend.addEventListener("click", sendChat);
chatInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendChat();
    }
});

var isDraggingChat = false;
var chatDragOffsetX, chatDragOffsetY;

chatTitlebar.addEventListener("mousedown", function(e) {
    if (e.target.tagName.toLowerCase() === "button") return;
    isDraggingChat = true;
    var rect = chatWindow.getBoundingClientRect();
    chatDragOffsetX = e.clientX - rect.left;
    chatDragOffsetY = e.clientY - rect.top;
});

document.addEventListener("mousemove", function(e) {
    if (isDraggingChat) {
    var parentRect = chatWindow.parentElement.getBoundingClientRect();
    chatWindow.style.bottom = "auto";
    var newLeft = e.clientX - parentRect.left - chatDragOffsetX;
    var newRight = e.clientY - parentRect.top - chatDragOffsetY;
    chatWindow.style.left = newLeft + "px";
    chatWindow.style.top = newRight + "px";
    }
});
document.addEventListener("mouseup", function() {
    isDraggingChat = false;
});

var isChatMin = false;
document.getElementById("minChat").addEventListener("click", function() {
    var chatBody = document.getElementById("chatBody");
    isChatMin = !isChatMin;
    chatBody.style.display = isChatMin ? "none" : "flex";
});