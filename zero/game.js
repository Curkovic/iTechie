const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const stateSpan = document.getElementById("state-value");
const onesSpan = document.getElementById("ones-value");
const scoreSpan = document.getElementById("score-value");
const messageEl = document.getElementById("message");

const GROUND_Y = canvas.height - 60;
const GRAVITY = 0.7;
const JUMP_VELOCITY = -13;
const GAME_SPEED_START = 6;

let lastTime = 0;
let gameSpeed = GAME_SPEED_START;
let obstacles = [];
let spawnTimer = 0;
let spawnInterval = 1200; // ms
let running = false;
let gameOver = false;

// zero / runner character
const player = {
  x: 80,
  y: GROUND_Y - 40,
  width: 40,
  height: 40,
  vy: 0,
  onGround: true
};

// logical state
let currentState = 0; // 0 or 1
let onesCount = 0;
let score = 0;

function resetGame() {
  obstacles = [];
  gameSpeed = GAME_SPEED_START;
  spawnTimer = 0;
  running = false;
  gameOver = false;

  player.y = GROUND_Y - 40;
  player.vy = 0;
  player.onGround = true;

  currentState = 0;
  onesCount = 0;
  score = 0;

  updateUI();
  messageEl.textContent = "PRESS SPACE OR TAP TO START";
  messageEl.classList.remove("hidden");
}

function startGame() {
  if (running) return;
  if (gameOver) {
    resetGame();
  }
  running = true;
  messageEl.classList.add("hidden");
}

function updateUI() {
  stateSpan.textContent = currentState;
  onesSpan.textContent = onesCount;
  scoreSpan.textContent = score;
}

function spawnObstacle() {
  const type = Math.random() < 0.5 ? 0 : 1; // 0 or 1 block
  const size = 40;
  const obstacle = {
    x: canvas.width + 10,
    y: GROUND_Y - size,
    width: size,
    height: size,
    type
  };
  obstacles.push(obstacle);
}

// basic AABB collision
function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function endGame(reason) {
  gameOver = true;
  running = false;
  messageEl.textContent = reason + " // TAP OR PRESS SPACE TO REBOOT";
  messageEl.classList.remove("hidden");
}

function update(delta) {
  if (!running) return;

  // player physics
  player.vy += GRAVITY;
  player.y += player.vy;
  if (player.y >= GROUND_Y - player.height) {
    player.y = GROUND_Y - player.height;
    player.vy = 0;
    player.onGround = true;
  }

  // obstacles
  spawnTimer += delta;
  if (spawnTimer > spawnInterval) {
    spawnObstacle();
    spawnTimer = 0;
    // gradually faster
    if (spawnInterval > 700) spawnInterval -= 20;
    gameSpeed += 0.05;
  }

  obstacles.forEach(o => {
    o.x -= gameSpeed;
  });
  obstacles = obstacles.filter(o => o.x + o.width > 0);

  // collision and logic
  for (const o of obstacles) {
    if (isColliding(player, o)) {
      if (o.type === 0) {
        currentState = 0;
      } else {
        currentState = 1;
        onesCount += 1;
        if (onesCount > 5) {
          updateUI();
          endGame("ONES OVERFLOW");
          return;
        }
      }
      // move obstacle offscreen after hit to avoid multiple triggers
      o.x = -999;
    }
  }

  score += 1;
  updateUI();
}

function drawBackground() {
  // parallax "city" bars for cyberpunk feel
  ctx.fillStyle = "#02030a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ground line
  ctx.strokeStyle = "#f6ff00";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 0.5);
  ctx.lineTo(canvas.width, GROUND_Y + 0.5);
  ctx.stroke();

  // neon skyline
  ctx.fillStyle = "#050814";
  for (let i = 0; i < canvas.width; i += 60) {
    const w = 40;
    const h = 40 + Math.random() * 40;
    ctx.fillRect(i, GROUND_Y - h, w, h);
  }

  // horizontal scanline accents
  ctx.strokeStyle = "rgba(246,255,0,0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = 40; y < GROUND_Y; y += 30) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
}

function drawPlayer() {
  // main body
  ctx.fillStyle = "#f6ff00";
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // "ZERO" label
  ctx.fillStyle = "#02030a";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ZERO", player.x + player.width / 2, player.y + player.height / 2 + 3);

  // glitch border
  ctx.strokeStyle = "#00f7ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
}

function drawObstacles() {
  obstacles.forEach(o => {
    if (o.type === 0) {
      ctx.fillStyle = "#101010";
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.strokeStyle = "#f6ff00";
      ctx.strokeRect(o.x, o.y, o.width, o.height);
      ctx.fillStyle = "#f6ff00";
      ctx.font = "18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("0", o.x + o.width / 2, o.y + o.height / 2 + 6);
    } else {
      ctx.fillStyle = "#f6ff00";
      ctx.fillRect(o.x, o.y, o.width, o.height);
      ctx.strokeStyle = "#00f7ff";
      ctx.strokeRect(o.x, o.y, o.width, o.height);
      ctx.fillStyle = "#02030a";
      ctx.font = "18px monospace";
      ctx.textAlign = "center";
      ctx.fillText("1", o.x + o.width / 2, o.y + o.height / 2 + 6);
    }
  });
}

function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  drawBackground();
  update(delta);
  drawObstacles();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

// controls
function jump() {
  if (!running) {
    startGame();
    return;
  }
  if (!gameOver && player.onGround) {
    player.onGround = false;
    player.vy = JUMP_VELOCITY;
  } else if (gameOver) {
    resetGame();
  }
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.key === " ") {
    e.preventDefault();
    jump();
  }
});

window.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
});

// init
resetGame();
requestAnimationFrame(gameLoop);
