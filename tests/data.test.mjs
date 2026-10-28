// The content files are consistent, and every caller gets the verdict its story intends.
// Runs in Node, no browser.

import { assert } from './harness.mjs';
import { validateData } from '../src/validate.js';
import { evaluate, grade } from '../src/verdict.js';
import { CALLERS } from '../data/callers.js';
import { DAYS } from '../data/days.js';

const caller = (id) => CALLERS.find((c) => c.id === id);

export const tests = [
  ['data files have no problems', async () => {
    const problems = validateData();
    assert(!problems.length, problems.join('\n'));
  }],
  ['genuine callers with matching details are approved', async () => {
    for (const id of ['d1-priya-unlock', 'd1-dale-install']) {
      const v = evaluate(caller(id), 1);
      assert(v.correct === 'approve', `${id}: expected approve, got ${v.correct} (${v.failures.map((f) => f.reason)})`);
    }
  }],
  ['a misspelled name is denied', async () => {
    const v = evaluate(caller('d1-whitacre-reset'), 1);
    assert(v.correct === 'deny' && v.failures.length === 1, JSON.stringify(v));
    assert(v.failures[0].reason.includes('Jonathan Whittaker'), v.failures[0].reason);
  }],
  ['a bad ID format is denied once, not reported twice', async () => {
    const v = evaluate(caller('d1-kevin-admin'), 1);
    assert(v.correct === 'deny' && v.failures.length === 1, JSON.stringify(v.failures.map((f) => f.reason)));
  }],
  ['on its day, every attacker is caught by the rules and every genuine caller gets through or escalated', async () => {
    for (const day of DAYS) {
      for (const id of day.callers) {
        const c = caller(id);
        const v = evaluate(c, day.day);
        if (c.attacker) assert(v.correct === 'deny', `day ${day.day} ${id}: attacker should be denied, policy says ${v.correct}`);
        else assert(v.correct !== 'deny', `day ${day.day} ${id}: genuine caller is denied (${v.failures.map((f) => f.reason)})`);
      }
    }
  }],
  ['Day 2: terminated is denied, on leave is escalated', async () => {
    assert(evaluate(caller('d2-nadia-reset'), 2).correct === 'deny', 'Nadia');
    assert(evaluate(caller('d2-owen-leave'), 2).correct === 'escalate', 'Owen');
    assert(evaluate(caller('d2-nadia-reset'), 1).correct === 'approve', 'the HR rule is off on Day 1');
  }],
  ['approving an attacker is a breach and escalating is safe', async () => {
    const c = caller('d1-whitacre-reset');
    const v = evaluate(c, 1);
    assert(grade('approve', c, v).breach, 'approve should be a breach');
    const g = grade('escalate', c, v);
    assert(g.outcome === 'escalated' && !g.breach, JSON.stringify(g));
  }],
];
