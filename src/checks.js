// Check functions, referenced by name from data/rules.js.
//
//   check(caller, ctx, actions) -> { pass: boolean, reason?: string, verdict?: 'deny' | 'escalate' }
//   caller   a caller from data/callers.js
//   ctx      { company, findEmployee(id), siteByName(name) }, built in verdict.js
//   actions  what the player did on the call:
//              { asked: [questions], callback: 'confirms' | 'denies' | 'unreachable' | null,
//                mfa: 'approved' | 'denied' | 'timeout' | null }
//
// `reason` is shown to the player after the call when the check fails, so write it like a
// supervisor explaining the mistake. `verdict` overrides the rule's `onFail` for this
// failure only. A check that can't apply (say, "name matches AD" when
// there is no AD record at all) passes and leaves it to the more specific check, so the
// player isn't told the same thing twice.

import { isLocalTo } from './phone.js';

const PASS = { pass: true };
const fail = (reason) => ({ pass: false, reason });

// Case- and whitespace-insensitive. Spelling still has to match.
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

const validId = (ctx, id) => new RegExp(ctx.company.employeeIdPattern).test(String(id ?? '').trim());

export const CHECKS = {
  employeeIdFormat(caller, ctx) {
    const id = caller.claims.employeeId;
    if (validId(ctx, id)) return PASS;
    return fail(`Employee ID "${id}" isn't in the ${ctx.company.employeeIdExample} format.`);
  },

  employeeIdExists(caller, ctx) {
    const id = caller.claims.employeeId;
    if (!validId(ctx, id) || ctx.findEmployee(id)) return PASS; // employeeIdFormat reports a bad format
    return fail(`No AD account exists for employee ID ${id}.`);
  },

  nameMatchesAd(caller, ctx) {
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS; // employeeIdExists reports this
    const known = [emp.name, ...(emp.aliases ?? [])].map(norm);
    if (known.includes(norm(caller.claims.name))) return PASS;
    return fail(`The caller said "${caller.claims.name}", but AD has ${emp.id} as "${emp.name}".`);
  },

  hrNotTerminated(caller, ctx) {
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp?.hr || emp.hr.status !== 'terminated') return PASS;
    return fail(`HR lists ${emp.name} as terminated on ${emp.hr.endDate}.`);
  },

  hrNotOnLeave(caller, ctx) {
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp?.hr || emp.hr.status !== 'leave') return PASS;
    const why = emp.hr.note ? ` (${emp.hr.note.toLowerCase()})` : '';
    return { ...fail(`HR lists ${emp.name} as on leave${why} until ${emp.hr.endDate}. Policy is to escalate.`), verdict: 'escalate' };
  },

  callerIdLocal(caller, ctx, actions) {
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp || isLocalTo(caller.callerId.number, emp.site)) return PASS;
    if (actions.asked.length) return PASS; // answersCheckOut judges the answers
    const site = ctx.company.sites.find((s) => s.id === emp.site);
    return {
      ...fail(`Caller ID ${caller.callerId.number} (${caller.callerId.location}) isn't local to ${site?.name ?? emp.site}, and you didn't ask a verification question.`),
      verdict: 'escalate',
    };
  },

  answersCheckOut(caller, ctx, actions) {
    const bad = actions.asked.find((q) => q.tell);
    if (!bad) return PASS;
    return fail(`Asked "${bad.ask}": ${bad.tell}`);
  },

  managerApproved(caller, ctx, actions) {
    if (!ctx.company.requestTypes[caller.claims.request]?.privileged) return PASS;
    if (actions.callback === 'confirms') return PASS;
    if (actions.callback === 'denies') return fail("The employee's manager said they never approved this request.");
    if (actions.callback === 'unreachable') return { ...fail("The manager didn't answer the callback, so nobody confirmed the request."), verdict: 'escalate' };
    return { ...fail('Admin requests need a manager callback, and you didn\'t make one.'), verdict: 'escalate' };
  },

  mfaVerified(caller, ctx, actions) {
    if (caller.claims.request !== 'password_reset') return PASS;
    if (actions.mfa === 'approved') return PASS;
    if (actions.mfa === 'denied') return fail("The MFA push was denied on the account owner's phone.");
    if (actions.mfa === 'timeout') return { ...fail('The MFA push got no response, so the reset was never verified.'), verdict: 'escalate' };
    return { ...fail('Password resets need an MFA push, and you didn\'t send one.'), verdict: 'escalate' };
  },
};
