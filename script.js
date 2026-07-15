// =========================================================
// SPACE STATION MAZE - main game script
// =========================================================

// ---------------------------------------------------------
// 1. SETTINGS
// ---------------------------------------------------------
const SETTINGS = {
  gravity: 0.5,
  jumpPower: -12,
  moveSpeed: 4,
  playerColor: "#ff6b6b",
  platformColor: "#5b7fff",
  deadEndColor: "#8f6bff",
  gemColor: "#ffe066",
  exitColor: "#66ff9e",
  starCount: 80,
};

// ---------------------------------------------------------
// 2. SETUP
// ---------------------------------------------------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("scoreDisplay");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayScore = document.getElementById("overlayScore");
const restartBtn = document.getElementById("restartBtn");

let cameraY = 0;
let gameOver = false;
let gameWon = false;
let platforms = [];
let gems = [];
let exitZone = null;
let player;
let stars = [];

const keys = {};

// ---------------------------------------------------------
// 3. LEVEL
// ---------------------------------------------------------
function buildLevel() {
  platforms = [
    { x: 20, y: 550, width: 150, height: 20, type: "normal" },
    { x: 220, y: 560, width: 90, height: 20, type: "deadend" },
    { x: 20, y: 430, width: 120, height: 20, type: "normal" },
    { x: 250, y: 420, width: 90, height: 20, type: "deadend" },
    { x: 20, y: 300, width: 120, height: 20, type: "normal" },
    { x: 260, y: 290, width: 90, height: 20, type: "deadend" },
    { x: 150, y: 180, width: 120, height: 20, type: "normal" },
    { x: 350, y: 170, width: 90, height: 20, type: "deadend" },
    { x: 30, y: 60, width: 120, height: 20, type: "normal" },
    { x: 200, y: 50, width: 90, height: 20, type: "deadend" },
    { x: 120, y: -60, width: 120, height: 20, type: "normal" },
    { x: 150, y: -180, width: 150, height: 30, type: "exit" },
  ];

  gems = platforms
    .filter((p) => p.type === "deadend")
    .map((p) => ({ x: p.x + p.width / 2, y: p.y - 20, radius: 10, collected: false }));

  const exitPlatform = platforms.find((p) => p.type === "exit");
  exitZone = { x: exitPlatform.x, y: exitPlatform.y - 40, width: exitPlatform.width, height: 40 };

  stars = [];
  for (let i = 0; i < SETTINGS.starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * 1600 - 400,
      size: Math.random() * 2 + 1,
    });
  }
}

function drawStars() {
  ctx.fillStyle = "#ffffff";
  for (const s of stars) {
    const screenY = ((s.y - cameraY * 0.4) % 1600 + 1600) % 1600 - 400;
    ctx.fillRect(s.x, screenY, s.size, s.size);
  }
}

function drawPlatforms() {
  for (const p of platforms) {
    const screenY = p.y - cameraY;
    if (screenY < -30 || screenY > canvas.height + 30) continue;

    if (p.type === "deadend") ctx.fillStyle = SETTINGS.deadEndColor;
    else if (p.type === "exit") ctx.fillStyle = SETTINGS.exitColor;
    else ctx.fillStyle = SETTINGS.platformColor;

    ctx.fillRect(p.x, screenY, p.width, p.height);
  }
}

function drawGems() {
  for (const g of gems) {
    if (g.collected) continue;
    const screenY = g.y - cameraY;
    ctx.fillStyle = SETTINGS.gemColor;
    ctx.beginPath();
    ctx.arc(g.x, screenY, g.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function updateGems() {
  for (const g of gems) {
    if (g.collected) continue;
    const dx = player.x + player.width / 2 - g.x;
    const dy = player.y + player.height / 2 - g.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < g.radius + player.width / 2) {
      g.collected = true;
    }
  }
}

function allGemsCollected() {
  return gems.every((g) => g.collected);
}

// ---------------------------------------------------------
// 4. PLAYER
// ---------------------------------------------------------
function createPlayer() {
  player = {
    x: 40,
    y: 500