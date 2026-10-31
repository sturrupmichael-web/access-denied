// Random callers and background staff, built from data/pools.js. Each generated caller
// comes with a new employee, who joins the directory for the shift so every desk tool can
// find them. Attackers get exactly one tell, chosen from the ones today's rules can catch.
//
// Everything is drawn from a seeded random generator, so the same saved game and day
// always produce the same callers (a reload doesn't reshuffle the queue), and a New game
// picks a new seed, so every game gets different people, problems and jokes.

import { POOLS } from '../data/pools.js';
import { COMPANY } from '../data/company.js';
import { DIRECTORY } from '../data/directory.js';
import { GROUPS } from '../data/groups.js';
import { DAYS } from '../data/days.js';
import { findEmployee, findGroup, deviceOwner } from './verdict.js';

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
  'mfa-swap': ['deskCallback'],
  'no-readback': ['readbackOutsider', 'readbackSpoof'],
  'group-owner': ['ownerDenies', 'noSuchGroup'],
  'leaver-data': ['leaverNotManager'],
  'remote-tool': ['badTool', 'notTheirDevice'],
  'lost-device': ['badShipTo', 'lostNotTheirs'],
  'vendor-change': ['notInGroup'],
  'contractor-extension': ['tooLong', 'notContractor'],
};

// Tells that come with their own request.
const TELL_REQUEST = {
  mfa: 'password_reset',
  deskCallback: 'mfa_swap',
  readbackOutsider: 'info_readback',
  readbackSpoof: 'info_readback',
  ownerDenies: 'shared_access',
  noSuchGroup: 'shared_access',
  leaverNotManager: 'leaver_access',
  badTool: 'remote_session',
  notTheirDevice: 'remote_session',
  badShipTo: 'lost_device',
  lostNotTheirs: 'lost_device',
  notInGroup: 'vendor_change',
  tooLong: 'account_extension',
  notContractor: 'account_extension',
};

// Week-two requests only come up once the rule that covers them is on.
const REQUEST_RULE = {
  mfa_swap: 'mfa-swap',
  info_readback: 'no-readback',
  shared_access: 'group-owner',
  leaver_access: 'leaver-data',
  remote_session: 'remote-tool',
  lost_device: 'lost-device',
  vendor_change: 'vendor-change',
  account_extension: 'contractor-extension',
};
const EVERYDAY_REQUESTS = ['password_reset', 'account_unlock', 'access_request', 'software_install'];

const DEBRIEFS = {
  misspell: (e, c) => `The real ${e.id} is "${e.name}" in AD. The caller said "${c.claims.name}". One letter is all it takes.`,
  noSuchId: (e, c) => `${e.name} is real, but their ID is ${e.id}. ${c.claims.employeeId} doesn't exist.`,
  badFormat: (e, c) => `"${c.claims.employeeId}" isn't in the ${COMPANY.employeeIdExample} format. Real IDs never look like that.`,
  terminated: (e) => `Name and ID were right, but HR terminated ${e.name} on ${e.hr.endDate}.`,
  location: (e, c) => `Caller ID put them in ${c.callerId.location}, and their answers didn't match the directory.`,
  callback: (e) => `Everything looked right, but ${findEmployee(e.manager).name} never approved this request for ${e.name}.`,
  mfa: (e) => `Everything looked right, but the MFA push went to the real ${e.name}'s phone, and they denied it.`,
  deskCallback: (e) => `The desk phone on file rang on ${e.name}'s actual desk, and the real ${e.name.split(' ')[0]} still has their phone. A classic SIM-swap setup.`,
  readbackOutsider: (e) => `${e.name} works in ${e.department}, not Security, and isn't in ${COMPANY.securityGroup}. Reading back details would have handed them a pretext for the next call.`,
  readbackSpoof: (e, c) => `${e.name} really is in Security, but Caller ID ${c.callerId.number} isn't their desk phone (${e.phone}). Someone borrowed their name.`,
  ownerDenies: (e, c) => `${findEmployee(findGroup(c.claims.group).owner).name} owns ${c.claims.group} and never approved it.`,
  noSuchGroup: (e, c) => `There's no group called ${c.claims.group}. Made-up names that sound official are a favourite.`,
  leaverNotManager: (e, c) => `${c.claims.subject} reported to ${findEmployee(findEmployee(c.claims.subjectId).manager).name}, not ${e.name}, and HR never approved a handover to them.`,
  badTool: (e, c) => `${c.claims.tool} isn't ${COMPANY.approvedRemoteTool}. A "vendor" asking for a remote tool is how back doors get installed.`,
  notTheirDevice: (e, c) => `${c.claims.device} belongs to ${deviceOwner(c.claims.device)?.name ?? 'nobody'}, not ${e.name}. They wanted a session on someone else's machine.`,
  badShipTo: (e, c) => `The laptop was really ${e.name}'s, but "${c.claims.shipTo}" is neither their site nor their address on file. That's a free laptop for a thief.`,
  lostNotTheirs: (e, c) => `${c.claims.device} isn't ${e.name}'s laptop. It belongs to ${deviceOwner(c.claims.device)?.name ?? 'nobody'}.`,
  notInGroup: (e) => `${e.name} isn't in ${COMPANY.requestTypes.vendor_change.needsGroup}. "The CFO asked me" is the oldest invoice fraud there is.`,
  tooLong: (e, c) => `${e.name} is a real contractor, but ${c.claims.days} days is more than the ${COMPANY.maxExtensionDays} Tier 1 can give.`,
  notContractor: (e) => `${e.name} is an employee, not a contractor. Nobody's account was about to expire.`,
};

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);

// Removes employees generated for an earlier shift (and the background staff, which
// generateStaff puts back).
export function clearGenerated() {
  for (let i = DIRECTORY.length - 1; i >= 0; i--) if (DIRECTORY[i].generated) DIRECTORY.splice(i, 1);
}

// Name, ID, phone, asset tag and address makers that never reuse what the directory has.
function makers(r) {
  const pick = (list) => list[Math.floor(r() * list.length)];
  const takenNames = new Set(DIRECTORY.flatMap((e) => [e.name, ...(e.aliases ?? [])]).map((n) => n.toLowerCase()));
  const usedNumbers = new Set(DIRECTORY.map((e) => e.phone));
  const usedTags = new Set(DIRECTORY.flatMap((e) => e.devices ?? []));
  const make = {
    pick,
    chance: (p) => r() < p,
    name() {
      for (;;) {
        const name = `${pick(POOLS.firstNames)} ${pick(POOLS.lastNames)}`;
        if (!takenNames.has(name.toLowerCase())) {
          takenNames.add(name.toLowerCase());
          return name;
        }
      }
    },
    id() {
      for (;;) {
        const id = `HD-1${String(Math.floor(r() * 10000)).padStart(4, '0')}`;
        if (!findEmployee(id)) return id;
      }
    },
    // A local number nobody in the directory has, and never the recurring attacker's 0199.
    localNumber(siteId) {
      const site = COMPANY.sites.find((s) => s.id === siteId);
      for (let tries = 0; ; tries++) {
        const tail = String(100 + Math.floor(r() * 99)).slice(1);
        // Once the 01xx numbers run out, use the next block of fictional 555 numbers.
        const block = tries > 300 ? `0${2 + Math.floor(r() * 7)}` : '01';
        const number = site.id === 'LDS' ? `+44 113 496 ${block}${tail}` : `(${pick(site.areaCodes)}) 555-${block}${tail}`;
        if (!usedNumbers.has(number) && !number.endsWith('0199')) {
          usedNumbers.add(number);
          return number;
        }
      }
    },
    tag() {
      for (;;) {
        const tag = `LT-${5 + Math.floor(r() * 4)}${String(Math.floor(r() * 10000)).padStart(4, '0')}`;
        if (!usedTags.has(tag)) {
          usedTags.add(tag);
          return tag;
        }
      }
    },
    address(siteId) {
      const site = COMPANY.sites.find((s) => s.id === siteId);
      return `${2 + Math.floor(r() * 400)} ${pick(POOLS.streets[siteId])}, ${site.city}`;
    },
  };
  // A new employee in `deptName`, reporting to the department's manager unless
  // `manager` says otherwise. Added to the directory.
  make.employee = (deptName, { manager, title, hr = {}, groups = [] } = {}) => {
    const dept = POOLS.departments[deptName];
    const boss = findEmployee(manager ?? dept.manager);
    const department = dept.ad ?? deptName;
    const emp = {
      id: make.id(),
      name: make.name(),
      title: title ?? pick(dept.titles),
      department,
      site: boss.site,
      manager: boss.id,
      phone: make.localNumber(boss.site),
      devices: [make.tag()],
      ad: { status: 'active', lastLogon: pick(['Today 08:12', 'Yesterday 17:40', 'Today 07:55', '2 days ago', 'Today 06:31', 'Yesterday 21:03']), groups: ['All Staff', `${department}-Staff`, ...(dept.groups ?? []), ...groups] },
      hr: { status: 'active', startDate: pick(['2016-04-04', '2019-06-10', '2021-09-13', '2023-03-06', '2024-08-19', '2025-11-17']), endDate: null, address: make.address(boss.site), ...hr },
      generated: true,
    };
    DIRECTORY.push(emp);
    return emp;
  };
  return make;
}

// Background coworkers for the whole game: the same people every day of one game, and
// different people in the next. They never call, but they fill the directory, own
// devices, and make every search a little more like a real company.
export function generateStaff(seed, count = POOLS.staffCount) {
  const r = rng(seed ^ 0x5eed);
  const make = makers(r);
  const staff = [];
  for (let i = 0; i < count; i++) {
    const roll = r();
    const hr = roll < 0.06
      ? { status: 'leave', endDate: make.pick(['2026-11-20', '2026-12-04', '2027-01-08']), note: make.pick(['Parental leave', 'Sabbatical', 'Medical leave']) }
      : roll < 0.1 ? { status: 'terminated', endDate: make.pick(['2026-09-30', '2026-10-16']) } : {};
    const emp = make.employee(make.pick(POOLS.everyday), { hr });
    if (hr.status === 'terminated') emp.ad.status = 'disabled';
    if (make.chance(0.25)) {
      const t = make.pick(POOLS.staffTickets);
      emp.tickets = [{ id: `INC-${39000 + Math.floor(r() * 2000)}`, when: make.pick(['Last Tue', '2 weeks ago', 'Mon 10:12', 'Last month']), type: t.type, summary: t.summary, status: 'Resolved' }];
    }
    staff.push(emp);
  }
  return staff;
}

// count callers for `dayNumber`, given the rules in effect. seed: a number.
export function generateCallers(dayNumber, count, seed, rules) {
  const r = rng(seed);
  const make = makers(r);
  const { pick, chance } = make;
  const ruleIds = rules.map((x) => x.id);
  const has = (id) => ruleIds.includes(id);
  // Today's new rules' tells are twice as likely, so each day tests what it just taught.
  const newToday = new Set(DAYS.find((d) => d.day === dayNumber)?.addRules ?? [ruleIds.at(-1)]);
  const tells = ruleIds.flatMap((id) => {
    const t = TELLS_BY_RULE[id] ?? [];
    return newToday.has(id) ? [...t, ...t] : t;
  });

  // What a genuine caller (or an attacker with a generic tell) asks for. Today's new
  // request types come up most.
  const requestFor = (tell) => {
    if (TELL_REQUEST[tell]) return TELL_REQUEST[tell];
    const options = [...EVERYDAY_REQUESTS];
    if (has('manager-callback') && chance(0.25)) options.push('admin_access', 'admin_access');
    for (const [request, rule] of Object.entries(REQUEST_RULE)) {
      if (!has(rule)) continue;
      // A Caller ID tell can't come with a readback: that rule needs their desk phone.
      if (tell === 'location' && request === 'info_readback') continue;
      for (let n = newToday.has(rule) ? 4 : 1; n > 0; n--) options.push(request);
    }
    if (tell === 'callback') return pick(options.filter((o) => COMPANY.requestTypes[o].privileged).concat('admin_access'));
    return pick(options);
  };

  const callers = [];
  for (let i = 0; i < count; i++) {
    // Make sure a batch of three or more has at least one attacker.
    const attacker = chance(ATTACKER_SHARE) || (count >= 3 && i === count - 1 && !callers.some((c) => c.attacker));
    const tell = attacker ? pick(tells) : null;
    const request = requestFor(tell);

    // Who they are. Some requests only make sense from certain teams.
    let deptName = pick(POOLS.everyday);
    let extra = {};
    if (request === 'info_readback' && tell !== 'readbackOutsider') deptName = 'Security Operations';
    if (request === 'vendor_change') {
      deptName = tell === 'notInGroup' ? 'Executive' : 'Finance';
      if (tell !== 'notInGroup') extra.groups = [COMPANY.requestTypes.vendor_change.needsGroup];
    }
    if (request === 'account_extension' && tell !== 'notContractor') {
      extra.hr = { type: 'contractor', endDate: pick(['2026-11-06', '2026-11-13', '2026-11-20']) };
    }
    if (request === 'leaver_access') extra.title = pick(['Team Lead', 'Supervisor', 'Project Lead']);
    const emp = make.employee(deptName, extra);
    if (extra.hr?.type === 'contractor') emp.title = `Contract ${emp.title}`;
    if (tell === 'terminated') {
      emp.hr = { ...emp.hr, status: 'terminated', startDate: '2020-02-03', endDate: pick(['2026-10-02', '2026-10-14', '2026-10-21']) };
      if (emp.hr.type === 'contractor') emp.hr.note = 'Contract ended';
    }
    if (request === 'account_unlock') emp.ad.status = 'locked';
    const manager = findEmployee(emp.manager);
    const site = COMPANY.sites.find((s) => s.id === emp.site);
    const name = emp.name;
    const first = name.split(' ')[0];

    const claims = {
      name,
      employeeId: emp.id,
      department: emp.department,
      site: site.name,
      manager: manager.name,
      callback: attacker ? make.localNumber(site.id) : emp.phone,
      request,
    };
    const caller = { attacker, generated: true };
    const extraQuestions = [];
    let genuineNote = 'Everything checks out.';

    // The request's own details, and its tell if it has one.
    if (request === 'info_readback') {
      const subject = pick(DIRECTORY.filter((e) => !e.generated && e.id !== emp.id && e.hr.status === 'active'));
      Object.assign(claims, { subject: subject.name, subjectId: subject.id });
      if (tell === 'readbackOutsider') claims.department = 'IT Security';
      extraQuestions.push(attacker
        ? { ask: 'Why do you need their details?', answer: pick(['Routine audit. Very routine. Super routine.', "I can't say. It's that kind of investigation.", "Because I'm asking. Is that not enough?"]) }
        : { ask: 'Why do you need their details?', answer: `There's an odd login on ${subject.name.split(' ')[0]}'s account. I want to ring them on a number I trust before I lock anything.` });
      genuineNote = `They're in ${COMPANY.securityGroup} and called from their own desk phone, so reading back the details was fine.`;
    }
    if (request === 'shared_access') {
      const pool = tell === 'ownerDenies' ? GROUPS.filter((g) => g.restricted) : GROUPS;
      claims.group = tell === 'noSuchGroup' ? pick(POOLS.fakeGroups) : pick(pool).name;
      if (tell === 'ownerDenies') caller.ownerCallback = { result: 'denies' };
      const g = findGroup(claims.group);
      genuineNote = g?.restricted ? `${findEmployee(g.owner).name} owns ${g.name} and said yes.` : `${claims.group} is open to anyone.`;
    }
    if (request === 'leaver_access') {
      const leaverIsTheirs = tell !== 'leaverNotManager';
      const leaver = make.employee(deptName, {
        manager: leaverIsTheirs ? emp.id : manager.id,
        hr: { status: 'terminated', endDate: pick(['2026-10-23', '2026-10-27', '2026-10-30']) },
      });
      leaver.ad.status = 'disabled';
      const handover = leaverIsTheirs ? (chance(0.6) ? emp.id : null) : (chance(0.5) ? manager.id : null);
      if (handover) {
        leaver.hr.handoverTo = handover;
        leaver.hr.note = `Files handed over to ${findEmployee(handover).name}`;
      }
      Object.assign(claims, { subject: leaver.name, subjectId: leaver.id });
      extraQuestions.push(leaverIsTheirs
        ? { ask: `Were you ${leaver.name.split(' ')[0]}'s manager?`, answer: `Yes, ${leaver.name.split(' ')[0]} reported to me.` }
        : { ask: `Were you ${leaver.name.split(' ')[0]}'s manager?`, answer: pick(['Sort of. Informally. Spiritually.', 'Basically, yes. Day to day, anyway.']), tell: `the Org Chart has ${leaver.name} reporting to ${manager.name}, not ${name}.` });
      genuineNote = handover
        ? `HR approved ${leaver.name}'s handover to them, so the files could be copied over without reopening the account.`
        : `They really were ${leaver.name}'s manager, but HR hadn't approved a handover yet, so it goes to Tier 2.`;
    }
    if (request === 'remote_session' || request === 'lost_device') {
      const others = DIRECTORY.filter((e) => e.id !== emp.id && e.devices?.length);
      const stolenTag = ['notTheirDevice', 'lostNotTheirs'].includes(tell);
      claims.device = stolenTag ? pick(pick(others).devices) : emp.devices[0];
      if (request === 'remote_session') claims.tool = tell === 'badTool' ? pick(POOLS.badRemoteTools) : COMPANY.approvedRemoteTool;
      if (request === 'lost_device') {
        claims.shipTo = tell === 'badShipTo' ? pick(POOLS.badShipTo) : chance(0.5) ? site.name : emp.hr.address;
        extraQuestions.push({ ask: 'Where should the replacement go?', answer: claims.shipTo === site.name ? `Just to my desk at ${site.name}.` : `To ${claims.shipTo}.` });
      }
      genuineNote = request === 'lost_device'
        ? `${claims.device} is theirs and the replacement went to ${claims.shipTo === site.name ? 'their site' : 'their address on file'}.`
        : `${claims.device} is theirs and they asked for ${COMPANY.approvedRemoteTool}.`;
    }
    if (request === 'vendor_change') {
      claims.vendor = pick(POOLS.vendors);
      extraQuestions.push({ ask: 'Who asked for the change?', answer: tell === 'notInGroup' ? 'The CFO. Personally. From a plane.' : `${claims.vendor} wrote to us on letterhead, and I've rung them on the number we already had.` });
      genuineNote = `They're in ${COMPANY.requestTypes.vendor_change.needsGroup}, and ${manager.name} confirmed the change.`;
    }
    if (request === 'account_extension') {
      claims.days = tell === 'tooLong' ? pick([120, 180, 365]) : pick([30, 60, 90]);
      genuineNote = `They're a contractor sponsored by ${manager.name}, who confirmed ${claims.days} more days.`;
    }
    if (request === 'mfa_swap' && !attacker && chance(0.15)) {
      caller.deskCallback = { result: 'unreachable' };
      genuineNote = "They were genuine, but nobody answered their desk phone, so the swap couldn't be confirmed.";
    }
    if (tell === 'callback') caller.managerCallback = { result: 'denies' };
    if (tell === 'mfa') caller.mfa = { result: 'denied' };

    if (tell === 'misspell') claims.name = misspell(name, r);
    if (tell === 'noSuchId') claims.employeeId = nearbyMissingId(emp.id, r);
    if (tell === 'badFormat') claims.employeeId = pick([emp.id.replace('HD-', 'HD'), emp.id.slice(0, -1), emp.id.replace('HD-', 'H-')]);

    // Caller ID: their desk phone, unless they're travelling (genuine) or calling from
    // elsewhere (attacker). Security staff asking for a readback are always at their desks.
    let callerId = { number: attacker ? make.localNumber(site.id) : emp.phone, location: site.city };
    let travelLine = null;
    if (tell === 'location') callerId = { ...pick(POOLS.spoofed) };
    else if (!attacker && request !== 'info_readback' && has('caller-location') && chance(0.25)) {
      const trip = pick(POOLS.travel);
      callerId = { number: trip.number, location: trip.location };
      travelLine = trip.line;
    }

    const vars = {
      name: claims.name, first: claims.name.split(' ')[0], id: claims.employeeId, dept: emp.department, site: site.name,
      manager: manager.name, app: pick(POOLS.apps), group: claims.group, device: claims.device, tool: claims.tool,
      shipTo: claims.shipTo, vendor: claims.vendor, days: claims.days, subject: claims.subject, subjectFirst: claims.subject?.split(' ')[0],
    };
    const reqPool = POOLS.requests[request];
    claims.detail = fill(pick(reqPool.detail), vars);
    const problem = POOLS.scams[tell] ? pick(POOLS.scams[tell]) : pick(reqPool.problem);
    const mood = pick(Object.keys(POOLS.openers));
    const dialogue = [
      { from: 'agent', text: 'HD ServiceDesk, this is Tier 1. How can I help?' },
      { from: 'caller', text: fill(pick(POOLS.openers[mood]), vars) },
      { from: 'caller', text: fill(problem, vars) },
      chance(0.5) && { from: 'caller', text: pick(POOLS.asides) },
      travelLine && { from: 'caller', text: travelLine },
      attacker && { from: 'caller', text: pick(POOLS.pressure) },
      { from: 'agent', text: 'Can I get your employee ID?' },
      { from: 'caller', text: fill(pick(POOLS.idLines), vars) },
      !attacker && chance(0.3) && { from: 'caller', text: pick(POOLS.closers) },
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
        ...extraQuestions,
      ];

    Object.assign(caller, {
      id: `gen-d${dayNumber}-${i + 1}`,
      claims,
      callerId,
      dialogue,
      questions,
      debrief: attacker
        ? `A random social engineer. ${DEBRIEFS[tell](emp, { claims, callerId })}`
        : `${name} is a genuine employee${travelLine ? ', just away from their usual site' : ''}. ${genuineNote}${chance(0.4) ? ` ${pick(POOLS.quips)}` : ''}`,
    });
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
