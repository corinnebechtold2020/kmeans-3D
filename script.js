// --- K-Means 3D Demo ---

const canvas = document.getElementById('canvas3d');
const ctx = canvas.getContext('2d');
const kSelect = document.getElementById('k-select');
const assignBtn = document.getElementById('assign-btn');
const moveBtn = document.getElementById('move-btn');
const resetBtn = document.getElementById('reset-btn');


const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const POINTS = 60;
const COLORS = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4'];

let data = [];
let centroids = [];
let assignments = [];
let k = parseInt(kSelect.value);

// Rotation state
let rotY = 0; // azimuth
let rotX = 0; // elevation
let dragging = false;
let lastX = 0, lastY = 0;

function randomPoint3D() {
    return [
        Math.random() * 2 - 1, // x in [-1,1]
        Math.random() * 2 - 1, // y in [-1,1]
        Math.random() * 2 - 1  // z in [-1,1]
    ];
}

function resetData() {
    data = Array.from({length: POINTS}, randomPoint3D);
    assignments = Array(POINTS).fill(-1);
    randomizeCentroids();
    draw();
}

function randomizeCentroids() {
    centroids = Array.from({length: k}, randomPoint3D);
}


function rotate3D([x, y, z], rotY, rotX) {
    // Rotate around Y axis (azimuth)
    let x1 = x * Math.cos(rotY) - z * Math.sin(rotY);
    let z1 = x * Math.sin(rotY) + z * Math.cos(rotY);
    // Rotate around X axis (elevation)
    let y1 = y * Math.cos(rotX) - z1 * Math.sin(rotX);
    let z2 = y * Math.sin(rotX) + z1 * Math.cos(rotX);
    return [x1, y1, z2];
}

function project([x, y, z]) {
    // Apply rotation
    [x, y, z] = rotate3D([x, y, z], rotY, rotX);
    // Simple perspective projection
    const scale = 300 / (z + 3); // z in [-1,1] => scale in [150,100]
    return [
        WIDTH/2 + x * scale,
        HEIGHT/2 - y * scale
    ];
}
// --- Mouse drag to rotate view ---
canvas.addEventListener('mousedown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});
canvas.addEventListener('mousemove', (e) => {
    if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        rotY += dx * 0.01;
        rotX += dy * 0.01;
        rotX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotX)); // Clamp elevation
        lastX = e.clientX;
        lastY = e.clientY;
        draw();
    }
});
canvas.addEventListener('mouseup', () => { dragging = false; });
canvas.addEventListener('mouseleave', () => { dragging = false; });

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Draw lines from points to centroids
    for (let i = 0; i < data.length; ++i) {
        if (assignments[i] !== -1) {
            ctx.strokeStyle = COLORS[assignments[i]];
            ctx.beginPath();
            const [x1, y1] = project(data[i]);
            const [x2, y2] = project(centroids[assignments[i]]);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    // Draw data points
    for (let i = 0; i < data.length; ++i) {
        ctx.fillStyle = assignments[i] === -1 ? '#888' : COLORS[assignments[i]];
        const [x, y] = project(data[i]);
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.stroke();
    }
    // Draw centroids
    for (let i = 0; i < centroids.length; ++i) {
        ctx.fillStyle = COLORS[i];
        const [x, y] = project(centroids[i]);
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}

function assignPoints() {
    for (let i = 0; i < data.length; ++i) {
        let minDist = Infinity, minIdx = -1;
        for (let j = 0; j < centroids.length; ++j) {
            const d = dist3(data[i], centroids[j]);
            if (d < minDist) {
                minDist = d;
                minIdx = j;
            }
        }
        assignments[i] = minIdx;
    }
    draw();
}

function moveCentroids() {
    let changed = false;
    for (let j = 0; j < centroids.length; ++j) {
        let sum = [0,0,0], count = 0;
        for (let i = 0; i < data.length; ++i) {
            if (assignments[i] === j) {
                sum[0] += data[i][0];
                sum[1] += data[i][1];
                sum[2] += data[i][2];
                count++;
            }
        }
        if (count > 0) {
            let newCentroid = sum.map(x => x / count);
            if (!arraysEqual(newCentroid, centroids[j])) changed = true;
            centroids[j] = newCentroid;
        }
    }
    draw();
    return changed;
}

function dist3(a, b) {
    return Math.sqrt(
        (a[0]-b[0])**2 +
        (a[1]-b[1])**2 +
        (a[2]-b[2])**2
    );
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
}

kSelect.addEventListener('change', () => {
    k = parseInt(kSelect.value);
    randomizeCentroids();
    assignments = Array(POINTS).fill(-1);
    draw();
});
assignBtn.addEventListener('click', assignPoints);
moveBtn.addEventListener('click', moveCentroids);
resetBtn.addEventListener('click', resetData);

resetData();
