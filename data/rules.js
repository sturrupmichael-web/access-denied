/* =============================================================================
 * RULES: the verification policy library.
 * -----------------------------------------------------------------------------
 * A rule is a policy line from the Policy Binder plus the checks that enforce
 * it. Days switch rules on with `addRules` (see days.js); once on, a rule
 * stays on for every later day unless a day lists it in `removeRules`.
 *
 * Rule fields:
 *   id         string   Unique id, referenced from days.js.
 *   title      string   One-line rule shown in the briefing and binder.
 *   binderText string   Longer explanation for the Policy Binder.
 *   checks     string[] Names of functions in src/checks.js. The rule
 *                       fails if ANY of its checks fails.
 *   onFail     "deny" | "escalate"   What policy says to do when it fails.
 *                       If several rules fail, "deny" wins over "escalate".
 *
 * To add a rule that needs new logic, write one small function in checks.js
 * and reference its name here. Rules that reuse existing checks need no code.
 * ========================================================================== */
export const RULES = [
  {
    id: "identity-match",
    title: "Name and employee ID must match Active Directory.",
    binderText:
      "Look the caller up in AD Lookup. The employee ID must be in the correct format, " +
      "must exist, and the name on that record must match the name the caller gave. " +
      "Nicknames listed on the record are fine. Any mismatch: deny.",
    checks: ["employeeIdFormat", "employeeIdExists", "nameMatchesAd"],
    onFail: "deny"
  },
  {
    // Ready for Day 2 (Phase 2). No day turns it on yet.
    id: "hr-active",
    title: "The employee must be active in the HR Roster.",
    binderText:
      "Check the HR Roster. Terminated employees must be denied, even if their AD account still works. " +
      "Employees on leave should be escalated to Tier 2.",
    checks: ["hrNotTerminated"],
    onFail: "deny"
  }
];
