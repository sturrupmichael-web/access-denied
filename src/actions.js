// What happens when the player uses a desk action on a call. Pure functions over the data,
// so the same caller always gives the same result (a reload doesn't reroll an MFA push).
//
//   managerCallback(caller) -> { result: 'confirms' | 'denies' | 'unreachable', line, manager }
//   mfaPush(caller)         -> { result: 'approved' | 'denied' | 'timeout', line }
//   deskCallback(caller)    -> { result: 'confirms' | 'denies' | 'unreachable', line }
//   ownerCallback(caller)   -> { result: 'confirms' | 'denies' | 'unreachable', line }
//
// A caller can set the outcome with `managerCallback: { result, line }`,
// `mfa: { result, line }`, `deskCallback` or `ownerCallback`. Otherwise genuine callers' managers confirm and their pushes are
// approved (except about one in six, where they don't have their phone), and attackers'
// managers say no and the real owner denies the push.

import { findEmployee, findGroup } from './verdict.js';

const firstName = (name) => String(name).split(' ')[0];

// A stable 0..1 number from a string, so "random" outcomes don't change between plays.
export function hashUnit(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

export function managerCallback(caller) {
  const emp = findEmployee(caller.claims.employeeId);
  const manager = emp?.manager ? findEmployee(emp.manager) : null;
  if (!emp || !manager) {
    return { result: 'unreachable', manager: null, line: 'There is no manager on file to call for that employee ID.' };
  }
  const set = caller.managerCallback ?? {};
  const result = set.result ?? (caller.attacker ? 'denies' : 'confirms');
  const who = firstName(manager.name);
  const them = firstName(emp.name);
  const line = set.line ?? {
    confirms: `${who}: "Yes, that's fine. I asked ${them} to call you."`,
    denies: `${who}: "No, I never asked for that. Who did you say was calling?"`,
    unreachable: `${manager.name}'s voicemail: "I'm away from my desk. Leave a message."`,
  }[result];
  return { result, manager, line };
}

export function mfaPush(caller) {
  const emp = findEmployee(caller.claims.employeeId);
  if (!emp) return { result: 'timeout', line: 'No registered device: that employee ID has no account.' };
  const set = caller.mfa ?? {};
  let result = set.result;
  if (!result) result = caller.attacker ? 'denied' : hashUnit(caller.id) < 0.17 ? 'timeout' : 'approved';
  const line = set.line ?? {
    approved: `Push approved on ${firstName(emp.name)}'s registered phone.`,
    denied: `Push DENIED on ${firstName(emp.name)}'s registered phone. The real owner says it wasn't them.`,
    timeout: `No response. ${caller.claims.name}: "Oh no. My phone's in my other bag."`,
  }[result];
  return { result, line };
}

// Hangs up and rings the employee's desk phone on file, whoever is on the line.
export function deskCallback(caller) {
  const emp = findEmployee(caller.claims.employeeId);
  if (!emp) return { result: 'unreachable', line: 'There is no desk phone on file for that employee ID.' };
  const set = caller.deskCallback ?? {};
  const result = set.result ?? (caller.attacker ? 'denies' : 'confirms');
  const who = firstName(emp.name);
  const line = set.line ?? {
    confirms: `You ring ${emp.phone}. ${who}: "Yes, that was me. Thanks for checking, I suppose."`,
    denies: `You ring ${emp.phone}. ${who} picks up: "Sorry, what? I haven't called the help desk. Should I be worried?"`,
    unreachable: `${emp.phone} rings out. Nobody is at ${who}'s desk.`,
  }[result];
  return { result, line };
}

// Rings the owner of the group the caller wants to join (claims.group).
export function ownerCallback(caller) {
  const group = findGroup(caller.claims.group);
  const owner = group && findEmployee(group.owner);
  if (!owner) return { result: 'unreachable', line: `There's no group called "${caller.claims.group}", so there's no owner to call.` };
  const set = caller.ownerCallback ?? {};
  const result = set.result ?? (caller.attacker ? 'denies' : 'confirms');
  const who = firstName(owner.name);
  const them = firstName(caller.claims.name);
  const line = set.line ?? {
    confirms: `${who}: "${them}? Yes, add them to ${group.name}. Thanks."`,
    denies: `${who}: "No. I own ${group.name} and nobody asked me. Who is this?"`,
    unreachable: `${owner.name}'s voicemail: "I'm out today. For anything urgent, it can probably wait."`,
  }[result];
  return { result, line };
}

// Every desk action by the name rules.js uses for it.
export const ACTIONS = { callback: managerCallback, mfa: mfaPush, deskCallback, ownerCallback };

// Everything a careful agent would do on this call on this day: every question asked, and
// every action the day's rules unlock. Used by the tests to check each caller is fair.
export function idealActions(caller, rules) {
  const unlocked = new Set(rules.flatMap((r) => r.actions ?? []));
  const done = { asked: caller.questions ?? [] };
  for (const [kind, run] of Object.entries(ACTIONS)) done[kind] = unlocked.has(kind) ? run(caller).result : null;
  return done;
}
