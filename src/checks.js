// Check functions, referenced by name from data/rules.js.
//
//   check(caller, ctx, actions) -> { pass: boolean, reason?: string, verdict?: 'deny' | 'escalate' }
//   caller   a caller from data/callers.js
//   ctx      { company, findEmployee(id), siteByName(name), findGroup(name), deviceOwner(tag) },
//            built in verdict.js
//   actions  what the player did on the call:
//              { asked: [questions], callback: 'confirms' | 'denies' | 'unreachable' | null,
//                mfa: 'approved' | 'denied' | 'timeout' | null,
//                deskCallback: 'confirms' | 'denies' | 'unreachable' | null,
//                ownerCallback: 'confirms' | 'denies' | 'unreachable' | null }
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

const is = (caller, request) => caller.claims.request === request;

// What a callback result means for a check that needs one. `what` names the call
// ("a desk phone callback"), `who` says who said no.
function callbackResult(result, what, who) {
  if (result === 'confirms') return PASS;
  if (result === 'denies') return fail(`${who} said they never asked for this.`);
  if (result === 'unreachable') return { ...fail(`Nobody answered ${what}, so nobody confirmed the request.`), verdict: 'escalate' };
  return { ...fail(`This request needs ${what}, and you didn't make one.`), verdict: 'escalate' };
}

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

  // ---- Week two: each check applies to its own request type only. ----

  deskCallbackConfirms(caller, ctx, actions) {
    if (!is(caller, 'mfa_swap')) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS;
    return callbackResult(actions.deskCallback, `a callback to ${emp.name}'s desk phone`, `${emp.name}, on their own desk phone,`);
  },

  readbackAllowed(caller, ctx) {
    if (!is(caller, 'info_readback')) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS;
    const group = ctx.company.securityGroup;
    if (!emp.ad.groups.includes(group)) return fail(`${emp.name} isn't in ${group} in AD, so they don't get anyone else's details. Not even a little bit.`);
    if (norm(caller.callerId.number) !== norm(emp.phone)) {
      return fail(`${emp.name} is in ${group}, but Caller ID ${caller.callerId.number} isn't their desk phone (${emp.phone}). Real Security staff call from their desks.`);
    }
    return PASS;
  },

  groupOwnerApproved(caller, ctx, actions) {
    if (!is(caller, 'shared_access')) return PASS;
    const group = ctx.findGroup(caller.claims.group);
    if (!group) return fail(`There's no group called "${caller.claims.group}" in the Groups tab.`);
    if (!group.restricted) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (emp && emp.id === group.owner) return PASS;
    const owner = ctx.findEmployee(group.owner);
    return callbackResult(actions.ownerCallback, `a callback to ${group.name}'s owner`, `${owner?.name ?? 'The owner'}, who owns ${group.name},`);
  },

  leaverHandover(caller, ctx) {
    if (!is(caller, 'leaver_access')) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS;
    const leaver = ctx.findEmployee(caller.claims.subjectId);
    if (!leaver) return fail(`There's no employee ${caller.claims.subjectId} for the caller to inherit files from.`);
    if (leaver.hr.status !== 'terminated') {
      return { ...fail(`HR still lists ${leaver.name} as ${leaver.hr.status}, not a leaver. Tier 2 needs to find out what's going on.`), verdict: 'escalate' };
    }
    if (leaver.hr.handoverTo === emp.id) return PASS;
    const approved = leaver.hr.handoverTo && ctx.findEmployee(leaver.hr.handoverTo);
    if (approved) return fail(`HR approved ${leaver.name}'s handover to ${approved.name}, not to ${emp.name}.`);
    if (leaver.manager === emp.id) {
      return { ...fail(`${emp.name} is ${leaver.name}'s manager, but HR hasn't approved a handover yet. Escalate so Tier 2 can ask HR.`), verdict: 'escalate' };
    }
    return fail(`${emp.name} isn't ${leaver.name}'s manager, and HR hasn't approved a handover to them.`);
  },

  remoteSessionSafe(caller, ctx) {
    if (!is(caller, 'remote_session')) return PASS;
    const tool = ctx.company.approvedRemoteTool;
    if (norm(caller.claims.tool) !== norm(tool)) return fail(`"${caller.claims.tool}" isn't ${tool}, the only approved remote tool. That's how back doors get installed.`);
    return deviceIsTheirs(caller, ctx);
  },

  lostDeviceSafe(caller, ctx) {
    if (!is(caller, 'lost_device')) return PASS;
    const owned = deviceIsTheirs(caller, ctx);
    if (!owned.pass) return owned;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS;
    const site = ctx.company.sites.find((s) => s.id === emp.site);
    const allowed = [site?.name, emp.hr.address].filter(Boolean).map(norm);
    if (allowed.includes(norm(caller.claims.shipTo))) return PASS;
    return fail(`They wanted the replacement sent to "${caller.claims.shipTo}". It can only go to ${site?.name ?? emp.site} or the home address HR has on file.`);
  },

  inRequiredGroup(caller, ctx) {
    const group = ctx.company.requestTypes[caller.claims.request]?.needsGroup;
    if (!group) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp || emp.ad.groups.includes(group)) return PASS;
    return fail(`${emp.name} isn't in the ${group} group in AD, so they can't ask for this, whoever they say they're calling for.`);
  },

  extensionAllowed(caller, ctx) {
    if (!is(caller, 'account_extension')) return PASS;
    const emp = ctx.findEmployee(caller.claims.employeeId);
    if (!emp) return PASS;
    if (emp.hr.type !== 'contractor') return fail(`HR lists ${emp.name} as an employee, not a contractor. Employees don't have accounts that expire.`);
    const max = ctx.company.maxExtensionDays;
    if (Number(caller.claims.days) > max) return fail(`They asked for ${caller.claims.days} days. Tier 1 can extend a contractor by ${max} at most.`);
    return PASS;
  },
};

// The asset tag on the call must be assigned to the employee in AD.
function deviceIsTheirs(caller, ctx) {
  const emp = ctx.findEmployee(caller.claims.employeeId);
  if (!emp) return PASS;
  const tag = caller.claims.device;
  if ((emp.devices ?? []).some((d) => norm(d) === norm(tag))) return PASS;
  const owner = ctx.deviceOwner(tag);
  return fail(owner
    ? `Asset ${tag} belongs to ${owner.name}, not ${emp.name}.`
    : `AD has no device ${tag} at all, let alone one assigned to ${emp.name}.`);
}
