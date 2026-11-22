// Everything the eye sees: the gallery at night, the sweeping vision cones, the thief and the
// guards, the alarm meter and the screens. It reads the world's state and never changes it.

import { ALARM, CAMERA, FIELD, FONT, PALETTE, SERIF, SMOKE } from './config.js';
import { CASES, DAIS, EXIT, PILLARS, WALLS, rayHit } from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_WIN = 3;
export const SCREEN_OVER = 4;

const CONE_RAYS = 26;

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let scale = 1;
  let ox = 0;
  let oy = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ox = (canvas.width - FIELD.width * scale) / 2;
    oy = (canvas.height - FIELD.height * scale) / 2;
  }

  window.addEventListener('resize', resize);
  resize();

  function conePath(x, y, angle, half, range, color, edge) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i <= CONE_RAYS; i += 1) {
      const a = angle - half + (2 * half * i) / CONE_RAYS;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      const hit = rayHit(x, y, dx, dy);
      const len = Math.min(range, hit === Infinity ? range : hit);
      ctx.lineTo(x + dx * len, y + dy * len);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = edge;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floorA;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.floorB;
    for (let ty = 0; ty < 18; ty += 1) {
      for (let tx = 0; tx < 32; tx += 1) {
        if ((tx + ty) % 2 === 0) ctx.fillRect(tx * 40, ty * 40, 40, 40);
      }
    }
    // The red carpet runner from the entrance to the dais, gold-trimmed.
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(584, 28, 112, 664);
    ctx.fillStyle = PALETTE.carpetTrim;
    ctx.fillRect(584, 28, 3, 664);
    ctx.fillRect(693, 28, 3, 664);
  }

  function drawWalls() {
    for (const w of WALLS) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = PALETTE.wallTrim;
      if (w.h <= 28 && w.w > 28) ctx.fillRect(w.x, w.y + w.h - 3, w.w, 3);
      else if (w.w <= 28 && w.h > 28) ctx.fillRect(w.x + w.w - 3, w.y, 3, w.h);
    }
    // The exit door glows green at the bottom gap.
    ctx.fillStyle = PALETTE.exit;
    ctx.fillRect(EXIT.x, EXIT.y - 4, EXIT.w, 8);
    ctx.fillStyle = 'rgba(55, 214, 122, 0.25)';
    ctx.fillRect(EXIT.x - 10, EXIT.y - 34, EXIT.w + 20, 34);
    ctx.fillStyle = PALETTE.exit;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y - 12);
  }

  function drawCasesAndPillars() {
    for (const c of CASES) {
      ctx.fillStyle = PALETTE.caseFrame;
      ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
      ctx.fillStyle = PALETTE.caseGlass;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.moveTo(c.x + 12, c.y + c.h);
      ctx.lineTo(c.x + c.w - 30, c.y);
      ctx.lineTo(c.x + c.w - 12, c.y);
      ctx.lineTo(c.x + 30, c.y + c.h);
      ctx.closePath();
      ctx.fill();
    }
    for (const p of PILLARS) {
      const g = ctx.createRadialGradient(p.x - 8, p.y - 8, 4, p.x, p.y, p.r);
      g.addColorStop(0, PALETTE.pillarHi);
      g.addColorStop(1, PALETTE.pillar);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawDais(state, t) {
    const g = ctx.createRadialGradient(DAIS.x - 8, DAIS.y - 8, 6, DAIS.x, DAIS.y, DAIS.r + 14);
    g.addColorStop(0, 'rgba(255, 237, 176, 0.30)');
    g.addColorStop(1, 'rgba(255, 237, 176, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(DAIS.x, DAIS.y, DAIS.r + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8ab8d';
    ctx.beginPath();
    ctx.arc(DAIS.x, DAIS.y, DAIS.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 3;
    ctx.stroke();
    const gem = state.loot.find((l) => l.kind === 'gem');
    if (gem && !gem.taken) {
      const pulse = 1 + 0.12 * Math.sin(t * 3);
      ctx.save();
      ctx.translate(DAIS.x, DAIS.y - 6);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = PALETTE.gem;
      ctx.strokeStyle = '#a67c1a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(17, 0);
      ctx.lineTo(0, 24);
      ctx.lineTo(-17, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(8, -5);
      ctx.lineTo(0, 0);
      ctx.lineTo(-8, -5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function drawLoot(state) {
    for (const l of state.loot) {
      if (l.taken || l.kind === 'gem') continue;
      const bob = Math.sin(state.elapsed * 2 + l.x) * 2;
      ctx.save();
      ctx.translate(l.x, l.y + bob);
      ctx.fillStyle = 'rgba(232, 182, 76, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.loot;
      if (l.id === 'painting') {
        ctx.fillRect(-22, -16, 44, 32);
        ctx.fillStyle = '#2b3a67';
        ctx.fillRect(-18, -12, 36, 24);
        ctx.fillStyle = '#e8b64c';
        ctx.beginPath();
        ctx.arc(0, -4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 12, 10, Math.PI, 0);
        ctx.fill();
      } else if (l.id === 'bust') {
        ctx.beginPath();
        ctx.arc(0, -8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-12, 0, 24, 14);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-5, -20, 10, 6);
      }
      ctx.restore();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `11px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText('$100', l.x, l.y + 42);
    }
  }

  function drawCones(state) {
    for (const c of state.cameras) {
      conePath(c.x, c.y, c.angle, CAMERA.coneHalf, CAMERA.coneRange, c.sees ? PALETTE.coneAlert : PALETTE.coneCamera, 'rgba(255, 170, 110, 0.55)');
    }
    for (const g of state.guards) {
      const color = g.state === 'alert' ? PALETTE.coneAlert : g.state === 'curious' ? PALETTE.coneSuspicious : PALETTE.cone;
      conePath(g.x, g.y, g.angle, 0.61, 265, color, 'rgba(255, 230, 150, 0.6)');
    }
  }

  function drawSmokeAndCoins(state) {
    for (const s of state.smoke) {
      ctx.fillStyle = PALETTE.smoke;
      ctx.beginPath();
      ctx.arc(s.x, s.y, SMOKE.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(200, 205, 220, 0.18)';
      ctx.beginPath();
      ctx.arc(s.x - 30, s.y + 18, SMOKE.radius * 0.6, 0, Math.PI * 2);
      ctx.arc(s.x + 34, s.y - 14, SMOKE.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of state.coins) {
      ctx.fillStyle = PALETTE.loot;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(232, 182, 76, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawGuard(g) {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.fillStyle = '#42538a';
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c7d4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim points where the guard looks.
    ctx.fillStyle = '#c7d4ff';
    ctx.beginPath();
    ctx.arc(Math.cos(g.angle) * 11, Math.sin(g.angle) * 11, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (g.state !== 'patrol') {
      const mark = g.state === 'alert' ? '!' : '?';
      const color = g.state === 'alert' ? PALETTE.red : '#ffb020';
      ctx.fillStyle = 'rgba(10, 13, 26, 0.85)';
      ctx.beginPath();
      ctx.arc(g.x, g.y - 32, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = `bold 26px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mark, g.x, g.y - 31);
      ctx.textBaseline = 'alphabetic';
    }
    if (g.suspicion > 0.05 && g.state !== 'alert') {
      ctx.fillStyle = 'rgba(10, 13, 26, 0.8)';
      ctx.fillRect(g.x - 16, g.y - 40, 32, 5);
      ctx.fillStyle = '#ffb020';
      ctx.fillRect(g.x - 16, g.y - 40, 32 * g.suspicion, 5);
    }
  }

  function drawCamera(c) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.fillStyle = '#1c2138';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.sees ? PALETTE.red : '#8b93a3';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = c.sees ? PALETTE.red : '#ffd95a';
    ctx.beginPath();
    ctx.arc(Math.cos(c.angle) * 5, Math.sin(c.angle) * 5, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer(p, state) {
    // A soft teal glow and a bright ring so the thief always reads against the dark floor.
    const glow = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 30);
    glow.addColorStop(0, 'rgba(45, 212, 191, 0.28)');
    glow.addColorStop(1, 'rgba(45, 212, 191, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(p.x, p.y);
    // Soft shadow.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 7, 18, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cloak: a hooded triangle pointing where the thief faces.
    ctx.rotate(p.angle);
    ctx.fillStyle = '#232838';
    ctx.beginPath();
    ctx.moveTo(21, 0);
    ctx.lineTo(-14, -15);
    ctx.lineTo(-9, 0);
    ctx.lineTo(-14, 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = PALETTE.playerScarf;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = PALETTE.playerScarf;
    ctx.beginPath();
    ctx.arc(5, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (state.gemTaken) {
      ctx.fillStyle = PALETTE.gem;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 28);
      ctx.lineTo(p.x + 7, p.y - 19);
      ctx.lineTo(p.x, p.y - 10);
      ctx.lineTo(p.x - 7, p.y - 19);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(0, 0, FIELD.width, 46);
    // Alarm meter.
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', 24, 19);
    ctx.fillStyle = '#2a3040';
    ctx.fillRect(24, 26, 240, 10);
    const alarmColor = state.alarm >= 80 ? PALETTE.red : state.alarm >= 40 ? '#ff9a3d' : '#ffd95a';
    ctx.fillStyle = alarmColor;
    ctx.fillRect(24, 26, 240 * (state.alarm / ALARM.lockdown), 10);
    ctx.fillStyle = state.alarm >= ALARM.lockdown ? PALETTE.red : PALETTE.text;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillText(state.alarm >= ALARM.lockdown ? 'LOCKDOWN' : `${Math.floor(state.alarm)}%`, 272, 36);
    // Loot.
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 19px ${FONT}`;
    ctx.fillText(`$${state.lootValue}`, FIELD.width / 2, 24);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `11px ${FONT}`;
    ctx.fillText(state.gemTaken ? 'The Sun is yours — reach the EXIT' : 'Steal the Sun of Meridian, then reach the EXIT', FIELD.width / 2, 41);
    // Tools and time.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 14px ${FONT}`;
    ctx.fillText(`Smoke ${state.smokeLeft}  •  Coins ${state.coinsLeft}`, FIELD.width - 24, 20);
    const mins = Math.floor(state.elapsed / 60);
    const secs = Math.floor(state.elapsed % 60);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `13px ${FONT}`;
    ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, FIELD.width - 24, 38);
    // Objective banner.
    if (state.messageT > 0 && state.message) {
      ctx.textAlign = 'center';
      ctx.fillStyle = state.alarm >= ALARM.lockdown ? PALETTE.red : PALETTE.gold;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText(state.message, FIELD.width / 2, 84);
    }
    // Sneak hint at the bottom.
    ctx.fillStyle = 'rgba(154, 163, 189, 0.75)';
    ctx.font = `12px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('WASD move  •  Shift sneak  •  Space grab  •  Q smoke  •  C toss a coin  •  P pause', FIELD.width / 2, FIELD.height - 12);
  }

  function drawWorld(state) {
    const t = state.elapsed;
    drawFloor();
    drawCasesAndPillars();
    drawDais(state, t);
    drawLoot(state);
    drawCones(state);
    drawSmokeAndCoins(state);
    drawWalls();
    for (const c of state.cameras) drawCamera(c);
    for (const g of state.guards) drawGuard(g);
    drawPlayer(state.player, state);
    // Vignette.
    const v = ctx.createRadialGradient(640, 360, 300, 640, 360, 780);
    v.addColorStop(0, 'rgba(0, 0, 0, 0)');
    v.addColorStop(1, 'rgba(0, 0, 0, 0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function panel(title, lines, accent) {
    ctx.fillStyle = 'rgba(5, 7, 16, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = `bold 64px ${SERIF}`;
    ctx.fillText(title, FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    let y = 350;
    for (const line of lines) {
      ctx.fillText(line, FIELD.width / 2, y);
      y += 30;
    }
  }

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    if (screen === SCREEN_TITLE) {
      drawWorld(state);
      ctx.fillStyle = 'rgba(5, 7, 16, 0.66)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      ctx.textAlign = 'center';
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `bold 92px ${SERIF}`;
      ctx.fillText('GILDED', FIELD.width / 2, 250);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `22px ${SERIF}`;
      ctx.fillText('The Meridian Gallery Heist', FIELD.width / 2, 292);
      ctx.font = `17px ${FONT}`;
      ctx.fillStyle = PALETTE.muted;
      ctx.fillText('One thief. Four guards. Three cameras. One priceless gem.', FIELD.width / 2, 340);
      ctx.fillStyle = PALETTE.text;
      ctx.fillText('WASD move   •   Shift sneak   •   Space grab loot   •   Q smoke   •   C toss a coin', FIELD.width / 2, 400);
      ctx.fillText('Read the cones before you move. Fill the alarm meter and the whole gallery hunts you.', FIELD.width / 2, 430);
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `bold 22px ${FONT}`;
      ctx.fillText('Press SPACE or click to begin', FIELD.width / 2, 500);
      if (best > 0) {
        ctx.fillStyle = PALETTE.muted;
        ctx.font = `16px ${FONT}`;
        ctx.fillText(`Best getaway: $${best}`, FIELD.width / 2, 540);
      }
      return;
    }
    drawWorld(state);
    if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) drawHud(state);
    if (screen === SCREEN_PAUSED) {
      panel('PAUSED', ['Press P or Space to keep stealing.'], PALETTE.text);
    } else if (screen === SCREEN_WIN) {
      const timeBonus = Math.max(0, 600 - Math.floor(state.elapsed));
      const quiet = state.alarm < 50 ? 100 : 0;
      panel('CLEAN GETAWAY', [
        `Loot $${state.lootValue}  •  Speed bonus $${timeBonus}  •  Quiet bonus $${quiet}`,
        `Total score: $${state.lootValue + timeBonus + quiet}     Best: $${Math.max(best, state.lootValue + timeBonus + quiet)}`,
        'Press SPACE to steal again.',
      ], PALETTE.gold);
    } else if (screen === SCREEN_OVER) {
      panel('BUSTED', [
        `The gallery keeps its gem this time. Loot held: $${state.lootValue}.`,
        `Best getaway: $${best}`,
        'Press SPACE to try again.',
      ], PALETTE.red);
    }
  }

  return { draw };
}
