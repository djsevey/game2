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
  }const TILE_SIZE = 32;

const MAZE = [
  "####################",
  "#........#.........#",
  "#.####...#...####..#",
  "#.#  #...#...#  #..#",
  "#.#  #### ####  #..#",
  "#.................E#",
  "####################",
];
function drawMaze() {
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      const tile = MAZE[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;

      if (tile === "#") {
        ctx.fillStyle = "#1f2933"; // wall
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = "#0b1120"; // floor
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      }
    }
  }
}
function createPlayer() {
  player = {
    col: 1,
    row: 1,
    x: 1 * TILE_SIZE,
    y: 1 * TILE_SIZE,
    speed: 2,
    dirX: 0,
    dirY: 0,
    size: 24,
  };
}

function updatePlayer() {
  const nextX = player.x + player.dirX * player.speed;
  const nextY = player.y + player.dirY * player.speed;

  const nextCol = Math.floor((nextX + player.size / 2) / TILE_SIZE);
  const nextRow = Math.floor((nextY + player.size / 2) / TILE_SIZE);

  if (MAZE[nextRow][nextCol] !== "#") {
    player.x = nextX;
    player.y = nextY;
    player.col = nextCol;
    player.row = nextRow;
  }
}

function drawPlayer() {
  ctx.fillStyle = SETTINGS.playerColor;
  ctx.beginPath();
  ctx.arc(
    player.x + player.size / 2,
    player.y + player.size / 2,
    player.size / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
}
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") {
    player.dirX = -1; player.dirY = 0;
  }
  if (e.key === "ArrowRight" || e.key === "d") {
    player.dirX = 1; player.dirY = 0;
  }
  if (e.key === "ArrowUp" || e.key === "w") {
    player.dirY = -1; player.dirX = 0;
  }
  if (e.key === "ArrowDown" || e.key === "s") {
    player.dirY = 1; player.dirX = 0;
  }
});
####################
#        ##        #
#   ##   ##   ##   #
#   ##        ##   #
#   ######  ####   #
#   #              #
#   ######   #######
#   #    #   #     #
#   #    #####     #
#   #              #
####################
const TILE_SIZE = 40;

const MAZE = [
  "####################",
  "#........##........#",
  "#.####...##...####.#",
  "#.#  #.......#  #..#",
  "#.#  #### ####  #..#",
  "#........D........E#",
  "####################",
];
function buildMazePlatforms() {
  platforms = [];

  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      const tile = MAZE[row][col];

      if (tile === "#") {
        platforms.push({
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          type: "wall"
        });
      }

      if (tile === "D") {
        gems.push({
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2,
          radius: 10,
          collected: false
        });
      }

      if (tile === "E") {
        exitZone = {
          x: col * TILE_SIZE,
          y: row * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE
        };
      }
    }
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