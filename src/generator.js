// Random callers, built from data/pools.js. Each generated caller comes with a new
// employee, who joins the directory for the shift so every desk tool can find them.
// Attackers get exactly one tell, chosen from the ones today's rules can catch.
//
// Everything is drawn from a seeded random generator, so the same saved game and day
// always produce the same callers (a reload doesn't reshuffle the queue).

import { POOLS } from '../data/pools.js';
import { COMPANY } from '../data/company.js';
import { DIRECTORY } from '../data/directory.js';
import { findEmployee } from './verdict.js';

// mulberry32: small, fast, good enough for a game.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ATTACKER_SHARE = 0.32;

// Which tells each rule can catch.
const TELLS_BY_RULE = {
  'identity-match': ['misspell', 'noSuchId', 'badFormat'],
  'hr-active': ['terminated'],
  'caller-location': ['location'],
  'manager-callback': ['callback'],
  'mfa-reset': ['mfa'],
};

const DEBRIEFS = {
  misspell: (e, c) => `The real ${e.id} is "${e.name}" in AD. The caller said "${c.claims.name}". One letter is all it takes.`,
  noSuchId: (e, c) => `${e.name} is real, but their ID is ${e.id}. ${c.claims.employeeId} doesn't exist.`,
  badFormat: (e, c) => `"${c.claims.employeeId}" isn't in the ${COMPANY.employeeIdExample} format. Real IDs never look like that.`,
  terminated: (e) => `Name and ID were right, but HR terminated ${e.name} on ${e.hr.endDate}.`,
  location: (e, c) => `Caller ID put them in ${c.callerId.location}, and their answers didn't match the directory.`,
  callback: (e) => `Everything looked right, but ${findEmployee(e.manager).name} never approved an admin request for ${e.name}.`,
  mfa: (e) => `Everything looked right, but the MFA push went to the real ${e.name}'s phone, and they denied it.`,
};

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

// Removes employees generated for an earlier shift.
export function clearGenerated() {
  for (let i = DIRECTORY.length - 1; i >= 0; i--) if (DIRECTORY[i].generated) DIRECTORY.splice(i, 1);
}

// count callers for `dayNumber`, given the rules in effect. seed: a number.
export function generateCallers(dayNumber, count, seed, rules) {
  const r = rng(seed);
  const pick = (list) => list[Math.floor(r() * list.length)];
  const chance = (p) => r() < p;
  const ruleIds = rules.map((x) => x.id);
  // Newer rules' tells are twice as likely, so each day tests what it just taught.
  const tells = ruleIds.flatMap((id, i) => {
    const t = TELLS_BY_RULE[id] ?? [];
    return i === ruleIds.length - 1 ? [...t, ...t] : t;
  });
  const has = (id) => ruleIds.includes(id);

  const takenNames = new Set(DIRECTORY.map((e) => e.name.toLowerCase()));
  const uniqueName = () => {
    for (;;) {
      const name = `${pick(POOLS.firstNames)} ${pick(POOLS.lastNames)}`;
      if (!takenNames.has(name.toLowerCase())) {
        takenNames.add(name.toLowerCase());
        return name;
      }
    }
  };
  const uniqueId = () => {
    for (;;) {
      const id = `HD-1${String(Math.floor(r() * 10000)).padStart(4, '0')}`;
      if (!findEmployee(id)) return id;
    }
  };
  // A local number nobody in the directory has, and never the recurring attacker's 0199.
  const usedNumbers = new Set(DIRECTORY.map((e) => e.phone));
  const localNumber = (siteId) => {
    const site = COMPANY.sites.find((s) => s.id === siteId);
    for (;;) {
      const tail = String(100 + Math.floor(r() * 99)).slice(1);
      const number = site.id === 'LDS' ? `+44 113 496 01${tail}` : `(${site.areaCodes[0]}) 555-01${tail}`;
      if (!usedNumbers.has(number)) {
        usedNumbers.add(number);
        return number;
      }
    }
  };

  const callers = [];
  for (let i = 0; i < count; i++) {
    // Make sure a batch of three or more has at least one attacker.
    const attacker = chance(ATTACKER_SHARE) || (count >= 3 && i === count - 1 && !callers.some((c) => c.attacker));
    const tell = attacker ? pick(tells) : null;

    const deptName = pick(Object.keys(POOLS.departments));
    const dept = POOLS.departments[deptName];
    const manager = findEmployee(dept.manager);
    const site = COMPANY.sites.find((s) => s.id === manager.site);
    const name = uniqueName();
    const first = name.split(' ')[0];

    let request;
    if (tell === 'callback') request = 'admin_access';
    else if (tell === 'mfa') request = 'password_reset';
    else {
      const options = ['password_reset', 'account_unlock', 'access_request', 'software_install'];
      if (has('manager-callback') && chance(0.25)) options.push('admin_access', 'admin_access');
      request = pick(options);
    }

    const emp = {
      id: uniqueId(),
      name,
      title: pick(dept.titles),
      department: deptName,
      site: site.id,
      manager: manager.id,
      phone: localNumber(site.id),
      ad: { status: request === 'account_unlock' ? 'locked' : 'active', lastLogon: pick(['Today 08:12', 'Yesterday 17:40', 'Today 07:55', '2 days ago']), groups: ['All Staff', `${deptName}-Staff`] },
      hr: tell === 'terminated'
        ? { status: 'terminated', startDate: '2020-02-03', endDate: pick(['2026-10-02', '2026-10-14', '2026-10-21']) }
        : { status: 'active', startDate: pick(['2019-06-10', '2021-09-13', '2023-03-06', '2025-11-17']), endDate: null },
      generated: true,
    };
    if (!DIRECTORY.some((e) => e.id === emp.id)) DIRECTORY.push(emp);

    const app = pick(POOLS.apps);
    const vars = { name, first, id: emp.id, dept: deptName, site: site.name, manager: manager.name, app };
    const reqPool = POOLS.requests[request];
    const claims = {
      name,
      employeeId: emp.id,
      department: deptName,
      site: site.name,
      manager: manager.name,
      callback: attacker ? localNumber(site.id) : emp.phone,
      request,
      detail: fill(pick(reqPool.detail), vars),
    };
    if (tell === 'misspell') claims.name = misspell(name, r);
    if (tell === 'noSuchId') claims.employeeId = nearbyMissingId(emp.id, r);
    if (tell === 'badFormat') claims.employeeId = pick([emp.id.replace('HD-', 'HD'), emp.id.slice(0, -1), emp.id.replace('HD-', 'H-')]);

    // Caller ID: local unless they're travelling (genuine) or calling from elsewhere (attacker).
    let callerId = { number: attacker ? localNumber(site.id) : emp.phone, location: site.city };
    let travelLine = null;
    if (tell === 'location') callerId = { ...pick(POOLS.spoofed) };
    else if (!attacker && has('caller-location') && chance(0.25)) {
      const trip = pick(POOLS.travel);
      callerId = { number: trip.number, location: trip.location };
      travelLine = trip.line;
    }

    const mood = pick(Object.keys(POOLS.openers));
    const spoken = { ...vars, name: claims.name, first: claims.name.split(' ')[0], id: claims.employeeId };
    const dialogue = [
      { from: 'agent', text: 'HD ServiceDesk, this is Tier 1. How can I help?' },
      { from: 'caller', text: fill(pick(POOLS.openers[mood]), spoken) },
      { from: 'caller', text: fill(pick(reqPool.problem), spoken) },
      travelLine && { from: 'caller', text: travelLine },
      attacker && { from: 'caller', text: pick(POOLS.pressure) },
      { from: 'agent', text: 'Can I get your employee ID?' },
      { from: 'caller', text: fill(pick(POOLS.idLines), spoken) },
    ].filter(Boolean);

    const otherManager = findEmployee(pick(Object.values(POOLS.departments).map((d) => d.manager).filter((m) => m !== manager.id)));
    const questions = tell === 'location'
      ? [
        { ask: "Who's your manager?", answer: `${otherManager.name}.`, tell: `they named ${otherManager.name}, but the Org Chart says ${manager.name}.` },
        { ask: 'Which site are you at?', answer: `${site.name}, at my desk.`, tell: `they claimed ${site.name}, but Caller ID says ${callerId.location}.` },
      ]
      : [
        { ask: "Who's your manager?", answer: `${manager.name}.` },
        { ask: 'Which site are you at?', answer: travelLine ? `Normally ${site.name}. ${travelLine}` : `${site.name}.` },
      ];

    const caller = {
      id: `gen-d${dayNumber}-${i + 1}`,
      attacker,
      generated: true,
      claims,
      callerId,
      dialogue,
      questions,
      debrief: attacker
        ? `A random social engineer. ${DEBRIEFS[tell](emp, { claims, callerId })}`
        : `${name} is a genuine employee${travelLine ? ', just away from their usual site' : ''}. Everything checks out.`,
    };
    if (tell === 'callback') caller.managerCallback = { result: 'denies' };
    if (tell === 'mfa') caller.mfa = { result: 'denied' };
    if (attacker && !['callback', 'mfa'].includes(tell)) {
      // Their other details are fine; the tell is the one thing that's wrong.
      caller.managerCallback = { result: 'denies' };
      caller.mfa = { result: 'denied' };
    }
    if (!attacker) caller.managerCallback = { result: 'confirms' };
    callers.push(caller);
  }
  return callers;
}

// Changes one letter in the last name: a doubled letter, a dropped one, or a swap.
function misspell(name, r) {
  const [first, ...rest] = name.split(' ');
  const last = rest.join(' ');
  const i = 1 + Math.floor(r() * (last.length - 2));
  const options = [
    last.slice(0, i) + last[i] + last.slice(i), // double a letter
    last.slice(0, i) + last.slice(i + 1), // drop a letter
    last.slice(0, i) + last[i + 1] + last[i] + last.slice(i + 2), // swap two
  ].filter((x) => x.toLowerCase() !== last.toLowerCase());
  return `${first} ${options[Math.floor(r() * options.length)]}`;
}

function nearbyMissingId(id, r) {
  for (;;) {
    const digits = id.slice(3).split('');
    const a = 1 + Math.floor(r() * 4);
    digits[a] = String((Number(digits[a]) + 1 + Math.floor(r() * 8)) % 10);
    const candidate = `HD-${digits.join('')}`;
    if (candidate !== id && !findEmployee(candidate)) return candidate;
  }
}
