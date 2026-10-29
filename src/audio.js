// Sound effects, synthesized with Web Audio, so there are no sound files to license.
// play(name) is safe to call anywhere: it does nothing while muted, before the player
// has clicked (browsers block audio until then), or where Web Audio is missing.
// Mute is saved under "accessDenied:muted"; the volume is in settings.js.

import { load, save } from './storage.js';
import * as settings from './settings.js';

let ctx = null;
let master = null;
let muted = !!load('muted', false);

const level = () => (settings.get().volume / 100) * 0.9;
settings.onChange(() => {
  if (master) master.gain.value = level();
});

// Created lazily: browsers only allow audio after the player has clicked something.
function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = level();
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One oscillator with a quick attack and an exponential fade.
function tone(c, { freq, dur, type = 'sine', gain = 0.1, at = 0, slideTo, filter }) {
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let out = osc.connect(g);
  if (filter) out = out.connect(biquad(c, filter));
  out.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function biquad(c, { type, freq, q = 1 }) {
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

// A burst of white noise that fades out: paper, clicks, thumps.
function noise(c, { dur, gain = 0.2, at = 0, filter }) {
  const t = c.currentTime + at;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = c.createBufferSource();
  const g = c.createGain();
  g.gain.value = gain;
  src.buffer = buf;
  let out = src.connect(g);
  if (filter) out = out.connect(biquad(c, filter));
  out.connect(master);
  src.start(t);
}

// Notes as frequencies, for the little tunes.
const NOTE = { C4: 261.6, E4: 329.6, G4: 392, B4: 493.9, Eb4: 311.1, C5: 523.3, E5: 659.3, G5: 784, Gs5: 830.6, C6: 1046.5, E6: 1318.5 };

const SOUNDS = {
  // An old desk phone: a bell hammered about twenty times a second.
  ring(c) {
    for (let i = 0; i < 18; i++) {
      const at = i * 0.05;
      tone(c, { freq: 1250, dur: 0.06, type: 'triangle', gain: 0.045, at });
      tone(c, { freq: 1580, dur: 0.05, type: 'sine', gain: 0.03, at: at + 0.02 });
    }
  },
  key: (c) => noise(c, { dur: 0.018, gain: 0.05 + Math.random() * 0.03, filter: { type: 'highpass', freq: 1800 + Math.random() * 1500 } }),
  click(c) {
    noise(c, { dur: 0.012, gain: 0.12, filter: { type: 'highpass', freq: 2500 } });
    tone(c, { freq: 1400, dur: 0.02, type: 'square', gain: 0.012 });
  },
  pickup(c) {
    noise(c, { dur: 0.05, gain: 0.25, filter: { type: 'lowpass', freq: 900 } });
    tone(c, { freq: 140, dur: 0.09, gain: 0.12, slideTo: 70 });
  },
  hangup(c) {
    noise(c, { dur: 0.03, gain: 0.2, filter: { type: 'bandpass', freq: 1200 } });
    noise(c, { dur: 0.03, gain: 0.15, at: 0.09, filter: { type: 'bandpass', freq: 1500 } });
  },
  // The stamp itself: a wooden thump and a slap of paper. A second sound marks the kind.
  stamp(c) {
    tone(c, { freq: 150, dur: 0.22, gain: 0.4, slideTo: 45 });
    noise(c, { dur: 0.12, gain: 0.35, filter: { type: 'lowpass', freq: 2200 } });
  },
  'stamp-approve': (c) => {
    tone(c, { freq: NOTE.E6, dur: 0.35, gain: 0.035, at: 0.06 });
    tone(c, { freq: NOTE.C6 * 1.5, dur: 0.4, gain: 0.02, at: 0.06 });
  },
  'stamp-deny': (c) => tone(c, { freq: 98, dur: 0.3, type: 'sawtooth', gain: 0.06, at: 0.04, filter: { type: 'lowpass', freq: 600 } }),
  'stamp-escalate': (c) => tone(c, { freq: 300, dur: 0.3, gain: 0.04, at: 0.04, slideTo: 900 }),
  // The callback: three keypad tones, then the ring-back tone.
  dial(c) {
    [[697, 1209], [770, 1336], [852, 1477]].forEach(([lo, hi], i) => {
      tone(c, { freq: lo, dur: 0.08, gain: 0.03, at: i * 0.11 });
      tone(c, { freq: hi, dur: 0.08, gain: 0.03, at: i * 0.11 });
    });
    tone(c, { freq: 440, dur: 0.6, gain: 0.025, at: 0.45 });
    tone(c, { freq: 480, dur: 0.6, gain: 0.025, at: 0.45 });
  },
  // MFA push: a phone buzzing on a desk.
  buzz(c) {
    for (const at of [0, 0.2, 0.4]) tone(c, { freq: 160, dur: 0.13, type: 'sawtooth', gain: 0.05, at, filter: { type: 'lowpass', freq: 400 } });
  },
  mail(c) {
    tone(c, { freq: NOTE.G5, dur: 0.18, gain: 0.05 });
    tone(c, { freq: NOTE.C6, dur: 0.35, gain: 0.05, at: 0.1 });
  },
  alarm(c) {
    for (let i = 0; i < 4; i++) tone(c, { freq: i % 2 ? 554 : 740, dur: 0.14, type: 'square', gain: 0.025, at: i * 0.15, filter: { type: 'lowpass', freq: 2000 } });
  },
  shiftEnd(c) {
    [NOTE.C6, NOTE.G5, NOTE.E5].forEach((f, i) => tone(c, { freq: f, dur: 0.9, type: 'triangle', gain: 0.05, at: i * 0.22 }));
  },
  // The title screen: an original four-note chime.
  startup(c) {
    [NOTE.E4, NOTE.B4, NOTE.E5, NOTE.Gs5].forEach((f, i) => {
      tone(c, { freq: f, dur: 1.6 - i * 0.2, gain: 0.04, at: i * 0.16 });
      tone(c, { freq: f * 2, dur: 0.8, type: 'triangle', gain: 0.01, at: i * 0.16 });
    });
  },
  fanfare(c) {
    [NOTE.C5, NOTE.E5, NOTE.G5].forEach((f, i) => tone(c, { freq: f, dur: 0.25, type: 'triangle', gain: 0.06, at: i * 0.13 }));
    for (const f of [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6]) tone(c, { freq: f, dur: 1.4, type: 'triangle', gain: 0.04, at: 0.42 });
  },
  gameover(c) {
    [NOTE.G4, NOTE.Eb4, NOTE.C4].forEach((f, i) => tone(c, { freq: f, dur: 0.7, type: 'sawtooth', gain: 0.04, at: i * 0.3, filter: { type: 'lowpass', freq: 900 } }));
  },
};

export function play(name) {
  if (muted || !SOUNDS[name]) return;
  // Before the first click, audio would only queue up and play late.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
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
