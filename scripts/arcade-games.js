const TAU = Math.PI * 2;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function shuffle(list) {
  const next = list.slice();
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = randInt(0, index);
    const temp = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = temp;
  }
  return next;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function circleDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function drawCenteredText(ctx, text, x, y, size = 26, color = "#f5f7ff") {
  ctx.fillStyle = color;
  ctx.font = `${size}px 'Trebuchet MS', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(text, x, y);
}

function baseHud(state, extras = {}) {
  return Object.assign(
    {
      score: state.score ?? 0,
      lives: state.lives ?? "-",
      level: state.level ?? 1,
      status: state.gameOver ? "Game Over" : state.won ? "Victory" : state.status || "Live",
    },
    extras
  );
}

function createSnakeGame() {
  const gridSize = 20;
  const cell = 28;
  const width = gridSize * cell;
  const height = gridSize * cell;

  function create() {
    return {
      score: 0,
      level: 1,
      lives: 1,
      gameOver: false,
      snake: [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ],
      direction: { x: 1, y: 0 },
      queued: { x: 1, y: 0 },
      food: { x: 4, y: 4 },
      stepTimer: 0,
      stepDelay: 0.12,
    };
  }

  function spawnFood(state) {
    let next = null;
    while (!next || state.snake.some((part) => part.x === next.x && part.y === next.y)) {
      next = { x: randInt(0, gridSize - 1), y: randInt(0, gridSize - 1) };
    }
    state.food = next;
  }

  return {
    id: "snake",
    title: "Snake",
    year: "1976",
    tagline: "Eat, grow, and never fold into yourself.",
    description: "A tight modern cabinet take on the phone-era classic. Clean grid, faster loops, instant restarts.",
    controls: ["Arrow keys or WASD to turn.", "Eat pellets to grow.", "Avoid walls and your own tail."],
    width,
    height,
    create,
    onKeyDown(state, key) {
      const map = {
        ArrowUp: { x: 0, y: -1 },
        w: { x: 0, y: -1 },
        W: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        s: { x: 0, y: 1 },
        S: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        a: { x: -1, y: 0 },
        A: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        d: { x: 1, y: 0 },
        D: { x: 1, y: 0 },
      };
      const next = map[key];
      if (!next) {
        return;
      }
      if (next.x === -state.direction.x && next.y === -state.direction.y) {
        return;
      }
      state.queued = next;
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.stepTimer += dt;
      if (state.stepTimer < state.stepDelay) {
        return;
      }
      state.stepTimer = 0;
      state.direction = state.queued;
      const head = {
        x: state.snake[0].x + state.direction.x,
        y: state.snake[0].y + state.direction.y,
      };
      if (
        head.x < 0 ||
        head.y < 0 ||
        head.x >= gridSize ||
        head.y >= gridSize ||
        state.snake.some((part) => part.x === head.x && part.y === head.y)
      ) {
        state.gameOver = true;
        state.status = "Crashed";
        return;
      }
      state.snake.unshift(head);
      if (head.x === state.food.x && head.y === state.food.y) {
        state.score += 10;
        state.level = 1 + Math.floor(state.score / 50);
        state.stepDelay = Math.max(0.05, 0.12 - state.level * 0.007);
        spawnFood(state);
      } else {
        state.snake.pop();
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#061319";
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x <= gridSize; x += 1) {
        ctx.beginPath();
        ctx.moveTo(x * cell, 0);
        ctx.lineTo(x * cell, height);
        ctx.stroke();
      }
      for (let y = 0; y <= gridSize; y += 1) {
        ctx.beginPath();
        ctx.moveTo(0, y * cell);
        ctx.lineTo(width, y * cell);
        ctx.stroke();
      }
      ctx.fillStyle = "#ffb347";
      ctx.fillRect(state.food.x * cell + 6, state.food.y * cell + 6, cell - 12, cell - 12);
      state.snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? "#7dff95" : "#32c86a";
        ctx.fillRect(part.x * cell + 4, part.y * cell + 4, cell - 8, cell - 8);
      });
      if (state.gameOver) {
        drawCenteredText(ctx, "Snake Crashed", width / 2, height / 2, 34, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createPongGame() {
  const width = 960;
  const height = 640;
  return {
    id: "pong",
    title: "Pong",
    year: "1972",
    tagline: "Pure paddle warfare against a steady machine.",
    description: "Fast one-on-one Pong with a readable AI opponent, rally speedups, and a clean score chase.",
    controls: ["W/S or Arrow Up/Down moves your paddle.", "First to 11 points wins the cabinet."],
    width,
    height,
    create() {
      return {
        score: 0,
        enemyScore: 0,
        lives: "-",
        level: 1,
        paddle: { x: 28, y: height / 2 - 60, w: 16, h: 120, speed: 520 },
        enemy: { x: width - 44, y: height / 2 - 60, w: 16, h: 120, speed: 420 },
        ball: { x: width / 2, y: height / 2, vx: 340, vy: 210, r: 11 },
      };
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      if (input.keys.has("ArrowUp") || input.keys.has("w") || input.keys.has("W")) {
        state.paddle.y -= state.paddle.speed * dt;
      }
      if (input.keys.has("ArrowDown") || input.keys.has("s") || input.keys.has("S")) {
        state.paddle.y += state.paddle.speed * dt;
      }
      state.paddle.y = clamp(state.paddle.y, 0, height - state.paddle.h);
      const enemyCenter = state.enemy.y + state.enemy.h / 2;
      if (enemyCenter < state.ball.y - 12) {
        state.enemy.y += state.enemy.speed * dt;
      } else if (enemyCenter > state.ball.y + 12) {
        state.enemy.y -= state.enemy.speed * dt;
      }
      state.enemy.y = clamp(state.enemy.y, 0, height - state.enemy.h);

      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;
      if (state.ball.y < state.ball.r || state.ball.y > height - state.ball.r) {
        state.ball.vy *= -1;
      }
      const ballRect = {
        x: state.ball.x - state.ball.r,
        y: state.ball.y - state.ball.r,
        w: state.ball.r * 2,
        h: state.ball.r * 2,
      };
      if (rectsOverlap(ballRect, state.paddle) && state.ball.vx < 0) {
        state.ball.vx = Math.abs(state.ball.vx) + 15;
        state.ball.vy += (state.ball.y - (state.paddle.y + state.paddle.h / 2)) * 3;
      }
      if (rectsOverlap(ballRect, state.enemy) && state.ball.vx > 0) {
        state.ball.vx = -Math.abs(state.ball.vx) - 15;
        state.ball.vy += (state.ball.y - (state.enemy.y + state.enemy.h / 2)) * 3;
      }
      if (state.ball.x < -30) {
        state.enemyScore += 1;
        Object.assign(state.ball, { x: width / 2, y: height / 2, vx: 340, vy: rand(-220, 220) });
      }
      if (state.ball.x > width + 30) {
        state.score += 1;
        Object.assign(state.ball, { x: width / 2, y: height / 2, vx: -340, vy: rand(-220, 220) });
      }
      state.level = 1 + Math.floor((state.score + state.enemyScore) / 4);
      if (state.score >= 11) {
        state.won = true;
      }
      if (state.enemyScore >= 11) {
        state.gameOver = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#05070c";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#dbe7ff";
      for (let y = 0; y < height; y += 36) {
        ctx.fillRect(width / 2 - 4, y, 8, 18);
      }
      ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
      ctx.fillRect(state.enemy.x, state.enemy.y, state.enemy.w, state.enemy.h);
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, TAU);
      ctx.fill();
      ctx.font = "72px Arial";
      ctx.textAlign = "center";
      ctx.fillText(String(state.score), width * 0.25, 90);
      ctx.fillText(String(state.enemyScore), width * 0.75, 90);
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "You Win" : "You Lose", width / 2, height / 2, 42, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) =>
      baseHud(state, {
        lives: `${state.score}-${state.enemyScore}`,
        status: state.won ? "Match Won" : state.gameOver ? "Match Lost" : "Rally",
      }),
  };
}

function createBreakoutGame() {
  const width = 960;
  const height = 640;
  return {
    id: "breakout",
    title: "Breakout",
    year: "1976",
    tagline: "Shatter the wall and protect the floor.",
    description: "Brick-breaking at an arcade tempo with durable angles, three lives, and fast resets between waves.",
    controls: ["Arrow Left/Right or A/D to move.", "Clear every brick before you run out of balls."],
    width,
    height,
    create() {
      const bricks = [];
      const palette = ["#ff7171", "#ff9d57", "#ffe27a", "#7df18d", "#69d8f7"];
      for (let row = 0; row < 6; row += 1) {
        for (let column = 0; column < 10; column += 1) {
          bricks.push({
            x: 70 + column * 82,
            y: 70 + row * 34,
            w: 70,
            h: 22,
            color: palette[row % palette.length],
            alive: true,
          });
        }
      }
      return {
        score: 0,
        level: 1,
        lives: 3,
        paddle: { x: 400, y: 590, w: 160, h: 18, speed: 600 },
        ball: { x: 480, y: 520, vx: 260, vy: -290, r: 10 },
        bricks,
      };
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      if (input.keys.has("ArrowLeft") || input.keys.has("a") || input.keys.has("A")) {
        state.paddle.x -= state.paddle.speed * dt;
      }
      if (input.keys.has("ArrowRight") || input.keys.has("d") || input.keys.has("D")) {
        state.paddle.x += state.paddle.speed * dt;
      }
      state.paddle.x = clamp(state.paddle.x, 20, width - state.paddle.w - 20);
      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;
      if (state.ball.x < state.ball.r || state.ball.x > width - state.ball.r) {
        state.ball.vx *= -1;
      }
      if (state.ball.y < state.ball.r) {
        state.ball.vy *= -1;
      }
      if (state.ball.y > height + 30) {
        state.lives -= 1;
        state.ball = { x: 480, y: 520, vx: rand(-260, 260), vy: -290, r: 10 };
        if (state.lives <= 0) {
          state.gameOver = true;
        }
      }
      const ballRect = {
        x: state.ball.x - state.ball.r,
        y: state.ball.y - state.ball.r,
        w: state.ball.r * 2,
        h: state.ball.r * 2,
      };
      if (rectsOverlap(ballRect, state.paddle) && state.ball.vy > 0) {
        state.ball.vy = -Math.abs(state.ball.vy);
        state.ball.vx += (state.ball.x - (state.paddle.x + state.paddle.w / 2)) * 2.2;
      }
      state.bricks.forEach((brick) => {
        if (!brick.alive) {
          return;
        }
        if (rectsOverlap(ballRect, brick)) {
          brick.alive = false;
          state.ball.vy *= -1;
          state.score += 20;
        }
      });
      if (state.bricks.every((brick) => !brick.alive)) {
        state.won = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#091018";
      ctx.fillRect(0, 0, width, height);
      state.bricks.forEach((brick) => {
        if (!brick.alive) {
          return;
        }
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
      });
      ctx.fillStyle = "#eef2ff";
      ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h);
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, TAU);
      ctx.fill();
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Wall Cleared" : "Ball Lost", width / 2, height / 2, 40, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createAsteroidsGame() {
  const width = 960;
  const height = 640;
  function makeRock(size = 3, x = rand(0, width), y = rand(0, height)) {
    return {
      x,
      y,
      vx: rand(-80, 80),
      vy: rand(-80, 80),
      size,
      r: size * 18 + 18,
    };
  }
  return {
    id: "asteroids",
    title: "Asteroids",
    year: "1979",
    tagline: "Drift, wrap, and vaporize the field.",
    description: "Vector-style space dodging with wraparound movement, rock splitting, and sharp ship control.",
    controls: ["A/D or Arrow Left/Right rotates.", "W or Arrow Up thrusts.", "Space fires."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 3,
        level: 1,
        ship: { x: width / 2, y: height / 2, vx: 0, vy: 0, angle: -Math.PI / 2, cooldown: 0 },
        bullets: [],
        rocks: [makeRock(3), makeRock(3), makeRock(2)],
      };
    },
    onKeyDown(state, key) {
      if (key === " " && state.ship.cooldown <= 0 && !state.gameOver && !state.won) {
        state.bullets.push({
          x: state.ship.x,
          y: state.ship.y,
          vx: Math.cos(state.ship.angle) * 420,
          vy: Math.sin(state.ship.angle) * 420,
          life: 1.2,
        });
        state.ship.cooldown = 0.16;
      }
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      const ship = state.ship;
      if (input.keys.has("ArrowLeft") || input.keys.has("a") || input.keys.has("A")) {
        ship.angle -= 3.2 * dt;
      }
      if (input.keys.has("ArrowRight") || input.keys.has("d") || input.keys.has("D")) {
        ship.angle += 3.2 * dt;
      }
      if (input.keys.has("ArrowUp") || input.keys.has("w") || input.keys.has("W")) {
        ship.vx += Math.cos(ship.angle) * 180 * dt;
        ship.vy += Math.sin(ship.angle) * 180 * dt;
      }
      ship.cooldown = Math.max(0, ship.cooldown - dt);
      ship.x = (ship.x + ship.vx * dt + width) % width;
      ship.y = (ship.y + ship.vy * dt + height) % height;
      ship.vx *= 0.995;
      ship.vy *= 0.995;

      state.bullets.forEach((bullet) => {
        bullet.x = (bullet.x + bullet.vx * dt + width) % width;
        bullet.y = (bullet.y + bullet.vy * dt + height) % height;
        bullet.life -= dt;
      });
      state.bullets = state.bullets.filter((bullet) => bullet.life > 0);

      const nextRocks = [];
      state.rocks.forEach((rock) => {
        rock.x = (rock.x + rock.vx * dt + width) % width;
        rock.y = (rock.y + rock.vy * dt + height) % height;
        const hitBullet = state.bullets.find((bullet) => circleDistance(rock, bullet) < rock.r);
        if (hitBullet) {
          hitBullet.life = 0;
          state.score += 30 * rock.size;
          if (rock.size > 1) {
            nextRocks.push(makeRock(rock.size - 1, rock.x, rock.y));
            nextRocks.push(makeRock(rock.size - 1, rock.x, rock.y));
          }
        } else {
          nextRocks.push(rock);
        }
      });
      state.rocks = nextRocks;

      if (state.rocks.some((rock) => circleDistance(rock, ship) < rock.r + 12)) {
        state.lives -= 1;
        state.ship = { x: width / 2, y: height / 2, vx: 0, vy: 0, angle: -Math.PI / 2, cooldown: 0 };
        if (state.lives <= 0) {
          state.gameOver = true;
        }
      }

      if (!state.rocks.length) {
        state.won = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#02050b";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      state.bullets.forEach((bullet) => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, TAU);
        ctx.fill();
      });
      ctx.strokeStyle = "#d7e3ff";
      ctx.lineWidth = 2;
      state.rocks.forEach((rock) => {
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.r, 0, TAU);
        ctx.stroke();
      });
      const ship = state.ship;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 16);
      ctx.lineTo(0, 8);
      ctx.lineTo(-14, 16);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Sector Clear" : "Ship Destroyed", width / 2, height / 2, 38, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createInvadersGame() {
  const width = 960;
  const height = 640;
  return {
    id: "space-invaders",
    title: "Space Invaders",
    year: "1978",
    tagline: "Defend the bottom line from descending swarms.",
    description: "Marching rows, player shots, enemy volleys, and mounting pressure as the formation drops lower.",
    controls: ["Arrow Left/Right or A/D moves.", "Space fires upward."],
    width,
    height,
    create() {
      const invaders = [];
      for (let row = 0; row < 5; row += 1) {
        for (let column = 0; column < 10; column += 1) {
          invaders.push({ x: 110 + column * 68, y: 90 + row * 52, w: 36, h: 26, alive: true });
        }
      }
      return {
        score: 0,
        lives: 3,
        level: 1,
        player: { x: width / 2 - 28, y: height - 70, w: 56, h: 24, cooldown: 0 },
        bullets: [],
        enemyBullets: [],
        invaders,
        dir: 1,
        moveTimer: 0,
        moveDelay: 0.55,
      };
    },
    onKeyDown(state, key) {
      if (key === " " && state.player.cooldown <= 0 && !state.gameOver && !state.won) {
        state.bullets.push({ x: state.player.x + state.player.w / 2, y: state.player.y, vy: -460 });
        state.player.cooldown = 0.25;
      }
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      if (input.keys.has("ArrowLeft") || input.keys.has("a") || input.keys.has("A")) {
        state.player.x -= 420 * dt;
      }
      if (input.keys.has("ArrowRight") || input.keys.has("d") || input.keys.has("D")) {
        state.player.x += 420 * dt;
      }
      state.player.x = clamp(state.player.x, 20, width - state.player.w - 20);
      state.player.cooldown = Math.max(0, state.player.cooldown - dt);
      state.moveTimer += dt;
      if (state.moveTimer >= state.moveDelay) {
        state.moveTimer = 0;
        let edgeHit = false;
        state.invaders.forEach((invader) => {
          if (!invader.alive) {
            return;
          }
          invader.x += state.dir * 18;
          if (invader.x < 40 || invader.x > width - 80) {
            edgeHit = true;
          }
        });
        if (edgeHit) {
          state.dir *= -1;
          state.invaders.forEach((invader) => {
            if (invader.alive) {
              invader.y += 24;
            }
          });
        }
        const shooters = state.invaders.filter((invader) => invader.alive);
        if (shooters.length) {
          const shooter = shooters[randInt(0, shooters.length - 1)];
          state.enemyBullets.push({ x: shooter.x + shooter.w / 2, y: shooter.y + shooter.h, vy: 260 });
        }
        state.moveDelay = Math.max(0.14, 0.55 - (50 - shooters.length) * 0.006);
      }
      state.bullets.forEach((bullet) => {
        bullet.y += bullet.vy * dt;
      });
      state.enemyBullets.forEach((bullet) => {
        bullet.y += bullet.vy * dt;
      });
      state.bullets = state.bullets.filter((bullet) => bullet.y > -20);
      state.enemyBullets = state.enemyBullets.filter((bullet) => bullet.y < height + 20);

      state.invaders.forEach((invader) => {
        if (!invader.alive) {
          return;
        }
        const hit = state.bullets.find(
          (bullet) =>
            bullet.x >= invader.x &&
            bullet.x <= invader.x + invader.w &&
            bullet.y >= invader.y &&
            bullet.y <= invader.y + invader.h
        );
        if (hit) {
          invader.alive = false;
          hit.y = -100;
          state.score += 20;
        }
        if (invader.y + invader.h >= state.player.y) {
          state.gameOver = true;
        }
      });
      const playerRect = state.player;
      if (
        state.enemyBullets.some(
          (bullet) =>
            bullet.x >= playerRect.x &&
            bullet.x <= playerRect.x + playerRect.w &&
            bullet.y >= playerRect.y &&
            bullet.y <= playerRect.y + playerRect.h
        )
      ) {
        state.lives -= 1;
        state.enemyBullets.length = 0;
        if (state.lives <= 0) {
          state.gameOver = true;
        }
      }
      if (state.invaders.every((invader) => !invader.alive)) {
        state.won = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#06040b";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#9eff7c";
      state.invaders.forEach((invader) => {
        if (!invader.alive) {
          return;
        }
        ctx.fillRect(invader.x, invader.y, invader.w, invader.h);
      });
      ctx.fillStyle = "#dbe7ff";
      ctx.fillRect(state.player.x, state.player.y, state.player.w, state.player.h);
      ctx.fillStyle = "#ffe27a";
      state.bullets.forEach((bullet) => ctx.fillRect(bullet.x - 2, bullet.y - 12, 4, 16));
      ctx.fillStyle = "#ff8d8d";
      state.enemyBullets.forEach((bullet) => ctx.fillRect(bullet.x - 2, bullet.y, 4, 16));
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Wave Cleared" : "Earth Lost", width / 2, height / 2, 38, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createTetrisGame() {
  const width = 960;
  const height = 640;
  const cols = 10;
  const rows = 20;
  const cell = 26;
  const shapes = [
    [[[1, 1, 1, 1]]],
    [[[1, 1], [1, 1]]],
    [[[0, 1, 0], [1, 1, 1]]],
    [[[1, 0, 0], [1, 1, 1]]],
    [[[0, 0, 1], [1, 1, 1]]],
    [[[1, 1, 0], [0, 1, 1]]],
    [[[0, 1, 1], [1, 1, 0]]],
  ];
  const palette = ["#69d8f7", "#ffe27a", "#ff8f59", "#7dff95", "#c38fff", "#ff7171", "#83a8ff"];

  function rotate(shape) {
    return shape[0].map((_, x) => shape.map((row) => row[x]).reverse());
  }

  function spawn() {
    const index = randInt(0, shapes.length - 1);
    const shape = shapes[index].map((row) => row.slice());
    return { shape, x: 3, y: 0, color: palette[index] };
  }

  function fits(board, piece, offsetX = piece.x, offsetY = piece.y, shape = piece.shape) {
    for (let y = 0; y < shape.length; y += 1) {
      for (let x = 0; x < shape[y].length; x += 1) {
        if (!shape[y][x]) {
          continue;
        }
        const boardX = offsetX + x;
        const boardY = offsetY + y;
        if (boardX < 0 || boardX >= cols || boardY >= rows) {
          return false;
        }
        if (boardY >= 0 && board[boardY][boardX]) {
          return false;
        }
      }
    }
    return true;
  }

  function merge(board, piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((cellValue, x) => {
        if (cellValue) {
          board[piece.y + y][piece.x + x] = piece.color;
        }
      });
    });
  }

  return {
    id: "tetris",
    title: "Tetris",
    year: "1984",
    tagline: "Stack smart, clear lines, and never top out.",
    description: "A fast single-board Tetris run with crisp controls, hard drop, and accelerating gravity.",
    controls: ["Arrow Left/Right to move.", "Arrow Up or W rotates.", "Arrow Down soft drops.", "Space hard drops."],
    width,
    height,
    create() {
      return {
        score: 0,
        level: 1,
        lives: 1,
        dropTimer: 0,
        dropDelay: 0.8,
        board: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)),
        piece: spawn(),
      };
    },
    onKeyDown(state, key) {
      if (state.gameOver) {
        return;
      }
      if ((key === "ArrowLeft" || key === "a" || key === "A") && fits(state.board, state.piece, state.piece.x - 1, state.piece.y)) {
        state.piece.x -= 1;
      }
      if ((key === "ArrowRight" || key === "d" || key === "D") && fits(state.board, state.piece, state.piece.x + 1, state.piece.y)) {
        state.piece.x += 1;
      }
      if ((key === "ArrowDown" || key === "s" || key === "S") && fits(state.board, state.piece, state.piece.x, state.piece.y + 1)) {
        state.piece.y += 1;
      }
      if ((key === "ArrowUp" || key === "w" || key === "W") && fits(state.board, state.piece, state.piece.x, state.piece.y, rotate(state.piece.shape))) {
        state.piece.shape = rotate(state.piece.shape);
      }
      if (key === " " || key === "Space" || key === "Spacebar") {
        while (fits(state.board, state.piece, state.piece.x, state.piece.y + 1)) {
          state.piece.y += 1;
        }
        state.dropTimer = state.dropDelay;
      }
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.dropTimer += dt * ((input.keys.has("ArrowDown") || input.keys.has("s") || input.keys.has("S")) ? 2.6 : 1);
      if (state.dropTimer < state.dropDelay) {
        return;
      }
      state.dropTimer = 0;
      if (fits(state.board, state.piece, state.piece.x, state.piece.y + 1)) {
        state.piece.y += 1;
        return;
      }
      merge(state.board, state.piece);
      let cleared = 0;
      state.board = state.board.filter((row) => {
        const full = row.every(Boolean);
        if (full) {
          cleared += 1;
        }
        return !full;
      });
      while (state.board.length < rows) {
        state.board.unshift(Array.from({ length: cols }, () => null));
      }
      if (cleared) {
        state.score += [0, 100, 300, 500, 800][cleared];
        state.level = 1 + Math.floor(state.score / 800);
        state.dropDelay = Math.max(0.12, 0.8 - state.level * 0.05);
      }
      state.piece = spawn();
      if (!fits(state.board, state.piece)) {
        state.gameOver = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#070910";
      ctx.fillRect(0, 0, width, height);
      const offsetX = 320;
      const offsetY = 60;
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.strokeRect(offsetX - 4, offsetY - 4, cols * cell + 8, rows * cell + 8);
      state.board.forEach((row, y) => {
        row.forEach((color, x) => {
          ctx.fillStyle = color || "rgba(255,255,255,0.04)";
          ctx.fillRect(offsetX + x * cell, offsetY + y * cell, cell - 2, cell - 2);
        });
      });
      state.piece.shape.forEach((row, y) => {
        row.forEach((filled, x) => {
          if (filled) {
            ctx.fillStyle = state.piece.color;
            ctx.fillRect(offsetX + (state.piece.x + x) * cell, offsetY + (state.piece.y + y) * cell, cell - 2, cell - 2);
          }
        });
      });
      if (state.gameOver) {
        drawCenteredText(ctx, "Top Out", width / 2, height / 2, 40, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createFroggerGame() {
  const width = 960;
  const height = 640;
  const lanes = [120, 170, 220, 270, 360, 410, 460, 510];
  return {
    id: "frogger",
    title: "Frogger",
    year: "1981",
    tagline: "Hop through traffic, cross water, claim the pads.",
    description: "Lane-by-lane Frogger with moving cars, floating logs, and three home slots to fill.",
    controls: ["Arrow keys or WASD to hop one lane or tile at a time.", "Ride logs across the river.", "Fill three home pads to win."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 3,
        level: 1,
        frog: { x: 480, y: 585, size: 28 },
        homes: [false, false, false],
        traffic: lanes.map((laneY, index) =>
          Array.from({ length: 3 }, (_, itemIndex) => ({
            x: index < 4 ? itemIndex * 320 : itemIndex * 340,
            y: laneY,
            w: index < 4 ? 88 : 150,
            h: 28,
            speed: (index < 4 ? 1 : -1) * (110 + index * 14),
            kind: index < 4 ? "car" : "log",
          }))
        ),
      };
    },
    onKeyDown(state, key) {
      if (state.gameOver || state.won) {
        return;
      }
      const step = 48;
      if (key === "ArrowUp" || key === "w" || key === "W") {
        state.frog.y -= step;
      }
      if (key === "ArrowDown" || key === "s" || key === "S") {
        state.frog.y += step;
      }
      if (key === "ArrowLeft" || key === "a" || key === "A") {
        state.frog.x -= step;
      }
      if (key === "ArrowRight" || key === "d" || key === "D") {
        state.frog.x += step;
      }
      state.frog.x = clamp(state.frog.x, 20, width - 20);
      state.frog.y = clamp(state.frog.y, 60, 585);
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      state.traffic.flat().forEach((item) => {
        item.x += item.speed * dt;
        if (item.speed > 0 && item.x > width + 180) {
          item.x = -item.w - 40;
        }
        if (item.speed < 0 && item.x < -item.w - 40) {
          item.x = width + 40;
        }
      });
      const frogRect = { x: state.frog.x - 16, y: state.frog.y - 16, w: 32, h: 32 };
      let onLog = false;
      state.traffic.flat().forEach((item) => {
        const itemRect = { x: item.x, y: item.y - 14, w: item.w, h: item.h };
        if (!rectsOverlap(frogRect, itemRect)) {
          return;
        }
        if (item.kind === "car") {
          state.lives -= 1;
          state.frog.x = 480;
          state.frog.y = 585;
        } else {
          onLog = true;
          state.frog.x += item.speed * dt;
        }
      });
      if (state.frog.y >= 170 && state.frog.y <= 360 && !onLog) {
        state.lives -= 1;
        state.frog.x = 480;
        state.frog.y = 585;
      }
      if (state.frog.y <= 80) {
        const slot = clamp(Math.floor((state.frog.x - 170) / 220), 0, 2);
        if (!state.homes[slot]) {
          state.homes[slot] = true;
          state.score += 120;
        }
        state.frog.x = 480;
        state.frog.y = 585;
      }
      if (state.lives <= 0) {
        state.gameOver = true;
      }
      if (state.homes.every(Boolean)) {
        state.won = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#132414";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#0e2e56";
      ctx.fillRect(0, 150, width, 280);
      ctx.fillStyle = "#2a2d30";
      ctx.fillRect(0, 100, width, 220);
      ctx.fillStyle = "#21461f";
      ctx.fillRect(0, 430, width, 210);
      state.traffic.flat().forEach((item) => {
        ctx.fillStyle = item.kind === "car" ? "#ff8f59" : "#d1a26d";
        ctx.fillRect(item.x, item.y - 14, item.w, item.h);
      });
      state.homes.forEach((filled, index) => {
        ctx.strokeStyle = "#dbe7ff";
        ctx.strokeRect(180 + index * 220, 30, 110, 40);
        if (filled) {
          ctx.fillStyle = "#7dff95";
          ctx.fillRect(180 + index * 220 + 6, 36, 98, 28);
        }
      });
      ctx.fillStyle = "#7dff95";
      ctx.fillRect(state.frog.x - 14, state.frog.y - 14, 28, 28);
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "River Cleared" : "Frog Flattened", width / 2, height / 2, 38, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createMissileCommandGame() {
  const width = 960;
  const height = 640;
  return {
    id: "missile-command",
    title: "Missile Command",
    year: "1980",
    tagline: "Intercept incoming warheads before they erase the skyline.",
    description: "Pointer-driven city defense with expanding blasts, falling missiles, and a collapsing horizon.",
    controls: ["Move the mouse to aim.", "Click or tap to fire an interceptor.", "Protect the six cities."],
    width,
    height,
    create() {
      return {
        score: 0,
        level: 1,
        lives: 6,
        launcher: { x: width / 2, y: height - 60 },
        cursor: { x: width / 2, y: height / 2 },
        cities: Array.from({ length: 6 }, (_, index) => ({ x: 90 + index * 140, y: height - 60, alive: true })),
        enemyMissiles: [],
        playerMissiles: [],
        explosions: [],
        spawnTimer: 0,
      };
    },
    onPointerMove(state, pointer) {
      state.cursor = { x: pointer.x, y: pointer.y };
    },
    onPointerDown(state, pointer) {
      if (state.gameOver) {
        return;
      }
      state.playerMissiles.push({
        x: state.launcher.x,
        y: state.launcher.y,
        vx: (pointer.x - state.launcher.x) * 1.9,
        vy: (pointer.y - state.launcher.y) * 1.9,
        targetX: pointer.x,
        targetY: pointer.y,
      });
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.spawnTimer += dt;
      if (state.spawnTimer > Math.max(0.22, 1.1 - state.level * 0.08)) {
        state.spawnTimer = 0;
        const living = state.cities.filter((city) => city.alive);
        if (living.length) {
          const city = living[randInt(0, living.length - 1)];
          state.enemyMissiles.push({
            x: rand(40, width - 40),
            y: -20,
            targetX: city.x,
            targetY: city.y,
            speed: 90 + state.level * 25,
          });
        }
      }
      state.playerMissiles.forEach((missile) => {
        missile.x += missile.vx * dt;
        missile.y += missile.vy * dt;
        if (circleDistance({ x: missile.x, y: missile.y }, { x: missile.targetX, y: missile.targetY }) < 18) {
          missile.done = true;
          state.explosions.push({ x: missile.targetX, y: missile.targetY, r: 12, max: 58 });
        }
      });
      state.enemyMissiles.forEach((missile) => {
        const angle = Math.atan2(missile.targetY - missile.y, missile.targetX - missile.x);
        missile.x += Math.cos(angle) * missile.speed * dt;
        missile.y += Math.sin(angle) * missile.speed * dt;
        if (circleDistance({ x: missile.x, y: missile.y }, { x: missile.targetX, y: missile.targetY }) < 18) {
          missile.done = true;
          const hitCity = state.cities.find((city) => city.alive && Math.abs(city.x - missile.targetX) < 30);
          if (hitCity) {
            hitCity.alive = false;
            state.lives -= 1;
          }
        }
      });
      state.explosions.forEach((blast) => {
        blast.r += 180 * dt;
        if (blast.r >= blast.max) {
          blast.done = true;
        }
      });
      state.enemyMissiles.forEach((missile) => {
        if (state.explosions.some((blast) => circleDistance(missile, blast) < blast.r)) {
          missile.done = true;
          state.score += 25;
        }
      });
      state.enemyMissiles = state.enemyMissiles.filter((missile) => !missile.done);
      state.playerMissiles = state.playerMissiles.filter((missile) => !missile.done);
      state.explosions = state.explosions.filter((blast) => !blast.done);
      state.level = 1 + Math.floor(state.score / 250);
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#07121d";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#132a3b";
      ctx.fillRect(0, height - 92, width, 92);
      state.cities.forEach((city) => {
        ctx.fillStyle = city.alive ? "#7eb0ff" : "#3d4b64";
        ctx.fillRect(city.x - 26, city.y - 20, 52, 20);
      });
      ctx.fillStyle = "#dbe7ff";
      ctx.fillRect(state.launcher.x - 12, state.launcher.y - 26, 24, 26);
      ctx.strokeStyle = "#ffe27a";
      ctx.beginPath();
      ctx.arc(state.cursor.x, state.cursor.y, 12, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = "#ff9d57";
      state.enemyMissiles.forEach((missile) => {
        ctx.beginPath();
        ctx.moveTo(missile.x, missile.y);
        ctx.lineTo(missile.targetX, missile.targetY);
        ctx.stroke();
      });
      ctx.strokeStyle = "#dbe7ff";
      state.playerMissiles.forEach((missile) => {
        ctx.beginPath();
        ctx.moveTo(state.launcher.x, state.launcher.y);
        ctx.lineTo(missile.x, missile.y);
        ctx.stroke();
      });
      state.explosions.forEach((blast) => {
        ctx.beginPath();
        ctx.arc(blast.x, blast.y, blast.r, 0, TAU);
        ctx.strokeStyle = "#ffe27a";
        ctx.stroke();
      });
      if (state.gameOver) {
        drawCenteredText(ctx, "Cities Lost", width / 2, height / 2, 38, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createLanderGame() {
  const width = 960;
  const height = 640;
  return {
    id: "lunar-lander",
    title: "Lunar Lander",
    year: "1979",
    tagline: "Burn fuel, fight gravity, touch down clean.",
    description: "A crunchy little lander sim with rotation, thrust, gravity, and a strict safe-landing window.",
    controls: ["Arrow Left/Right rotates.", "Arrow Up or W thrusts.", "Land slowly on the pad."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 1,
        level: 1,
        fuel: 100,
        ship: { x: width / 2, y: 100, vx: 0, vy: 0, angle: 0 },
        pad: { x: rand(180, width - 280), y: height - 90, w: 140 },
      };
    },
    update(state, input, dt) {
      if (state.gameOver || state.won) {
        return;
      }
      const ship = state.ship;
      if (input.keys.has("ArrowLeft") || input.keys.has("a") || input.keys.has("A")) {
        ship.angle -= 1.8 * dt;
      }
      if (input.keys.has("ArrowRight") || input.keys.has("d") || input.keys.has("D")) {
        ship.angle += 1.8 * dt;
      }
      if ((input.keys.has("ArrowUp") || input.keys.has("w") || input.keys.has("W")) && state.fuel > 0) {
        ship.vx += Math.sin(ship.angle) * 90 * dt;
        ship.vy -= Math.cos(ship.angle) * 160 * dt;
        state.fuel = Math.max(0, state.fuel - 22 * dt);
      }
      ship.vy += 60 * dt;
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      if (ship.x < 20 || ship.x > width - 20 || ship.y < 10) {
        state.gameOver = true;
      }
      if (ship.y >= state.pad.y - 14) {
        const safe =
          ship.x >= state.pad.x &&
          ship.x <= state.pad.x + state.pad.w &&
          Math.abs(ship.vx) < 28 &&
          Math.abs(ship.vy) < 36 &&
          Math.abs(ship.angle) < 0.2;
        if (safe) {
          state.won = true;
          state.score = Math.round(state.fuel * 10);
        } else {
          state.gameOver = true;
        }
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#04070d";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#d8dfef";
      ctx.fillRect(0, height - 70, width, 70);
      ctx.fillStyle = "#7dff95";
      ctx.fillRect(state.pad.x, state.pad.y, state.pad.w, 8);
      const ship = state.ship;
      ctx.save();
      ctx.translate(ship.x, ship.y);
      ctx.rotate(ship.angle);
      ctx.strokeStyle = "#dbe7ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(14, 16);
      ctx.lineTo(-14, 16);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Soft Landing" : "Crash Landing", width / 2, height / 2, 40, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state, { lives: state.fuel.toFixed(0), status: state.won ? "Landed" : state.gameOver ? "Crashed" : "Descent" }),
  };
}

function createSimonGame() {
  const width = 960;
  const height = 640;
  const pads = [
    { id: 0, x: 240, y: 130, w: 200, h: 160, color: "#ff7171", key: "1" },
    { id: 1, x: 520, y: 130, w: 200, h: 160, color: "#69d8f7", key: "2" },
    { id: 2, x: 240, y: 340, w: 200, h: 160, color: "#ffe27a", key: "3" },
    { id: 3, x: 520, y: 340, w: 200, h: 160, color: "#7dff95", key: "4" },
  ];

  function addToSequence(state) {
    state.sequence.push(randInt(0, 3));
    state.showing = true;
    state.showIndex = 0;
    state.showTimer = 0;
    state.inputIndex = 0;
  }

  return {
    id: "simon",
    title: "Simon",
    year: "1978",
    tagline: "See the pattern. Repeat the pattern. Survive the pattern.",
    description: "The memory toy turned into a cabinet challenge. Watch the glow, repeat it, extend it.",
    controls: ["Press keys 1-4 or click the four pads.", "Repeat the sequence exactly."],
    width,
    height,
    create() {
      const state = {
        score: 0,
        lives: 1,
        level: 1,
        sequence: [],
        showing: false,
        showIndex: 0,
        showTimer: 0,
        litPad: null,
        inputIndex: 0,
      };
      addToSequence(state);
      return state;
    },
    onKeyDown(state, key) {
      const pad = pads.find((item) => item.key === key);
      if (!pad || state.showing || state.gameOver) {
        return;
      }
      if (state.sequence[state.inputIndex] !== pad.id) {
        state.gameOver = true;
        return;
      }
      state.litPad = pad.id;
      state.showTimer = 0.18;
      state.inputIndex += 1;
      if (state.inputIndex >= state.sequence.length) {
        state.score += 25;
        state.level += 1;
        addToSequence(state);
      }
    },
    onPointerDown(state, pointer) {
      const pad = pads.find(
        (item) =>
          pointer.x >= item.x &&
          pointer.x <= item.x + item.w &&
          pointer.y >= item.y &&
          pointer.y <= item.y + item.h
      );
      if (pad) {
        this.onKeyDown(state, pad.key);
      }
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.showTimer -= dt;
      if (state.showing) {
        if (state.showTimer <= 0) {
          if (state.litPad == null) {
            state.litPad = state.sequence[state.showIndex];
            state.showTimer = 0.4;
          } else {
            state.litPad = null;
            state.showIndex += 1;
            if (state.showIndex >= state.sequence.length) {
              state.showing = false;
            }
            state.showTimer = 0.2;
          }
        }
      } else if (state.showTimer <= 0) {
        state.litPad = null;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#0b1017";
      ctx.fillRect(0, 0, width, height);
      pads.forEach((pad) => {
        ctx.fillStyle = pad.color;
        ctx.globalAlpha = state.litPad === pad.id ? 1 : 0.55;
        ctx.fillRect(pad.x, pad.y, pad.w, pad.h);
        ctx.globalAlpha = 1;
        drawCenteredText(ctx, pad.key, pad.x + pad.w / 2, pad.y + pad.h / 2 + 10, 42, "#091018");
      });
      if (state.gameOver) {
        drawCenteredText(ctx, "Sequence Lost", width / 2, 570, 38, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state, { lives: "-", status: state.gameOver ? "Wrong Pad" : state.showing ? "Watch" : "Repeat" }),
  };
}

function createMemoryGame() {
  const width = 960;
  const height = 640;
  const icons = ["A", "B", "C", "D", "E", "F", "G", "H"];
  function buildDeck() {
    return shuffle([...icons, ...icons]).map((value, index) => ({
      value,
      row: Math.floor(index / 4),
      col: index % 4,
      revealed: false,
      matched: false,
    }));
  }
  return {
    id: "memory-match",
    title: "Memory Match",
    year: "1989",
    tagline: "Flip, remember, and clear the board cleanly.",
    description: "A polished card-flip memory table that fits right into an arcade site for quick high-score runs.",
    controls: ["Click tiles to reveal them.", "Match every pair in as few misses as possible."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 12,
        level: 1,
        deck: buildDeck(),
        pick: [],
        wait: 0,
      };
    },
    onPointerDown(state, pointer) {
      if (state.gameOver || state.won || state.wait > 0) {
        return;
      }
      const startX = 250;
      const startY = 110;
      const size = 110;
      const gap = 18;
      const card = state.deck.find((item) => {
        const x = startX + item.col * (size + gap);
        const y = startY + item.row * (size + gap);
        return pointer.x >= x && pointer.x <= x + size && pointer.y >= y && pointer.y <= y + size;
      });
      if (!card || card.revealed || card.matched || state.pick.length === 2) {
        return;
      }
      card.revealed = true;
      state.pick.push(card);
      if (state.pick.length === 2) {
        if (state.pick[0].value === state.pick[1].value) {
          state.pick.forEach((item) => (item.matched = true));
          state.pick = [];
          state.score += 50;
        } else {
          state.wait = 0.7;
          state.lives -= 1;
        }
      }
      if (state.deck.every((item) => item.matched)) {
        state.won = true;
      }
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    },
    update(state, input, dt) {
      if (state.wait > 0) {
        state.wait -= dt;
        if (state.wait <= 0) {
          state.pick.forEach((item) => (item.revealed = false));
          state.pick = [];
        }
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#0a1119";
      ctx.fillRect(0, 0, width, height);
      const startX = 250;
      const startY = 110;
      const size = 110;
      const gap = 18;
      state.deck.forEach((card) => {
        const x = startX + card.col * (size + gap);
        const y = startY + card.row * (size + gap);
        ctx.fillStyle = card.revealed || card.matched ? "#7eb0ff" : "#1a2230";
        ctx.fillRect(x, y, size, size);
        if (card.revealed || card.matched) {
          drawCenteredText(ctx, card.value, x + size / 2, y + size / 2 + 10, 44, "#091018");
        }
      });
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Board Cleared" : "Memory Lost", width / 2, 590, 36, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state, { status: state.won ? "Solved" : state.gameOver ? "Out of Misses" : "Matching" }),
  };
}

function createMinesweeperGame() {
  const width = 960;
  const height = 640;
  const cols = 10;
  const rows = 10;
  const mines = 14;

  function buildBoard() {
    const cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ mine: false, revealed: false, flagged: false, count: 0 }))
    );
    let placed = 0;
    while (placed < mines) {
      const x = randInt(0, cols - 1);
      const y = randInt(0, rows - 1);
      if (!cells[y][x].mine) {
        cells[y][x].mine = true;
        placed += 1;
      }
    }
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (cells[y][x].mine) {
          continue;
        }
        let count = 0;
        for (let yy = -1; yy <= 1; yy += 1) {
          for (let xx = -1; xx <= 1; xx += 1) {
            const nx = x + xx;
            const ny = y + yy;
            if (cells[ny]?.[nx]?.mine) {
              count += 1;
            }
          }
        }
        cells[y][x].count = count;
      }
    }
    return cells;
  }

  function reveal(board, x, y) {
    const cell = board[y]?.[x];
    if (!cell || cell.revealed || cell.flagged) {
      return;
    }
    cell.revealed = true;
    if (cell.count === 0 && !cell.mine) {
      for (let yy = -1; yy <= 1; yy += 1) {
        for (let xx = -1; xx <= 1; xx += 1) {
          if (xx !== 0 || yy !== 0) {
            reveal(board, x + xx, y + yy);
          }
        }
      }
    }
  }

  return {
    id: "minesweeper",
    title: "Minesweeper",
    year: "1990",
    tagline: "Read the numbers, mark the bombs, clear the field.",
    description: "A fast arcade-flavored Minesweeper board for short tactical runs between action cabinets.",
    controls: ["Click to reveal.", "Shift-click to flag.", "Reveal every safe tile."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 1,
        level: 1,
        board: buildBoard(),
        flags: 0,
      };
    },
    onPointerDown(state, pointer, input) {
      if (state.gameOver || state.won) {
        return;
      }
      const startX = 300;
      const startY = 90;
      const size = 42;
      const x = Math.floor((pointer.x - startX) / size);
      const y = Math.floor((pointer.y - startY) / size);
      const cell = state.board[y]?.[x];
      if (!cell) {
        return;
      }
      if (input.keys.has("Shift")) {
        if (!cell.revealed) {
          cell.flagged = !cell.flagged;
          state.flags += cell.flagged ? 1 : -1;
        }
        return;
      }
      reveal(state.board, x, y);
      if (cell.mine) {
        state.gameOver = true;
      }
      const safeTotal = rows * cols - mines;
      const safeShown = state.board.flat().filter((item) => item.revealed && !item.mine).length;
      state.score = safeShown * 10;
      if (safeShown >= safeTotal) {
        state.won = true;
      }
    },
    update() {},
    render(ctx, state) {
      ctx.fillStyle = "#0b0f16";
      ctx.fillRect(0, 0, width, height);
      const startX = 300;
      const startY = 90;
      const size = 42;
      state.board.forEach((row, y) => {
        row.forEach((cell, x) => {
          ctx.fillStyle = cell.revealed ? "#dbe7ff" : "#18202c";
          ctx.fillRect(startX + x * size, startY + y * size, size - 2, size - 2);
          if (cell.flagged) {
            drawCenteredText(ctx, "F", startX + x * size + size / 2, startY + y * size + size / 2 + 7, 20, "#ff8d8d");
          } else if (cell.revealed && cell.mine) {
            drawCenteredText(ctx, "*", startX + x * size + size / 2, startY + y * size + size / 2 + 8, 22, "#ff7171");
          } else if (cell.revealed && cell.count > 0) {
            drawCenteredText(ctx, String(cell.count), startX + x * size + size / 2, startY + y * size + size / 2 + 7, 20, "#071018");
          }
        });
      });
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "Field Cleared" : "Mine Detonated", width / 2, 560, 36, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state, { lives: `${state.flags}/${mines}`, status: state.won ? "Solved" : state.gameOver ? "Boom" : "Scanning" }),
  };
}

function create2048Game() {
  const width = 960;
  const height = 640;
  const size = 4;
  function emptyBoard() {
    return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
  }
  function addTile(board) {
    const open = [];
    board.forEach((row, y) => row.forEach((value, x) => !value && open.push({ x, y })));
    if (!open.length) {
      return;
    }
    const spot = open[randInt(0, open.length - 1)];
    board[spot.y][spot.x] = Math.random() < 0.9 ? 2 : 4;
  }
  function slide(line) {
    const compact = line.filter(Boolean);
    const next = [];
    let gained = 0;
    while (compact.length) {
      if (compact[0] && compact[0] === compact[1]) {
        const value = compact.shift() * 2;
        compact.shift();
        next.push(value);
        gained += value;
      } else {
        next.push(compact.shift());
      }
    }
    while (next.length < size) {
      next.push(0);
    }
    return { line: next, gained };
  }
  function move(board, direction) {
    let moved = false;
    let gained = 0;
    for (let index = 0; index < size; index += 1) {
      const line =
        direction === "left" || direction === "right"
          ? board[index].slice()
          : board.map((row) => row[index]);
      const read = direction === "right" || direction === "down" ? line.reverse() : line;
      const result = slide(read);
      const write =
        direction === "right" || direction === "down" ? result.line.reverse() : result.line;
      gained += result.gained;
      write.forEach((value, inner) => {
        if (direction === "left" || direction === "right") {
          if (board[index][inner] !== value) {
            moved = true;
          }
          board[index][inner] = value;
        } else {
          if (board[inner][index] !== value) {
            moved = true;
          }
          board[inner][index] = value;
        }
      });
    }
    return { moved, gained };
  }
  return {
    id: "2048",
    title: "2048",
    year: "2014",
    tagline: "Slide, merge, and chase the huge tile.",
    description: "Not a cabinet original, but it belongs in a modern arcade stack because it is dangerously replayable.",
    controls: ["Arrow keys or WASD slides all tiles.", "Merge matching values and build up to 2048 or beyond."],
    width,
    height,
    create() {
      const board = emptyBoard();
      addTile(board);
      addTile(board);
      return { score: 0, lives: 1, level: 1, board };
    },
    onKeyDown(state, key) {
      if (state.gameOver || state.won) {
        return;
      }
      const map = {
        ArrowLeft: "left",
        a: "left",
        A: "left",
        ArrowRight: "right",
        d: "right",
        D: "right",
        ArrowUp: "up",
        w: "up",
        W: "up",
        ArrowDown: "down",
        s: "down",
        S: "down",
      };
      const direction = map[key];
      if (!direction) {
        return;
      }
      const result = move(state.board, direction);
      if (result.moved) {
        addTile(state.board);
        state.score += result.gained;
        state.level = 1 + Math.floor(state.score / 1000);
      }
      if (state.board.flat().some((value) => value >= 2048)) {
        state.won = true;
      }
      const blocked = ["left", "right", "up", "down"].every((dir) => !move(state.board.map((row) => row.slice()), dir).moved);
      if (blocked && !state.won) {
        state.gameOver = true;
      }
    },
    update() {},
    render(ctx, state) {
      ctx.fillStyle = "#0f1117";
      ctx.fillRect(0, 0, width, height);
      const startX = 300;
      const startY = 80;
      const cell = 110;
      state.board.forEach((row, y) => {
        row.forEach((value, x) => {
          ctx.fillStyle = value ? "#7eb0ff" : "#202532";
          ctx.fillRect(startX + x * (cell + 12), startY + y * (cell + 12), cell, cell);
          if (value) {
            drawCenteredText(ctx, String(value), startX + x * (cell + 12) + cell / 2, startY + y * (cell + 12) + cell / 2 + 12, 34, "#091018");
          }
        });
      });
      if (state.gameOver || state.won) {
        drawCenteredText(ctx, state.won ? "2048 Reached" : "No Moves Left", width / 2, 590, 36, state.won ? "#7dff95" : "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

function createRunnerGame() {
  const width = 960;
  const height = 640;
  return {
    id: "runner",
    title: "Endless Runner",
    year: "1985-ish",
    tagline: "Jump the hazards and stay alive as the pace climbs.",
    description: "A one-button sprint cabinet with rising speed, compact obstacles, and a clean score chase.",
    controls: ["Space, W, or Arrow Up jumps.", "Survive as long as possible."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 1,
        level: 1,
        runner: { x: 120, y: 500, vy: 0, grounded: true },
        obstacles: [],
        spawnTimer: 0,
        speed: 320,
      };
    },
    onKeyDown(state, key) {
      if ((key === " " || key === "ArrowUp" || key === "w" || key === "W") && state.runner.grounded && !state.gameOver) {
        state.runner.vy = -580;
        state.runner.grounded = false;
      }
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.spawnTimer += dt;
      state.speed += dt * 6;
      state.score += dt * 20;
      state.level = 1 + Math.floor(state.score / 120);
      if (state.spawnTimer > Math.max(0.45, 1.2 - state.level * 0.06)) {
        state.spawnTimer = 0;
        state.obstacles.push({ x: width + 40, y: 522, w: randInt(24, 48), h: randInt(34, 60) });
      }
      state.runner.vy += 1400 * dt;
      state.runner.y += state.runner.vy * dt;
      if (state.runner.y >= 500) {
        state.runner.y = 500;
        state.runner.vy = 0;
        state.runner.grounded = true;
      }
      state.obstacles.forEach((obstacle) => {
        obstacle.x -= state.speed * dt;
      });
      state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.w > -20);
      const runnerRect = { x: state.runner.x - 18, y: state.runner.y - 42, w: 36, h: 42 };
      if (state.obstacles.some((obstacle) => rectsOverlap(runnerRect, obstacle))) {
        state.gameOver = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#0b1017";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#182331";
      ctx.fillRect(0, 542, width, 98);
      ctx.fillStyle = "#dbe7ff";
      ctx.fillRect(state.runner.x - 18, state.runner.y - 42, 36, 42);
      ctx.fillStyle = "#ff9d57";
      state.obstacles.forEach((obstacle) => ctx.fillRect(obstacle.x, obstacle.y - obstacle.h, obstacle.w, obstacle.h));
      if (state.gameOver) {
        drawCenteredText(ctx, "Run Ended", width / 2, height / 2, 40, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state, { score: Math.floor(state.score) }),
  };
}

function createTargetGalleryGame() {
  const width = 960;
  const height = 640;
  return {
    id: "target-gallery",
    title: "Target Gallery",
    year: "1984",
    tagline: "Quick shot carnival targets with one click.",
    description: "A pointer-driven arcade gallery. Hit moving targets, miss too many, and the round ends fast.",
    controls: ["Move the mouse over the stage.", "Click targets before they leave the frame."],
    width,
    height,
    create() {
      return {
        score: 0,
        lives: 5,
        level: 1,
        targets: [],
        cursor: { x: width / 2, y: height / 2 },
        spawnTimer: 0,
      };
    },
    onPointerMove(state, pointer) {
      state.cursor = { x: pointer.x, y: pointer.y };
    },
    onPointerDown(state, pointer) {
      if (state.gameOver) {
        return;
      }
      const hit = state.targets.find((target) => circleDistance(target, pointer) < target.r);
      if (hit) {
        hit.hit = true;
        state.score += 35;
        state.level = 1 + Math.floor(state.score / 250);
      } else {
        state.lives -= 1;
        if (state.lives <= 0) {
          state.gameOver = true;
        }
      }
    },
    update(state, input, dt) {
      if (state.gameOver) {
        return;
      }
      state.spawnTimer += dt;
      if (state.spawnTimer > Math.max(0.22, 0.9 - state.level * 0.05)) {
        state.spawnTimer = 0;
        state.targets.push({
          x: -30,
          y: rand(120, 520),
          vx: rand(180, 280) + state.level * 18,
          r: rand(18, 28),
        });
      }
      state.targets.forEach((target) => {
        target.x += target.vx * dt;
      });
      const escaped = state.targets.filter((target) => target.x - target.r > width && !target.hit).length;
      if (escaped) {
        state.lives -= escaped;
      }
      state.targets = state.targets.filter((target) => target.x - target.r <= width && !target.hit);
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    },
    render(ctx, state) {
      ctx.fillStyle = "#101117";
      ctx.fillRect(0, 0, width, height);
      state.targets.forEach((target) => {
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r, 0, TAU);
        ctx.fillStyle = "#ff7171";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r * 0.55, 0, TAU);
        ctx.fillStyle = "#ffe27a";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(target.x, target.y, target.r * 0.2, 0, TAU);
        ctx.fillStyle = "#0b1118";
        ctx.fill();
      });
      ctx.strokeStyle = "#dbe7ff";
      ctx.beginPath();
      ctx.arc(state.cursor.x, state.cursor.y, 16, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(state.cursor.x - 24, state.cursor.y);
      ctx.lineTo(state.cursor.x + 24, state.cursor.y);
      ctx.moveTo(state.cursor.x, state.cursor.y - 24);
      ctx.lineTo(state.cursor.x, state.cursor.y + 24);
      ctx.stroke();
      if (state.gameOver) {
        drawCenteredText(ctx, "Gallery Closed", width / 2, height / 2, 38, "#ff8d8d");
      }
    },
    hud: (state) => baseHud(state),
  };
}

const GAMES = [
  createSnakeGame(),
  createPongGame(),
  createBreakoutGame(),
  createAsteroidsGame(),
  createInvadersGame(),
  createTetrisGame(),
  createFroggerGame(),
  createMissileCommandGame(),
  createLanderGame(),
  createSimonGame(),
  createMemoryGame(),
  createMinesweeperGame(),
  create2048Game(),
  createRunnerGame(),
  createTargetGalleryGame(),
];

export { clamp, rand, randInt, rectsOverlap, shuffle };
export const ARCADE_GAMES = GAMES;
