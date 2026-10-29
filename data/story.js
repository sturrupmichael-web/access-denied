/* =============================================================================
 * STORY: the inbox emails, and what the recurring threat actor can steal.
 * -----------------------------------------------------------------------------
 * Emails land in the inbox at the start of a shift (before Bev's briefing) or
 * at the end of one (before the summary). Recurring characters write about
 * how you treated them, and Security writes when the threat actor got
 * something out of you.
 *
 * Email fields:
 *   id       string   Unique.
 *   day      number   The day it arrives.
 *   at       "start" | "end"   Optional, default "end".
 *   from     string
 *   subject  string
 *   body     string   A blank line starts a new paragraph.
 *   if       Optional condition (below). Leave it out to always send it.
 *
 * CONDITIONS are used here, by caller `variants` (callers.js) and by the
 * final ending (endings.js). Every key listed must hold:
 *   approved: "caller-id"       you stamped that caller Approve (on any day)
 *   denied: "caller-id"         ... Deny
 *   escalated: "caller-id"      ... Escalate
 *   wronglyDenied: "caller-id"  you denied them and policy said approve
 *   answered: "caller-id"       you took the call at all
 *   leaked: "key"               the threat actor holds this leak (LEAKS below)
 *   notLeaked: "key"            ... doesn't
 *   leakedAny: true | false     the threat actor holds any leak at all
 *   today: { field: range }     the shift that just ended ("end" emails only).
 *                               Fields: handled, correct, escalated, breaches,
 *                               wrongfulDenials, missed, missedGenuine, csat
 *   week: { field: range }      the same fields added up over every finished
 *                               day (csat is the average)
 *   meters: { name: range }     breach, csat, patience right now
 *   any: [condition, ...]       at least one holds
 *   not: condition              it doesn't hold
 * A range is a number (exactly) or { atLeast: n } / { atMost: n } / both.
 * Example: { approved: "d1-dale-install", today: { breaches: 0 } }
 * ========================================================================== */

/* LEAKS: what the threat actor gets when you approve one of their calls. An
 * attacker caller lists the keys it hands over in `leaks`; later threat-actor
 * calls use `variants` with { if: { leaked: "key" } } to sound more convincing.
 * The text here appears in the endings ("{leaks}"). */
export const LEAKS = {
  "jon-mailbox": "Jonathan Whittaker's mailbox, with Marguerite's calendar and the Finance travel bookings",
  "vpn": "VPN access as Gordon Fitch, and the internal phone list",
  "approvers": "a seat in the payment approvers group",
  "payroll": "payroll approver rights",
  "ceo-mailbox": "Rick Halvorsen's mailbox"
};

export const EMAILS = [
  /* ---------- Day 1 ---------- */
  {
    id: "d1-priya-thanks",
    day: 1,
    from: "Priya Raman",
    subject: "THANK YOU",
    body:
      "You unlocked me so fast! I left a pastry on the Service Desk counter for you. It's the one with the little almond on top. " +
      "Don't let Raj take it, he already had two.\n\nPriya (front desk) :)",
    if: { approved: "d1-priya-unlock" }
  },
  {
    id: "d1-priya-sad",
    day: 1,
    from: "Priya Raman",
    subject: "no worries!!",
    body:
      "Hi! I don't think the system liked me today, haha. Gloria let me use her login for the visitor sign-in, " +
      "which I'm told I shouldn't mention to IT, so please forget I said that.\n\nI'll try again tomorrow! Priya :)",
    if: { any: [{ wronglyDenied: "d1-priya-unlock" }, { escalated: "d1-priya-unlock" }] }
  },
  {
    id: "d1-dale-happy",
    day: 1,
    from: "Dale Brannigan",
    subject: "RE: scanner app",
    body:
      "IT WORKS. FINALLY SOMEBODY IN IT WHO CAN DO THEIR JOB.\n\n" +
      "Don't let it go to your head. It'll be broken again by Wednesday. It's ALWAYS broken by Wednesday.\n\nDale",
    if: { approved: "d1-dale-install" }
  },
  {
    id: "d1-dale-angry",
    day: 1,
    from: "Dale Brannigan",
    subject: "WHAT WAS THAT",
    body:
      "I gave you my name. I gave you my ID. I gave you my MANAGER. You gave me NOTHING.\n\n" +
      "Dock PC four is still missing the scanner app, forty pallets are sitting there unscanned, " +
      "and I have printed your call reference number and taped it to the forklift so everybody knows who to thank.\n\nDale",
    if: { any: [{ denied: "d1-dale-install" }, { escalated: "d1-dale-install" }] }
  },
  {
    id: "d1-rick",
    day: 1,
    from: "Rick Halvorsen",
    subject: "(no subject)",
    body:
      "thx for the password. what was it again\n\nSent from my HDphone",
    if: { approved: "d1-rick-reset" }
  },
  {
    id: "d1-security-jon",
    day: 1,
    from: "Security Operations",
    subject: "Jonathan Whittaker's mailbox",
    body:
      "Someone logged into Jonathan Whittaker's mailbox at 09:47 using the password the Service Desk reset this morning. " +
      "The real Jonathan has been at his desk all day and never called.\n\n" +
      "Before we locked it, they set up a forwarding rule and read Finance mail for about an hour: Marguerite's calendar, " +
      "the vendor list, and the Finance travel bookings. Assume the caller knows all of that now, and will use it.",
    if: { leaked: "jon-mailbox" }
  },
  {
    id: "d1-raj",
    day: 1,
    from: "Raj Patel (Tier 2)",
    subject: "Escalations",
    body:
      "Hi! Raj from Tier 2. I've noticed a lot of tickets coming up from you today. That's fine. " +
      "That's what we're here for. I just want you to know that I've counted them, and I've made a chart.",
    if: { today: { escalated: { atLeast: 3 } } }
  },
  {
    id: "d1-facilities",
    day: 1,
    from: "Gloria Okafor (Facilities)",
    subject: "ALL STAFF: Third floor microwave",
    body:
      "To whoever reheated fish in the third floor microwave at 12:10 today: we know it was a Tuesday kind of fish, " +
      "and it is Monday. Please stop.\n\nFacilities",
  },

  /* ---------- Day 2 ---------- */
  {
    id: "d2-hr-badges",
    day: 2,
    at: "start",
    from: "HR Operations",
    subject: "Reminder: offboarding",
    body:
      "A friendly reminder to all managers: when someone leaves, please tell HR, return their badge, and tell IT. " +
      "In that order. Or any order. Please just tell someone.",
  },
  {
    id: "d2-security-vpn",
    day: 2,
    from: "Security Operations",
    subject: "Terminated account back on the VPN",
    body:
      "Gordon Fitch left the company on 20 October. This afternoon his VPN account was switched back on through the Service Desk, " +
      "and it was used to download the internal phone list. Every desk number at Halvorsen Dynamics is now out there.\n\n" +
      "Expect calls that show a real desk number on Caller ID. Caller ID can be faked.",
    if: { leaked: "vpn" }
  },
  {
    id: "d2-dale-kurt",
    day: 2,
    from: "Dale Brannigan",
    subject: "UPDATE",
    body:
      "Scanner app is back. Thank you. I asked Kurt if he's been uninstalling it. Kurt says no. " +
      "Kurt said it too fast. I'm watching Kurt.\n\nDale",
    if: { approved: "d2-dale-again" }
  },
  {
    id: "d2-owen",
    day: 2,
    from: "Owen Pritchard",
    subject: "Thanks for not just switching it on",
    body:
      "Tier 2 rang my manager and sorted my access in about ten minutes. I'm honestly glad you didn't just flip it back on " +
      "for anyone who said they were me. Baby is great, by the way. Nobody here is sleeping.\n\nOwen",
    if: { escalated: "d2-owen-leave" }
  },
  {
    id: "d2-raj",
    day: 2,
    from: "Raj Patel (Tier 2)",
    subject: "A small request",
    body:
      "The Escalate button is not a coin toss. When policy has a clear answer, please give the answer. " +
      "My chart now has a second page.",
    if: { today: { escalated: { atLeast: 4 } } }
  },
  {
    id: "d2-priya",
    day: 2,
    from: "Priya Raman",
    subject: "badges!!",
    body:
      "The badge printer is printing again! I'll miss the hand-drawn ones a little. " +
      "One visitor asked to keep his. I drew him a very good moustache.\n\nPriya :)",
    if: { approved: "d2-priya-software" }
  },

  /* ---------- Day 3 ---------- */
  {
    id: "d3-security-approvers",
    day: 3,
    from: "Security Operations",
    subject: "Payment approvers group",
    body:
      "At 14:20 a Service Desk ticket added \"Jonathan Whittaker\" to the payment approvers group. " +
      "Twenty minutes later two payments of $48,000 were queued to \"Halvorsen Dynamic Solutions LLC\", a company that does not exist. " +
      "Treasury stopped them with four minutes to spare.\n\nWe've removed the access. Please stop giving it out.",
    if: { leaked: "approvers" }
  },
  {
    id: "d3-felix",
    day: 3,
    from: "Felix Ambrose",
    subject: "From a hotel lobby in New York",
    body:
      "Thanks for getting me back in. I know the number looked odd. The client meeting went well, " +
      "and I only cried a little at the price of coffee here.\n\nFelix",
    if: { approved: "d3-felix-travel" }
  },
  {
    id: "d3-gloria",
    day: 3,
    from: "Gloria Okafor (Facilities)",
    subject: "Someone pretended to be me?",
    body:
      "Security tells me somebody called the desk this morning pretending to be me, from Manila. " +
      "I've never been to Manila. I'd like to go. Thank you for not giving them my account.\n\nGloria",
    if: { denied: "d3-gloria-fake" }
  },
  {
    id: "d3-gloria-breach",
    day: 3,
    from: "Gloria Okafor (Facilities)",
    subject: "My account",
    body:
      "Apparently I called you from Manila this morning and you gave me the badge export screen. I was in the boiler room all morning. " +
      "The boiler can confirm. Somebody now has a list of everyone who can get into this building.\n\nGloria",
    if: { approved: "d3-gloria-fake" }
  },

  /* ---------- Day 4 ---------- */
  {
    id: "d4-security-morning",
    day: 4,
    at: "start",
    from: "Security Operations",
    subject: "The 0199 caller",
    body:
      "Quick summary for the desk. Since Monday, someone has called as at least four different Finance employees. " +
      "They always want a callback on (330) 555-0199, and every call is better researched than the last.\n\n" +
      "They will go after admin rights today. If something feels off, it is off.",
  },
  {
    id: "d4-security-payroll",
    day: 4,
    from: "Security Operations",
    subject: "Payroll changes",
    body:
      "Using the payroll approver rights granted through the Service Desk today, someone changed the direct deposit details " +
      "for four executives, including Rick. Payroll caught it on the pre-run report.\n\n" +
      "Rick was not upset. Rick did not know he had a direct deposit.",
    if: { leaked: "payroll" }
  },
  {
    id: "d4-aisha",
    day: 4,
    from: "Aisha Karimi",
    subject: "Admin rights",
    body:
      "Got them, thanks. And thank you for actually ringing Rick. It took him four minutes to find the button to answer, " +
      "but it's the first time anyone has checked before giving me anything, and I build the security tooling here.\n\nAisha",
    if: { approved: "d4-aisha-admin" }
  },
  {
    id: "d4-rick",
    day: 4,
    from: "Rick Halvorsen",
    subject: "quick q",
    body:
      "someone from IT called me today and asked if Aisha could have admin. I said yes. is that right? who is Aisha's manager. is it me\n\n" +
      "Sent from my HDphone",
    if: { answered: "d4-aisha-admin" }
  },
  {
    id: "d4-imogen",
    day: 4,
    from: "Imogen Castellanos",
    subject: "Cheers from Leeds",
    body:
      "Tier 2 got hold of my manager in the end. Bit of a palaver, but I'd rather that than the alternative. " +
      "Biscuits are in the post. They will arrive broken. They always do.\n\nImogen",
    if: { escalated: "d4-imogen-admin" }
  },

  /* ---------- Day 5 ---------- */
  {
    id: "d5-rick-morning",
    day: 5,
    at: "start",
    from: "Rick Halvorsen",
    subject: "what is MFA",
    body:
      "Bev says I have to approve a push on my phone now when I forget my password. what is a push. " +
      "my nephew says it's like a text but angrier\n\nSent from my HDphone",
  },
  {
    id: "d5-dale-kurt",
    day: 5,
    from: "Dale Brannigan",
    subject: "JUSTICE",
    body:
      "Dock PC four is locked down. Carla has admin. Kurt has been reassigned to counting pallets by hand, " +
      "which he says is \"not a real punishment\", and which he is doing very slowly.\n\n" +
      "You're alright. Don't tell anyone I said that.\n\nDale",
    if: { approved: "d5-carla-admin" }
  },
  {
    id: "d5-priya",
    day: 5,
    from: "Priya Raman",
    subject: "Friday cookies!",
    body:
      "I made cookies for the whole Service Desk because you were all so nice to me this week. " +
      "The ones shaped like padlocks are for you, because of all the security! I worked very hard on the keyholes.\n\nPriya :)",
    if: { not: { any: [{ wronglyDenied: "d1-priya-unlock" }, { wronglyDenied: "d5-priya-reset" }] } }
  },
  {
    id: "d5-phish",
    day: 5,
    from: "IT Support <helpdesk@halvorsen-dynamlcs.com>",
    subject: "Your account will be suspended",
    body:
      "Dear Valued Employee,\n\nWe have notice that you are very good at you're job. Unfortunately this means your account " +
      "will be suspended in 24 hour. To keep you're account, reply with your password and you're employee ID.\n\n" +
      "Regards, Real IT Department (not a scam)",
    if: { week: { breaches: 0 } }
  },
  {
    id: "d5-security-phish",
    day: 5,
    from: "Security Operations",
    subject: "RE: Your account will be suspended",
    body:
      "Don't click it. Look at the address: \"dynamlcs\", with an L. That's our 0199 friend. They couldn't get through you by phone all week, " +
      "so now they're trying email.\n\nWe've taken that as a compliment on your behalf.",
    if: { week: { breaches: 0 } }
  },
  {
    id: "d5-security-ceo",
    day: 5,
    from: "Security Operations",
    subject: "Rick's mailbox",
    body:
      "The real Rick has been on the phone to us all afternoon. Somebody with his new password read his email for two hours " +
      "and sent the board a very convincing message about an \"urgent acquisition\". Legal is involved. Bev is involved. Everyone is involved.",
    if: { leaked: "ceo-mailbox" }
  }
];
