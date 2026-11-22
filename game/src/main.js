// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between five screens: title, play, paused, clean getaway and busted.
//
// ?shot=cover|sneak|gem|escape stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createWorld, EVENT_CAUGHT, EVENT_COIN, EVENT_GEM, EVENT_GRAB, EVENT_SMOKE, EVENT_SPOTTED, EVENT_WIN } from './world.js';
import { ACTION_COIN, ACTION_CONFIRM, ACTION_GRAB, ACTION_MUTE, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each event.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    announce('Playing. Steal the Sun of Meridian, then reach the exit.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    const value = world.score();
    if (won && value > best) {
      best = value;
      saveBest(best);
    }
    announce(won ? `Clean getaway. Score ${value}. Best ${best}.` : `Busted. Loot held $${world.state.lootValue}. Best ${best}.`);
  }

  function handleEvents(events) {
    if (events & EVENT_SPOTTED) {
      audio.spotted();
      announce('Spotted! Break line of sight.');
    }
    if (events & EVENT_GRAB) {
      if (events & EVENT_GEM) audio.gem();
      else audio.pickup();
    }
    if (events & EVENT_SMOKE) audio.smoke();
    if (events & EVENT_COIN) audio.coin();
    if (events & EVENT_WIN) {
      audio.win();
      endGame(true);
    } else if (events & EVENT_CAUGHT) {
      audio.caught();
      endGame(false);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
    else if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (screen === SCREEN_PLAY) {
      if (actions & ACTION_GRAB) handleEvents(world.tryGrab());
      if (actions & ACTION_SMOKE) handleEvents(world.throwSmoke());
      if (actions & ACTION_COIN) handleEvents(world.tossCoin());
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0, sneak: false }, true);
      return;
    }
    const events = world.step(STEP, input.direction(), false);
    handleEvents(events);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab pauses a running game rather than letting guards close in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gilded: the Meridian Gallery Heist. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
