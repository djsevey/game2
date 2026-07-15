// =========================================================
//  SPACE STATION MAZE - main game script
//  Sections:
//    1. SETTINGS    - numbers you can tweak for quick fun changes
//    2. SETUP       - canvas + game state
//    3. LEVEL       - the fixed layout of platforms, gems, and exit
//    4. PLAYER      - the character: movement, jumping, drawing
//    5. GAME LOOP   - runs every frame
//    6. INPUT       - keyboard controls
//    7. WIN / LOSE  - game over and restart logic
// =========================================================


// ---------------------------------------------------------
// 1. SETTINGS  <-- easiest place to start experimenting!
// ---------------------------------------------------------
const SETTINGS = {
  gravity: 0.5,
  jumpPower: -12,
  moveSpeed: 4,
  playerColor: "#ff6b6b",
  platformColor: "#5b7fff",
  deadEndColor: "#8f6bff",   // dead-end branch platforms are a different color as a hint
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
// This is a hand-built layout, not randomly generated, so you always
// know exactly where the gems and dead ends are. Every platform is
// {x, y, width, height, type}. "normal" platforms are the main route,
// "deadend" platforms are branches off to the side with a gem to grab.
//
// Want to design your OWN layout? Just edit this list! Remember:
// smaller y = higher up. Keep jumps within about 120px sideways and
// 130px upward so they stay reachable.
function buildLevel() {
  platforms = [
    { x: 20,  y: 550, width: 150, height: 20, type: "normal" },   // start platform
    { x: 220, y: 560, width: 90,  height: 20, type: "deadend" },  // branch 1 (gem)
    { x: 20,  y: 430, width: 120, height: 20, type: "normal" },
    { x: 250, y: 420, width: 90,  height: 20, type: "deadend" },  // branch 2 (gem)
    { x: 20,  y: 300, width: 120, height: 20, type: "normal" },
    { x: 260, y: 290, width: 90,  height: 20, type: "deadend" },  // branch 3 (gem)
    { x: 150, y: 180, width: 120, height: 20, type: "normal" },
    { x: 350, y: 170, width: 90,  height: 20, type: "deadend" },  // branch 4 (gem)
    { x: 30,  y: 60,  width: 120, height: 20, type: "normal" },
    { x: 200, y: 50,  width: 90,  height: 20, type: "deadend" },  // branch 5 (gem)
    { x: 120, y: -60, width: 120, height: 20, type: "normal" },
    { x: 150, y: -180, width: 150, height: 30, type: "exit" },    // exit platform
  ];

  // A gem sits just above the middle of each dead-end platform.
  gems = platforms
    .filter((p) => p.type === "deadend")
    .map((p) => ({ x: p.x + p.width / 2, y: p.y - 20, radius: 10, collected: false }));

  const exitPlatform = platforms.find((p) => p.type === "exit");
  exitZone = { x: exitPlatform.x, y: exitPlatform.y - 40, width: exitPlatform.width, height: 40 };

  // Simple starfield background - stars scroll slower than the
  // foreground so it feels like they're far away (parallax).
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
    y: 500,
    width: 28,
    height: 28,
    vx: 0,
    vy: 0,
    onGround: false,
  };
}

function drawPlayer() {
  ctx.fillStyle = SETTINGS.playerColor;
  const screenY = player.y - cameraY;
  ctx.fillRect(player.x, screenY, player.width, player.height);
}

function updatePlayer() {
  // --- horizontal movement ---
  player.vx = 0;
  if (keys["ArrowLeft"] || keys["a"]) player.vx = -SETTINGS.moveSpeed;
  if (keys["ArrowRight"] || keys["d"]) player.vx = SETTINGS.moveSpeed;
  player.x += player.vx;

  // keep the player inside the canvas horizontally (no wrap-around here,
  // since this level's layout depends on fixed left/right positions)
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  // --- gravity + jumping ---
  player.vy += SETTINGS.gravity;
  player.y += player.vy;

  // --- platform collision (only when falling downward) ---
  player.onGround = false;
  if (player.vy > 0) {
    for (const p of platforms) {
      const withinX = player.x + player.width > p.x && player.x < p.x + p.width;
      const wasAbove = player.y + player.height - player.vy <= p.y;
      const nowBelowTop = player.y + player.height >= p.y;
      if (withinX && wasAbove && nowBelowTop) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  updateGems();

  // --- camera follows the player upward ---
  const targetCameraY = player.y - canvas.height * 0.6;
  if (targetCameraY < cameraY) {
    cameraY = targetCameraY;
  }

  // --- win condition: standing in the exit zone with every gem collected ---
  const inExitZone =
    player.x + player.width > exitZone.x &&
    player.x < exitZone.x + exitZone.width &&
    player.y + player.height > exitZone.y &&
    player.y < exitZone.y + exitZone.height;

  if (inExitZone && allGemsCollected()) {
    endGame(true);
  }

  // --- lose condition: fell below the visible camera view ---
  if (player.y - cameraY > canvas.height + 80) {
    endGame(false);
  }
}

function jump() {
  if (player.onGround) {
    player.vy = SETTINGS.jumpPower;
    player.onGround = false;
  }
}


// ---------------------------------------------------------
// 5. GAME LOOP
// ---------------------------------------------------------
function updateScoreDisplay() {
  const collected = gems.filter((g) => g.collected).length;
  scoreDisplay.textContent = `Gems: ${collected} / ${gems.length}`;
}

function gameLoop() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  drawStars();
  drawPlatforms();
  drawGems();
  drawPlayer();
  updateScoreDisplay();

  requestAnimationFrame(gameLoop);
}


// ---------------------------------------------------------
// 6. INPUT
// ---------------------------------------------------------
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
    jump();
    e.preventDefault();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});


// ---------------------------------------------------------
// 7. WIN / LOSE
// ---------------------------------------------------------
function endGame(won) {
  gameOver = true;
  gameWon = won;

  const collected = gems.filter((g) => g.collected).length;
  overlayTitle.textContent = won ? "You Escaped the Station! 🎉" : "You Fell! 💥";
  overlayScore.textContent = `Gems collected: ${collected} / ${gems.length}`;
  overlay.classList.remove("hidden");
}

function startGame() {
  cameraY = 0;
  gameOver = false;
  gameWon = false;
  overlay.classList.add("hidden");
  buildLevel();
  createPlayer();
  gameLoop();
}

restartBtn.addEventListener("click", startGame);

// Kick things off!
startGame();
