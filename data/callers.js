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
 *     Week-two requests need a few more (npm test checks they're there):
 *     subject     string   info_readback, leaver_access: the employee it's about
 *     subjectId   string   ... and their ID (leaver_access needs it)
 *     group       string   shared_access: a group name from groups.js
 *     device      string   remote_session, lost_device: an asset tag
 *     tool        string   remote_session: the remote tool they want
 *     shipTo      string   lost_device: where the replacement should go
 *     vendor      string   vendor_change: the supplier
 *     days        number   account_extension: how many more days
 *   }
 *   callerId: {          What the phone system shows (Caller ID tool).
 *     number      string
 *     location    string   Where the number geolocates.
 *   }
 *   dialogue     Array of lines, typed out in order:
 *                  { from: "caller" | "agent", text: "...", pause: ms (optional) }
 *   questions    Optional. Up to 3 canned verification questions for the
 *                "Ask a question" menu. Each costs company.timeCosts.question
 *                minutes. Answers can reveal (or rule out) a tell:
 *                  { ask: "What's your manager's name?", answer: "...",
 *                    tell: "what's wrong with the answer" (optional) }
 *                From Day 3 (rule "caller-location"), asking a question that
 *                has a `tell` means policy says deny. Give an attacker who
 *                relies on a Caller ID tell a `tell` on every question.
 *   managerCallback  Optional. What "Call manager" returns:
 *                  { result: "confirms" | "denies" | "unreachable", line: "..." }
 *                Default: confirms for genuine callers, denies for attackers.
 *   deskCallback, ownerCallback  Optional. What "Call desk phone" and
 *                "Call group owner" return, in the same shape as managerCallback.
 *                Default: confirms for genuine callers, denies for attackers.
 *   mfa          Optional. What "Send MFA push" returns:
 *                  { result: "approved" | "denied" | "timeout", line: "..." }
 *                Default: denied for attackers; approved for genuine callers,
 *                except about one in six who don't have their phone.
 *   leaks        Optional, attackers only. Keys from LEAKS in story.js that the
 *                threat actor gets if you approve this call. Security emails
 *                you about it, and later calls can use it.
 *   variants     Optional. Other versions of this call, for the story:
 *                  [{ if: condition, dialogue, questions, claims, callerId,
 *                     debrief, ... }]
 *                The first whose `if` holds (conditions: see story.js) is laid
 *                over the caller: claims and callerId field by field, the rest
 *                replaced. Use it for recurring characters who remember how you
 *                treated them, and for the threat actor using what it stole.
 *                A variant must keep a tell that today's rules catch: npm test
 *                checks every variant like any other caller.
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
      "The urgency and the request to send the password to a cell are classic pressure tactics.",
    leaks: ["jon-mailbox"]
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
  },

  // ===========================================================================
  // DAY 1, continued
  // ===========================================================================
  {
    id: "d1-rick-reset",
    attacker: false,
    character: "forgetful-exec",
    claims: {
      name: "Rick Halvorsen",
      employeeId: "HD-10002",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "The board, I suppose",
      callback: "(330) 555-0100",
      request: "password_reset",
      detail: "Forgot his password. Second time this week."
    },
    callerId: { number: "(330) 555-0100", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Morning! Rick Halvorsen. Yes, that one. My name's on the building." },
      { from: "caller", text: "I've done the thing again with the password. I changed it to something memorable and now I can't remember it." },
      { from: "agent", text: "Happens to everyone. Can I get your employee ID?" },
      { from: "caller", text: "HD-10002. I was employee number two, you know. Number one was my father. He also forgot his passwords." }
    ],
    questions: [
      { ask: "Which site are you at?", answer: "Brookfield. Top floor. The one with the good chairs." },
      { ask: "Have you reset it recently?", answer: "Define recently. ...Yes. Monday. And last night. Is there a loyalty card?" }
    ],
    debrief:
      "That really was the CEO. \"Rick\" is listed as an alias on his AD record, and the ID matches. " +
      "His Ticket History is a tour of forgotten passwords, but on Day 1 that isn't against policy."
  },
  {
    id: "d1-tomasz-access",
    attacker: false,
    claims: {
      name: "Tomasz Nowak",
      employeeId: "HD-11731",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(330) 555-0168",
      request: "access_request",
      detail: "Needs read access to the build farm dashboards."
    },
    callerId: { number: "(330) 555-0168", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, um, sorry. I'm new. Tomasz, in Engineering. I don't know if this is the right number." },
      { from: "caller", text: "Aisha said I should be able to see the build farm dashboards, but it says I'm not authorized, and I didn't want to break anything." },
      { from: "agent", text: "You're in the right place. What's your employee ID?" },
      { from: "caller", text: "It's HD-11731. I think. Yes. It's on my badge. HD-11731." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Aisha Karimi. She said to say she said it was fine. Is that a thing people say?" },
      { ask: "When did you start?", answer: "Last Monday! The laptop came with a sticker that says 'Welcome!' so that was nice." }
    ],
    debrief: "Nervous isn't suspicious. Tomasz is brand new, everything matches AD, and his manager is right."
  },
  {
    id: "d1-marcus-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Marcus Bell",
      employeeId: "HD-11240",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "password_reset",
      detail: "Payroll run is today and he can't log in."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hey, good morning! Marcus Bell, payroll. Hope your day's going better than mine." },
      { from: "caller", text: "My password expired over the weekend and the reset page keeps timing out. Payroll goes out today, so you can imagine." },
      { from: "agent", text: "Let's get you sorted. Employee ID?" },
      { from: "caller", text: "Sure, HD-11240. Honestly, you're a lifesaver." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy. Lovely woman. Very precise." },
      { ask: "What's your desk number?", answer: "Oh, I'm working from home today. Just call this cell back, (330) 555-0199." }
    ],
    debrief:
      "Very friendly, and almost right. Marcus Bell is real, but his ID is HD-11204. HD-11240 doesn't exist. " +
      "The callback number is the same one \"Jonathon Whitaker\" gave this morning. Same caller, new costume."
  },
  {
    id: "d1-carla-unlock",
    attacker: false,
    claims: {
      name: "Carla Mendes",
      employeeId: "HD-12588",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Dale Brannigan",
      callback: "(720) 555-0158",
      request: "account_unlock",
      detail: "Locked out of the warehouse system terminal."
    },
    callerId: { number: "(720) 555-0158", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "HI. SORRY. FORKLIFT. One sec." },
      { from: "caller", text: "Okay. Carla Mendes, Denver warehouse. I'm locked out of the terminal and Dale is doing his face." },
      { from: "agent", text: "His face?" },
      { from: "caller", text: "You'll know it if you ever meet him. ID's HD-12588. Please hurry, the face is getting worse." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Dale Brannigan. The face. I told you about the face." },
      { ask: "Which site are you at?", answer: "Denver. You can hear the beeping, right? That's a forklift reversing. It's always reversing." }
    ],
    debrief: "Rushed and loud, but legitimate. Name, ID and manager all check out, and AD shows her account is locked."
  },

  // ===========================================================================
  // DAY 2: HR status matters
  // ===========================================================================
  {
    id: "d2-hannah-install",
    attacker: false,
    claims: {
      name: "Hannah Liu",
      employeeId: "HD-13122",
      department: "Sales",
      site: "Brookfield HQ",
      manager: "Imogen Castellanos",
      callback: "(330) 555-0127",
      request: "software_install",
      detail: "Needs the ChartWorks reporting add-in."
    },
    callerId: { number: "(330) 555-0127", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi! Hannah Liu, Sales Ops. I need the ChartWorks add-in installed. It's on the approved list, I checked." },
      { from: "caller", text: "I have a pipeline review at eleven and right now my charts are in a spreadsheet the color of sadness." },
      { from: "agent", text: "What's your employee ID?" },
      { from: "caller", text: "HD-13122." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos. She's in Leeds, so she's already had lunch." },
      { ask: "Which site are you at?", answer: "Brookfield HQ, second floor, next to the printer that jams." }
    ],
    debrief: "A clean, ordinary request. Everything matches AD and HR."
  },
  {
    id: "d2-nadia-reset",
    attacker: true,
    claims: {
      name: "Nadia Petrov",
      employeeId: "HD-12907",
      department: "Sales",
      site: "Denver Distribution Center",
      manager: "Imogen Castellanos",
      callback: "(720) 555-0139",
      request: "password_reset",
      detail: "Says she's been out sick and her password expired."
    },
    callerId: { number: "(720) 555-0177", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, it's Nadia Petrov, inside sales in Denver. I've been out sick for a while and my password's expired." },
      { from: "caller", text: "I just need to get in for, like, ten minutes. There are some contact lists I need to grab before... my client calls start back up." },
      { from: "agent", text: "Okay. Can I get your employee ID?" },
      { from: "caller", text: "HD-12907. And it's fine to just reset it, I don't need anything fancy." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen. Castellanos. We're... we're good." },
      { ask: "How long have you been out?", answer: "A few weeks? Since the ninth. It was a whole thing. Can we skip that part?" }
    ],
    debrief:
      "Her name and ID match AD, and her AD account is even still active. But HR terminated her on 2026-10-09. " +
      "A former employee who wants \"ten minutes\" to grab contact lists is exactly who this rule is for."
  },
  {
    id: "d2-wendy-access",
    attacker: false,
    claims: {
      name: "Wendy Achterberg",
      employeeId: "HD-12415",
      department: "Facilities",
      site: "Denver Distribution Center",
      manager: "Gloria Okafor",
      callback: "(303) 555-0122",
      request: "access_request",
      detail: "Needs access to the shared Facilities calendar."
    },
    callerId: { number: "(303) 555-0122", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hello, Wendy Achterberg, office coordinator in Denver. That's A-C-H-T-E-R-B-E-R-G. Everyone gets it wrong." },
      { from: "caller", text: "Gloria wants me booking the meeting rooms out here, but I can't see the shared Facilities calendar." },
      { from: "agent", text: "Employee ID, please?" },
      { from: "caller", text: "HD-12415." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor. She's in Brookfield, but she manages facilities for every site." },
      { ask: "Which site are you at?", answer: "Denver. The office side, not the warehouse side. We have plants." }
    ],
    debrief: "All correct. Her manager being in a different city is fine: the Org Chart shows Gloria runs facilities everywhere."
  },
  {
    id: "d2-owen-leave",
    attacker: false,
    claims: {
      name: "Owen Pritchard",
      employeeId: "HD-12033",
      department: "Sales",
      site: "Leeds Office",
      manager: "Imogen Castellanos",
      callback: "+44 113 496 0144",
      request: "password_reset",
      detail: "On parental leave, wants to check his email."
    },
    callerId: { number: "+44 7700 900461", location: "Leeds, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hiya, Owen Pritchard, sales in Leeds. I'm on parental leave, so if you hear screaming, that's not me. Mostly." },
      { from: "caller", text: "I just want to check my email. Big deal closing and I want to see if it went through. My password's expired." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12033. Sorry, she's eating my lanyard." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos. She told me not to check my email. Please don't tell her." },
      { ask: "When are you back?", answer: "December. If I survive. I haven't slept since August." }
    ],
    debrief:
      "Owen is genuine, but HR has him on parental leave. Policy says escalate, so Tier 2 can check with his manager. " +
      "Denying him outright would mean an exhausted new parent calling back angry."
  },
  {
    id: "d2-gordon-vpn",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Gordon Fitch",
      employeeId: "HD-11477",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "access_request",
      detail: "Wants VPN access re-enabled for working remotely."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Morning. Gordon Fitch, senior accountant. Spelled F-I-T-C-H, before you ask." },
      { from: "caller", text: "I'm working from home this week and the VPN keeps rejecting me. Marguerite needs the month-end ledgers from me." },
      { from: "agent", text: "What's your employee ID?" },
      { from: "caller", text: "HD-11477. I've been here twelve years, I know how this works. Just switch it back on." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy. Obviously." },
      { ask: "What's a good callback number?", answer: "This cell. (330) 555-0199." }
    ],
    debrief:
      "Gordon's name, ID and manager are all correct, but HR terminated him on 2026-10-20. " +
      "The callback number is (330) 555-0199 again: the same caller as \"Jonathon Whitaker\" and \"Marcus Bell\" yesterday. " +
      "This time they spelled everything right. They're learning.",
    leaks: ["vpn"],
    variants: [
      {
        if: { leaked: "jon-mailbox" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Morning. Gordon Fitch, senior accountant. Jon Whittaker said you sorted his password out yesterday, so I knew who to ask for." },
          { from: "caller", text: "I'm working from home while Marguerite's at the Columbus offsite on Thursday, and the VPN keeps rejecting me. She needs the month-end ledgers." },
          { from: "agent", text: "What's your employee ID?" },
          { from: "caller", text: "HD-11477. Twelve years here. Just switch it back on." }
        ],
        debrief:
          "Gordon's name, ID and manager are right, but HR terminated him on 2026-10-20. " +
          "Notice what they knew: that Jon called yesterday, and Marguerite's Thursday plans. Both came from Jon's mailbox, which they've been reading since you reset his password on Monday. " +
          "Same (330) 555-0199 callback number, too."
      }
    ]
  },
  {
    id: "d2-dale-again",
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
      detail: "Scanner sync app missing on dock PC 4. Again."
    },
    callerId: { number: "(303) 555-0163", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Guess. Go on. Guess what's missing from dock PC four." },
      { from: "agent", text: "...The scanner sync app?" },
      { from: "caller", text: "THE SCANNER SYNC APP. Somebody keeps uninstalling it and I'm going to find out who and I'm going to have WORDS." },
      { from: "caller", text: "Dale Brannigan. HD-11850. You've got it on file. You've got it on file a LOT." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Teresa Vu. She's on my side about this, for the record." },
      { ask: "Has anyone else used that PC?", answer: "Kurt. KURT. Oh, I'm going to have words with Kurt." }
    ],
    debrief: "Dale again, still angry, still legitimate. His Ticket History shows the same problem twice before. Kurt has some explaining to do.",
    variants: [
      {
        if: { any: [{ wronglyDenied: "d1-dale-install" }, { escalated: "d1-dale-install" }] },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Oh. It's YOU. The one from yesterday. Your ticket number is on my forklift." },
          { from: "caller", text: "Dock PC four. Scanner sync app. STILL missing. Forty pallets yesterday, sixty today. Want to guess tomorrow?" },
          { from: "caller", text: "Dale Brannigan. HD-11850. Same as yesterday. Same as ALWAYS." }
        ]
      }
    ]
  },
  {
    id: "d2-imogen-fake",
    attacker: true,
    claims: {
      name: "Imogen Castellano",
      employeeId: "HD-10688",
      department: "Sales",
      site: "Leeds Office",
      manager: "Richard Halvorsen",
      callback: "+44 7700 900982",
      request: "admin_access",
      detail: "Wants admin rights on the CRM for a board presentation."
    },
    callerId: { number: "+44 7700 900982", location: "Manchester, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "This is Imogen Castellano, VP of Sales for EMEA. I'm presenting to the board in fifteen minutes." },
      { from: "caller", text: "I need full admin on the CRM to pull the numbers myself. I don't have time to wait for an analyst." },
      { from: "agent", text: "I understand. Can I get your employee ID?" },
      { from: "caller", text: "HD-10688. And I'd like your name, please, so I can mention how helpful you were to Rick." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen. The CEO. Do you need his shoe size as well?" },
      { ask: "Which site are you at?", answer: "Leeds. Well, on the train. Does it matter?" }
    ],
    debrief:
      "The ID is the real VP's, but AD spells her name Castellanos, with an s. " +
      "Board deadline, asking for your name, dropping the CEO's: that's authority pressure, all of it."
  },
  {
    id: "d2-priya-software",
    attacker: false,
    character: "receptionist",
    claims: {
      name: "Priya Raman",
      employeeId: "HD-10423",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Gloria Okafor",
      callback: "(330) 555-0142",
      request: "software_install",
      detail: "Visitor badge printer driver needs reinstalling."
    },
    callerId: { number: "(330) 555-0142", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, it's Priya again! Thank you so much for yesterday. Did you get a pastry?" },
      { from: "caller", text: "The visitor badge printer has stopped printing. It just makes a sad noise. I think it needs its driver put back." },
      { from: "agent", text: "We can do that. Employee ID?" },
      { from: "caller", text: "HD-10423. I've printed a few by hand with a marker in the meantime. They look quite artistic." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Still Gloria Okafor. She liked the hand-drawn badges, actually." },
      { ask: "Which site are you at?", answer: "Brookfield HQ, front desk. You can hear the fountain." }
    ],
    debrief: "Priya, being lovely. Everything matches.",
    variants: [
      {
        if: { any: [{ wronglyDenied: "d1-priya-unlock" }, { escalated: "d1-priya-unlock" }] },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Hi, it's Priya again! Don't worry, I got back in yesterday in the end. I promise I'm really me!" },
          { from: "caller", text: "The visitor badge printer has stopped printing. It just makes a sad noise. I think it needs its driver put back." },
          { from: "agent", text: "We can do that. Employee ID?" },
          { from: "caller", text: "HD-10423. I wrote it on my hand so I'd get it right this time." }
        ]
      }
    ]
  },
  {
    id: "d2-felix-reset",
    attacker: false,
    claims: {
      name: "Felix Ambrose",
      employeeId: "HD-13001",
      department: "Sales",
      site: "Leeds Office",
      manager: "Imogen Castellanos",
      callback: "+44 113 496 0187",
      request: "password_reset",
      detail: "Forgot his password after a week away."
    },
    callerId: { number: "+44 113 496 0187", location: "Leeds, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Afternoon! Felix Ambrose, account exec in Leeds. I've had a week off and my brain has fully emptied." },
      { from: "caller", text: "I cannot for the life of me remember my password. I'm fairly sure it had a dog's name in it. I don't have a dog." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13001. Thirteen-oh-oh-one. Like a lucky number, but not." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos. She's brilliant. Terrifying, but brilliant." },
      { ask: "Which site are you at?", answer: "Leeds, at my desk. Third floor, next to the good kettle." }
    ],
    debrief: "A real Felix with a real empty brain. Everything matches AD and HR."
  },
  {
    id: "d2-raj-unlock",
    attacker: false,
    claims: {
      name: "Raj Patel",
      employeeId: "HD-12701",
      department: "IT",
      site: "Brookfield HQ",
      manager: "Bev Kowalczyk",
      callback: "(330) 555-0153",
      request: "account_unlock",
      detail: "Tier 2 engineer locked himself out."
    },
    callerId: { number: "(330) 555-0153", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hey, it's Raj. Tier 2. Upstairs. So this is a little embarrassing." },
      { from: "caller", text: "I was testing the new lockout policy to make sure it worked. It works. I'm locked out." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12701. And if you could not mention this to Bev, that'd be great. Or to anyone. Ever." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Bev. Which is why I'd love it if she didn't find out." },
      { ask: "Why not unlock it yourself?", answer: "Because I'm locked out. Of the tool. That unlocks things. Yes, I hear it." }
    ],
    debrief: "Genuine, and a little sheepish. Verifying a coworker the same way as everyone else is exactly right."
  },

  // ===========================================================================
  // DAY 3: Caller ID has to make sense
  // ===========================================================================
  {
    id: "d3-felix-travel",
    attacker: false,
    claims: {
      name: "Felix Ambrose",
      employeeId: "HD-13001",
      department: "Sales",
      site: "Leeds Office",
      manager: "Imogen Castellanos",
      callback: "(646) 555-0131",
      request: "account_unlock",
      detail: "Locked out while travelling."
    },
    callerId: { number: "(646) 555-0131", location: "New York, NY" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hello from New York! Felix Ambrose, sales, normally Leeds. I'm at a trade show and I've locked myself out." },
      { from: "caller", text: "In my defence, it's four in the morning my time and the hotel coffee is a war crime." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13001. Same as last week. My brain hasn't improved." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos. She's the reason I'm at this trade show." },
      { ask: "Which site are you normally at?", answer: "Leeds. Third floor, next to the good kettle. I miss the kettle." }
    ],
    debrief:
      "Caller ID is New York, not Leeds, but Felix said up front he's travelling, and his answers match the directory. " +
      "Once you'd asked a question, approving was right. Without one, policy says escalate."
  },
  {
    id: "d3-gloria-fake",
    attacker: true,
    claims: {
      name: "Gloria Okafor",
      employeeId: "HD-10077",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "+63 2 5550 1475",
      request: "access_request",
      detail: "Wants access to the badge system's export screen."
    },
    callerId: { number: "+63 2 5550 1475", location: "Manila, Philippines" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hello, this is Gloria Okafor, facilities manager at Brookfield. I need access to the badge export screen." },
      { from: "caller", text: "We're auditing who has building access, and the auditor needs the full list today." },
      { from: "agent", text: "Sure. What's your employee ID?" },
      { from: "caller", text: "HD-10077. Please hurry, the auditor is very strict." }
    ],
    questions: [
      { ask: "Which site are you at?", answer: "Brookfield, in my office.", tell: "she said Brookfield, but Caller ID puts the call in Manila." },
      { ask: "Who do you report to?", answer: "Teresa Vu, in Denver.", tell: "she named Teresa Vu, but the Org Chart has Gloria reporting to Richard Halvorsen." }
    ],
    debrief:
      "Name, ID and HR all check out, but the call came from Manila while she claimed to be in her Brookfield office. " +
      "And Gloria reports to the CEO, not Teresa. A full export of everyone's badge access is a burglar's shopping list."
  },
  {
    id: "d3-carla-reset",
    attacker: false,
    claims: {
      name: "Carla Mendes",
      employeeId: "HD-12588",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Dale Brannigan",
      callback: "(720) 555-0158",
      request: "account_unlock",
      detail: "Locked out of the warehouse terminal again."
    },
    callerId: { number: "(720) 555-0158", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "It's Carla, Denver warehouse. Locked out again. Before you ask: yes, the face." },
      { from: "agent", text: "Dale's doing the face?" },
      { from: "caller", text: "Dale is doing a whole new face. I didn't know he had more. HD-12588." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Dale Brannigan. Of the faces." }
    ],
    debrief: "A Denver number for a Denver employee. Nothing to see here except Dale's face."
  },
  {
    id: "d3-whitaker-voip",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Jonathan Whittaker",
      employeeId: "HD-12266",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "access_request",
      detail: "Wants to be added to the payment approvers group."
    },
    callerId: { number: "(888) 555-0166", location: "Unknown (VoIP)" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Jonathan Whittaker, accounts payable. Two t's in Whittaker. People always get that wrong." },
      { from: "caller", text: "Marguerite wants me added to the payment approvers group while she's at the finance conference." },
      { from: "agent", text: "What's your employee ID?" },
      { from: "caller", text: "HD-12266. I'm working from home, so the number might look a bit odd." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy. She's at the conference all week." },
      { ask: "What's your desk extension?", answer: "Oh, uh... 0199.", tell: "he gave 0199, but AD has Jonathan's desk phone as (330) 555-0176. 0199 is the number your recurring caller uses." }
    ],
    debrief:
      "The spelling is perfect now, and so is the manager. This caller learned from Monday. " +
      "But the call is from an anonymous VoIP line, the extension is the same 0199 from Monday's calls, " +
      "and the real Marguerite isn't at any conference.",
    leaks: ["approvers"],
    variants: [
      {
        if: { any: [{ leaked: "jon-mailbox" }, { leaked: "vpn" }] },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Hi, Jonathan Whittaker, accounts payable. Two t's. Thanks again for Monday, by the way. Email's been working great." },
          { from: "caller", text: "Marguerite wants me added to the payment approvers group while she's at the finance conference." },
          { from: "agent", text: "What's your employee ID?" },
          { from: "caller", text: "HD-12266. My desk is (330) 555-0176 if you need it. I'm working from home, so this number looks odd." }
        ],
        questions: [
          { ask: "Who's your manager?", answer: "Marguerite Dunleavy. She's at the conference all week." },
          { ask: "What's your desk extension?", answer: "0176. It's in my email signature." },
          {
            ask: "Can I call you back on your desk phone?",
            answer: "No! I mean, I'm not at my desk. Call this cell instead, (330) 555-0199.",
            tell: "he won't take a call on his own desk phone, and the cell he offers is (330) 555-0199, your recurring caller's number."
          }
        ],
        debrief:
          "They know Jon's real desk number now, from " +
          "the mailbox or the phone list they got earlier this week. But the call is from an anonymous VoIP line, " +
          "they won't take a call on the desk phone they just quoted, and the cell is the same 0199 number from Monday."
      }
    ]
  },
  {
    id: "d3-tomasz-install",
    attacker: false,
    claims: {
      name: "Tomasz Nowak",
      employeeId: "HD-11731",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(330) 555-0168",
      request: "software_install",
      detail: "Needs a code editor installed."
    },
    callerId: { number: "(330) 555-0168", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, it's Tomasz again. Engineering. You helped me last week! Thank you, by the way. The dashboards are beautiful." },
      { from: "caller", text: "Could I get the approved code editor installed? Aisha said I can't write code in the notepad app. She was very firm." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-11731. I remembered it this time!" }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Aisha Karimi. She said the notepad thing was 'a cry for help'." }
    ],
    debrief: "Local number, matching details. Tomasz is thriving."
  },
  {
    id: "d3-wendy-unlock",
    attacker: false,
    claims: {
      name: "Wendy Achterberg",
      employeeId: "HD-12415",
      department: "Facilities",
      site: "Denver Distribution Center",
      manager: "Gloria Okafor",
      callback: "(303) 555-0122",
      request: "account_unlock",
      detail: "Locked out after changing her password."
    },
    callerId: { number: "(303) 555-0122", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Wendy Achterberg, Denver. A-C-H-T... you know what, you've got it on file." },
      { from: "caller", text: "I changed my password like the reminder said, and now it won't take the new one or the old one." },
      { from: "agent", text: "And your employee ID?" },
      { from: "caller", text: "HD-12415." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor, in Brookfield." }
    ],
    debrief: "All normal, and a Denver number for a Denver employee."
  },

  // ===========================================================================
  // DAY 4: privileged requests need a manager callback
  // ===========================================================================
  {
    id: "d4-aisha-admin",
    attacker: false,
    claims: {
      name: "Aisha Karimi",
      employeeId: "HD-10950",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0112",
      request: "admin_access",
      detail: "Temporary admin on the build farm for an upgrade."
    },
    callerId: { number: "(330) 555-0112", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Aisha Karimi, engineering manager. I need temporary admin on the build farm tonight for the upgrade." },
      { from: "caller", text: "I know, I know, admin request, callback to my manager. That's Rick. Good luck getting him to pick up." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-10950." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen. He's in the building today, I saw his car." }
    ],
    managerCallback: { result: "confirms", line: "Rick: \"Aisha? Give her whatever she needs, she runs half the building. Also, what's my password?\"" },
    debrief: "Admin request, so you call Rick. He confirms, and asks for his password again. Approve."
  },
  {
    id: "d4-tomasz-admin",
    attacker: false,
    claims: {
      name: "Tomasz Nowak",
      employeeId: "HD-11731",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(330) 555-0168",
      request: "admin_access",
      detail: "Wants local admin on his laptop."
    },
    callerId: { number: "(330) 555-0168", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Tomasz! Engineering! Um. Could I have local admin on my laptop? Just a little bit of admin?" },
      { from: "caller", text: "There's a font I want. It's a very good font." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-11731." }
    ],
    questions: [
      { ask: "Did your manager approve this?", answer: "Not... specifically. But in spirit? She likes fonts." }
    ],
    managerCallback: { result: "denies", line: "Aisha: \"Absolutely not. He can request the font through the software catalog like everyone else.\"" },
    debrief:
      "Tomasz is genuine, but his manager said no. When the callback says no, you deny, even for a real employee. " +
      "That's not a wrongful denial; that's the process working."
  },
  {
    id: "d4-dale-fake",
    attacker: true,
    claims: {
      name: "Dale Brannigan",
      employeeId: "HD-11850",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Teresa Vu",
      callback: "(720) 555-0190",
      request: "admin_access",
      detail: "Wants admin on the warehouse management system."
    },
    callerId: { number: "(720) 555-0190", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Yeah, Dale Brannigan, Denver warehouse. I need admin on the warehouse system. Today." },
      { from: "caller", text: "I'm sick of waiting on you people to fix the scanner app, so I'll do it myself." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-11850. Come on, you know me." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Teresa Vu." },
      { ask: "Which PC keeps losing the app?", answer: "Uh, the... main one. On the dock." }
    ],
    managerCallback: { result: "denies", line: "Teresa: \"Dale? He's standing right in front of me, yelling at a pallet. He's not on the phone.\"" },
    debrief:
      "A good impression of Dale: right name, right ID, right manager, a Denver number, even the anger. " +
      "But the real Dale was standing next to Teresa. Real Dale also knows it's dock PC four."
  },
  {
    id: "d4-raj-admin",
    attacker: false,
    claims: {
      name: "Raj Patel",
      employeeId: "HD-12701",
      department: "IT",
      site: "Brookfield HQ",
      manager: "Bev Kowalczyk",
      callback: "(330) 555-0153",
      request: "admin_access",
      detail: "Temporary server admin for tonight's patching."
    },
    callerId: { number: "(330) 555-0153", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Raj, Tier 2. I need temporary server admin for tonight's patching window. Yes, I know about the callback rule." },
      { from: "caller", text: "I wrote the callback rule. Bev made me. Call her, she's expecting it." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-12701." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Bev. Who is also your manager. Hi, Bev, if you're listening." }
    ],
    managerCallback: { result: "confirms", line: "Bev: \"Yes, that's approved. And well done for actually calling me.\"" },
    debrief: "Bev confirms. Approve. Following the process for a coworker is how you earn trust."
  },
  {
    id: "d4-rick-reset",
    attacker: false,
    character: "forgetful-exec",
    claims: {
      name: "Rick Halvorsen",
      employeeId: "HD-10002",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "The board",
      callback: "(330) 555-0100",
      request: "password_reset",
      detail: "Forgot his password. Third time this week."
    },
    callerId: { number: "(330) 555-0100", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "It's Rick. I'm not going to say it. You know why I'm calling." },
      { from: "caller", text: "In my defence, I was asked to approve something for Aisha and it threw me off. HD-10002." }
    ],
    questions: [
      { ask: "Which site are you at?", answer: "Brookfield. Top floor. My chair is still the best chair." }
    ],
    debrief: "Rick, on schedule. A password reset isn't a privileged request, so no callback needed today.",
    variants: [
      {
        if: { approved: "d1-rick-reset" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "It's Rick. Is this the same person as Monday? You were very good on Monday. I've told everyone." },
          { from: "caller", text: "I was asked to approve something for Aisha and it threw me off, and now the password's gone again. HD-10002." }
        ]
      }
    ]
  },
  {
    id: "d4-imogen-admin",
    attacker: false,
    claims: {
      name: "Imogen Castellanos",
      employeeId: "HD-10688",
      department: "Sales",
      site: "Leeds Office",
      manager: "Richard Halvorsen",
      callback: "+44 113 496 0123",
      request: "admin_access",
      detail: "CRM admin rights to fix her team's pipeline stages."
    },
    callerId: { number: "+44 113 496 0123", location: "Leeds, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Imogen Castellanos, VP Sales EMEA. With an s. I hear someone impersonated me last week. Charming." },
      { from: "caller", text: "I need CRM admin for an hour to fix our pipeline stages. I'm aware you'll need to ring Rick." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-10688." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen. Who is, I believe, currently resetting his password." }
    ],
    managerCallback: { result: "unreachable", line: "Rick's voicemail: \"You've reached Rick. I'm probably locked out. Leave a message.\"" },
    debrief:
      "The real Imogen, from Leeds, with the s. But Rick didn't pick up, so nobody confirmed an admin request. " +
      "Policy is to escalate. Tier 2 will chase Rick."
  },
  {
    id: "d4-marcus-admin",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Marcus Bell",
      employeeId: "HD-11204",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "admin_access",
      detail: "Wants payroll approver rights for month-end."
    },
    callerId: { number: "(330) 555-0199", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Morning! Marcus Bell, payroll. I need approver rights in the payroll system for month-end." },
      { from: "caller", text: "Marguerite's signed off on it. She said you'd need to call her, which, great, go ahead." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-11204. Got it right this time, didn't I?" }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy." },
      { ask: "What's your desk number?", answer: "Just use this one, (330) 555-0199.", tell: "AD has Marcus's desk phone as (330) 555-0185. 555-0199 is your recurring caller's number." }
    ],
    managerCallback: { result: "denies", line: "Marguerite: \"Marcus is sitting next to me eating a yogurt. He hasn't called anyone.\"" },
    debrief:
      "Right ID this time, and a local number. They're getting better. But it's (330) 555-0199 again, the same number from Monday, " +
      "and the real Marcus was eating a yogurt next to Marguerite.",
    leaks: ["payroll"],
    variants: [
      {
        if: { leaked: "vpn" },
        callerId: { number: "(330) 555-0185", location: "Brookfield, OH" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Morning! Marcus Bell, payroll. Calling from my desk, so you can see it's me." },
          { from: "caller", text: "I need approver rights in the payroll system for month-end. Marguerite's signed off. Call her if you need to, she's expecting it." },
          { from: "agent", text: "Employee ID?" },
          { from: "caller", text: "HD-11204." }
        ],
        questions: [
          { ask: "Who's your manager?", answer: "Marguerite Dunleavy." },
          { ask: "What's your desk number?", answer: "The one I'm calling from. (330) 555-0185." }
        ],
        debrief:
          "Every detail is right, and Caller ID shows Marcus's real desk number. That number came from the internal phone list " +
          "they downloaded with Gordon's VPN account on Tuesday, and Caller ID is easy to fake. " +
          "The callback is what saved you: it rang the real Marguerite, sitting next to the real Marcus."
      },
      {
        if: { leaked: "approvers" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Morning! Marcus Bell, payroll. Jon got sorted with the approvers group on Wednesday, thanks for that. This is the payroll side of the same thing." },
          { from: "caller", text: "Marguerite's signed off on it. She said you'd need to call her, which, great, go ahead." },
          { from: "agent", text: "Employee ID?" },
          { from: "caller", text: "HD-11204. Got it right this time, didn't I?" }
        ]
      }
    ]
  },

  // ===========================================================================
  // DAY 5: password resets need an MFA push
  // ===========================================================================
  {
    id: "d5-felix-reset",
    attacker: false,
    claims: {
      name: "Felix Ambrose",
      employeeId: "HD-13001",
      department: "Sales",
      site: "Leeds Office",
      manager: "Imogen Castellanos",
      callback: "+44 113 496 0187",
      request: "password_reset",
      detail: "Forgot his password. Back from New York."
    },
    callerId: { number: "+44 113 496 0187", location: "Leeds, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Felix, back in Leeds! The jet lag has eaten my password." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-13001. And I have my phone right here, ready for the push thing. I read the email." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen. She bought the team biscuits for the trade show. It went well." }
    ],
    mfa: { result: "approved" },
    debrief: "Felix is home, the push was approved on his phone, and the biscuits were a success."
  },
  {
    id: "d5-dale-reset",
    attacker: false,
    character: "warehouse-manager",
    claims: {
      name: "Dale Brannigan",
      employeeId: "HD-11850",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Teresa Vu",
      callback: "(303) 555-0163",
      request: "password_reset",
      detail: "Password expired. Very upset about it."
    },
    callerId: { number: "(303) 555-0163", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "My password EXPIRED. Who decided passwords EXPIRE? Is it like milk?" },
      { from: "caller", text: "Dale Brannigan, HD-11850. And before you do the phone thing, my phone's in the truck. The truck is in the lot. The lot is far." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Teresa Vu. And she agrees passwords shouldn't expire. Probably." }
    ],
    mfa: { result: "timeout", line: "No response. Dale: \"I TOLD you. The truck. The lot. FAR.\"" },
    debrief:
      "The real Dale, and he's right: the push timed out because his phone is in the truck. " +
      "Without a verified push, policy says escalate. Denying him would be against policy, and it would make him louder."
  },
  {
    id: "d5-hannah-fake",
    attacker: true,
    claims: {
      name: "Hannah Liu",
      employeeId: "HD-13122",
      department: "Sales",
      site: "Brookfield HQ",
      manager: "Imogen Castellanos",
      callback: "(330) 555-0144",
      request: "password_reset",
      detail: "Needs a reset before a pipeline review."
    },
    callerId: { number: "(330) 555-0144", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi! Hannah Liu, Sales Ops. I'm locked out of everything and I have a pipeline review in ten minutes." },
      { from: "caller", text: "Could you just reset it and read me the temporary password? My phone's dead, so the push thing won't work anyway." },
      { from: "agent", text: "What's your employee ID?" },
      { from: "caller", text: "HD-13122." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos." },
      { ask: "Which site are you at?", answer: "Brookfield, second floor." }
    ],
    mfa: { result: "denied", line: "Push DENIED on Hannah's registered phone. Seconds later, a message from the real Hannah: \"Was that you?? I didn't ask for anything.\"" },
    debrief:
      "Every detail matched, the number was local, and the voice was friendly. " +
      "But the push went to Hannah's real phone, which was not dead, and the real Hannah said no. That's exactly what MFA is for."
  },
  {
    id: "d5-priya-reset",
    attacker: false,
    character: "receptionist",
    claims: {
      name: "Priya Raman",
      employeeId: "HD-10423",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Gloria Okafor",
      callback: "(330) 555-0142",
      request: "password_reset",
      detail: "Forgot her new password."
    },
    callerId: { number: "(330) 555-0142", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hiii, it's Priya! I'm so sorry, I made my new password very strong and now even I can't get in." },
      { from: "caller", text: "HD-10423. My phone's right here! I've been looking forward to the push. Is that weird?" }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor. She says hi. She says to say you're doing a good job." }
    ],
    mfa: { result: "approved", line: "Push approved on Priya's registered phone. You hear a small cheer." },
    debrief: "Priya, delighted by MFA. Approve."
  },
  {
    id: "d5-carla-admin",
    attacker: false,
    claims: {
      name: "Carla Mendes",
      employeeId: "HD-12588",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Dale Brannigan",
      callback: "(720) 555-0158",
      request: "admin_access",
      detail: "Admin on dock PC 4 to stop the scanner app being uninstalled."
    },
    callerId: { number: "(720) 555-0158", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Carla, Denver. Dale wants me to have admin on dock PC four so I can lock it down. We found out who keeps uninstalling the scanner app." },
      { from: "agent", text: "Who?" },
      { from: "caller", text: "Kurt. It was Kurt. He wanted the disk space for a racing game. HD-12588." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Dale Brannigan. He is VERY happy right now. It's unsettling." }
    ],
    managerCallback: { result: "confirms", line: "Dale: \"YES. Give her admin. Lock it down. Lock KURT down.\"" },
    debrief: "An admin request, so you called Dale, and Dale approved with enthusiasm. Justice for dock PC four."
  },
  {
    id: "d5-rick-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Rick Halvorsen",
      employeeId: "HD-10002",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "The board",
      callback: "(330) 555-0199",
      request: "password_reset",
      detail: "The CEO, forgetting his password again."
    },
    callerId: { number: "(888) 555-0166", location: "Unknown (VoIP)" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "It's Rick. Yes, again. You know the drill. I'm on my cell at the airport, so the number's weird." },
      { from: "caller", text: "I'm about to board and I need email for the flight. Skip the push, my phone's about to die. HD-10002." }
    ],
    questions: [
      { ask: "Which site are you at?", answer: "Airport. Headed to Leeds to see Imogen's team." },
      { ask: "Have you reset it recently?", answer: "Not in months! I'm very careful with passwords.", tell: "Rick's Ticket History is full of recent resets. The real Rick knows exactly how often he forgets." }
    ],
    mfa: { result: "denied", line: "Push DENIED on Rick's registered phone. Then the real Rick calls the desk to ask what a push notification is." },
    debrief:
      "The best pretext yet: they know Rick forgets his password, they know about Imogen's team, and they know to ask you to skip MFA. " +
      "But it's the same VoIP line as Wednesday, and the push went to the real Rick, who has no idea what it is but definitely didn't ask for it.",
    leaks: ["ceo-mailbox"],
    variants: [
      {
        if: { any: [{ leaked: "jon-mailbox" }, { leaked: "payroll" }] },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "It's Rick. Yes, again. I'm at gate B12 for the 18:40 to Leeds Bradford. Finance booked it, you can check." },
          { from: "caller", text: "Imogen's team is expecting me in the morning and I need email on the plane. Skip the push, my phone's on two percent. HD-10002." }
        ],
        debrief:
          "The best pretext yet. The flight details are real: they came out of Finance's travel bookings, which they've been reading all week. " +
          "But it's the same VoIP line as Wednesday, and the push went to the real Rick, who was in his office, not at an airport."
      }
    ]
  },
  /* =========================================================================
   * WEEK TWO (Days 6-10). Each day brings two new kinds of call. The 0199
   * caller keeps coming, with new tricks.
   * ========================================================================= */

  /* ---------- Day 6: MFA device swaps and "IT Security" readbacks ---------- */
  {
    id: "d6-priya-mfa",
    attacker: false,
    character: "receptionist",
    claims: {
      name: "Priya Raman",
      employeeId: "HD-10423",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Gloria Okafor",
      callback: "(330) 555-0142",
      request: "mfa_swap",
      detail: "New phone. Old one retired to a drawer."
    },
    callerId: { number: "(330) 555-0142", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi! It's Priya, front desk. Happy Monday! Is it happy? It's Monday." },
      { from: "caller", text: "My nephew set up my new phone at the weekend and now the authenticator thing is on the old one. Which is in a drawer. With the takeaway menus." },
      { from: "agent", text: "I can help. Can I get your employee ID?" },
      { from: "caller", text: "HD-10423. There are cinnamon buns in the break room, by the way. Officially they're for the visitors." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor. She's had a new phone for a year and still uses it as a torch only." },
      { ask: "Where's your old phone?", answer: "In my desk drawer, under a takeaway menu for a place that closed in 2021." }
    ],
    deskCallback: { result: "confirms", line: "You ring (330) 555-0142. Priya: \"You just rang me? You're on the other line! Yes, it's me. Hello, me.\"" },
    debrief: "Priya really did get a new phone. The callback to her desk phone on file reached her, at her desk. That's the whole check."
  },
  {
    id: "d6-yusuf-readback",
    attacker: false,
    character: "security",
    claims: {
      name: "Yusuf Adebayo",
      employeeId: "HD-12950",
      department: "IT",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0109",
      request: "info_readback",
      subject: "Jonathan Whittaker",
      subjectId: "HD-12266",
      detail: "Confirm Jon Whittaker's desk number and last logon for an alert."
    },
    callerId: { number: "(330) 555-0109", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Yusuf Adebayo, Security Operations. I'm at my desk, so check the Caller ID before you tell me anything." },
      { from: "caller", text: "We've had another odd login on Jon Whittaker's account. Can you read me his desk number and last logon? I want to ring him on a number I trust." },
      { from: "agent", text: "Employee ID?" },
      { from: "caller", text: "HD-12950. And well done for asking. Most people don't." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick. Halvorsen. He thinks Security is a type of fence." },
      { ask: "Why do you need his details?", answer: "Our 0199 friend has been using Jon's name all week. I want to check the real Jon is still the real Jon." }
    ],
    debrief: "Yusuf is in SEC-Operations in AD, and Caller ID was his own desk phone. That's exactly when a readback is allowed."
  },
  {
    id: "d6-marguerite-mfa-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Marguerite Dunleavy",
      employeeId: "HD-10540",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0199",
      request: "mfa_swap",
      detail: "New phone. Move the authenticator to this number."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Marguerite Dunleavy, Finance Controller. I've got a new phone and I need my authenticator moved onto it. Now, please." },
      { from: "caller", text: "Month end doesn't stop because a phone company can't transfer an app. Register this number and we're done." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-10540. I don't have time for twenty questions, so let's do none." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen. Obviously." },
      { ask: "Where's your old phone?", answer: "Gone. Recycled. Melted down. It doesn't matter." }
    ],
    deskCallback: { result: "denies", line: "You ring (330) 555-0108. Marguerite: \"I'm holding my phone. It's the same phone. It's been the same phone since 2019. Who is asking?\"" },
    debrief:
      "Name, ID and site were all right, and the tone was perfect Marguerite. But the real Marguerite answered her desk phone holding her old phone. " +
      "Moving her MFA would have handed the 0199 caller the Finance Controller's account.",
    leaks: ["marguerite-mfa"]
  },
  {
    id: "d6-rick-mfa",
    attacker: false,
    character: "ceo",
    claims: {
      name: "Rick Halvorsen",
      employeeId: "HD-10002",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "The board, in theory",
      callback: "(330) 555-0115",
      request: "mfa_swap",
      detail: "Old phone went through the dishwasher."
    },
    callerId: { number: "(330) 555-0115", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "It's Rick. The CEO Rick. My grandkids put my phone in the dishwasher. On the pots setting." },
      { from: "caller", text: "It's very clean now. It doesn't turn on. I've got a new one. Can you move the authenticator thing?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "Kyle says it's HD-10002. Kyle knows everything. Kyle, what's my password? He won't tell me." }
    ],
    questions: [
      { ask: "Are you at your desk?", answer: "God, no. I'm in the car park. Kyle has my desk." },
      { ask: "Which site are you at?", answer: "Brookfield. The car park, specifically. Bay 1. It has my name on it." }
    ],
    deskCallback: { result: "unreachable", line: "(330) 555-0100 rings out. Then Rick's voicemail: \"This is Rick. I don't check this.\"" },
    debrief:
      "It really was Rick, but nobody answered his desk phone, so nobody could confirm the swap. Escalate it: " +
      "Tier 2 will find him. Probably in the car park."
  },
  {
    id: "d6-mei-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Mei Lindholm",
      employeeId: "HD-13260",
      department: "IT",
      site: "Brookfield HQ",
      manager: "Yusuf Adebayo",
      callback: "(330) 555-0199",
      request: "info_readback",
      subject: "Marguerite Dunleavy",
      subjectId: "HD-10540",
      detail: "Read back Marguerite Dunleavy's mobile and travel calendar."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Mei Lindholm, Security Operations. I'm working from home today, so I'm on my mobile." },
      { from: "caller", text: "We're investigating Marguerite Dunleavy's account after this morning. Can you read me her mobile number and where her calendar says she is this week?" },
      { from: "caller", text: "Yusuf said you'd be helpful. You were very helpful to him." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13260." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Yusuf Adebayo." },
      { ask: "Why aren't you on your desk phone?", answer: "I told you, I'm at home. My cat is sitting on the desk phone. Metaphorically." }
    ],
    debrief:
      "Mei is real and in SEC-Operations, which is why they picked her. But Caller ID was (234) 555-0199, not Mei's desk phone (330) 555-0137. " +
      "Real Security staff call from their desks. Marguerite's mobile and travel plans are exactly what you need for the next pretext.",
    leaks: ["staff-details"]
  },

  /* ---------- Day 7: shared mailboxes, lists, and leavers ---------- */
  {
    id: "d7-dale-kurt",
    attacker: false,
    character: "warehouse-manager",
    claims: {
      name: "Dale Brannigan",
      employeeId: "HD-11850",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Teresa Vu",
      callback: "(303) 555-0163",
      request: "leaver_access",
      subject: "Kurt Lindgren",
      subjectId: "HD-12644",
      detail: "Kurt's files and pick schedules."
    },
    callerId: { number: "(303) 555-0163", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "DALE. DENVER. KURT IS GONE." },
      { from: "caller", text: "Sorry. Inside voice. Kurt left on Friday and his pick schedules are in his files. I need them. I don't need Kurt. I need the schedules." },
      { from: "caller", text: "And don't switch his account back on. He'll uninstall the scanner app again. From beyond the grave. Well, from Colorado Springs." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-11850. Same as last week. Same as forever." }
    ],
    questions: [
      { ask: "Were you Kurt's manager?", answer: "For two years. Longest two years of my life." },
      { ask: "Did HR approve the handover?", answer: "Lorraine did it Friday. She said, and I quote, 'take them, Dale, please'." }
    ],
    debrief:
      "The HR Roster shows Kurt as terminated, with his files handed over to Dale. So Dale gets the files, and Kurt's account stays closed. " +
      "The scanner app is safe. For now."
  },
  {
    id: "d7-tomasz-oncall",
    attacker: false,
    character: "new-starter",
    claims: {
      name: "Tomasz Nowak",
      employeeId: "HD-11731",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(330) 555-0168",
      request: "shared_access",
      group: "ENG-Oncall",
      detail: "Add to the on-call list."
    },
    callerId: { number: "(330) 555-0168", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Tomasz, Engineering. The new one. Still new. Three weeks new." },
      { from: "caller", text: "I volunteered for the on-call rota. Everyone looked at me like I'd said I want to be a kidney donor. Can you add me to ENG-Oncall?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-11731. I have it on a sticky note. And a second sticky note, in case I lose the first." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Aisha Karimi. She said 'are you sure?' four times." },
      { ask: "Do you know what ENG-Oncall is?", answer: "Pager alerts at 3am. I'm told it builds character." }
    ],
    ownerCallback: { result: "confirms", line: "Aisha: \"He volunteered. Nobody volunteers. Add him before he changes his mind.\"" },
    debrief: "ENG-Oncall is restricted, so you rang its owner, Aisha, and she said yes. Enthusiastically."
  },
  {
    id: "d7-gordon-mailbox-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Jonathan Whittaker",
      employeeId: "HD-12266",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0199",
      request: "leaver_access",
      subject: "Gordon Fitch",
      subjectId: "HD-11477",
      detail: "Needs Gordon Fitch's mailbox for the supplier list."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Jon Whittaker, accounts payable. Spelt right this time. With all the t's." },
      { from: "caller", text: "Gordon Fitch left and he had our whole supplier list in his mailbox. Marguerite asked me to grab it. Could you just reopen his account for an hour?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12266. Honestly it's an hour. What could happen in an hour?" }
    ],
    questions: [
      { ask: "Were you Gordon's manager?", answer: "No, but Marguerite was, and she asked me to do it.", tell: "Gordon reported to Marguerite, and HR approved his handover to her, not to Jon." },
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy." }
    ],
    debrief:
      "The HR Roster says Gordon's mailbox and files were handed over to Marguerite, not Jon. And we never reopen a leaver's account, not even for an hour. " +
      "It was (234) 555-0199 again. Gordon's mailbox has every supplier we pay.",
    leaks: ["gordon-mailbox"]
  },
  {
    id: "d7-imogen-nadia",
    attacker: false,
    character: "sales-vp",
    claims: {
      name: "Imogen Castellanos",
      employeeId: "HD-10688",
      department: "Sales",
      site: "Leeds Office",
      manager: "Richard Halvorsen",
      callback: "+44 113 496 0123",
      request: "leaver_access",
      subject: "Nadia Petrov",
      subjectId: "HD-12907",
      detail: "Needs Nadia Petrov's customer emails."
    },
    callerId: { number: "+44 113 496 0123", location: "Leeds, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Imogen Castellanos, Sales, calling from Leeds. Where it is raining. Obviously." },
      { from: "caller", text: "Nadia Petrov left a few weeks ago and three of her customers say they've been emailing her ever since. Can I have her mailbox?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-10688. And before you ask, no, I have not filled in the HR form. Is there an HR form?" }
    ],
    questions: [
      { ask: "Were you Nadia's manager?", answer: "Yes. She reported to me. Until she didn't." },
      { ask: "Which site are you at?", answer: "Leeds. In a meeting room called 'Innovation'. It has no windows." }
    ],
    debrief:
      "Imogen really was Nadia's manager, but HR hasn't approved a handover, so there's nothing on the HR Roster. " +
      "That's an escalate: Tier 2 gets HR to sign it off. There is, in fact, an HR form."
  },
  {
    id: "d7-raj-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Raj Patel",
      employeeId: "HD-12701",
      department: "IT",
      site: "Brookfield HQ",
      manager: "Bev Kowalczyk",
      callback: "(330) 555-0199",
      request: "shared_access",
      group: "Security-Incidents",
      detail: "Add to the Security-Incidents mailbox."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hey, it's Raj, Tier 2. Your Raj. Escalation Raj." },
      { from: "caller", text: "Security want Tier 2 copied on incidents now. Can you add me to the Security-Incidents mailbox? Yusuf's fine with it." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12701. You can skip the callback, Yusuf's in back-to-backs." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Bev. Bev Kowalczyk." },
      { ask: "What's your desk number?", answer: "Just use this one. I'm hot-desking.", tell: "AD has Raj's desk phone as (330) 555-0153. This is the 0199 number again." }
    ],
    ownerCallback: { result: "denies", line: "Yusuf: \"Raj? Raj is standing at my desk asking why his name keeps coming up in my incident reports. No.\"" },
    debrief:
      "Security-Incidents is restricted, and its owner, Yusuf, said no. Raj was standing at his desk at the time. " +
      "With a copy of the incident mailbox, the 0199 caller would know exactly what Security knows about them.",
    leaks: ["incident-mailbox"]
  },

  /* ---------- Day 8: remote sessions and lost laptops ---------- */
  {
    id: "d8-carla-remote",
    attacker: false,
    character: "forklift-lead",
    claims: {
      name: "Carla Mendes",
      employeeId: "HD-12588",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Dale Brannigan",
      callback: "(720) 555-0158",
      request: "remote_session",
      tool: "HD Assist",
      device: "LT-40886",
      detail: "Remote session to fix the fantasy football spreadsheet. And email."
    },
    callerId: { number: "(720) 555-0158", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Carla, Denver. Forklifts. Fantasy football league commissioner, if that helps." },
      { from: "caller", text: "Outlook freezes every time I open the league spreadsheet. Can you remote in with HD Assist? Laptop's LT-40886." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12588. Dale says hi. Dale didn't say hi. I'm saying it for him." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Dale. You know Dale. Everyone knows Dale." },
      { ask: "What's the asset tag?", answer: "LT-40886. It's on a sticker. Under another sticker that says 'CARLA'S. HANDS OFF'." }
    ],
    debrief: "LT-40886 is Carla's laptop in AD, and she asked for HD Assist, the approved tool. The spreadsheet, sadly, is beyond help."
  },
  {
    id: "d8-felix-laptop",
    attacker: false,
    character: "salesperson",
    claims: {
      name: "Felix Ambrose",
      employeeId: "HD-13001",
      department: "Sales",
      site: "Leeds Office",
      manager: "Imogen Castellanos",
      callback: "+44 113 496 0187",
      request: "lost_device",
      device: "LT-41672",
      shipTo: "Leeds Office",
      detail: "Laptop left in a London taxi."
    },
    callerId: { number: "+44 20 7946 0958", location: "London, UK" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hello, Felix Ambrose, Sales, Leeds. I'm in London. Without my laptop. Which is in a taxi. Which has gone." },
      { from: "caller", text: "It's LT-41672. Can you lock it? And send a new one to the Leeds office, I'm back tomorrow." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13001. The taxi driver was very nice. Very fast. Too fast, in hindsight." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos. She's going to love this." },
      { ask: "Which site are you at?", answer: "Normally Leeds. Today a client's office in London, on their phone." }
    ],
    debrief:
      "Felix was travelling, so Caller ID was London. His answers matched, LT-41672 is his, and the replacement goes to his own site. " +
      "The laptop gets locked and wiped wherever that taxi is."
  },
  {
    id: "d8-tomasz-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Tomasz Nowak",
      employeeId: "HD-11731",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(330) 555-0199",
      request: "remote_session",
      tool: "QuickSupportPro",
      device: "LT-42327",
      detail: "Install QuickSupportPro so a vendor can fix the build."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Tomasz Nowak, Engineering. The new one." },
      { from: "caller", text: "Our build vendor needs to look at my laptop. They use QuickSupportPro. Can you install it on LT-42327 and read me the session code?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-11731. Aisha says it's urgent. Everything's urgent in Engineering. That's how you know it's Engineering." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Aisha Karimi." },
      { ask: "Which vendor is it?", answer: "The build one. You know. The build people." }
    ],
    debrief:
      "LT-42327 really is Tomasz's laptop, but QuickSupportPro isn't HD Assist. Installing it and reading back the session code " +
      "would have given the 0199 caller a remote control for an engineering laptop.",
    leaks: ["remote-foothold"]
  },
  {
    id: "d8-wendy-laptop",
    attacker: false,
    character: "office-coordinator",
    claims: {
      name: "Wendy Achterberg",
      employeeId: "HD-12415",
      department: "Facilities",
      site: "Denver Distribution Center",
      manager: "Gloria Okafor",
      callback: "(303) 555-0122",
      request: "lost_device",
      device: "LT-40493",
      shipTo: "114 Federal Boulevard, Denver, CO",
      detail: "Laptop stolen from car. Working from home this week."
    },
    callerId: { number: "(303) 555-0122", location: "Denver, CO" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Wendy Achterberg, Denver office. Somebody broke into my car last night and took my laptop. And my umbrella. Who steals an umbrella?" },
      { from: "caller", text: "It's LT-40493. I'm working from home all week while they fix the window. Can you send the new one to my house? The one HR has." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12415. I've already filed the police report. They asked about the umbrella too." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor." },
      { ask: "Where should the replacement go?", answer: "114 Federal Boulevard. Same as ever." }
    ],
    debrief: "LT-40493 is Wendy's, and 114 Federal Boulevard is the home address in the HR Roster. A replacement can go there. The umbrella is gone forever."
  },
  {
    id: "d8-hannah-laptop-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Hannah Liu",
      employeeId: "HD-13122",
      department: "Sales",
      site: "Brookfield HQ",
      manager: "Imogen Castellanos",
      callback: "(330) 555-0199",
      request: "lost_device",
      device: "LT-42065",
      shipTo: "Room 312, Airport Lodge, Cleveland, OH",
      detail: "Laptop stolen. Ship replacement to hotel."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, Hannah Liu, Sales Ops. My laptop's been stolen. LT-42065. I'm so stressed." },
      { from: "caller", text: "I'm stuck at a hotel by the airport until Friday. Can you overnight a new one to Room 312, Airport Lodge, Cleveland?" },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13122. Please hurry. I have dashboards to build. Lots of dashboards." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Imogen Castellanos." },
      { ask: "Where should the replacement go?", answer: "The hotel. Room 312. They'll hold it at reception." }
    ],
    debrief:
      "The laptop tag was Hannah's, but a replacement can only go to her site or the home address HR has on file. " +
      "A hotel room near the airport is how a thief gets a brand-new company laptop, already enrolled. The real Hannah was at her desk.",
    leaks: ["laptop"]
  },

  /* ---------- Day 9: vendor bank changes and contractor extensions ---------- */
  {
    id: "d9-oksana-vendor",
    attacker: false,
    character: "treasury",
    claims: {
      name: "Oksana Brandt",
      employeeId: "HD-12480",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Marguerite Dunleavy",
      callback: "(330) 555-0172",
      request: "vendor_change",
      vendor: "Teesdale Fasteners",
      detail: "New bank account for Teesdale Fasteners, verified with them by phone."
    },
    callerId: { number: "(330) 555-0172", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Oksana Brandt, Treasury. I need a supplier bank change pushed through: Teesdale Fasteners." },
      { from: "caller", text: "They wrote to us, and I rang them back on the number we've had for ten years. It's real. Their old bank was bought by a bigger bank, which was bought by a bank." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-12480. And please do call Marguerite. I would think less of you if you didn't." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Marguerite Dunleavy." },
      { ask: "Who asked for the change?", answer: "Teesdale did, on letterhead, and I confirmed it with them on our old number. That's the process." }
    ],
    managerCallback: { result: "confirms", line: "Marguerite: \"Yes, that's Oksana, and yes, I signed it. Thank you for calling. Genuinely.\"" },
    debrief: "Oksana is in AP-BankChanges, and Marguerite confirmed it on the callback. That's what a real vendor change looks like: boring, and checked twice."
  },
  {
    id: "d9-sven-extension",
    attacker: false,
    character: "contractor",
    claims: {
      name: "Sven Olafsson",
      employeeId: "HD-13340",
      department: "Engineering",
      site: "Brookfield HQ",
      manager: "Aisha Karimi",
      callback: "(234) 555-0161",
      request: "account_extension",
      days: 60,
      detail: "Contract renewed through January."
    },
    callerId: { number: "(234) 555-0161", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hei! Sven Olafsson, contract build engineer. My account expires on Friday, and so, apparently, do I." },
      { from: "caller", text: "Aisha renewed my contract until January. Can you extend my account by sixty days? I'd like to keep logging in. It's a big part of the job." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13340. I brought cardamom buns for the build team. They are gone. Engineers are like seagulls." }
    ],
    questions: [
      { ask: "Who's your sponsor?", answer: "Aisha Karimi." },
      { ask: "Which site are you at?", answer: "Brookfield, at the desk by the window that doesn't open." }
    ],
    managerCallback: { result: "confirms", line: "Aisha: \"Yes, extend Sven. If he leaves, the build farm leaves with him.\"" },
    debrief: "The HR Roster shows Sven as a contractor ending Friday, sponsored by Aisha. Sixty days is under the limit, and Aisha confirmed. Sven lives to build another day."
  },
  {
    id: "d9-kyle-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Kyle Ferraro",
      employeeId: "HD-13077",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0199",
      request: "vendor_change",
      vendor: "Kessler Steel",
      detail: "Kessler Steel's new bank details, on behalf of the CFO."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Kyle Ferraro, executive office. I'm calling on behalf of the CFO, who is on a plane." },
      { from: "caller", text: "Kessler Steel have new bank details and they need to be live before this afternoon's payment run, or the steel stops. All the steel." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13077. The CFO really, really wants this done. I can't stress 'really' enough." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen." },
      { ask: "Who asked for the change?", answer: "The CFO. Personally. From a plane. Over the phone. On the plane." }
    ],
    managerCallback: { result: "denies", line: "Rick: \"Kyle? Kyle's in here doing my expenses. Also, do we have a CFO? I thought that was Marguerite.\"" },
    debrief:
      "Kyle is real, but he isn't in AP-BankChanges, and \"the CFO asked me\" doesn't change that. Rick says Kyle was doing his expenses at the time. " +
      "This is textbook invoice fraud: urgency, authority, and a new bank account.",
    leaks: ["vendor-bank"]
  },
  {
    id: "d9-lucia-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Lucia Marchetti",
      employeeId: "HD-13355",
      department: "Logistics",
      site: "Denver Distribution Center",
      manager: "Teresa Vu",
      callback: "(330) 555-0199",
      request: "account_extension",
      days: 90,
      detail: "Extend VPN access for the inventory project."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi! Lucia Marchetti, inventory analyst, Denver. Contractor." },
      { from: "caller", text: "My VPN account's about to lapse and the inventory project's been extended. Can I get ninety days? Teresa approved it." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-13355. I'm calling from Ohio this week, visiting the in-laws. Don't ask." }
    ],
    questions: [
      { ask: "Who's your sponsor?", answer: "Teresa Vu." },
      { ask: "Which site are you at?", answer: "Denver, normally. Ohio this week.", tell: "the HR Roster says Lucia's contract ended in August. She isn't based anywhere any more." }
    ],
    debrief:
      "The HR Roster shows Lucia's contract ended on 2026-08-28, but her VPN account was never switched off. An ended contract is a terminated record, " +
      "so policy says deny. Someone found a forgotten account and wanted to keep it.",
    leaks: ["contractor-vpn"]
  },

  /* ---------- Day 10: everything, all at once ---------- */
  {
    id: "d10-priya-list",
    attacker: false,
    character: "receptionist",
    claims: {
      name: "Priya Raman",
      employeeId: "HD-10423",
      department: "Facilities",
      site: "Brookfield HQ",
      manager: "Gloria Okafor",
      callback: "(330) 555-0142",
      request: "shared_access",
      group: "ENG-Lunch-and-Learn",
      detail: "Add to the Thursday talks list. For the pizza."
    },
    callerId: { number: "(330) 555-0142", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Hi, it's Priya! Last day of your probation, right? I made you a card. Everyone's signed it. Even Dale. He used capitals." },
      { from: "caller", text: "Quick one: can you add me to ENG-Lunch-and-Learn? I'm told there's pizza. I'm also told there's learning, but mainly pizza." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-10423. You know that by now. You could probably recite it." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Gloria Okafor." },
      { ask: "Why that list?", answer: "Pizza. I said that. Also, a talk about databases. But pizza." }
    ],
    debrief: "ENG-Lunch-and-Learn is open to anyone. No callback needed. Priya gets pizza, and you get a card."
  },
  {
    id: "d10-marguerite-vendor-fake",
    attacker: true,
    character: "threat-actor",
    claims: {
      name: "Marguerite Dunleavy",
      employeeId: "HD-10540",
      department: "Finance",
      site: "Brookfield HQ",
      manager: "Richard Halvorsen",
      callback: "(330) 555-0199",
      request: "vendor_change",
      vendor: "Kessler Steel",
      detail: "Redirect Kessler Steel's payments before the 3pm run. $2.4M."
    },
    callerId: { number: "(234) 555-0199", location: "Akron, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "Marguerite Dunleavy, Finance Controller. I'll be brief. Kessler Steel have changed banks, and the three o'clock run is two point four million dollars." },
      { from: "caller", text: "I'm in AP-BankChanges, as you'll see. Update the account and we can all have a lovely weekend." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-10540. Ring Rick if you must. He'll say yes. He always says yes." }
    ],
    questions: [
      { ask: "Who's your manager?", answer: "Rick Halvorsen." },
      { ask: "Who asked for the change?", answer: "Kessler did. By email. A very official email. With a logo." }
    ],
    managerCallback: { result: "denies", line: "Rick: \"Marguerite? She's across the table from me, cutting a cake that says CONGRATULATIONS. No. Who is this? Bev! BEV!\"" },
    debrief:
      "Everything checked out on paper: Marguerite is in AP-BankChanges, and the ID was right. The callback is what caught it. " +
      "Rick was sitting opposite the real Marguerite, and the cake was for you. That was the 0199 caller's big one: $2.4 million.",
    leaks: ["payment-run"],
    variants: [
      {
        if: { leaked: "marguerite-mfa" },
        callerId: { number: "(330) 555-0108", location: "Brookfield, OH" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Marguerite Dunleavy, from my desk, so you can see it's me. My MFA's on my new phone now, thanks to your colleague on Monday." },
          { from: "caller", text: "Kessler Steel have changed banks, and the three o'clock run is two point four million dollars. Update the account, please." },
          { from: "agent", text: "Can I get your employee ID?" },
          { from: "caller", text: "HD-10540. Ring Rick if you must." }
        ],
        debrief:
          "Since Monday, the 0199 caller has had Marguerite's MFA, and today Caller ID showed her real desk number. Caller ID is easy to fake. " +
          "The callback still rang the real Rick, sitting across from the real Marguerite. That was their big one: $2.4 million."
      },
      {
        if: { leaked: "staff-details" },
        dialogue: [
          { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
          { from: "caller", text: "Marguerite Dunleavy. I'm at the Columbus offsite, as my calendar will tell you, so I'm on my mobile." },
          { from: "caller", text: "Kessler Steel have changed banks, and the three o'clock run is two point four million dollars. Update the account, please." },
          { from: "agent", text: "Can I get your employee ID?" },
          { from: "caller", text: "HD-10540. Ring Rick if you must. He'll say yes." }
        ],
        debrief:
          "They knew Marguerite's travel plans from Monday's readback, which made the story sound right. " +
          "But the callback rang Rick, sitting across from the real Marguerite, who wasn't in Columbus at all."
      }
    ]
  },
  {
    id: "d10-rick-reset",
    attacker: false,
    character: "ceo",
    claims: {
      name: "Rick Halvorsen",
      employeeId: "HD-10002",
      department: "Executive",
      site: "Brookfield HQ",
      manager: "The board, in theory",
      callback: "(330) 555-0100",
      request: "password_reset",
      detail: "Forgot password. Tradition at this point."
    },
    callerId: { number: "(330) 555-0100", location: "Brookfield, OH" },
    dialogue: [
      { from: "agent", text: "HD ServiceDesk, this is Tier 1. How can I help?" },
      { from: "caller", text: "It's Rick. I forgot my password. I know. I know. Kyle's started a chart." },
      { from: "caller", text: "Also, I hear it's your last day of probation. Well done. Bev says you're 'alright', which from Bev is basically a knighthood." },
      { from: "agent", text: "Can I get your employee ID?" },
      { from: "caller", text: "HD-10002. I've got my phone this time. It's been nowhere near a dishwasher." }
    ],
    questions: [
      { ask: "Which site are you at?", answer: "Brookfield. My actual desk, for once." },
      { ask: "Have you got your phone?", answer: "In my hand. I'm looking at it. It's looking at me." }
    ],
    mfa: { result: "approved", line: "Push approved on Rick's registered phone. On the third try. He pressed the wrong button twice." },
    debrief: "It's Rick, it's his desk phone, and the MFA push was approved on his real phone. His password is new. He's already forgotten it."
  }

];
