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
  "ceo-mailbox": "Rick Halvorsen's mailbox",
  "marguerite-mfa": "Marguerite Dunleavy's MFA, moved onto their phone",
  "staff-details": "Marguerite's mobile number and travel calendar",
  "gordon-mailbox": "Gordon Fitch's mailbox, with every supplier we pay",
  "incident-mailbox": "a copy of Security's incident mailbox",
  "remote-foothold": "a remote-control tool on an engineering laptop",
  "laptop": "a brand-new company laptop, delivered to a hotel",
  "vendor-bank": "Kessler Steel's bank details, pointed at their account",
  "contractor-vpn": "a forgotten contractor's VPN account, extended for 90 days",
  "payment-run": "a $2.4 million payment to Kessler Steel, redirected"
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
  },
  /* ---------- Day 6 ---------- */
  {
    id: "d6-week-two",
    day: 6,
    at: "start",
    from: "Raj Patel",
    subject: "week two!!",
    body:
      "Welcome back. Bev says you're staying for the second week of probation, which means you get the weird calls now. " +
      "The weird calls are my favourite. You'll see two new buttons on Line 1 this week, and a Groups tab on Thursday's... no, Tuesday's... " +
      "on a day this week. I've lost track of days. I've been on call.\n\nRaj (Tier 2)"
  },
  {
    id: "d6-priya",
    day: 6,
    from: "Priya Raman",
    subject: "new phone works!!",
    body:
      "The authenticator is on my new phone and my nephew says I'm 'basically a hacker now'. I have changed my lock screen to a picture of the cinnamon buns. " +
      "Thank you!\n\nPriya",
    if: { approved: "d6-priya-mfa" }
  },
  {
    id: "d6-security-mfa",
    day: 6,
    from: "Security Operations",
    subject: "Marguerite's MFA",
    body:
      "The authenticator you moved this morning wasn't Marguerite's new phone. It was the 0199 caller's. They now get her MFA prompts, " +
      "and she gets nothing. We've reset it, but we can't un-know that they had it.\n\nThis is what \"Call desk phone\" is for.",
    if: { leaked: "marguerite-mfa" }
  },
  {
    id: "d6-security-readback",
    day: 6,
    from: "Yusuf Adebayo",
    subject: "Mei didn't call you",
    body:
      "Mei has been at her desk all day, which I know because she sits opposite me and eats very loud apples. " +
      "Whoever you read Marguerite's mobile and calendar to, it wasn't her. Real Security staff call from their desks. All of us. Even me.\n\nYusuf",
    if: { leaked: "staff-details" }
  },
  /* ---------- Day 7 ---------- */
  {
    id: "d7-groups-tab",
    day: 7,
    at: "start",
    from: "IT Change Board",
    subject: "New in Desk Tools: Groups",
    body:
      "From today, Desk Tools has a Groups tab listing every shared mailbox and distribution list, who owns it, and whether it's open or restricted. " +
      "Please stop guessing who owns Finance-Payroll. It has always been Marguerite. It will always be Marguerite."
  },
  {
    id: "d7-dale",
    day: 7,
    from: "Dale Brannigan",
    subject: "SCHEDULES",
    body: "Got Kurt's pick schedules. They were in a folder called NOT SCHEDULES. That tells you everything about Kurt.\n\nThank you.\n\nDale",
    if: { approved: "d7-dale-kurt" }
  },
  {
    id: "d7-security-gordon",
    day: 7,
    from: "Security Operations",
    subject: "Gordon Fitch's mailbox",
    body:
      "Gordon's account was reopened for \"an hour\" this afternoon. In that hour someone exported his entire supplier list. " +
      "HR had already handed his mailbox to Marguerite, and it says so on the HR Roster. Leavers stay left.",
    if: { leaked: "gordon-mailbox" }
  },
  {
    id: "d7-security-incidents",
    day: 7,
    from: "Yusuf Adebayo",
    subject: "who is reading my mailbox",
    body:
      "Someone added \"Raj\" to Security-Incidents today. Raj didn't ask. I own that mailbox, and nobody called me. " +
      "The 0199 caller has now read our notes about the 0199 caller. They know what we know. That's bad.\n\nYusuf",
    if: { leaked: "incident-mailbox" }
  },
  /* ---------- Day 8 ---------- */
  {
    id: "d8-felix",
    day: 8,
    from: "Felix Ambrose",
    subject: "Taxi update",
    body:
      "The taxi company found my laptop. It had been wiped, which they found very confusing. The new one was waiting at my desk in Leeds. " +
      "I've attached a photo of me holding it. I have not attached the photo. I'm in a hurry.\n\nFelix",
    if: { approved: "d8-felix-laptop" }
  },
  {
    id: "d8-security-remote",
    day: 8,
    from: "Security Operations",
    subject: "QuickSupportPro",
    body:
      "Tomasz's laptop has a remote tool on it called QuickSupportPro, and someone in Akron was connected to it for forty minutes. " +
      "Tomasz never called. We've reimaged the laptop and Tomasz now has trust issues. HD Assist is the only remote tool. The only one.",
    if: { leaked: "remote-foothold" }
  },
  {
    id: "d8-security-laptop",
    day: 8,
    from: "Asset Management",
    subject: "Laptop shipped to a hotel",
    body:
      "A new laptop went to Room 312 at the Airport Lodge this afternoon. The real Hannah Liu was at her desk, holding her old laptop, " +
      "which was never stolen. Replacements go to the site or the HR address. We'd like our laptop back.",
    if: { leaked: "laptop" }
  },
  /* ---------- Day 9 ---------- */
  {
    id: "d9-marguerite",
    day: 9,
    from: "Marguerite Dunleavy",
    subject: "Thank you",
    body: "You called me before changing Teesdale's details. Nobody calls me. I want you to know that I noticed.\n\nMarguerite",
    if: { approved: "d9-oksana-vendor" }
  },
  {
    id: "d9-security-vendor",
    day: 9,
    from: "Marguerite Dunleavy",
    subject: "Kessler Steel",
    body:
      "Kessler Steel's bank details were changed today on the word of someone claiming to be Kyle, for a CFO we don't have. " +
      "This afternoon's run paid them. It did not pay Kessler Steel. Kyle isn't in AP-BankChanges. Kyle can't even work the franking machine.\n\nMarguerite",
    if: { leaked: "vendor-bank" }
  },
  {
    id: "d9-security-lucia",
    day: 9,
    from: "Security Operations",
    subject: "Lucia Marchetti",
    body:
      "Lucia's contract ended in August. Her VPN account didn't, and as of today it's good for another ninety days, for whoever has the password. " +
      "We've shut it. The HR Roster said \"Contract ended\". Ended means ended.",
    if: { leaked: "contractor-vpn" }
  },
  {
    id: "d9-sven",
    day: 9,
    from: "Sven Olafsson",
    subject: "tusen takk",
    body: "My account lives! I have brought more cardamom buns. I have hidden two for you behind the monitor on desk 14. Tell no engineer.\n\nSven",
    if: { approved: "d9-sven-extension" }
  },
  /* ---------- Day 10 ---------- */
  {
    id: "d10-morning",
    day: 10,
    at: "start",
    from: "Bev Kowalczyk",
    subject: "Last day",
    body:
      "Last day of probation. Whatever happens, you've lasted longer than the last three people in that chair. One of them left for a llama farm. " +
      "Don't leave for a llama farm.\n\nBev"
  }
];
