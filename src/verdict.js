// Works out what policy says to do with a caller, and grades the player's choice.
// Pure logic over the data files: nothing here touches the page.

import { COMPANY } from '../data/company.js';
import { DIRECTORY } from '../data/directory.js';
import { RULES } from '../data/rules.js';
import { DAYS } from '../data/days.js';
import { CHECKS } from './checks.js';

const SEVERITY = { approve: 0, escalate: 1, deny: 2 };

// Looked up live, because generated employees (generator.js) join the directory mid-game.
export const findEmployee = (id) => {
  const key = String(id ?? '').trim().toUpperCase();
  return DIRECTORY.find((e) => e.id.toUpperCase() === key) ?? null;
};

export const NO_ACTIONS = { asked: [], callback: null, mfa: null };

const ctx = {
  company: COMPANY,
  findEmployee,
  siteByName: (name) => COMPANY.sites.find((s) => s.name.toLowerCase() === String(name ?? '').trim().toLowerCase()) ?? null,
};

// Rules switch on with a day's `addRules` and stay on until a later `removeRules`.
export function activeRules(dayNumber) {
  const active = new Set();
  for (const d of [...DAYS].sort((a, b) => a.day - b.day)) {
    if (d.day > dayNumber) break;
    for (const id of d.addRules ?? []) active.add(id);
    for (const id of d.removeRules ?? []) active.delete(id);
  }
  return [...active].map((id) => RULES.find((r) => r.id === id)).filter(Boolean);
}

// actions: what the player did on the call (see checks.js).
// -> { correct: 'approve' | 'deny' | 'escalate', failures: [{ rule, reason }] }
export function evaluate(caller, dayNumber, actions = NO_ACTIONS) {
  const failures = [];
  let correct = 'approve';
  for (const rule of activeRules(dayNumber)) {
    for (const name of rule.checks) {
      const check = CHECKS[name];
      if (!check) {
        console.warn(`[Access Denied] Rule "${rule.id}" uses unknown check "${name}".`);
        continue;
      }
      const result = check(caller, ctx, { ...NO_ACTIONS, ...actions });
      if (result.pass) continue;
      failures.push({ rule, reason: result.reason });
      const verdict = result.verdict ?? rule.onFail ?? 'deny';
      if (SEVERITY[verdict] > SEVERITY[correct]) correct = verdict;
    }
  }
  if (caller.expected) correct = caller.expected;
  return { correct, failures };
}

// outcome         'correct'   matched policy
//                 'escalated' escalated when policy had a clear answer (safe, but slow)
//                 'wrong'     approved or denied against policy
// breach          approved a real attacker
// wrongfulDenial  denied a genuine caller that policy said to approve
export function grade(choice, caller, evaluation) {
  const policy = evaluation.correct;
  let outcome = 'wrong';
  if (choice === policy) outcome = 'correct';
  else if (choice === 'escalate') outcome = 'escalated';
  return {
    choice,
    policy,
    outcome,
    breach: choice === 'approve' && !!caller.attacker,
    wrongfulDenial: choice === 'deny' && !caller.attacker && policy === 'approve',
  };
}
