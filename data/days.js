/* =============================================================================
 * DAYS: one entry per shift, in order.
 * -----------------------------------------------------------------------------
 * Day fields:
 *   day         number   1, 2, 3, ... Must be unique.
 *   title       string   Shown on the briefing ("Orientation").
 *   weekday     string   Flavour text for the memo header.
 *   briefing    string[] Paragraphs of the morning memo from your boss.
 *   addRules    string[] Rule ids (rules.js) that switch on today and stay on.
 *   removeRules string[] Optional. Rule ids that switch off from today.
 *   callers     string[] The call queue, in order, as caller ids from callers.js.
 *                        Callers still waiting at the end of the shift count as
 *                        missed. (Phase 3 adds { procedural: n } entries.)
 *   bossNotes            End-of-shift note from your boss. The first that applies:
 *     breach      string   you approved at least one attacker
 *     complaints  string   you wrongly denied or missed a genuine caller
 *     clean       string   neither
 * ========================================================================== */
export const DAYS = [
  {
    day: 1,
    title: "Orientation",
    weekday: "Monday",
    briefing: [
      "Welcome to the Service Desk. You're Tier 1 now, which means you're the first thing between " +
        "Halvorsen Dynamics and everyone on the internet who wants into it.",
      "Today's rule is simple. Before you touch anyone's account, look them up in AD and make sure " +
        "the name and employee ID they give you actually match. Real IDs look like HD-12345.",
      "The phones open at 9:00 and close at 17:00. Anyone still waiting at five is somebody else's " +
        "problem tomorrow, and they'll be grumpy about it. If you're not sure, Escalate. Tier 2 will grumble, " +
        "but grumbling is cheaper than a breach."
    ],
    addRules: ["identity-match"],
    callers: [
      "d1-priya-unlock", "d1-rick-reset", "d1-whitacre-reset", "d1-dale-install",
      "d1-tomasz-access", "d1-kevin-admin", "d1-carla-unlock", "d1-marcus-fake"
    ],
    bossNotes: {
      breach:
        "Security flagged a password reset you approved this morning. The real account owner never called. " +
        "We caught it, this time. Tomorrow, read the AD record letter by letter. - Bev",
      complaints:
        "A couple of real employees are telling everyone the new person hung up on them. " +
        "Being careful is good. Being careful with the wrong people is a ticket backlog. - Bev",
      clean:
        "Not bad for a first day. Somebody brought pastries and the coffee machine works again. " +
        "Tomorrow we start checking HR status too. Don't be late. - Bev"
    }
  },
  {
    day: 2,
    title: "People leave. Accounts don't.",
    weekday: "Tuesday",
    briefing: [
      "Bad news from Audit. HR has been terminating people, and nobody has been telling IT. " +
        "Some of those AD accounts are still switched on.",
      "From today, check the HR Roster as well as AD. If HR says terminated, deny, no matter how nice they are " +
        "or how well their account works. If they're on leave, escalate and let Tier 2 confirm with their manager.",
      "Also: yesterday's dodgy callers all used the same callback number. Whoever it is will try again. " +
        "The Ticket History and Caller ID tabs are there for a reason. - Bev"
    ],
    addRules: ["hr-active"],
    callers: [
      "d2-hannah-install", "d2-dale-again", "d2-nadia-reset", "d2-wendy-access", "d2-owen-leave",
      "d2-priya-software", "d2-gordon-vpn", "d2-felix-reset", "d2-imogen-fake", "d2-raj-unlock"
    ],
    bossNotes: {
      breach:
        "We just spent the afternoon disabling an account you handed back to someone we fired. " +
        "HR Roster. Every call. I'm not saying it again. - Bev",
      complaints:
        "Real employees were turned away today. A few of them found my desk in person. " +
        "Please let them reach you instead. - Bev",
      clean:
        "Clean day. Audit is happy, which has never happened before. I don't know how to feel. " +
        "More rules are coming tomorrow, and the phones get busier. - Bev"
    }
  }
];
