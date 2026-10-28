// Runs a shift: the briefing, the call queue against the clock, desk actions, the call
// reviews, the meters and their events, and the end-of-shift summary. Saves after every
// call so a reload picks up at the next one.

import { DAYS } from '../data/days.js';
import { CALLERS } from '../data/callers.js';
import { COMPANY } from '../data/company.js';
import { ENDINGS } from '../data/endings.js';
import * as state from './state.js';
import * as clock from './clock.js';
import * as meters from './meters.js';
import { activeRules, evaluate, grade } from './verdict.js';
import { managerCallback, mfaPush } from './actions.js';
import { generateCallers, clearGenerated } from './generator.js';
import { setClock, setQueue } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as toolbox from './ui/toolbox.js';
import * as screens from './ui/screens.js';

let day = null;
let rules = [];
let queue = []; // caller objects for today, handcrafted and generated, in order
let active = null; // { caller, answeredAt, actions } for the call on the line
let onGameOver = () => {};

const findDay = (n) => DAYS.find((d) => d.day === n) ?? null;
export const firstDay = () => Math.min(...DAYS.map((d) => d.day));
export const dayExists = (n) => !!findDay(n);
export const currentCaller = () => active?.caller ?? null;
export const currentActions = () => active?.actions ?? null;
export const todaysQueue = () => queue;
export const setGameOverHandler = (fn) => { onGameOver = fn; };

clock.onChange((m) => {
  setClock(clock.format(m));
  state.setMinutes(m);
});

// Out of time: finish the call on the line if it was answered, otherwise go home.
clock.onEnd(() => {
  if (active && active.answeredAt !== null) call.lastCall();
  else endShift();
});

// Handcrafted caller ids and { procedural: n } entries, turned into caller objects.
// Generated callers depend only on the game's seed and the day, so a reload rebuilds the
// same queue.
function buildQueue() {
  clearGenerated();
  const seed = state.gameSeed() ^ (day.day * 7919);
  let batch = 0;
  return day.callers.flatMap((entry) => {
    if (typeof entry === 'string') {
      const caller = CALLERS.find((c) => c.id === entry);
      if (!caller) console.warn(`[Access Denied] Day ${day.day} lists unknown caller "${entry}". Skipping.`);
      return caller ? [caller] : [];
    }
    batch += 1;
    return generateCallers(day.day, entry.procedural, seed + batch * 104729, rules)
      .map((c) => ({ ...c, id: `${c.id}-${batch}` }));
  });
}

function updateQueue() {
  const left = queue.length - state.current().callIndex;
  setQueue(left > 0 ? `${left} in queue` : 'Queue empty');
}

// saved: a shift from state.savedShift() to resume, or nothing for a fresh start.
export function begin(dayNumber, saved = null) {
  day = findDay(dayNumber);
  if (!day) throw new Error(`No day ${dayNumber} in data/days.js`);
  rules = activeRules(dayNumber);
  if (saved) state.resume(saved);
  else {
    state.startDay(dayNumber, clock.START);
    meters.applyDayStart();
  }
  queue = buildQueue();
  clock.reset(state.current().minutes);
  active = null;
  call.idle(saved ? 'Picking up where you left off.' : 'Waiting for shift to start.');
  toolbox.newCall(null);
  toolbox.setDay(day, rules);
  toolbox.selectById('ad');
  updateQueue();
  screens.showBriefing(day, rules, queue.length, () => {
    clock.start();
    nextCall();
  }, saved ? 'Back to work' : 'Clock in');
}

function nextCall() {
  if (clock.isOver()) return endShift();
  const caller = queue[state.current().callIndex];
  if (!caller) return endShift();

  active = { caller, answeredAt: null, actions: { asked: [], callback: null, mfa: null } };
  updateQueue();
  toolbox.newCall(null);
  call.ring(caller, {
    actions: [...new Set(rules.flatMap((r) => r.actions ?? []))],
    onAnswer: () => {
      active.answeredAt = clock.now();
      state.logCall(caller);
      toolbox.newCall(caller);
    },
    onAsk: (q) => {
      active.actions.asked.push(q);
      clock.advance(COMPANY.timeCosts.question);
    },
    onAction: (kind) => {
      const outcome = kind === 'callback' ? managerCallback(caller) : mfaPush(caller);
      active.actions[kind] = outcome.result;
      clock.advance(COMPANY.timeCosts[kind]);
      return outcome;
    },
    onLookup: (text) => toolbox.searchFor(text),
    onDecision: (choice) => decided(caller, choice),
  });
}

function decided(caller, choice) {
  if (choice === 'escalate') clock.advance(COMPANY.timeCosts.escalate);
  clock.pause();
  const minutes = Math.round(clock.now() - active.answeredAt);
  const evaluation = evaluate(caller, day.day, active.actions);
  const graded = grade(choice, caller, evaluation);
  state.recordResult(caller, graded, minutes);
  state.advance();
  active = null;
  const { deltas, events } = meters.applyCall(caller, graded, minutes);
  const done = clock.isOver() || state.current().callIndex >= queue.length;
  screens.showResult(caller, evaluation, graded, meters.describe(deltas), done ? 'End shift' : 'Next call', () => {
    runEvents(events, (effect) => {
      if (effect === 'sendHome') return endShift({ sentHome: true });
      if (done) return endShift();
      clock.start();
      nextCall();
    });
  });
}

// Shows each event's email in turn, then acts on the strongest effect: a game over beats
// being sent home, which beats carrying on (next(null)).
function runEvents(events, next) {
  const ending = events.find((ev) => ev.effect === 'gameOver')?.ending;
  const sendHome = events.some((ev) => ev.effect === 'sendHome');
  const emails = events.filter((ev) => ev.email).map((ev) => ev.email);
  const show = (i) => {
    if (i < emails.length) return screens.showEmail(emails[i], () => show(i + 1));
    if (ending) return gameOver(ending);
    return next(sendHome ? 'sendHome' : null);
  };
  show(0);
}

function gameOver(endingId) {
  clock.pause();
  active = null;
  state.newGame();
  meters.reset();
  call.idle('Your desk has been cleared.');
  setQueue('Game over');
  screens.showEnding(ENDINGS[endingId] ?? ENDINGS.pip, () => onGameOver());
}

function pickNote(s) {
  const notes = day.bossNotes ?? {};
  if (s.breaches && notes.breach) return notes.breach;
  if ((s.wrongfulDenials || s.missedGenuine) && notes.complaints) return notes.complaints;
  return notes.clean ?? day.bossNote ?? '';
}

function endShift({ sentHome = false } = {}) {
  clock.pause();
  active = null;
  const missed = queue.slice(state.current().callIndex);
  const s = { ...state.summary(missed), sentHome };
  const next = DAYS.map((d) => d.day).filter((n) => n > day.day).sort((a, b) => a - b)[0];
  state.finishDay(s, next ?? day.day);
  call.idle(sentHome ? 'Sent home. Security has your headset.' : 'Shift over. The phones are quiet.');
  setQueue('Off shift');
  const { events } = meters.applyShiftEnd(s);
  runEvents(events, () => {
    const replay = { label: `Replay Day ${day.day}`, onClick: () => begin(day.day) };
    const buttons = next
      ? [replay, { label: `Start Day ${next}`, primary: true, onClick: () => begin(next) }]
      : [{ ...replay, primary: true }];
    let note = pickNote(s);
    if (sentHome) note = `You were sent home early. ${note}`;
    if (!next) note += "\n\nThat's every day written so far. More shifts are coming.";
    screens.showShiftEnd(day, s, note, buttons);
  });
}
