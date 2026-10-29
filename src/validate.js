// Catches the typos you're most likely to make while adding content: unknown ids,
// bad employee ID formats, missing fields. Returns a list of problems; main.js logs them
// to the browser console (F12) and `npm test` fails on any.

import { COMPANY } from '../data/company.js';
import { DIRECTORY } from '../data/directory.js';
import { RULES } from '../data/rules.js';
import { CALLERS } from '../data/callers.js';
import { DAYS } from '../data/days.js';
import { EMAILS, LEAKS } from '../data/story.js';
import { ENDINGS, FINALE } from '../data/endings.js';
import { METERS } from '../data/meters.js';
import { GROUPS } from '../data/groups.js';
import { CHECKS } from './checks.js';
import { ACTIONS } from './actions.js';

const CALLER_KEYS = ['approved', 'denied', 'escalated', 'wronglyDenied', 'answered'];
const RANGE_KEYS = ['today', 'week', 'meters'];
const CALLBACK_RESULTS = ['confirms', 'denies', 'unreachable'];

// The extra intake fields each week-two request needs (see callers.js).
const REQUEST_FIELDS = {
  info_readback: ['subject'],
  shared_access: ['group'],
  leaver_access: ['subject', 'subjectId'],
  remote_session: ['tool', 'device'],
  lost_device: ['device', 'shipTo'],
  vendor_change: ['vendor'],
  account_extension: ['days'],
};

// Problems with one condition (see data/story.js): unknown keys, callers or leaks.
function checkCondition(cond, where, callerIds, need) {
  if (!cond) return;
  for (const [k, v] of Object.entries(cond)) {
    if (CALLER_KEYS.includes(k)) need(callerIds.has(v), `${where}: condition ${k} names unknown caller "${v}".`);
    else if (k === 'leaked' || k === 'notLeaked') need(LEAKS[v], `${where}: condition ${k} names unknown leak "${v}".`);
    else if (k === 'leakedAny') need(typeof v === 'boolean', `${where}: leakedAny must be true or false.`);
    else if (RANGE_KEYS.includes(k)) need(v && typeof v === 'object', `${where}: ${k} needs { field: range }.`);
    else if (k === 'any') for (const c of [].concat(v)) checkCondition(c, where, callerIds, need);
    else if (k === 'not') checkCondition(v, where, callerIds, need);
    else need(false, `${where}: unknown condition "${k}".`);
  }
}

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
    need(!e.hr.handoverTo || employeeIds.has(e.hr.handoverTo), `directory: ${e.id} has unknown handoverTo ${e.hr.handoverTo}.`);
    need(!e.hr.type || ['employee', 'contractor'].includes(e.hr.type), `directory: ${e.id} hr.type must be employee or contractor.`);
  }
  const tags = handmade.flatMap((e) => e.devices ?? []);
  need(new Set(tags).size === tags.length, 'directory: two employees share a device asset tag.');

  const groupNames = new Set();
  for (const g of GROUPS) {
    need(!groupNames.has(g.name.toLowerCase()), `groups: duplicate group "${g.name}".`);
    groupNames.add(g.name.toLowerCase());
    need(employeeIds.has(g.owner), `groups: "${g.name}" has unknown owner ${g.owner}.`);
    need(['mailbox', 'list'].includes(g.kind), `groups: "${g.name}" kind must be mailbox or list.`);
  }

  for (const r of RULES) {
    for (const c of r.checks ?? []) need(CHECKS[c], `rules: "${r.id}" uses unknown check "${c}".`);
    for (const a of r.actions ?? []) need(ACTIONS[a], `rules: "${r.id}" has unknown action "${a}".`);
  }

  const callerIds = new Set();
  for (const c of CALLERS) {
    need(!callerIds.has(c.id), `callers: duplicate id "${c.id}".`);
    callerIds.add(c.id);
    need(c.claims && c.callerId, `callers: "${c.id}" needs claims and callerId.`);
    need(COMPANY.requestTypes[c.claims?.request], `callers: "${c.id}" has unknown request "${c.claims?.request}".`);
    for (const q of c.questions ?? []) need(q.ask && q.answer, `callers: "${c.id}" has a question without ask/answer.`);
    for (const key of ['managerCallback', 'deskCallback', 'ownerCallback']) {
      if (c[key]) need(CALLBACK_RESULTS.includes(c[key].result), `callers: "${c.id}" ${key}.result must be confirms, denies or unreachable.`);
    }
    for (const f of REQUEST_FIELDS[c.claims?.request] ?? []) need(c.claims[f] !== undefined && c.claims[f] !== '', `callers: "${c.id}" is a ${c.claims.request} call, so its claims need "${f}".`);
    if (c.mfa) need(['approved', 'denied', 'timeout'].includes(c.mfa.result), `callers: "${c.id}" mfa.result must be approved, denied or timeout.`);
  }

  for (const c of CALLERS) {
    for (const key of c.leaks ?? []) need(LEAKS[key], `callers: "${c.id}" leaks unknown key "${key}".`);
    for (const v of c.variants ?? []) {
      need(v.if, `callers: "${c.id}" has a variant without an "if".`);
      checkCondition(v.if, `callers: "${c.id}" variant`, callerIds, need);
    }
  }

  const emailIds = new Set();
  for (const e of EMAILS) {
    need(!emailIds.has(e.id), `story: duplicate email id "${e.id}".`);
    emailIds.add(e.id);
    need(e.from && e.subject && e.body, `story: email "${e.id}" needs from, subject and body.`);
    need(DAYS.some((d) => d.day === e.day), `story: email "${e.id}" is for day ${e.day}, which isn't in days.js.`);
    need(!e.at || ['start', 'end'].includes(e.at), `story: email "${e.id}" has "at" other than start or end.`);
    need(!(e.at === 'start' && e.if?.today), `story: email "${e.id}" uses "today" at the start of a shift.`);
    checkCondition(e.if, `story: email "${e.id}"`, callerIds, need);
  }

  for (const [id, ending] of Object.entries(ENDINGS)) {
    for (const p of ending.body ?? []) if (typeof p !== 'string') checkCondition(p.if, `endings: "${id}"`, callerIds, need);
  }
  for (const f of FINALE) {
    need(ENDINGS[f.ending], `endings: FINALE names unknown ending "${f.ending}".`);
    checkCondition(f.if, 'endings: FINALE', callerIds, need);
  }
  need(FINALE.length && !FINALE[FINALE.length - 1].if, 'endings: the last FINALE entry should have no "if".');
  for (const ev of METERS.events) if (ev.ending) need(ENDINGS[ev.ending], `meters: event "${ev.id}" names unknown ending "${ev.ending}".`);

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
