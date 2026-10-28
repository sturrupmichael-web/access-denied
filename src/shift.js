// Runs one shift: the briefing, each caller in the day's queue, then the summary.
// Phase 2 adds the real shift clock; for now each call moves the taskbar clock on.

import { DAYS } from '../data/days.js';
import { CALLERS } from '../data/callers.js';
import * as state from './state.js';
import { activeRules, evaluate, grade } from './verdict.js';
import { setClock } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as adLookup from './ui/adLookup.js';
import * as screens from './ui/screens.js';

const START_MINUTES = 9 * 60;
const MINUTES_PER_CALL = 45;

let day = null;

function clockForCall(index) {
  const m = START_MINUTES + index * MINUTES_PER_CALL;
  setClock(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
}

export function start(dayNumber) {
  day = DAYS.find((d) => d.day === dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in data/days.js`);
  state.startDay(dayNumber);
  clockForCall(0);
  call.idle('Waiting for shift to start.');
  adLookup.reset();
  screens.showBriefing(day, activeRules(dayNumber), nextCall);
}

function nextCall() {
  const { callIndex } = state.current();
  const id = day.callers[callIndex];
  if (id === undefined) return endShift();

  const caller = CALLERS.find((c) => c.id === id);
  if (!caller) {
    console.warn(`[Access Denied] Day ${day.day} lists unknown caller "${id}". Skipping.`);
    state.advance();
    return nextCall();
  }
  clockForCall(callIndex);
  adLookup.reset();
  call.ring(caller, (choice) => decided(caller, choice));
}

function decided(caller, choice) {
  const evaluation = evaluate(caller, day.day);
  const graded = grade(choice, caller, evaluation);
  state.recordResult(caller.id, graded);
  const isLast = state.current().callIndex >= day.callers.length - 1;
  screens.showResult(caller, evaluation, graded, isLast, () => {
    state.advance();
    nextCall();
  });
}

function endShift() {
  call.idle('Shift over. The phones are quiet.');
  screens.showShiftEnd(day, state.summary(), () => start(day.day));
}
