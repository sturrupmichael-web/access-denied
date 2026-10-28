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
 *   callerId: {          What the phone system shows (Caller ID tool).
 *     number      string
 *     location    string   Where the number geolocates.
 *   }
 *   dialogue     Array of lines, typed out in order:
 *                  { from: "caller" | "agent", text: "...", pause: ms (optional) }
 *   questions    Optional. Up to 3 canned verification questions for the
 *                "Ask a question" menu. Each costs company.timeCosts.question
 *                minutes. Answers can reveal (or rule out) a tell:
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
      "This time they spelled everything right. They're learning."
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
    debrief: "Dale again, still angry, still legitimate. His Ticket History shows the same problem twice before. Kurt has some explaining to do."
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
    debrief: "Priya, being lovely. Everything matches."
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
  }
];
