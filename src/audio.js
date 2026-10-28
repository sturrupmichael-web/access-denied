// Sound effects, synthesized with Web Audio, so there are no sound files. Phase 1 has
// placeholder sounds and the mute toggle; Phase 4 polishes them.

import { load, save } from './storage.js';

let ctx = null;
let muted = !!load('muted', false);

// Created lazily: browsers only allow audio after the player has clicked something.
function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(c, { freq, dur, type = 'sine', gain = 0.1, at = 0, slideTo }) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(c, { dur, gain = 0.2 }) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  src.connect(g).connect(c.destination);
  src.start();
}

const SOUNDS = {
  ring(c) {
    for (const at of [0, 0.45]) {
      tone(c, { freq: 440, dur: 0.35, type: 'triangle', gain: 0.06, at });
      tone(c, { freq: 480, dur: 0.35, type: 'triangle', gain: 0.06, at });
    }
  },
  key: (c) => tone(c, { freq: 1700 + Math.random() * 500, dur: 0.012, type: 'square', gain: 0.012 }),
  click: (c) => tone(c, { freq: 900, dur: 0.03, type: 'square', gain: 0.03 }),
  stamp(c) {
    tone(c, { freq: 160, dur: 0.18, gain: 0.35, slideTo: 60 });
    noise(c, { dur: 0.09, gain: 0.25 });
  },
};

export function play(name) {
  if (muted || !SOUNDS[name]) return;
  const c = audio();
  if (!c) return;
  try {
    SOUNDS[name](c);
  } catch {
    // Sound is never worth crashing over.
  }
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = !!value;
  save('muted', muted);
}
