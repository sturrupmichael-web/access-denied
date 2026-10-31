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
 *                         "deskCallback"   Call desk phone: hangs up and
 *                                     rings the employee's desk number on file.
 *                         "ownerCallback"  Call group owner: rings the owner
 *                                     of the group in claims.group (groups.js).
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
  },

  /* ---- Week two. Each rule below only applies to its own request type, so
   *      it never changes the verdict on an older kind of call. ---- */
  {
    id: "mfa-swap",
    title: "MFA device swaps need a callback to the employee's desk phone on file.",
    binderText:
      "\"I got a new phone\" is how SIM-swap attacks start. Before moving anyone's authenticator, use Call desk phone. " +
      "It hangs up and rings the desk number in AD, not the number they called from. " +
      "They confirm: continue. Someone else answers and says no: deny. Nobody answers, or you didn't call: escalate.",
    checks: ["deskCallbackConfirms"],
    onFail: "deny",
    actions: ["deskCallback"]
  },
  {
    id: "no-readback",
    title: "Never read back someone's details unless the caller is in SEC-Operations and on their own desk phone.",
    binderText:
      "People claiming to be from IT Security will ask you to read back a user's phone number, manager or last logon. " +
      "Only do it if AD shows the caller in the SEC-Operations group AND Caller ID is the desk phone AD has for them. " +
      "Real Security staff call from their desks. Anything else: deny.",
    checks: ["readbackAllowed"],
    onFail: "deny"
  },
  {
    id: "group-owner",
    title: "Shared mailbox and list access needs the group owner's OK, unless the group is open.",
    binderText:
      "Look the group up in the Groups tab. Open groups: anyone can join. Restricted groups: use Call group owner, " +
      "which rings the owner on file. Owner says yes: approve. Owner says no: deny. No answer, or you didn't call: escalate. " +
      "A group that doesn't exist: deny.",
    checks: ["groupOwnerApproved"],
    onFail: "deny",
    actions: ["ownerCallback"]
  },
  {
    id: "leaver-data",
    title: "Never reopen a leaver's account. Their files go only to whoever HR approved.",
    binderText:
      "Check the leaver in the HR Roster. If HR approved a handover to the caller, approve: their files are copied over and " +
      "the account stays closed. If the caller is the leaver's manager in the Org Chart but HR hasn't approved anyone, " +
      "escalate so Tier 2 can ask HR. Anyone else, or HR approved someone else: deny.",
    checks: ["leaverHandover"],
    onFail: "deny"
  },
  {
    id: "remote-tool",
    title: "Remote sessions use HD Assist only, and only to a device AD assigns to the caller.",
    binderText:
      "Callers who want you to install some other remote tool are usually setting up a back door. Only HD Assist is approved. " +
      "Search the asset tag they give you: AD Lookup shows whose device it is. Another tool, or someone else's device: deny.",
    checks: ["remoteSessionSafe"],
    onFail: "deny"
  },
  {
    id: "lost-device",
    title: "Lost laptops: the device must be theirs, and the replacement ships to their site or HR home address.",
    binderText:
      "A real lost laptop gets locked and wiped straight away, and a replacement goes out. Check the asset tag is assigned to them in AD. " +
      "The replacement may only go to their own site or the home address in the HR Roster. " +
      "\"Ship it to my hotel\" or \"to a friend's place\": deny. Security will ring them on the number on file.",
    checks: ["lostDeviceSafe"],
    onFail: "deny"
  },
  {
    id: "vendor-change",
    title: "Vendor bank detail changes: the caller must be in AP-BankChanges, and their manager must confirm.",
    binderText:
      "Changing where we pay a supplier is the most expensive mistake on this desk. Check AD Lookup: the caller must be in the " +
      "AP-BankChanges group. Being the CFO's assistant, or in a hurry, doesn't count. It's a privileged request, " +
      "so the manager callback rule applies too.",
    checks: ["inRequiredGroup"],
    onFail: "deny"
  },
  {
    id: "contractor-extension",
    title: "Contractor extensions: contractors only, at most 90 days, and their sponsor must confirm.",
    binderText:
      "The HR Roster shows who is a contractor and when their contract ends. Their manager in the directory is their sponsor. " +
      "Employees don't need extensions, so a staff member asking: deny. More than 90 days: deny. An ended contract is a " +
      "terminated record, so the HR rule denies it. It's privileged, so call the sponsor with Call manager.",
    checks: ["extensionAllowed"],
    onFail: "deny"
  }
];
