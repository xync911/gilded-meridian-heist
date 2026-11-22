// Small synthesised sounds (Web Audio, no assets): a pickup chime, an alert sting, the gem
// fanfare, a smoke puff and the caught sting. Silent until the first gesture creates audio.

export function createAudio() {
  let ac = null;
  let muted = false;

  function ensure() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ac = null;
      }
    }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }

  function tone(freq, dur, type, gain, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.16);
      tone(1318, 0.18, 'sine', 0.14, 0.07);
    },
    gem() {
      tone(523, 0.16, 'triangle', 0.18);
      tone(659, 0.16, 'triangle', 0.18, 0.09);
      tone(784, 0.24, 'triangle', 0.2, 0.18);
      tone(1046, 0.4, 'sine', 0.16, 0.27);
    },
    spotted() {
      tone(196, 0.22, 'sawtooth', 0.12);
      tone(147, 0.3, 'sawtooth', 0.12, 0.1);
    },
    smoke() {
      tone(220, 0.25, 'sine', 0.08);
    },
    coin() {
      tone(1568, 0.07, 'square', 0.06);
      tone(2093, 0.09, 'square', 0.05, 0.06);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.12));
    },
    caught() {
      tone(110, 0.5, 'sawtooth', 0.16);
      tone(82, 0.7, 'sawtooth', 0.14, 0.15);
    },
  };
}
