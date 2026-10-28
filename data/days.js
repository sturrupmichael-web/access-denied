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
 *   callers     Array    The call queue, in order. Each entry is a caller id
 *                        from callers.js. (Phase 3 adds { procedural: n } to
 *                        mix in n random callers.)
 *   bossNote    string   End-of-shift note from your boss.
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
      "If you're not sure, Escalate. Tier 2 will grumble, but grumbling is cheaper than a breach."
    ],
    addRules: ["identity-match"],
    callers: ["d1-priya-unlock", "d1-whitacre-reset", "d1-dale-install", "d1-kevin-admin"],
    bossNote:
      "Not bad for a first day. Somebody brought pastries, and the coffee machine works again. " +
      "Tomorrow we start checking HR status too. Don't be late. - Bev"
  }
];
