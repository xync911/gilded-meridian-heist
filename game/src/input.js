// Keyboard (and click) input: a direction vector each frame plus one-shot actions the
// caller consumes with takeActions(). No rule here knows what an action does.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_SMOKE = 4;
export const ACTION_COIN = 8;
export const ACTION_GRAB = 16;
export const ACTION_MUTE = 32;

const KEY_ACTIONS = {
  Space: ACTION_CONFIRM | ACTION_GRAB,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyQ: ACTION_SMOKE,
  KeyC: ACTION_COIN,
  KeyM: ACTION_MUTE,
};

export function createInput(canvas) {
  const keys = new Set();
  let actions = 0;

  function onKeyDown(event) {
    if (event.repeat) return;
    keys.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action) {
      actions |= action;
      event.preventDefault();
    }
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
  }

  function onPointer(event) {
    actions |= ACTION_CONFIRM;
    event.preventDefault();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointer);

  /** Held movement as a unit vector (or 0,0); sneak is held Shift. */
  function direction() {
    let x = 0;
    let y = 0;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
    if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y, sneak: keys.has('ShiftLeft') || keys.has('ShiftRight') };
  }

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }

  return { direction, takeActions };
}
