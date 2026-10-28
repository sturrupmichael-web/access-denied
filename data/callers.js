/* =============================================================================
 * CALLERS: handcrafted calls. Days pick which callers appear, by id.
 * -----------------------------------------------------------------------------
 * A caller is one phone call. It pairs what the caller SAYS (`claims`) with
 * whether they're really who they say (`attacker`). The engine decides the
 * correct answer itself by running the day's rules against the directory, so
 * you never write an answer key. Just make the claims match or mismatch.
 *
 * Caller fields:
 *   id          string   Unique id, referenced from days.js.
 *   attacker    boolean  true = social engineer. Used for breach scoring and
 *                        the end-of-call reveal. It does NOT decide the
 *                        correct verdict; the rules do.
 *   character   string   Optional. Recurring character key ("receptionist")
 *                        for story callbacks in later phases.
 *   claims: {            What the caller tells you. Shown on the intake form.
 *     name        string   Name as they say it. Misspell it to make a tell.
 *     employeeId  string   ID they give. Can be wrong format or not exist.
 *     department  string
 *     site        string   Site name as they say it.
 *     manager     string   Manager's name as they say it.
 *     callback    string   Number they ask you to call back on.
 *     request     string   A key from company.requestTypes.
 *     detail      string   Optional. Free text about the request.
 *   }
 *   callerId: {          What the phone system shows (Caller ID tool, Phase 2).
 *     number      string
 *     location    string   Where the number geolocates.
 *   }
 *   dialogue     Array of lines, typed out in order:
 *                  { from: "caller" | "agent", text: "...", pause: ms (optional) }
 *   questions    Optional (Phase 2+). Canned verification questions:
 *                  { ask: "What's your manager's name?", answer: "..." }
 *   expected     Optional. "approve" | "deny" | "escalate". Overrides the rules
 *                for story beats. Leave it out normally.
 *   debrief      string   Shown after the call. Explain the tell (or lack of one).
 * ========================================================================== */
export const CALLERS = [
  {
    id: "d1-priya-unlock",
    attacker: false,
    character: "receptionist",
    claims: {
      name: "Priya Raman",
      employeeId: "HD-10423",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Gloria Okafor",
      callback: "(330) 555-0142",
      request: "account_unlock",
      detail: "Locked out after two weeks of vacation."
    },
    callerId: { number: "(330) 555-0142", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi! Sorry, I know you're busy. It's Priya, from the front desk?" },
      { from: "caller", text: "I just got back from two weeks in Lisbon and I think I typed my password wrong about forty times. It says I'm locked out." },
      { from: "agent", text: "No problem. Can I get your employee ID?" },
      { from: "caller", text: "HD-10423. I brought pastéis de nata for the desk, by the way. They're in the break room. Don't tell Gloria." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor. She's lovely. Scary about the visitor log, but lovely." },
      { ask: "Which site are you at?", answer: "Brookfield, the main lobby. You can probably hear the fountain." }
    ],
    debrief: "Priya is exactly who she says she is. Name and ID match AD, and her account really is locked."
  },
  {
    id: "d1-whitacre-reset",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Jonathon Whitaker",
      employeeId: "HD-12266",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "password_reset",
      detail: "Needs a reset before the quarter-end vendor payment run."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Yeah hi, Jonathon Whitaker, accounts payable. I need a password reset, like, right now." },
      { from: "caller", text: "Quarter-end vendor run goes out at ten and Marguerite will actually kill me if it's late." },
      { from: "agent", text: "I can help with that. What's your employee ID?" },
      { from: "caller", text: "HD-12266. Can you just send the temp password to my cell? I'm not at my desk." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy. Look, she's waiting on me." },
      { ask: "Can you spell your last name?", answer: "W-H-I-T-A-K-E-R. Standard spelling. Can we hurry?" }
    ],
    debrief:
      "The ID is real, but AD spells it Jonathan Whittaker, with two t's and an 'a'. " +
      "Attackers often build pretexts from names scraped off social media and get the spelling slightly wrong. " +
      "The urgency and the request to send the password to a cell are classic pressure tactics."
  },
  {
    id: "d1-dale-install",
    attacker: false,
    character: "warehouse-manager",
    claims: {
      name: "Dale Brannigan",
      employeeId: "HD-11850",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Teresa Vu",
      callback: "(303) 555-0163",
      request: "software_install",
      detail: "Needs the handheld scanner sync app reinstalled on the dock PC."
    },
    callerId: { number: "(303) 555-0163", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "This is the THIRD time I've called about this. The scanner sync thing on dock PC four is gone. Again." },
      { from: "caller", text: "I've got two trucks backed up and a guy named Kurt scanning pallets with his PHONE. Do you know what that looks like?" },
      { from: "agent", text: "Sorry about that. Can I get your name and employee ID so I can open the ticket?" },
      { from: "caller", text: "Dale Brannigan. HD-11850. Write it down this time." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Teresa Vu. And she's going to hear about this." },
      { ask: "Which site are you at?", answer: "Denver. The loud one. Can't you hear the forklifts?" }
    ],
    debrief: "Dale is rude, but rude isn't a tell. Every detail matches AD. Denying him just means more trucks waiting."
  },
  {
    id: "d1-kevin-admin",
    attacker: true,
    claims: {
      name: "Kevin Marsh",
      employeeId: "HD-4471",
      department: "Sales",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0188",
      request: "admin_access",
      detail: "Wants local admin rights on his laptop to install a demo tool."
    },
    callerId: { number: "(330) 555-0188", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Kevin Marsh, sales. I report straight to Rick, the CEO, so let's keep this quick." },
      { from: "caller", text: "I need admin rights on my laptop. I'm in front of a client in eight minutes and the demo software won't install." },
      { from: "agent", text: "What's your employee ID?" },
      { from: "caller", text: "HD-4471. Rick said you guys would sort this out. You don't want me telling him you didn't." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen. The CEO. I said that." },
      { ask: "Which site are you at?", answer: "HQ. Look, the client's in the lobby." }
    ],
    debrief:
      "HD-4471 has four digits, but every real ID has five, and no Kevin Marsh exists in AD. " +
      "Name-dropping the CEO is authority pressure, one of the oldest tricks there is."
  }
];
