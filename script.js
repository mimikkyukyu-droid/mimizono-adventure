(() => {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const overlayText = document.getElementById("overlayText");
  const overlayTitle = document.getElementById("overlayTitle");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const livesDisplay = document.getElementById("livesDisplay");
  const stageNameEl = document.getElementById("stageName");
  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");
  const btnJump = document.getElementById("btnJump");

  const WORLD_W = 3600;
  const GROUND_Y = 460;
  const GRAVITY = 0.55;
  const STAGE_NAME = "ステージ1：パステル草原";

  const GameState = {
    TITLE: "title",
    PLAYING: "playing",
    CLEAR: "clear",
    GAMEOVER: "gameover",
  };

  const keys = { left: false, right: false, jump: false, jumpPressed: false };
  const touch = { left: false, right: false, jump: false, jumpPressed: false };

  let state = GameState.TITLE;
  let score = 0;
  let lives = 3;
  let cameraX = 0;
  let time = 0;
  let invincibleUntil = 0;
  let goalReached = false;
  let goalTimer = 0;
  let gameOverTimer = 0;
  let particles = [];
  let playerSprite = null;
  let audioCtx = null;
  let bgmGain = null;
  let bgmPlaying = false;
  let bgmStep = 0;
  let bgmTimer = null;
  let screenShake = 0;
  let gameOverShowOverlay = false;
  let clearStars = [];

  const player = {
    x: 80,
    y: 0,
    w: 44,
    h: 52,
    vx: 0,
    vy: 0,
    speed: 4.2,
    jumpPower: -11.5,
    onGround: false,
    jumpsLeft: 2,
    facing: 1,
    anim: 0,
    squash: 1,
    stretch: 1,
  };

  const platforms = [
    { x: 0, y: GROUND_Y, w: 520, h: 80, type: "ground" },
    { x: 620, y: GROUND_Y, w: 280, h: 80, type: "ground" },
    { x: 1000, y: GROUND_Y, w: 200, h: 80, type: "ground" },
    { x: 1300, y: GROUND_Y, w: 360, h: 80, type: "ground" },
    { x: 1780, y: GROUND_Y, w: 240, h: 80, type: "ground" },
    { x: 2120, y: GROUND_Y, w: 300, h: 80, type: "ground" },
    { x: 2520, y: GROUND_Y, w: 200, h: 80, type: "ground" },
    { x: 2820, y: GROUND_Y, w: 780, h: 80, type: "ground" },
    { x: 300, y: 380, w: 120, h: 24, type: "platform" },
    { x: 480, y: 330, w: 100, h: 24, type: "platform" },
    { x: 760, y: 360, w: 140, h: 24, type: "platform" },
    { x: 1080, y: 310, w: 110, h: 24, type: "platform" },
    { x: 1420, y: 350, w: 130, h: 24, type: "platform" },
    { x: 1600, y: 290, w: 100, h: 24, type: "platform" },
    { x: 1880, y: 340, w: 120, h: 24, type: "platform" },
    { x: 2240, y: 300, w: 140, h: 24, type: "platform" },
    { x: 2580, y: 360, w: 110, h: 24, type: "platform" },
    { x: 2960, y: 320, w: 130, h: 24, type: "platform" },
    { x: 3180, y: 270, w: 100, h: 24, type: "platform" },
  ];

  const stars = [
    { x: 340, y: 350, r: 12, taken: false },
    { x: 510, y: 300, r: 12, taken: false },
    { x: 820, y: 330, r: 12, taken: false },
    { x: 1120, y: 280, r: 12, taken: false },
    { x: 1470, y: 320, r: 12, taken: false },
    { x: 1630, y: 260, r: 12, taken: false },
    { x: 1920, y: 310, r: 12, taken: false },
    { x: 2290, y: 270, r: 12, taken: false },
    { x: 2620, y: 330, r: 12, taken: false },
    { x: 3000, y: 290, r: 12, taken: false },
    { x: 3210, y: 240, r: 12, taken: false },
    { x: 1500, y: GROUND_Y - 30, r: 12, taken: false },
    { x: 2400, y: GROUND_Y - 30, r: 12, taken: false },
  ];

  const enemies = [
    { type: "sleepy", x: 400, y: 0, w: 38, h: 34, speed: 1.2, dir: 1, alive: true },
    { type: "dishes", x: 900, y: 0, w: 40, h: 36, speed: 1.0, dir: 1, alive: true },
    { type: "constipation", x: 1350, y: 0, w: 36, h: 38, speed: 0.9, dir: -1, alive: true },
    { type: "sleepy", x: 320, y: 0, w: 38, h: 34, speed: 1.0, dir: 1, alive: true, platformOnly: true },
    { type: "dishes", x: 770, y: 0, w: 40, h: 36, speed: 0.95, dir: -1, alive: true, platformOnly: true },
    { type: "sleepy", x: 1700, y: 0, w: 38, h: 34, speed: 1.1, dir: 1, alive: true },
    { type: "dishes", x: 2050, y: 0, w: 40, h: 36, speed: 1.0, dir: -1, alive: true },
    { type: "constipation", x: 2450, y: 0, w: 36, h: 38, speed: 0.85, dir: 1, alive: true },
    { type: "constipation", x: 1450, y: 0, w: 36, h: 38, speed: 0.8, dir: 1, alive: true, platformOnly: true },
    { type: "sleepy", x: 2900, y: 0, w: 38, h: 34, speed: 1.2, dir: -1, alive: true },
    { type: "dishes", x: 3300, y: 0, w: 40, h: 36, speed: 1.0, dir: 1, alive: true },
    { type: "dishes", x: 2990, y: 0, w: 40, h: 36, speed: 0.9, dir: -1, alive: true, platformOnly: true },
  ];

  const goal = { x: WORLD_W - 120, y: GROUND_Y - 120, w: 60, h: 120 };

  function ensureAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = "square", volume = 0.08) {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
  }

  function playJumpSound() {
    playTone(420, 0.08, "sine", 0.1);
    setTimeout(() => playTone(560, 0.06, "sine", 0.08), 40);
  }

  function playStarSound() {
    playTone(660, 0.06, "triangle", 0.1);
    setTimeout(() => playTone(880, 0.08, "triangle", 0.1), 60);
    setTimeout(() => playTone(1100, 0.1, "triangle", 0.08), 120);
  }

  function playStompSound() {
    playTone(180, 0.12, "square", 0.12);
    setTimeout(() => playTone(120, 0.1, "square", 0.1), 50);
  }

  function playHurtSound() {
    playTone(300, 0.15, "sawtooth", 0.1);
    setTimeout(() => playTone(200, 0.2, "sawtooth", 0.08), 80);
  }

  function playGoalSound() {
    const fanfare = [523, 659, 784, 1047, 1319, 1047, 1319, 1568];
    fanfare.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.22, "triangle", 0.11), i * 100);
    });
    setTimeout(() => playTone(1047, 0.4, "square", 0.07), 850);
  }

  function playGameOverSound() {
    stopBGM();
    [392, 349, 311, 262, 196].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.32, "square", 0.09), i * 200);
    });
  }

  const BGM_MELODY = [
    523, 0, 587, 523, 659, 0, 587, 0,
    698, 659, 587, 523, 659, 587, 523, 0,
    392, 440, 494, 523, 494, 440, 392, 0,
    523, 587, 659, 698, 784, 698, 659, 0,
  ];

  const BGM_BASS = [
    131, 0, 131, 147, 165, 0, 165, 147,
    131, 0, 131, 147, 165, 0, 131, 0,
    98, 0, 98, 110, 123, 0, 123, 110,
    131, 0, 147, 165, 131, 0, 98, 0,
  ];

  function playBGMNote(freq, duration, type, volume, startTime) {
    if (!freq || !audioCtx || !bgmGain) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration - 0.02);
    osc.connect(gain);
    gain.connect(bgmGain);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function scheduleBGMStep() {
    if (!bgmPlaying || !audioCtx || state !== GameState.PLAYING) return;

    const step = bgmStep % BGM_MELODY.length;
    const beat = 60 / 132 / 2;
    const now = audioCtx.currentTime;

    const melody = BGM_MELODY[step];
    const bass = BGM_BASS[step];
    if (melody) playBGMNote(melody, beat * 0.9, "square", 0.045, now);
    if (bass) playBGMNote(bass, beat * 0.95, "triangle", 0.06, now);
    if (step % 4 === 0) playBGMNote(80, 0.04, "square", 0.03, now);

    bgmStep++;
    bgmTimer = setTimeout(scheduleBGMStep, beat * 1000);
  }

  function startBGM() {
    ensureAudio();
    if (!bgmGain) {
      bgmGain = audioCtx.createGain();
      bgmGain.gain.value = 0.55;
      bgmGain.connect(audioCtx.destination);
    }
    if (bgmPlaying) return;
    bgmPlaying = true;
    bgmStep = 0;
    scheduleBGMStep();
  }

  function stopBGM() {
    bgmPlaying = false;
    if (bgmTimer) {
      clearTimeout(bgmTimer);
      bgmTimer = null;
    }
  }

  function applyPlayerSpriteSize(sw, sh, source) {
    const targetH = 52;
    const scale = targetH / sh;
    playerSprite = {
      image: source,
      sw,
      sh,
      dw: Math.round(sw * scale),
      dh: Math.round(sh * scale),
    };
    player.w = playerSprite.dw;
    player.h = playerSprite.dh;
    player.y = GROUND_Y - player.h;
  }

  function loadPlayerSprite() {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        applyPlayerSpriteSize(img.width, img.height, img);
        resolve();
      };
      img.onerror = () => {
        playerSprite = null;
        resolve();
      };
      img.src = "player.png?v=2";
    });
  }

  function resetGame() {
    score = 0;
    lives = 3;
    cameraX = 0;
    time = 0;
    invincibleUntil = 0;
    goalReached = false;
    goalTimer = 0;
    gameOverTimer = 0;
    gameOverShowOverlay = false;
    screenShake = 0;
    particles = [];
    clearStars = [];

    player.x = 80;
    player.y = GROUND_Y - player.h;
    player.vx = 0;
    player.vy = 0;
    player.onGround = true;
    player.jumpsLeft = 2;
    player.facing = 1;
    player.anim = 0;
    player.squash = 1;
    player.stretch = 1;

    stars.forEach((s) => { s.taken = false; });
    enemies.forEach((e) => {
      e.alive = true;
      e.dir = e.dir >= 0 ? 1 : -1;
    });
    placeEnemiesOnGround();

    updateHUD();
  }

  function updateHUD() {
    scoreDisplay.textContent = String(score);
    livesDisplay.textContent = "♥".repeat(lives) + "♡".repeat(Math.max(0, 3 - lives));
    stageNameEl.textContent = STAGE_NAME;
  }

  function startGame() {
    ensureAudio();
    resetGame();
    state = GameState.PLAYING;
    overlayTitle.textContent = "みみぞの大冒険";
    overlay.classList.add("hidden");
    startBGM();
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function getSurfaceYAt(x, feetY = GROUND_Y, preferPlatform = false) {
    let surface = null;

    for (const p of platforms) {
      if (x < p.x || x > p.x + p.w) continue;
      if (preferPlatform && p.type !== "platform") continue;
      if (!preferPlatform && p.type === "platform" && Math.abs(feetY - p.y) > 50) continue;
      if (surface === null || p.y < surface) surface = p.y;
    }

    return surface;
  }

  function getEnemyGroundY(ex, ew, preferPlatform = false) {
    const cx = ex + ew / 2;
    const feetY = preferPlatform ? GROUND_Y : GROUND_Y;
    return getSurfaceYAt(cx, feetY, preferPlatform) ?? GROUND_Y;
  }

  function placeEnemiesOnGround() {
    enemies.forEach((e) => {
      const gy = getEnemyGroundY(e.x, e.w, !!e.platformOnly);
      e.y = gy - e.h;
      e.groundY = gy;
    });
  }

  function enemyHasGroundAhead(e) {
    const probeX = e.dir > 0 ? e.x + e.w + 8 : e.x - 8;
    const centerX = e.x + e.w / 2;
    const feetY = e.y + e.h;
    const currentY = getSurfaceYAt(centerX, feetY, !!e.platformOnly);
    const aheadY = getSurfaceYAt(probeX, feetY, !!e.platformOnly);

    if (currentY === null || aheadY === null) return false;

    const step = aheadY - currentY;
    return step <= 32 && step >= -16;
  }

  function enemyHitsWall(e, nextX) {
    const frontX = e.dir > 0 ? nextX + e.w : nextX;
    for (const p of platforms) {
      if (frontX <= p.x || frontX >= p.x + p.w) continue;
      const onTop = e.y + e.h <= p.y + 10;
      if (!onTop && e.y + e.h > p.y + 12 && e.y < p.y + p.h) {
        return true;
      }
    }
    return false;
  }

  function spawnParticles(x, y, colors, count, speed = 3) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * speed * 2,
        vy: (Math.random() - 1) * speed,
        life: 30 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
      });
    }
  }

  function spawnJumpEffect() {
    spawnParticles(
      player.x + player.w / 2,
      player.y + player.h,
      ["#fff8b0", "#ffd0e8", "#b8e8ff"],
      8,
      2.5
    );
  }

  function spawnStompEffect(x, y) {
    spawnParticles(x, y, ["#ffe080", "#ffb0c0", "#c0e8ff", "#fff"], 14, 4);
  }

  function spawnGameOverEffect() {
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: player.x + player.w / 2 + (Math.random() - 0.5) * 60,
        y: player.y + player.h / 2 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 1.2) * 8,
        life: 50 + Math.random() * 40,
        color: ["#ff6080", "#ffd080", "#80c0ff", "#ff4040", "#fff"][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 8,
      });
    }
  }

  function triggerGameOver() {
    state = GameState.GAMEOVER;
    gameOverTimer = 0;
    gameOverShowOverlay = false;
    invincibleUntil = 0;
    screenShake = 28;
    player.vx = 0;
    player.vy = -9;
    player.onGround = false;
    spawnGameOverEffect();
    playGameOverSound();
    overlayTitle.textContent = "ゲームオーバー";
    overlayText.textContent = "スペースまたはタップでリトライ";
  }

  function spawnConfetti(x, y, count, spread = 6) {
    const colors = ["#ff6080", "#ffd040", "#60d0ff", "#80ff90", "#ff90d0", "#fff060", "#c080ff"];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * spread,
        vy: -3 - Math.random() * spread,
        life: 60 + Math.random() * 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 5,
        kind: "confetti",
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        w: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
      });
    }
  }

  function spawnFirework(x, y) {
    const colors = ["#ff4060", "#ffe040", "#40c0ff", "#ff80c0", "#80ff60"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 35 + Math.random() * 25,
        color,
        size: 3 + Math.random() * 4,
        kind: "spark",
      });
    }
    playTone(880 + Math.random() * 200, 0.12, "triangle", 0.06);
  }

  function spawnClearStars(cx, cy) {
    for (let i = 0; i < 12; i++) {
      clearStars.push({
        x: cx,
        y: cy,
        angle: (Math.PI * 2 * i) / 12,
        dist: 40 + Math.random() * 30,
        speed: 0.04 + Math.random() * 0.03,
        life: 120 + Math.random() * 40,
        size: 8 + Math.random() * 8,
        color: ["#ffe060", "#fff", "#ffd0e8"][Math.floor(Math.random() * 3)],
      });
    }
  }

  function spawnGoalEffect() {
    const gx = goal.x + goal.w / 2;
    const gy = goal.y + goal.h / 2;
    spawnConfetti(gx, gy, 80, 8);
    spawnConfetti(player.x + player.w / 2, player.y, 50, 7);
    spawnClearStars(gx, gy - 40);
    screenShake = 14;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        spawnFirework(
          goal.x + goal.w / 2 + (Math.random() - 0.5) * 120,
          goal.y - 20 - Math.random() * 60
        );
      }, i * 350);
    }
  }

  function tryJump() {
    if (state !== GameState.PLAYING) return;
    if (player.jumpsLeft > 0) {
      player.vy = player.jumpPower;
      player.onGround = false;
      player.jumpsLeft--;
      player.squash = 0.85;
      player.stretch = 1.15;
      playJumpSound();
      spawnJumpEffect();
    }
  }

  function handleInput() {
    const left = keys.left || touch.left;
    const right = keys.right || touch.right;
    const jumpPressed = keys.jumpPressed || touch.jumpPressed;

    if (left) {
      player.vx = -player.speed;
    } else if (right) {
      player.vx = player.speed;
    } else {
      player.vx *= 0.75;
      if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    if (jumpPressed) {
      tryJump();
      keys.jumpPressed = false;
      touch.jumpPressed = false;
    }
  }

  function resolvePlatformCollision() {
    player.onGround = false;
    player.vy += GRAVITY;

    const nextX = player.x + player.vx;
    const nextY = player.y + player.vy;

    let newX = nextX;
    let newY = nextY;

    for (const p of platforms) {
      const prevBottom = player.y + player.h;
      const nextBottom = nextY + player.h;

      if (
        nextX + player.w > p.x &&
        nextX < p.x + p.w &&
        nextY + player.h > p.y &&
        nextY < p.y + p.h
      ) {
        const overlapLeft = nextX + player.w - p.x;
        const overlapRight = p.x + p.w - nextX;
        const overlapTop = nextY + player.h - p.y;
        const overlapBottom = p.y + p.h - nextY;

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

        if (minOverlap === overlapTop && player.vy >= 0 && prevBottom <= p.y + 8) {
          newY = p.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.jumpsLeft = 2;
          if (player.squash < 1) {
            player.squash = 1.1;
            player.stretch = 0.9;
          }
        } else if (minOverlap === overlapBottom && player.vy < 0) {
          newY = p.y + p.h;
          player.vy = 0;
        } else if (minOverlap === overlapLeft) {
          newX = p.x - player.w;
          player.vx = 0;
        } else if (minOverlap === overlapRight) {
          newX = p.x + p.w;
          player.vx = 0;
        }
      }
    }

    player.x = newX;
    player.y = newY;

    if (player.y > canvas.height + 100) {
      takeDamage(true);
    }
  }

  function takeDamage(fromPit = false) {
    if (time < invincibleUntil) return;

    lives--;
    playHurtSound();
    updateHUD();
    invincibleUntil = time + 120;
    spawnParticles(player.x + player.w / 2, player.y + player.h / 2, ["#ff8080", "#ffb0b0"], 12, 3);

    if (fromPit) {
      player.x = Math.max(40, player.x - 80);
      player.y = GROUND_Y - player.h;
      player.vy = 0;
    } else {
      player.vx = -player.facing * 5;
      player.vy = -6;
    }

    if (lives <= 0) {
      triggerGameOver();
    }
  }

  function updateEnemies() {
    enemies.forEach((e) => {
      if (!e.alive) return;

      const nextX = e.x + e.speed * e.dir;
      let shouldTurn = false;

      if (nextX < 0 || nextX + e.w > WORLD_W) {
        shouldTurn = true;
      } else if (!enemyHasGroundAhead(e)) {
        shouldTurn = true;
      } else if (enemyHitsWall(e, nextX)) {
        shouldTurn = true;
      }

      if (shouldTurn) {
        e.dir *= -1;
      } else {
        e.x = nextX;
      }

      const surfaceY = getSurfaceYAt(e.x + e.w / 2, e.y + e.h, !!e.platformOnly);
      if (surfaceY !== null) {
        e.y = surfaceY - e.h;
        e.groundY = surfaceY;
      } else {
        e.y += 4;
        if (e.y > GROUND_Y + 200) e.alive = false;
      }
    });
  }

  function updateStars() {
    stars.forEach((s) => {
      if (s.taken) return;
      const starBox = { x: s.x - s.r, y: s.y - s.r, w: s.r * 2, h: s.r * 2 };
      if (rectsOverlap(player, starBox)) {
        s.taken = true;
        score += 10;
        playStarSound();
        spawnParticles(s.x, s.y, ["#fff8a0", "#ffe060", "#fff"], 10, 3);
        updateHUD();
      }
    });
  }

  function updateEnemyCollisions() {
    if (time < invincibleUntil) return;

    enemies.forEach((e) => {
      if (!e.alive) return;

      const enemyBox = { x: e.x, y: e.y, w: e.w, h: e.h };
      if (!rectsOverlap(player, enemyBox)) return;

      const playerBottom = player.y + player.h;
      const enemyTop = e.y;
      const falling = player.vy > 0;
      const above = playerBottom - enemyTop < 14 && player.y + player.h * 0.5 < e.y + e.h * 0.4;

      if (falling && above) {
        e.alive = false;
        player.vy = -8;
        score += 20;
        playStompSound();
        spawnStompEffect(e.x + e.w / 2, e.y);
        updateHUD();
      } else {
        takeDamage();
      }
    });
  }

  function updateGoal() {
    if (goalReached) return;
    if (rectsOverlap(player, goal)) {
      goalReached = true;
      goalTimer = 0;
      state = GameState.CLEAR;
      stopBGM();
      playGoalSound();
      spawnGoalEffect();
      overlayTitle.textContent = "ステージクリア！";
      overlayText.textContent = `スコア：${score} — もう一度遊ぶ？`;
      setTimeout(() => overlay.classList.remove("hidden"), 2800);
    }
  }

  function updateParticles() {
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.kind === "confetti" ? 0.08 : 0.12;
      if (p.rotSpeed) p.rot = (p.rot || 0) + p.rotSpeed;
      p.life--;
    });
    particles = particles.filter((p) => p.life > 0);

    clearStars.forEach((s) => {
      s.angle += s.speed;
      s.dist += 0.3;
      s.life--;
    });
    clearStars = clearStars.filter((s) => s.life > 0);
  }

  function updateCamera() {
    const target = player.x + player.w / 2 - canvas.width / 2;
    cameraX += (target - cameraX) * 0.12;
    cameraX = Math.max(0, Math.min(WORLD_W - canvas.width, cameraX));
  }

  function updatePlayerFacing() {
    if (keys.left || touch.left) {
      player.facing = -1;
    } else if (keys.right || touch.right) {
      player.facing = 1;
    } else if (player.vx > 0.25) {
      player.facing = 1;
    } else if (player.vx < -0.25) {
      player.facing = -1;
    }
  }

  function updateAnimation() {
    updatePlayerFacing();

    if (Math.abs(player.vx) > 0.5 && player.onGround) {
      player.anim += 0.2;
    }
    player.squash += (1 - player.squash) * 0.2;
    player.stretch += (1 - player.stretch) * 0.2;
  }

  function update() {
    time++;

    if (state === GameState.PLAYING) {
      handleInput();
      resolvePlatformCollision();
      updateEnemies();
      updateStars();
      updateEnemyCollisions();
      updateGoal();
      updateCamera();
      updateAnimation();
    }

    if (state === GameState.CLEAR) {
      goalTimer++;
      if (screenShake > 0) screenShake *= 0.92;
      player.anim += 0.18;
      player.squash = 1 + Math.sin(goalTimer * 0.2) * 0.08;
      player.stretch = 1 - Math.sin(goalTimer * 0.2) * 0.05;

      if (goalTimer % 10 === 0 && goalTimer < 160) {
        spawnConfetti(
          player.x + player.w / 2 + (Math.random() - 0.5) * 60,
          player.y - 10,
          6,
          5
        );
      }
      if (goalTimer % 50 === 0 && goalTimer < 200) {
        spawnFirework(
          player.x + player.w / 2 + (Math.random() - 0.5) * 200,
          player.y - 80 - Math.random() * 100
        );
      }
      if (goalTimer === 30 || goalTimer === 90) {
        spawnClearStars(player.x + player.w / 2, player.y + player.h / 2);
      }

      updateParticles();
      updateCamera();
      updateAnimation();
    }

    if (state === GameState.GAMEOVER) {
      gameOverTimer++;
      if (screenShake > 0) screenShake *= 0.88;
      player.vy += GRAVITY * 0.8;
      player.y += player.vy;
      player.x += Math.sin(gameOverTimer * 0.3) * 1.5;
      updateCamera();

      if (gameOverTimer % 8 === 0) {
        spawnParticles(
          player.x + player.w / 2,
          player.y + player.h / 2,
          ["#ff8080", "#ffd0a0"],
          3,
          4
        );
      }

      if (gameOverTimer > 100 && !gameOverShowOverlay) {
        gameOverShowOverlay = true;
        overlay.classList.remove("hidden");
      }

      updateParticles();
    }

    updateParticles();
  }

  function drawSky() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, "#c8ecff");
    grad.addColorStop(0.55, "#e8f8ff");
    grad.addColorStop(1, "#fff8e8");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    [
      [80, 60, 50], [200, 90, 40], [420, 50, 55],
      [600, 100, 35], [750, 55, 45], [880, 85, 38],
    ].forEach(([x, y, s]) => {
      const cx = ((x + cameraX * 0.2) % (canvas.width + 100)) - 50;
      ctx.beginPath();
      ctx.arc(cx, y, s, 0, Math.PI * 2);
      ctx.arc(cx + s * 0.8, y - s * 0.2, s * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + s * 1.5, y, s * 0.65, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawHills() {
    ctx.fillStyle = "#d8f8c8";
    for (let i = -1; i < 6; i++) {
      const hx = i * 400 - (cameraX * 0.3) % 400;
      ctx.beginPath();
      ctx.ellipse(hx, GROUND_Y + 20, 220, 80, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlatforms() {
    platforms.forEach((p) => {
      const sx = p.x - cameraX;
      if (sx + p.w < -50 || sx > canvas.width + 50) return;

      if (p.type === "ground") {
        ctx.fillStyle = "#b8e8a0";
        ctx.fillRect(sx, p.y, p.w, p.h);
        ctx.fillStyle = "#98d080";
        ctx.fillRect(sx, p.y, p.w, 12);
        ctx.fillStyle = "#f0c8a0";
        for (let i = 0; i < p.w; i += 28) {
          ctx.fillRect(sx + i + 4, p.y + p.h - 18, 8, 14);
        }
      } else {
        ctx.fillStyle = "#f5c8e8";
        ctx.fillRect(sx, p.y, p.w, p.h);
        ctx.fillStyle = "#e8a8d0";
        ctx.fillRect(sx, p.y, p.w, 6);
        ctx.strokeStyle = "#d888b8";
        ctx.lineWidth = 2;
        ctx.strokeRect(sx, p.y, p.w, p.h);
      }
    });
  }

  function drawStar(s) {
    if (s.taken) return;
    const sx = s.x - cameraX;
    if (sx < -30 || sx > canvas.width + 30) return;

    const bob = Math.sin(time * 0.08 + s.x) * 3;
    ctx.save();
    ctx.translate(sx, s.y + bob);
    ctx.fillStyle = "#ffe860";
    ctx.strokeStyle = "#f0c030";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const outerX = Math.cos(angle) * s.r;
      const outerY = Math.sin(angle) * s.r;
      const innerAngle = angle + Math.PI / 5;
      const innerX = Math.cos(innerAngle) * (s.r * 0.45);
      const innerY = Math.sin(innerAngle) * (s.r * 0.45);
      if (i === 0) ctx.moveTo(outerX, outerY);
      else ctx.lineTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemySleepy(e) {
    const x = e.x - cameraX;
    const bob = Math.sin(time * 0.1 + e.x) * 2;
    ctx.save();
    ctx.translate(x + e.w / 2, e.y + e.h / 2 + bob);
    if (e.dir < 0) ctx.scale(-1, 1);

    ctx.fillStyle = "#c8b8f0";
    ctx.beginPath();
    ctx.ellipse(0, 4, 18, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#9888c8";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Zz", 8, -8);
    ctx.fillText("z", 14, -2);

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(-6, 0, 3, 0, Math.PI * 2);
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f0a0c0";
    ctx.beginPath();
    ctx.arc(-10, 4, 3, 0, Math.PI * 2);
    ctx.arc(10, 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawEnemyDishes(e) {
    const x = e.x - cameraX;
    const wobble = Math.sin(time * 0.12 + e.x) * 2;
    ctx.save();
    ctx.translate(x + e.w / 2, e.y + e.h / 2 + wobble);
    if (e.dir < 0) ctx.scale(-1, 1);

    ctx.fillStyle = "#a8d8f0";
    ctx.beginPath();
    ctx.ellipse(0, 6, 16, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#68a8d0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#e8f4ff";
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 5, 0, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = "#f8d8a8";
    ctx.fillRect(-8, -6, 6, 4);
    ctx.fillRect(2, -8, 5, 5);

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(-5, 0, 2.5, 0, Math.PI * 2);
    ctx.arc(5, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#888";
    ctx.beginPath();
    ctx.arc(0, 4, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.restore();
  }

  function drawEnemyConstipation(e) {
    const x = e.x - cameraX;
    const squeeze = 1 + Math.sin(time * 0.15 + e.x) * 0.06;
    ctx.save();
    ctx.translate(x + e.w / 2, e.y + e.h / 2);
    ctx.scale(e.dir < 0 ? -squeeze : squeeze, squeeze);

    ctx.fillStyle = "#f0c8a0";
    ctx.beginPath();
    ctx.ellipse(0, 4, 15, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#d0a070";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#a06050";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, 6);
    ctx.quadraticCurveTo(0, 2, 4, 6);
    ctx.stroke();

    ctx.fillStyle = "#ffb0a0";
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 10, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawEnemies() {
    enemies.forEach((e) => {
      if (!e.alive) return;
      if (e.x - cameraX > canvas.width + 50 || e.x + e.w < cameraX - 50) return;
      if (e.type === "sleepy") drawEnemySleepy(e);
      else if (e.type === "dishes") drawEnemyDishes(e);
      else drawEnemyConstipation(e);
    });
  }

  function drawGoal() {
    const gx = goal.x - cameraX;
    if (gx > canvas.width + 80 || gx + goal.w < -80) return;

    ctx.fillStyle = "#f0a0c0";
    ctx.fillRect(gx + 24, goal.y, 8, goal.h);

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.moveTo(gx + 32, goal.y);
    ctx.lineTo(gx + 72, goal.y + 20);
    ctx.lineTo(gx + 32, goal.y + 40);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#e87898";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffd0e8";
    ctx.beginPath();
    ctx.arc(gx + 28, goal.y + goal.h, 14, Math.PI, 0);
    ctx.fill();
  }

  function drawPlayerFallback(px, py) {
    ctx.fillStyle = "#ffe860";
    ctx.beginPath();
    ctx.ellipse(px + player.w / 2, py + player.h * 0.55, player.w * 0.4, player.h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.ellipse(px + player.w / 2, py + player.h * 0.28, player.w * 0.42, player.h * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(px + player.w / 2 - 8, py + player.h * 0.3, 3, 0, Math.PI * 2);
    ctx.arc(px + player.w / 2 + 8, py + player.h * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPlayer() {
    const px = player.x - cameraX;
    const py = player.y;
    if (px + player.w < -50 || px > canvas.width + 50) return;

    const blink = time < invincibleUntil && Math.floor(time / 6) % 2 === 0;
    if (blink) return;

    const bob = player.onGround && Math.abs(player.vx) > 0.3
      ? Math.sin(player.anim) * 2
      : 0;

    ctx.save();
    ctx.translate(px + player.w / 2, py + player.h + bob);
    ctx.scale(player.squash, player.stretch);

    if (player.facing > 0) {
      ctx.scale(-1, 1);
    }

    if (playerSprite) {
      const drawW = playerSprite.dw;
      const drawH = playerSprite.dh;
      ctx.drawImage(
        playerSprite.image,
        0, 0, playerSprite.sw, playerSprite.sh,
        -drawW / 2, -drawH,
        drawW, drawH
      );
    } else {
      drawPlayerFallback(-player.w / 2, -player.h);
    }

    ctx.restore();
  }

  function drawParticles() {
    particles.forEach((p) => {
      const alpha = Math.min(1, p.life / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const sx = p.x - cameraX;

      if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(sx, p.y);
        ctx.rotate(p.rot || 0);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  function drawClearStars() {
    if (state !== GameState.CLEAR) return;
    clearStars.forEach((s) => {
      const alpha = Math.min(1, s.life / 30);
      const x = s.x + Math.cos(s.angle) * s.dist - cameraX;
      const y = s.y + Math.sin(s.angle) * s.dist;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = s.color;
      ctx.font = `bold ${s.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("★", x, y);
    });
    ctx.globalAlpha = 1;
  }

  function drawClearEffect() {
    if (state !== GameState.CLEAR) return;

    const fadeIn = Math.min(1, goalTimer / 40);
    const pulse = 1 + Math.sin(goalTimer * 0.12) * 0.06;

    const burst = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 10,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.8
    );
    burst.addColorStop(0, `rgba(255, 240, 180, ${fadeIn * 0.45})`);
    burst.addColorStop(0.5, `rgba(255, 200, 230, ${fadeIn * 0.25})`);
    burst.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = burst;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(255, 248, 255, ${fadeIn * 0.35})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 8; i++) {
      const rayAngle = (goalTimer * 0.02) + (Math.PI * 2 * i) / 8;
      const rayLen = canvas.height * 0.6;
      ctx.strokeStyle = `rgba(255, 220, 100, ${fadeIn * 0.15})`;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height / 2);
      ctx.lineTo(
        canvas.width / 2 + Math.cos(rayAngle) * rayLen,
        canvas.height / 2 + Math.sin(rayAngle) * rayLen
      );
      ctx.stroke();
    }

    if (goalTimer > 8) {
      const textIn = Math.min(1, (goalTimer - 8) / 30);
      const scale = textIn * pulse;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 - 40);
      ctx.scale(scale, scale);

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 8;
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.strokeText("STAGE CLEAR!", 0, 0);

      ctx.fillStyle = "#ff5080";
      ctx.fillText("STAGE CLEAR!", 0, 0);

      ctx.font = "bold 24px sans-serif";
      ctx.fillStyle = "#e87898";
      ctx.fillText("おめでとう、みみぞの！", 0, 44);
      ctx.restore();
    }

    if (goalTimer > 25) {
      const scoreIn = Math.min(1, (goalTimer - 25) / 20);
      ctx.globalAlpha = scoreIn;
      ctx.fillStyle = "#5a88b0";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`スコア ${score}`, canvas.width / 2, canvas.height / 2 + 50);
      ctx.globalAlpha = 1;
    }

    if (goalTimer > 50 && Math.floor(goalTimer / 15) % 2 === 0) {
      ctx.fillStyle = "rgba(255, 255, 200, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawGameOverEffect() {
    if (state !== GameState.GAMEOVER) return;

    const fadeIn = Math.min(1, gameOverTimer / 50);
    const pulse = 0.85 + Math.sin(gameOverTimer * 0.15) * 0.15;

    ctx.fillStyle = `rgba(30, 10, 30, ${fadeIn * 0.55})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vignette = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
      canvas.width / 2, canvas.height / 2, canvas.height * 0.75
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, `rgba(60,0,30,${fadeIn * 0.5})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameOverTimer > 15) {
      const textScale = Math.min(1, (gameOverTimer - 15) / 25) * pulse;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 - 30);
      ctx.scale(textScale, textScale);

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 6;
      ctx.font = "bold 52px monospace";
      ctx.textAlign = "center";
      ctx.strokeText("GAME OVER", 0, 0);

      ctx.fillStyle = "#ff4060";
      ctx.fillText("GAME OVER", 0, 0);

      ctx.font = "bold 22px sans-serif";
      ctx.fillStyle = "#ffe0e8";
      ctx.fillText("みみぞの、がんばったね…", 0, 42);
      ctx.restore();
    }

    if (gameOverTimer > 40) {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.7, (gameOverTimer - 40) / 30)})`;
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`スコア：${score}`, canvas.width / 2, canvas.height / 2 + 70);
    }

    if (Math.floor(gameOverTimer / 10) % 2 === 0 && gameOverTimer > 80) {
      ctx.fillStyle = "rgba(255, 80, 100, 0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function draw() {
    ctx.save();
    if (screenShake > 0.5) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
    }

    drawSky();
    drawHills();
    drawPlatforms();
    stars.forEach(drawStar);
    drawGoal();
    drawEnemies();
    drawPlayer();
    drawParticles();
    drawClearStars();
    drawClearEffect();
    drawGameOverEffect();
    ctx.restore();
  }

  function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }

  function bindTouchButton(btn, key, isJump = false) {
    const press = (e) => {
      e.preventDefault();
      ensureAudio();
      btn.classList.add("pressed");
      touch[key] = true;
      if (isJump) touch.jumpPressed = true;
      if (state === GameState.TITLE || state === GameState.CLEAR || state === GameState.GAMEOVER) {
        startGame();
      }
    };
    const release = (e) => {
      e.preventDefault();
      btn.classList.remove("pressed");
      touch[key] = false;
    };
    btn.addEventListener("touchstart", press, { passive: false });
    btn.addEventListener("touchend", release, { passive: false });
    btn.addEventListener("touchcancel", release, { passive: false });
    btn.addEventListener("mousedown", press);
    btn.addEventListener("mouseup", release);
    btn.addEventListener("mouseleave", release);
  }

  bindTouchButton(btnLeft, "left");
  bindTouchButton(btnRight, "right");
  bindTouchButton(btnJump, "jump", true);

  document.addEventListener("keydown", (e) => {
    if (e.code === "ArrowLeft") { keys.left = true; e.preventDefault(); }
    if (e.code === "ArrowRight") { keys.right = true; e.preventDefault(); }
    if (e.code === "Space") {
      e.preventDefault();
      keys.jump = true;
      keys.jumpPressed = true;
      if (state === GameState.TITLE || state === GameState.CLEAR || state === GameState.GAMEOVER) {
        startGame();
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (e.code === "ArrowLeft") keys.left = false;
    if (e.code === "ArrowRight") keys.right = false;
    if (e.code === "Space") keys.jump = false;
  });

  canvas.addEventListener("click", () => {
    if (state === GameState.TITLE || state === GameState.CLEAR || state === GameState.GAMEOVER) {
      startGame();
    }
  });

  overlay.addEventListener("click", () => {
    if (state === GameState.TITLE || state === GameState.CLEAR || state === GameState.GAMEOVER) {
      startGame();
    }
  });

  function initGame() {
    placeEnemiesOnGround();
    player.y = GROUND_Y - player.h;
    updateHUD();
    requestAnimationFrame(gameLoop);
    loadPlayerSprite();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGame);
  } else {
    initGame();
  }
})();
