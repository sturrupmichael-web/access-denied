// Catches the typos you're most likely to make while adding content: unknown ids,
// bad employee ID formats, missing fields. Returns a list of problems; main.js logs them
// to the browser console (F12) and `npm test` fails on any.

import { COMPANY } from '../data/company.js';
import { DIRECTORY } from '../data/directory.js';
import { RULES } from '../data/rules.js';
import { CALLERS } from '../data/callers.js';
import { DAYS } from '../data/days.js';
import { CHECKS } from './checks.js';

export function validateData() {
  const problems = [];
  const need = (ok, msg) => ok || problems.push(msg);

  const idPattern = new RegExp(COMPANY.employeeIdPattern);
  const handmade = DIRECTORY.filter((e) => !e.generated);
  const employeeIds = new Set(handmade.map((e) => e.id));
  for (const e of handmade) {
    need(idPattern.test(e.id), `directory: ${e.id} doesn't match employeeIdPattern.`);
    need(!e.manager || employeeIds.has(e.manager), `directory: ${e.id} has unknown manager ${e.manager}.`);
    need(COMPANY.sites.some((s) => s.id === e.site), `directory: ${e.id} has unknown site ${e.site}.`);
    need(COMPANY.departments.includes(e.department), `directory: ${e.id} has unknown department ${e.department}.`);
  }

  for (const r of RULES) {
    for (const c of r.checks ?? []) need(CHECKS[c], `rules: "${r.id}" uses unknown check "${c}".`);
    for (const a of r.actions ?? []) need(['callback', 'mfa'].includes(a), `rules: "${r.id}" has unknown action "${a}".`);
  }

  const callerIds = new Set();
  for (const c of CALLERS) {
    need(!callerIds.has(c.id), `callers: duplicate id "${c.id}".`);
    callerIds.add(c.id);
    need(c.claims && c.callerId, `callers: "${c.id}" needs claims and callerId.`);
    need(COMPANY.requestTypes[c.claims?.request], `callers: "${c.id}" has unknown request "${c.claims?.request}".`);
    for (const q of c.questions ?? []) need(q.ask && q.answer, `callers: "${c.id}" has a question without ask/answer.`);
    if (c.managerCallback) need(['confirms', 'denies', 'unreachable'].includes(c.managerCallback.result), `callers: "${c.id}" managerCallback.result must be confirms, denies or unreachable.`);
    if (c.mfa) need(['approved', 'denied', 'timeout'].includes(c.mfa.result), `callers: "${c.id}" mfa.result must be approved, denied or timeout.`);
  }

  const dayNumbers = new Set();
  for (const d of DAYS) {
    need(!dayNumbers.has(d.day), `days: day ${d.day} appears twice.`);
    dayNumbers.add(d.day);
    for (const id of d.addRules ?? []) need(RULES.some((r) => r.id === id), `days: day ${d.day} adds unknown rule "${id}".`);
    for (const entry of d.callers ?? []) {
      if (typeof entry === 'string') need(callerIds.has(entry), `days: day ${d.day} lists unknown caller "${entry}".`);
      else need(Number.isInteger(entry?.procedural) && entry.procedural > 0, `days: day ${d.day} has a callers entry that is neither an id nor { procedural: n }.`);
    }
  }
  return problems;
}
