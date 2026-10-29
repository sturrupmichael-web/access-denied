// The story layer: conditions over what the player has done, caller variants (recurring
// characters remembering you, the threat actor using what it stole), the inbox emails, and
// the final ending. The content lives in data/story.js and data/endings.js; the condition
// format is documented at the top of data/story.js.

import { CALLERS } from '../data/callers.js';
import { EMAILS, LEAKS } from '../data/story.js';
import { ENDINGS, FINALE } from '../data/endings.js';
import * as state from './state.js';
import * as meters from './meters.js';

const WEEK_FIELDS = ['handled', 'correct', 'escalated', 'breaches', 'wrongfulDenials', 'missed', 'missedGenuine'];

// Every finished day's summary added up, plus the average CSAT %.
export function week() {
  const days = Object.values(state.history());
  const total = Object.fromEntries(WEEK_FIELDS.map((k) => [k, days.reduce((n, d) => n + (d[k] ?? 0), 0)]));
  total.days = days.length;
  total.csat = days.length ? Math.round(days.reduce((n, d) => n + d.csat, 0) / days.length) : 100;
  return total;
}

// Leak keys the threat actor holds: from every attacker you approved whose caller lists `leaks`.
export function leaks() {
  const decisions = state.decisions();
  return [...new Set(CALLERS.filter((c) => decisions[c.id]?.breach).flatMap((c) => c.leaks ?? []))];
}

const inRange = (value, range) => (typeof range === 'number'
  ? value === range
  : (range.atLeast === undefined || value >= range.atLeast) && (range.atMost === undefined || value <= range.atMost));

const allInRange = (values, ranges) => Object.entries(ranges).every(([k, r]) => inRange(values[k] ?? 0, r));

// cond: a condition object (see data/story.js), or nothing (always true).
// today: the summary of the shift that just ended, for `today` conditions.
export function holds(cond, today = null) {
  if (!cond) return true;
  const decisions = state.decisions();
  const choice = (id) => decisions[id]?.choice;
  const tests = {
    leaked: (key) => leaks().includes(key),
    notLeaked: (key) => !leaks().includes(key),
    leakedAny: (yes) => (leaks().length > 0) === yes,
    approved: (id) => choice(id) === 'approve',
    denied: (id) => choice(id) === 'deny',
    escalated: (id) => choice(id) === 'escalate',
    wronglyDenied: (id) => !!decisions[id]?.wrongfulDenial,
    answered: (id) => !!decisions[id],
    today: (ranges) => !!today && allInRange(today, ranges),
    week: (ranges) => allInRange(week(), ranges),
    meters: (ranges) => allInRange(meters.current(), ranges),
    any: (list) => list.some((c) => holds(c, today)),
    not: (c) => !holds(c, today),
  };
  return Object.entries(cond).every(([k, v]) => tests[k]?.(v) ?? false);
}

// The caller as they call today: the first of their `variants` whose `if` holds, laid over
// the base caller. claims and callerId are merged field by field; the rest is replaced.
export function applyVariant(caller) {
  const v = (caller.variants ?? []).find((x) => holds(x.if));
  if (!v) return caller;
  const { if: _cond, claims, callerId, ...rest } = v;
  return {
    ...caller,
    ...rest,
    claims: { ...caller.claims, ...claims },
    callerId: { ...caller.callerId, ...callerId },
  };
}

// at: 'start' (before the briefing) or 'end' (after the last call). today: that shift's summary.
export function emailsFor(dayNumber, at, today = null) {
  return EMAILS.filter((e) => e.day === dayNumber && (e.at ?? 'end') === at && holds(e.if, today));
}

// Text with {leaks} replaced by what the threat actor got away with.
function fill(text) {
  const list = leaks().map((k) => LEAKS[k] ?? k);
  return text.replace('{leaks}', list.length ? list.join('; ') : 'nothing');
}

// The ending after the last day: the first FINALE entry whose `if` holds. Its paragraphs
// can be strings or { text, if }.
export function finale() {
  const pick = FINALE.find((f) => holds(f.if)) ?? FINALE[FINALE.length - 1];
  return resolveEnding(ENDINGS[pick.ending]);
}

export function resolveEnding(ending) {
  return {
    ...ending,
    body: ending.body.filter((p) => typeof p === 'string' || holds(p.if)).map((p) => fill(typeof p === 'string' ? p : p.text)),
  };
}
