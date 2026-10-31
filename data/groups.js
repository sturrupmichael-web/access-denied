/* =============================================================================
 * GROUPS: shared mailboxes and distribution lists (the Groups tab).
 * -----------------------------------------------------------------------------
 * From Day 7 (rule "group-owner"), anyone asking to join one of these needs
 * the owner's OK, unless it's open. Callers name a group in `claims.group`.
 *
 * Group fields:
 *   name        string   Exactly as Exchange spells it. Callers must use this name.
 *   kind        "mailbox" | "list"
 *   owner       string   Employee id of the owner (directory.js). "Call group
 *                        owner" rings this person.
 *   restricted  boolean  true = the owner must approve every new member.
 *                        false = open to anyone in the company.
 *   about       string   One line shown in the Groups tab.
 * ========================================================================== */
export const GROUPS = [
  // ---- Restricted: the owner says yes or no -----------------------------------
  { name: "Finance-Payroll", kind: "mailbox", owner: "HD-10540", restricted: true, about: "Payroll runs, salary changes, everyone's bank details. Guarded like a dragon's hoard." },
  { name: "AP-Invoices", kind: "mailbox", owner: "HD-10540", restricted: true, about: "Supplier invoices and remittances." },
  { name: "Exec-Office", kind: "mailbox", owner: "HD-10002", restricted: true, about: "The CEO's office. Mostly calendar invites and golf." },
  { name: "HR-Confidential", kind: "mailbox", owner: "HD-12230", restricted: true, about: "Offers, disciplinaries, leavers. Do not forward. Do not even look at it funny." },
  { name: "Sales-EMEA-Pipeline", kind: "mailbox", owner: "HD-10688", restricted: true, about: "EMEA deal desk. Pricing and contracts." },
  { name: "ENG-Oncall", kind: "list", owner: "HD-10950", restricted: true, about: "Pager alerts for production systems. Joining means 3am phone calls." },
  { name: "WMS-Alerts", kind: "list", owner: "HD-10311", restricted: true, about: "Warehouse system alerts for Denver." },
  { name: "IT-Changes", kind: "list", owner: "HD-12890", restricted: true, about: "Change approvals for IT systems." },
  { name: "Security-Incidents", kind: "mailbox", owner: "HD-12950", restricted: true, about: "Live incident traffic. Attackers would love a copy." },

  // ---- Open: anyone in the company can join -----------------------------------
  { name: "Facilities-Requests", kind: "mailbox", owner: "HD-10077", restricted: false, about: "Broken chairs, cold offices, the haunted printer." },
  { name: "BRK-Social", kind: "list", owner: "HD-10423", restricted: false, about: "Brookfield socials and cake alerts. Very high traffic on Fridays." },
  { name: "Denver-Dock", kind: "list", owner: "HD-11850", restricted: false, about: "Dock schedules. Dale writes these in capitals." },
  { name: "Leeds-Office", kind: "list", owner: "HD-10688", restricted: false, about: "Leeds office news, fire drills and the biscuit rota." },
  { name: "All-Hands", kind: "list", owner: "HD-12890", restricted: false, about: "Company-wide announcements." },
  { name: "Fantasy-Football", kind: "list", owner: "HD-12588", restricted: false, about: "Carla is winning. Carla is always winning." },
  { name: "ENG-Lunch-and-Learn", kind: "list", owner: "HD-10950", restricted: false, about: "Talks on Thursdays. Free pizza, mandatory questions." }
];
