// Runs a shift: the briefing, the call queue against the clock, the call reviews, and the
// end-of-shift summary. Saves after every call so a reload picks up at the next one.

import { DAYS } from '../data/days.js';
import { CALLERS } from '../data/callers.js';
import { COMPANY } from '../data/company.js';
import * as state from './state.js';
import * as clock from './clock.js';
import { activeRules, evaluate, grade } from './verdict.js';
import { setClock, setQueue } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as toolbox from './ui/toolbox.js';
import * as screens from './ui/screens.js';

let day = null;
let active = null; // { caller, answeredAt } for the call on the line

const findCaller = (id) => CALLERS.find((c) => c.id === id) ?? null;
const findDay = (n) => DAYS.find((d) => d.day === n) ?? null;
export const firstDay = () => Math.min(...DAYS.map((d) => d.day));
export const dayExists = (n) => !!findDay(n);
export const currentCaller = () => active?.caller ?? null;

clock.onChange((m) => {
  setClock(clock.format(m));
  state.setMinutes(m);
});

// Out of time: finish the call on the line if it was answered, otherwise go home.
clock.onEnd(() => {
  if (active?.answeredAt !== undefined && active.answeredAt !== null) call.lastCall();
  else endShift();
});

function updateQueue() {
  const left = day.callers.length - state.current().callIndex;
  setQueue(left > 0 ? `${left} in queue` : 'Queue empty');
}

// saved: a shift from state.savedShift() to resume, or nothing for a fresh start.
export function begin(dayNumber, saved = null) {
  day = findDay(dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in data/days.js`);
  if (saved) state.resume(saved);
  else state.startDay(dayNumber, clock.START);
  clock.reset(state.current().minutes);
  active = null;
  call.idle(saved ? 'Picking up where you left off.' : 'Waiting for shift to start.');
  const rules = activeRules(dayNumber);
  toolbox.newCall(null);
  toolbox.setDay(day, rules);
  toolbox.selectById('ad');
  updateQueue();
  screens.showBriefing(day, rules, () => {
    clock.start();
    nextCall();
  }, saved ? 'Back to work' : 'Clock in');
}

function nextCall() {
  if (clock.isOver()) return endShift();
  const { callIndex } = state.current();
  const id = day.callers[callIndex];
  if (id === undefined) return endShift();

  const caller = findCaller(id);
  if (!caller) {
    console.warn(`[Access Denied] Day ${day.day} lists unknown caller "${id}". Skipping.`);
    state.advance();
    return nextCall();
  }
  active = { caller, answeredAt: null };
  updateQueue();
  toolbox.newCall(null);
  call.ring(caller, {
    onAnswer: () => {
      active.answeredAt = clock.now();
      state.logCall(caller);
      toolbox.newCall(caller);
    },
    onAsk: () => clock.advance(COMPANY.timeCosts.question),
    onLookup: (text) => toolbox.searchFor(text),
    onDecision: (choice) => decided(caller, choice),
  });
}

function decided(caller, choice) {
  if (choice === 'escalate') clock.advance(COMPANY.timeCosts.escalate);
  clock.pause();
  const minutes = Math.round(clock.now() - active.answeredAt);
  const evaluation = evaluate(caller, day.day);
  const graded = grade(choice, caller, evaluation);
  state.recordResult(caller, graded, minutes);
  state.advance();
  active = null;
  const done = clock.isOver() || state.current().callIndex >= day.callers.length;
  screens.showResult(caller, evaluation, graded, done ? 'End shift' : 'Next call', () => {
    if (done) return endShift();
    clock.start();
    nextCall();
  });
}

function pickNote(s) {
  const notes = day.bossNotes ?? {};
  if (s.breaches && notes.breach) return notes.breach;
  if ((s.wrongfulDenials || s.missedGenuine) && notes.complaints) return notes.complaints;
  return notes.clean ?? day.bossNote ?? '';
}

function endShift() {
  clock.pause();
  active = null;
  const missed = day.callers.slice(state.current().callIndex).map(findCaller).filter(Boolean);
  const s = state.summary(missed);
  const next = DAYS.map((d) => d.day).filter((n) => n > day.day).sort((a, b) => a - b)[0];
  state.finishDay(s, next ?? day.day);
  call.idle('Shift over. The phones are quiet.');
  setQueue('Off shift');
  const replay = { label: `Replay Day ${day.day}`, onClick: () => begin(day.day) };
  const buttons = next
    ? [replay, { label: `Start Day ${next}`, primary: true, onClick: () => begin(next) }]
    : [{ ...replay, primary: true }];
  const note = next ? pickNote(s) : `${pickNote(s)}\n\nThat's every day written so far. More shifts are coming.`;
  screens.showShiftEnd(day, s, note, buttons);
}
