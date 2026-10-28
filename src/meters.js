// The Breach, CSAT and Boss Patience meters (rules in data/meters.js). Saved under
// "accessDenied:meters" as { breach, csat, patience, tripped: [event ids] }.
//
// Each apply function returns { deltas, events }: how much each meter moved, and the
// events that fired (to show as emails, and to act on: sendHome / gameOver).

import { METERS } from '../data/meters.js';
import { COMPANY } from '../data/company.js';
import { load, save, remove } from './storage.js';

const NAMES = ['breach', 'csat', 'patience'];
let meters = load('meters', null) ?? fresh();

function fresh() {
  return { ...METERS.start, tripped: [] };
}

export const current = () => ({ breach: meters.breach, csat: meters.csat, patience: meters.patience });

export function reset() {
  meters = fresh();
  remove('meters');
}

const listeners = [];
export const onChange = (fn) => listeners.push(fn);

function bump(deltas, change) {
  for (const k of NAMES) {
    if (!change[k]) continue;
    const before = meters[k];
    meters[k] = Math.max(0, Math.min(100, meters[k] + change[k]));
    deltas[k] = (deltas[k] ?? 0) + (meters[k] - before);
  }
}

function crossed(when) {
  const v = meters[when.meter];
  return when.atLeast !== undefined ? v >= when.atLeast : v <= when.atMost;
}

// Fires events whose line has been crossed, and re-arms ones that are back under it.
function fireEvents(deltas) {
  const fired = [];
  for (const ev of METERS.events) {
    const on = crossed(ev.when);
    const was = meters.tripped.includes(ev.id);
    if (on && !was) {
      meters.tripped.push(ev.id);
      if (ev.adjust) bump(deltas, ev.adjust);
      fired.push(ev);
    } else if (!on && was) {
      meters.tripped = meters.tripped.filter((id) => id !== ev.id);
    }
  }
  return fired;
}

function finish(deltas) {
  const events = fireEvents(deltas);
  save('meters', meters);
  for (const fn of listeners) fn(current());
  return { deltas, events };
}

// graded: from verdict.grade(). minutes: how long the call took.
export function applyCall(caller, graded, minutes) {
  const deltas = {};
  const rules = METERS.perCall;
  if (graded.breach) bump(deltas, rules.breach);
  if (graded.wrongfulDenial) bump(deltas, rules.wrongfulDenial);
  if (graded.outcome === 'escalated') bump(deltas, rules.needlessEscalate);
  if (graded.outcome === 'correct') bump(deltas, rules.correct);
  if (!caller.attacker && graded.choice === 'approve') bump(deltas, rules.genuineApproved);
  if (!caller.attacker && minutes > COMPANY.shift.slowCallMinutes) bump(deltas, rules.slowCall);
  return finish(deltas);
}

// summary: from state.summary().
export function applyShiftEnd(summary) {
  const deltas = {};
  for (let i = 0; i < summary.missedGenuine; i++) bump(deltas, METERS.perShift.missedGenuine);
  if (summary.csat < METERS.perShift.lowCsatDay.below) bump(deltas, METERS.perShift.lowCsatDay);
  return finish(deltas);
}

export function applyDayStart() {
  const deltas = {};
  bump(deltas, METERS.perDayStart);
  return finish(deltas);
}

// "Breach +34, Patience -25" for the call review.
export function describe(deltas) {
  const label = { breach: 'Breach', csat: 'CSAT', patience: 'Patience' };
  return NAMES.filter((k) => deltas[k]).map((k) => `${label[k]} ${deltas[k] > 0 ? '+' : ''}${deltas[k]}`).join(', ');
}
