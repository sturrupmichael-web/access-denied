// The shift clock, in game minutes since midnight. It runs from COMPANY.shift.start to
// COMPANY.shift.end over COMPANY.shift.realSeconds, stops while the tab is hidden, and can
// be pushed forward by actions that cost time (asking a question, escalating).
// The Shift length setting scales it, and `?speed=10` in the address runs it ten times
// faster, for testing.

import { COMPANY } from '../data/company.js';
import * as settings from './settings.js';

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const START = toMinutes(COMPANY.shift.start);
export const END = toMinutes(COMPANY.shift.end);
const RATE = (END - START) / COMPANY.shift.realSeconds; // game minutes per real second
const SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1;

let minutes = START;
let running = false;
let last = 0;
let timer = null;
let ended = false;
const changeListeners = [];
let endListener = null;

export const format = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
export const now = () => minutes;
export const isOver = () => ended;
export const isRunning = () => running;

export const onChange = (fn) => changeListeners.push(fn);
export const onEnd = (fn) => { endListener = fn; };

function emit() {
  for (const fn of changeListeners) fn(minutes);
}

export function reset(at = START) {
  pause();
  minutes = Math.min(Math.max(at, START), END);
  ended = minutes >= END;
  emit();
}

function tick() {
  const t = performance.now();
  const dt = Math.min(1, (t - last) / 1000); // a stalled tab never jumps the clock
  last = t;
  const pace = settings.SHIFT_LENGTHS[settings.get().shiftLength] ?? 1;
  if (running && !document.hidden) advance(dt * RATE * SPEED * pace);
}

export function start() {
  if (running || ended) return;
  running = true;
  last = performance.now();
  timer = setInterval(tick, 200);
}

export function pause() {
  if (running) tick();
  running = false;
  clearInterval(timer);
}

export function advance(by) {
  if (ended) return;
  minutes = Math.min(END, minutes + by);
  emit();
  if (minutes >= END) {
    ended = true;
    pause();
    endListener?.();
  }
}
