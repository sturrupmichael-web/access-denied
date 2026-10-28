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
 *   actions    string[] Optional. Desk actions this rule unlocks on the call
 *                       window, from the day it switches on:
 *                         "callback"  Call manager: rings the employee's real
 *                                     manager (from the directory, not the
 *                                     name the caller gave) to confirm.
 *                         "mfa"       MFA push: pings the employee's
 *                                     registered phone.
 *                       Each costs company.timeCosts minutes. Checks see what
 *                       the player did through their third argument, `actions`.
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
  },
  {
    id: "caller-location",
    title: "Caller ID must match the employee's site. If it doesn't, verify with a question.",
    binderText:
      "Compare the Caller ID area code with the employee's site (see the Sites table below). " +
      "If they don't match, ask at least one verification question before you decide. " +
      "People travel, but their answers should still line up with the directory. " +
      "A wrong answer to any question: deny. A mismatch you didn't question: escalate.",
    checks: ["callerIdLocal", "answersCheckOut"],
    onFail: "deny"
  },
  {
    id: "manager-callback",
    title: "Admin and privileged requests need a callback to the employee's manager.",
    binderText:
      "For any admin or privileged request, use Call manager. It rings the manager listed in the directory, " +
      "not whoever the caller names. Manager confirms: continue. Manager says no: deny. " +
      "No answer, or you didn't call: escalate.",
    checks: ["managerApproved"],
    onFail: "deny",
    actions: ["callback"]
  },
  {
    id: "mfa-reset",
    title: "Password resets need an approved MFA push.",
    binderText:
      "Before any password reset, use MFA push. It goes to the phone registered to the account, " +
      "not the phone the caller is on. Approved: continue. Denied: deny, because the real owner just said no. " +
      "No response, or you didn't send one: escalate.",
    checks: ["mfaVerified"],
    onFail: "deny",
    actions: ["mfa"]
  }
];
