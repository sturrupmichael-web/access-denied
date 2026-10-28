// Check functions, referenced by name from data/rules.js.
//
//   check(caller, ctx) -> { pass: boolean, reason?: string }
//   caller  a caller from data/callers.js
//   ctx     { company, findEmployee(id), siteByName(name) }, built in verdict.js
//
// `reason` is shown to the player after the call when the check fails, so write it like a
// supervisor explaining the mistake. A check that can't apply (say, "name matches AD" when
// there is no AD record at all) passes and leaves it to the more specific check, so the
// player isn't told the same thing twice.

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
};
