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
  const employeeIds = new Set(DIRECTORY.map((e) => e.id));
  for (const e of DIRECTORY) {
    need(idPattern.test(e.id), `directory: ${e.id} doesn't match employeeIdPattern.`);
    need(!e.manager || employeeIds.has(e.manager), `directory: ${e.id} has unknown manager ${e.manager}.`);
    need(COMPANY.sites.some((s) => s.id === e.site), `directory: ${e.id} has unknown site ${e.site}.`);
    need(COMPANY.departments.includes(e.department), `directory: ${e.id} has unknown department ${e.department}.`);
  }

  for (const r of RULES) for (const c of r.checks ?? []) need(CHECKS[c], `rules: "${r.id}" uses unknown check "${c}".`);

  const callerIds = new Set();
  for (const c of CALLERS) {
    need(!callerIds.has(c.id), `callers: duplicate id "${c.id}".`);
    callerIds.add(c.id);
    need(c.claims && c.callerId, `callers: "${c.id}" needs claims and callerId.`);
    need(COMPANY.requestTypes[c.claims?.request], `callers: "${c.id}" has unknown request "${c.claims?.request}".`);
  }

  const dayNumbers = new Set();
  for (const d of DAYS) {
    need(!dayNumbers.has(d.day), `days: day ${d.day} appears twice.`);
    dayNumbers.add(d.day);
    for (const id of d.addRules ?? []) need(RULES.some((r) => r.id === id), `days: day ${d.day} adds unknown rule "${id}".`);
    for (const id of d.callers ?? []) need(typeof id !== 'string' || callerIds.has(id), `days: day ${d.day} lists unknown caller "${id}".`);
  }
  return problems;
}
