// Game state and saving. Everything is stored with storage.js under "accessDenied:" keys:
//   shift     the shift in progress: { day, callIndex, results, minutes }, saved after
//             every call, so a reload resumes at the next call
//   progress  { nextDay }: the day to play next
//   history   { [day]: summary } of finished shifts
//   callLog   { "<day>:<callerId>": { day, number, name } }: every answered call, for Caller ID

import { load, save, remove } from './storage.js';
import { COMPANY } from '../data/company.js';

let state = null;

export function startDay(day, minutes) {
  state = { day, callIndex: 0, results: [], minutes };
  persist();
  return state;
}

export function resume(saved) {
  state = saved;
  return state;
}

export const current = () => state;
export const savedShift = () => load('shift', null);
export const progress = () => load('progress', null);
export const callLog = () => Object.values(load('callLog', {}));

export function setMinutes(m) {
  if (state) state.minutes = m;
}

export function recordResult(caller, graded, minutes) {
  state.results.push({ callerId: caller.id, attacker: !!caller.attacker, minutes, ...graded });
}

export function advance() {
  state.callIndex += 1;
  persist();
}

export function persist() {
  save('shift', state);
}

export function logCall(caller) {
  const log = load('callLog', {});
  log[`${state.day}:${caller.id}`] = { day: state.day, number: caller.callerId.number, name: caller.claims.name };
  save('callLog', log);
}

export function finishDay(summary, nextDay) {
  const history = load('history', {});
  history[state.day] = summary;
  save('history', history);
  save('progress', { nextDay });
  remove('shift');
}

export function newGame() {
  for (const key of ['shift', 'progress', 'history', 'callLog']) remove(key);
}

// Genuine callers rate each call 1 to 5. Attackers don't fill in surveys.
function rating(r) {
  if (r.attacker) return null;
  let stars = 2; // denied because policy said so (they're annoyed, but it's policy)
  if (r.wrongfulDenial) stars = 1;
  else if (r.choice === 'approve') stars = 5;
  else if (r.choice === 'escalate') stars = 3;
  if (r.minutes > COMPANY.shift.slowCallMinutes) stars -= 1;
  return Math.max(1, stars);
}

// missed: callers still in the queue when the shift ended.
export function summary(missed = []) {
  const r = state.results;
  const missedGenuine = missed.filter((c) => !c.attacker).length;
  const ratings = [...r.map(rating).filter((x) => x !== null), ...Array(missedGenuine).fill(1)];
  return {
    handled: r.length,
    correct: r.filter((x) => x.outcome === 'correct').length,
    escalated: r.filter((x) => x.choice === 'escalate').length,
    breaches: r.filter((x) => x.breach).length,
    wrongfulDenials: r.filter((x) => x.wrongfulDenial).length,
    missed: missed.length,
    missedGenuine,
    csat: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length / 5) * 100) : 100,
  };
}
