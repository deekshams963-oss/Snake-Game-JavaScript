(function () {
  const root = document.createElement('div');
  root.style.cssText =
    'width:min(420px,92vw);margin:24px auto;font-family:system-ui,sans-serif;color:#1a1a1a;';

  const hud = document.createElement('div');
  hud.style.cssText =
    'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:14px;color:#6b6b66;';
  hud.innerHTML =
    '<span>Score <strong id="sn-score" style="color:#1a1a1a">0</strong></span>' +
    '<span>Best <strong id="sn-best" style="color:#1a1a1a">0</strong></span>';

  const startBtn = document.createElement('button');
  startBtn.textContent = 'Start';
  startBtn.style.cssText =
    'font:inherit;font-size:14px;padding:8px 14px;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#fff;cursor:pointer;';
  hud.appendChild(startBtn);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;';

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.cssText =
    'width:100%;display:block;border:1px solid rgba(0,0,0,.15);border-radius:12px;background:#fff;';

  const overlay = document.createElement('div');
  overlay.style.cssText =
    'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
    'border-radius:12px;background:rgba(0,0,0,.35);color:#fff;font-size:16px;font-weight:500;';
  overlay.textContent = 'Press start or any arrow key';

  wrap.append(canvas, overlay);

  const dpad = document.createElement('div');
  dpad.style.cssText =
    'display:grid;grid-template-columns:repeat(3,56px);gap:8px;justify-content:center;margin-top:16px;';
  const btnStyle =
    'height:44px;font-size:18px;border:1px solid rgba(0,0,0,.15);border-radius:8px;background:#fff;cursor:pointer;';
  const arrows = { up: '\u2191', left: '\u2190', down: '\u2193', right: '\u2192' };
  ['', 'up', '', 'left', 'down', 'right'].forEach(name => {
    if (!name) {
      dpad.appendChild(document.createElement('div'));
      return;
    }
    const b = document.createElement('button');
    b.textContent = arrows[name];
    b.setAttribute('aria-label', name);
    b.style.cssText = btnStyle;
    b.addEventListener('click', () => setDir(name));
    dpad.appendChild(b);
  });

  root.append(hud, wrap, dpad);
  document.body.appendChild(root);

  const ctx = canvas.getContext('2d');
  const scoreEl = hud.querySelector('#sn-score');
  const bestEl = hud.querySelector('#sn-best');

  
  const N = 20;   
  const CELL = 20;

  let snake;         
  let dir, nextDir;  
  let food;
  let score = 0;
  let best = 0;
  let speed;   
  let running = false;
  let dead = false;
  let timer = null;

  function reset() {
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 };
    nextDir = dir;
    score = 0;
    speed = 140;
    dead = false;
    scoreEl.textContent = '0';
    placeFood();
    draw();
  }

  function placeFood() {
    while (true) {
      const f = {
        x: Math.floor(Math.random() * N),
        y: Math.floor(Math.random() * N),
      };
      if (!snake.some(s => s.x === f.x && s.y === f.y)) {
        food = f;
        return;
      }
    }
  }

  function start() {
    if (running) return;
    if (dead || !snake) reset();
    running = true;
    overlay.style.display = 'none';
    clearInterval(timer);
    timer = setInterval(tick, speed);
  }

  function gameOver() {
    running = false;
    dead = true;
    clearInterval(timer);
    best = Math.max(best, score);
    bestEl.textContent = best;
    overlay.textContent = 'Game over \u2014 score ' + score;
    overlay.style.display = 'flex';
    startBtn.textContent = 'Restart';
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if ( head.x < 0 ||head.x >= N ||head.y < 0 || head.y >= N ||snake.some(s => s.x === head.x && s.y === head.y)
    ) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      scoreEl.textContent = score;
      placeFood();
      if (speed > 70) {         
                speed -= 4;
        clearInterval(timer);
        timer = setInterval(tick, speed);
      }
    } else {
      snake.pop();             
    }

    draw();
  }
  function draw() {
    ctx.clearRect(0, 0, 400, 400);

    // Grid
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(400, i * CELL); ctx.stroke();
    }

    ctx.fillStyle = '#00cf8a';
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
    ctx.fill();

    for (let j = snake.length - 1; j >= 0; j--) {
      ctx.fillStyle = j === 0 ? '#0a034a' : '#0c056e';
      const s = snake[j];
      roundRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4, 5);
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function setDir(name) {
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const nd = map[name];
    if (!nd) return;
    if (nd.x === -dir.x && nd.y === -dir.y) return;
    nextDir = nd;
    if (!running) start();
  }

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const d =
      k === 'arrowup' || k === 'w' ? 'up' :
      k === 'arrowdown' || k === 's' ? 'down' :
      k === 'arrowleft' || k === 'a' ? 'left' :
      k === 'arrowright' || k === 'd' ? 'right' : null;
    if (d) {
      e.preventDefault();
      setDir(d);
    }
  });

  startBtn.addEventListener('click', start);

  reset();
})();