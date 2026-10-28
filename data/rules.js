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
 *                       A check can override this for its own failure (for
 *                       example, "on leave" escalates inside a deny rule).
 *                       If several checks fail, "deny" wins over "escalate".
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
    id: "hr-active",
    title: "The employee must be active in the HR Roster.",
    binderText:
      "Check the HR Roster, not just AD. AD accounts are not always disabled on time. " +
      "Terminated: deny, even if their AD account still works. " +
      "On leave: escalate to Tier 2, who will confirm with their manager.",
    checks: ["hrNotTerminated", "hrNotOnLeave"],
    onFail: "deny"
  }
];
