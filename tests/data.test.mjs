// The content files are consistent, and every caller gets the verdict its story intends.
// Runs in Node, no browser.

import { assert } from './harness.mjs';
import { validateData } from '../src/validate.js';
import { evaluate, grade, activeRules } from '../src/verdict.js';
import { idealActions } from '../src/actions.js';
import { generateCallers, clearGenerated } from '../src/generator.js';
import { CALLERS } from '../data/callers.js';
import { DAYS } from '../data/days.js';
import { DIRECTORY } from '../data/directory.js';

// A careful agent's verdict: every question asked, every unlocked action used.
const ideal = (c, day) => evaluate(c, day, idealActions(c, activeRules(day)));

// Attackers must be caught by a careful agent. Genuine callers must not be denied, unless
// their own manager said no on the callback (that's the process working).
function assertFair(c, day) {
  const v = ideal(c, day);
  if (c.attacker) assert(v.correct === 'deny', `day ${day} ${c.id}: attacker should be denied, policy says ${v.correct}`);
  else if (c.managerCallback?.result !== 'denies') assert(v.correct !== 'deny', `day ${day} ${c.id}: genuine caller is denied (${v.failures.map((f) => f.reason)})`);
}

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
  ['on its day, a careful agent catches every attacker and lets every genuine caller through', async () => {
    for (const day of DAYS) for (const id of day.callers.filter((e) => typeof e === 'string')) assertFair(caller(id), day.day);
  }],
  ['the random generator makes fair callers for every day, and the same seed makes the same callers', async () => {
    for (const day of DAYS) {
      for (let seed = 1; seed <= 40; seed++) {
        clearGenerated();
        const batch = generateCallers(day.day, 4, seed * 7919, activeRules(day.day));
        assert(batch.some((c) => c.attacker), `day ${day.day} seed ${seed}: no attacker in a batch of 4`);
        for (const c of batch) assertFair(c, day.day);
        clearGenerated();
        const again = generateCallers(day.day, 4, seed * 7919, activeRules(day.day));
        assert(JSON.stringify(again) === JSON.stringify(batch), `day ${day.day} seed ${seed}: not repeatable`);
      }
    }
    clearGenerated();
    assert(!DIRECTORY.some((e) => e.generated), 'clearGenerated leaves no generated employees');
  }],
  ['Day 3: a Caller ID mismatch needs a question, and a wrong answer is a deny', async () => {
    const felix = caller('d3-felix-travel');
    assert(evaluate(felix, 3).correct === 'escalate', 'no question asked: escalate');
    assert(evaluate(felix, 3, { asked: [felix.questions[0]] }).correct === 'approve', 'asked: approve');
    const gloria = caller('d3-gloria-fake');
    assert(evaluate(gloria, 3, { asked: [gloria.questions[0]] }).correct === 'deny', 'a tell answer: deny');
  }],
  ['Days 4 and 5: callbacks and MFA decide admin requests and resets', async () => {
    assert(evaluate(caller('d4-aisha-admin'), 4).correct === 'escalate', 'admin without a callback: escalate');
    assert(evaluate(caller('d4-aisha-admin'), 4, { callback: 'confirms' }).correct === 'approve', 'confirmed: approve');
    assert(evaluate(caller('d4-tomasz-admin'), 4, { callback: 'denies' }).correct === 'deny', 'manager says no: deny');
    assert(evaluate(caller('d4-imogen-admin'), 4, { callback: 'unreachable' }).correct === 'escalate', 'no answer: escalate');
    assert(evaluate(caller('d5-felix-reset'), 5).correct === 'escalate', 'reset without a push: escalate');
    assert(ideal(caller('d5-dale-reset'), 5).correct === 'escalate', 'push timed out: escalate');
    assert(ideal(caller('d5-hannah-fake'), 5).correct === 'deny', 'push denied: deny');
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
