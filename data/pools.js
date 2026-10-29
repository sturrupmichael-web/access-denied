/* =============================================================================
 * POOLS: raw material for the random caller generator (src/generator.js).
 * -----------------------------------------------------------------------------
 * A day asks for random callers with { procedural: n } in its `callers` list.
 * Each one is a brand-new employee (added to the directory for that shift, so
 * every desk tool knows them) plus a call, genuine or attacker. Attackers get
 * one tell that the day's rules can catch.
 *
 * Every New game also adds `staffCount` background coworkers built from these
 * pools, so the directory is busier and different each game.
 *
 * Lines can use these placeholders:
 *   {name} {first} {id} {dept} {site} {manager} {app} {group} {device} {tool}
 *   {shipTo} {vendor} {days} {subject} {subjectFirst}
 * Add as many lines as you like; the generator picks at random (the same picks
 * for the same saved game, so a reload doesn't reshuffle the day).
 * Don't add first or last names containing "rick" or "nadia": the browser tests
 * search for those and expect one match.
 * ========================================================================== */
export const POOLS = {
  staffCount: 48,

  firstNames: [
    "Alex", "Bea", "Chidi", "Dana", "Eli", "Fatima", "Gus", "Hiro", "Ines", "Jamal",
    "Kezia", "Lars", "Mina", "Nico", "Ola", "Pete", "Quinn", "Rosa", "Sanjay", "Tess",
    "Umar", "Val", "Wes", "Xena", "Yara", "Zoe", "Bram", "Cleo", "Dev", "Esme",
    "Femi", "Greta", "Hal", "Isla", "Joon", "Kit", "Lena", "Marta", "Noor", "Otis",
    "Abena", "Bjorn", "Carmen", "Desmond", "Elif", "Farah", "Gideon", "Hana", "Idris", "Jolene",
    "Kofi", "Leila", "Mateo", "Nell", "Oren", "Pilar", "Rafael", "Saoirse", "Tariq", "Ulla",
    "Vikram", "Wanjiru", "Ximena", "Yosef", "Zainab", "Arjun", "Bronwyn", "Caspian", "Dagny", "Emeka",
    "Freya", "Gemma", "Hamish", "Ingrid", "Javier", "Kamala", "Linus", "Maeve", "Nnamdi", "Odette",
    "Paloma", "Ravi", "Sigrid", "Thandiwe", "Uriel", "Vera", "Winston", "Yuki", "Zeb", "Anouk",
    "Benedikt", "Cosima", "Dmitri", "Elodie", "Florin", "Gwen", "Hector", "Imani", "Jules", "Kasimir",
    "Lucien", "Mirela", "Nils", "Orla", "Pavel", "Rhiannon", "Soren", "Talia", "Ugo", "Wilhelmina"
  ],
  lastNames: [
    "Abernathy", "Baptiste", "Castellano", "Dimitriou", "Eriksson", "Ferreira", "Gallagher", "Hollis",
    "Iwasaki", "Jablonski", "Kowalski", "Lindqvist", "Mbeki", "Nakamura", "Oyelaran", "Pennington",
    "Quigley", "Rasmussen", "Sorensen", "Thackeray", "Underwood", "Valdivia", "Wexley", "Yardley",
    "Zielinski", "Brightwater", "Cavendish", "Delacroix", "Fairweather", "Hargreaves", "Kettering", "Morrow",
    "Achebe", "Bergstrom", "Chukwu", "Dragomir", "Esposito", "Fonseca", "Grabowski", "Haddad",
    "Ibarra", "Jovanovic", "Kaczmarek", "Lafleur", "Moreau", "Novak", "Okonkwo", "Papadakis",
    "Quintero", "Rosales", "Szabo", "Takahashi", "Uchenna", "Vasquez", "Whitlock", "Yilmaz",
    "Zamora", "Ashdown", "Blackwood", "Coppersmith", "Dunmore", "Ellsworth", "Foxley", "Greenhalgh",
    "Holloway", "Inglewood", "Juniper", "Kingsley", "Larkspur", "Merriweather", "Northcott", "Oakenfold",
    "Pemberton", "Ravensworth", "Stillwater", "Thornbury", "Upton", "Vane", "Winterbottom", "Ainsworth",
    "Bellamy", "Crowther", "Dewhurst", "Featherstone", "Goodfellow", "Honeycutt", "Ironside", "Jessop",
    "Kilbride", "Lockwood", "Mablethorpe", "Nettleton", "Ormerod", "Pickles", "Ramsbottom", "Shufflebotham"
  ],

  // Where generated employees work. `manager` is an existing employee id; the
  // new employee sits at that manager's site. `ad` overrides the AD department
  // name (Security Operations is part of IT), and `groups` are extra AD groups.
  departments: {
    Finance:     { manager: "HD-10540", titles: ["AP Clerk", "Billing Analyst", "Treasury Assistant", "Junior Accountant", "Credit Controller", "Payroll Assistant", "Expenses Auditor"] },
    Logistics:   { manager: "HD-11850", titles: ["Picker", "Shipping Clerk", "Inventory Controller", "Dock Lead", "Forklift Operator", "Returns Coordinator", "Route Planner"] },
    Sales:       { manager: "HD-10688", titles: ["Account Manager", "Sales Coordinator", "Bid Writer", "Sales Rep", "Customer Success Manager", "Pricing Analyst"] },
    Engineering: { manager: "HD-10950", titles: ["QA Engineer", "Software Engineer", "Build Engineer", "Data Engineer", "Site Reliability Engineer", "Firmware Engineer"] },
    Facilities:  { manager: "HD-10077", titles: ["Maintenance Tech", "Mailroom Clerk", "Office Assistant", "Security Guard", "Catering Coordinator"] },
    IT:          { manager: "HD-12890", titles: ["Desktop Support Tech", "Network Analyst", "Systems Administrator", "Service Desk Analyst"] },
    HR:          { manager: "HD-12230", titles: ["HR Advisor", "Recruiter", "Payroll and Benefits Officer", "Learning Coordinator"] },
    Executive:   { manager: "HD-10002", titles: ["Executive Assistant to the CFO", "Chief of Staff", "Board Liaison", "Office of the CEO Coordinator"] },
    "Security Operations": { ad: "IT", manager: "HD-12950", groups: ["SEC-Operations"], titles: ["Security Analyst", "Incident Responder", "Threat Hunter", "SOC Analyst"] }
  },
  // Departments random callers and staff come from. Security Operations and
  // Executive only appear when a call needs them.
  everyday: ["Finance", "Logistics", "Sales", "Engineering", "Facilities", "IT", "HR"],

  apps: [
    "ChartWorks", "the expense portal", "the VPN client", "PDF Wrangler", "the timesheet app", "the label printer driver",
    "TeamTalk", "SpreadsheetPro", "the CAD viewer", "the payroll portal", "the scanner sync app", "Visio-ish",
    "the training portal", "the badge printer software", "the route planner"
  ],

  // Street names for home addresses (HR Roster), by site id.
  streets: {
    BRK: ["Elm Row", "Maple Court", "Kinsman Road", "Orchard Lane", "Sharon Drive", "Warren Street", "Locust Avenue", "Chestnut Way", "Hubbard Road", "Ridge Road", "Willow Bend", "Union Street", "Pine Hollow Road", "Brookside Drive"],
    DEN: ["Larimer Street", "Pearl Street", "Tennyson Street", "Federal Boulevard", "Colfax Avenue", "York Street", "Sheridan Boulevard", "Lowell Boulevard", "Bannock Street", "Zuni Street"],
    LDS: ["Kirkgate Mews", "Otley Road", "Headingley Lane", "Chapel Allerton Grove", "Roundhay Terrace", "Meanwood Close", "Kirkstall Road", "Harehills Avenue"]
  },

  // What the caller wants, by request type. `problem` is how a genuine caller (or an
  // attacker with a generic tell) puts it; `detail` goes on the intake form.
  requests: {
    password_reset: {
      problem: [
        "My password expired over the weekend and I can't log in.",
        "I changed my password yesterday and my brain deleted it overnight.",
        "It keeps saying my password is wrong, and I'm sure it isn't. Fairly sure.",
        "I set a new password on Friday. It was very clever. I can't remember any of it.",
        "My cat walked on the keyboard during the password change screen. I don't know what she typed.",
        "I came back from holiday and my password is gone. Like the tan."
      ],
      detail: ["Password expired.", "Forgot password.", "Password not accepted.", "Forgot new password."]
    },
    account_unlock: {
      problem: [
        "I'm locked out. I may have tried my old password a few times. Or eleven.",
        "It says my account is locked and to contact the service desk. So, hi.",
        "My phone kept trying my old password all night, apparently. Now I'm locked out.",
        "I'm locked out and I have a presentation in twenty minutes. No pressure. Some pressure."
      ],
      detail: ["Locked out after failed logins.", "Account locked.", "Locked out by an old phone password."]
    },
    access_request: {
      problem: [
        "I need access to the shared {dept} drive. My manager said to call you.",
        "Can I get added to the {dept} reports folder? Everyone else has it but me.",
        "I've moved desks and lost my mapped drives. All of them. Even the one with the cat photos.",
        "I need read access to the {dept} dashboard. I promise only to read it."
      ],
      detail: ["Shared drive access.", "Reports folder access.", "Mapped drives missing.", "Dashboard access."]
    },
    software_install: {
      problem: [
        "I need {app} installed. It's on the approved list, I checked.",
        "{app} has vanished off my laptop. Can you put it back?",
        "{app} updated itself and now it just shows a spinning circle. Forever.",
        "My new laptop doesn't have {app} and I can't do my job without it. Well, I can, but slower."
      ],
      detail: ["Install {app}.", "Reinstall {app}.", "Repair {app}."]
    },
    admin_access: {
      problem: [
        "I need local admin on my laptop for a day to set up {app}.",
        "I need admin rights on the {dept} file server to fix some folder permissions.",
        "Can I have admin on the {dept} SharePoint site? The owner left and nobody can change anything."
      ],
      detail: ["Local admin rights.", "Admin rights on a file server.", "Site admin rights."]
    },
    mfa_swap: {
      problem: [
        "I got a new phone and my authenticator didn't come with it. Can you move it over?",
        "I dropped my phone in a pond. A small pond. Can you move my MFA to the new one?",
        "My phone upgrade arrived and the old one's been traded in. Now MFA keeps asking the old phone.",
        "I reset my phone to fix the battery and it wiped the authenticator app. Can you re-register me?"
      ],
      detail: ["New phone, move authenticator.", "Old phone lost, re-register MFA.", "Authenticator wiped."]
    },
    info_readback: {
      problem: [
        "We've had an alert on {subject}'s account. Can you read me their desk number and last logon so I can ring them?",
        "I'm looking at a suspicious login for {subject}. What manager and phone do you have on file for them?",
        "Quick one for an investigation: can you confirm {subject}'s mobile and site for me?"
      ],
      detail: ["Read back {subject}'s details.", "Confirm contact details for {subject}."]
    },
    shared_access: {
      problem: [
        "Can you add me to the {group} mailbox? I'm covering for someone this week.",
        "I need to be on {group}. I keep hearing about things after they've happened.",
        "My team said I should be on {group}. I've no idea what's on it, but they were insistent.",
        "Please put me on {group}. I'm told that's where all the important emails go to die."
      ],
      detail: ["Add to {group}.", "Join {group}."]
    },
    leaver_access: {
      problem: [
        "{subject} left last week and I need their files for a handover. Can you get me into their mailbox?",
        "I need {subject}'s project folders. They left and nobody's got the latest version of anything.",
        "{subject} has gone, and so have half our customer replies. Can I have their mailbox?"
      ],
      detail: ["Access to {subject}'s mailbox and files.", "Handover of {subject}'s files."]
    },
    remote_session: {
      problem: [
        "My laptop's doing that thing again. Can someone remote in? It's {device}.",
        "Outlook keeps crashing. Can you connect to my laptop and have a look? Asset tag {device}.",
        "My screen is upside down. Physically I'm the right way up. Can you remote in? {device}."
      ],
      detail: ["Remote session to {device} with {tool}.", "Remote support on {device} ({tool})."]
    },
    lost_device: {
      problem: [
        "I think I left my laptop on the train. It's {device}. Can you lock it and send me a new one?",
        "My laptop was stolen from my car. {device}. I need a replacement, and I need a lie down.",
        "I can't find my laptop anywhere. {device}. I've checked the fridge. Don't ask."
      ],
      detail: ["Lost laptop {device}: lock, wipe, replace to {shipTo}.", "Stolen laptop {device}: replacement to {shipTo}."]
    },
    vendor_change: {
      problem: [
        "{vendor} have changed banks. I need their payment details updated before Friday's run.",
        "I've got a letter from {vendor} with new bank details. Can you update the supplier record?",
        "{vendor} say we paid an old account last month. They've sent new details to use from now on."
      ],
      detail: ["Update bank details for {vendor}.", "New remittance account for {vendor}."]
    },
    account_extension: {
      problem: [
        "My contractor account runs out soon and the project doesn't. Can you extend it by {days} days?",
        "My VPN keeps warning me my account expires. Can I get {days} more days?",
        "They've renewed my contract, apparently. Can you extend my account by {days} days?"
      ],
      detail: ["Extend contractor account by {days} days.", "VPN access extension, {days} days."]
    }
  },

  // What attackers say instead, for the tells that come with the request itself.
  scams: {
    deskCallback: [
      "New phone, so the old authenticator's useless. Just move it to this number and we're done.",
      "I'm on my new phone right now. Can you register this one for MFA? Old one's gone for good."
    ],
    readbackOutsider: [
      "IT Security here. We're auditing accounts. Read me {subject}'s mobile and manager, please.",
      "I'm calling on behalf of the security team. Need {subject}'s phone number and last logon. Routine."
    ],
    readbackSpoof: [
      "Security Operations. I'm off-site, so I'm on my mobile. Read me {subject}'s desk number and manager.",
      "I'm working from home today. Can you give me {subject}'s mobile and last logon? Investigation."
    ],
    ownerDenies: [
      "I need access to {group}. The owner said it's fine, they're just in meetings all day.",
      "Can you add me to {group}? I'm helping out with month end. Everyone knows."
    ],
    noSuchGroup: [
      "Can you add me to {group}? It's the main one, you'll know it.",
      "I need to be on {group}. Everyone in my team is on it."
    ],
    leaverNotManager: [
      "{subject} left, and I was basically their manager. Open their mailbox for me, would you?",
      "Their manager asked me to grab {subject}'s files. They're busy. Just reopen the account for an hour."
    ],
    badTool: [
      "Our software vendor needs to fix my laptop. They said install {tool} and give them the code. It's {device}.",
      "Can you put {tool} on {device}? The supplier's support team only uses that."
    ],
    notTheirDevice: [
      "I need a remote session on {device}. It's mine. Well, it's the one I use.",
      "Can you connect to {device} with {tool}? I'm covering on that machine this week."
    ],
    badShipTo: [
      "My laptop got nicked. {device}. Can you send the new one to {shipTo}? I'm not at home.",
      "Lost it at the airport. {device}. Ship the replacement to {shipTo}, I'm staying there this week."
    ],
    lostNotTheirs: [
      "Laptop's gone. {device}. Lock it and send me a new one to {shipTo}.",
      "Someone took {device} from my desk. Can I get a replacement sent to {shipTo}?"
    ],
    notInGroup: [
      "I'm calling for the CFO. {vendor} have new bank details and it has to be done before the payment run.",
      "The CFO is on a plane and asked me to sort {vendor}'s new account details. Today, please."
    ],
    tooLong: [
      "Can you extend my account by {days} days? Saves us all doing this again.",
      "I'd like {days} more days on my account. Long project. Very long."
    ],
    notContractor: [
      "Can you extend my account by {days} days? It keeps saying it's going to expire.",
      "I got an email saying my account expires. Can you add {days} days to be safe?"
    ]
  },

  // How a caller opens, by mood. Any mood can be genuine or an attacker.
  openers: {
    polite: [
      "Hi there, it's {name} from {dept}. Sorry to bother you.",
      "Good morning! {name}, {dept}. Hope your day's going well.",
      "Hello! {first} here, {dept}. Is now a good time? It's never a good time, is it."
    ],
    rushed: [
      "{name}, {dept}, I'm in a hurry, sorry.",
      "Hi, {first} from {dept}, I've got two minutes, can we be quick?",
      "{first}, {dept}. I'm walking and talking, so forgive the wind noise."
    ],
    rude: [
      "Yeah, it's {name}. {dept}. Again.",
      "{name}. {dept}. I've been on hold for ages.",
      "It's {name}. I'm told you're the people who fix things. Prove it."
    ],
    nervous: [
      "Um, hi, is this the help desk? It's {name}, in {dept}.",
      "Hello? Sorry, I'm {first}, from {dept}. I don't usually call.",
      "Hi. {first}. {dept}. I've rehearsed this. Okay. Here goes."
    ],
    chatty: [
      "Hiya! {name}, {dept}. How's the weather your end? It's doing that sideways rain here.",
      "Hello, hello! {first} from {dept}. Lovely to speak to a human. The last thing I spoke to was the printer."
    ]
  },

  // Jokes and asides. A caller drops one in about half the time.
  asides: [
    "Also, the printer on the third floor is making a noise like a dying goose. Not my problem, just saying.",
    "Sorry, there's a fire drill. Not a real fire. I think. There's no smoke. Carry on.",
    "I've already turned it off and on again. Twice. The second time with feeling.",
    "My kid says it's because I have too many tabs open. I have 140 tabs open.",
    "Someone microwaved fish in the kitchen again. I just thought you should know.",
    "Is it true you can see everyone's screens? Don't answer that.",
    "I'd have emailed, but, well, that's sort of the problem.",
    "The coffee machine is broken too, if you do coffee machines.",
    "My manager says I'm not a 'computer person'. I'm a person. With a computer. Usually.",
    "I tried asking the chatbot. It asked me if I'd tried asking the chatbot.",
    "Sorry about the hold music. Who chose that? It's eleven minutes of one panpipe.",
    "Last time I called, the person told me a joke about UDP. I don't know if I got it.",
    "The office plant next to me has more uptime than my laptop.",
    "I'm calling from the stairwell because it's the only place with signal. And echo. Echo.",
    "My colleague says hi. She doesn't know you. She just says hi to everyone.",
    "I've got three monitors and somehow everything opens on the one that's switched off.",
    "Do you ever get calls from people who are just lonely? Asking for a friend. The friend is me.",
    "The Wi-Fi password on the meeting room poster is a password from 2019. Just flagging.",
    "Someone's put a sign on the server room door that says 'Narnia'. Is that you?",
    "I'm eating a sandwich, sorry. It's a big sandwich. It's a whole situation."
  ],

  // Attackers lean on urgency or authority.
  pressure: [
    "My director needs this done in the next ten minutes.",
    "I'm about to walk into a client meeting, so whatever's fastest.",
    "The CEO asked for this personally, if that helps.",
    "Last time someone helped me without all the questions. That was nice.",
    "If this isn't done by lunch, I'll have to tell them you held it up. Sorry. Not sorry.",
    "Look, I'm the one who'll get in trouble, not you. Just do it.",
    "We're being audited this afternoon. You don't want to be in the audit, trust me.",
    "Can we skip the script? I know how this works. I used to work on a help desk."
  ],

  idLines: ["It's {id}.", "{id}.", "{id}, I think. Yes, {id}.", "Hang on, it's on my badge. {id}.", "{id}. I know it by heart. Unlike my password."],

  // How a genuine caller signs off, now and then.
  closers: [
    "Thanks, you're a lifesaver.",
    "You're much nicer than the last person. Don't tell them.",
    "Brilliant. I'll stop panicking now. Mostly.",
    "Cheers. I owe you a coffee. From the broken machine, but still."
  ],

  // Genuine callers away from their site (from Day 3, Caller ID won't match).
  travel: [
    { number: "(646) 555-0131", location: "New York, NY", line: "I'm at a conference in New York, so I'm on the hotel phone." },
    { number: "(312) 555-0174", location: "Chicago, IL", line: "I'm visiting a customer in Chicago this week." },
    { number: "+44 20 7946 0958", location: "London, UK", line: "I'm calling from a client's office in London." },
    { number: "(415) 555-0126", location: "San Francisco, CA", line: "I'm at the trade show in San Francisco. It's all lanyards and free pens." },
    { number: "(305) 555-0143", location: "Miami, FL", line: "I'm at my sister's wedding in Miami. Working. At a wedding. Yes, I know." },
    { number: "+49 30 5550 1932", location: "Berlin, Germany", line: "I'm at the supplier's office in Berlin, on their guest phone." }
  ],

  // Where attackers really are, when the generator gives them a Caller ID tell.
  spoofed: [
    { number: "(888) 555-0166", location: "Unknown (VoIP)" },
    { number: "+63 2 5550 1475", location: "Manila, Philippines" },
    { number: "+7 495 555 0148", location: "Moscow, Russia" },
    { number: "(702) 555-0119", location: "Las Vegas, NV" },
    { number: "(877) 555-0182", location: "Unknown (prepaid)" },
    { number: "+234 1 555 0136", location: "Lagos, Nigeria" }
  ],

  // Remote tools attackers want installed. None of these is HD Assist.
  badRemoteTools: ["QuickSupportPro", "AnyConnectDesk", "RemoteBuddy Free", "ScreenPal Remote", "HelpLink Personal", "TotallySafeRDP"],

  // Where attackers want a replacement laptop sent.
  badShipTo: [
    "Unit 14, Dockside Self Storage, Elyria, OH",
    "Room 312, Airport Lodge, Cleveland, OH",
    "c/o Mail Boxes Plus, 88 Main St, Akron, OH",
    "A friend's place, 19 Canal Street, Pittsburgh, PA",
    "Locker 7, ParcelHub, Union Station, Denver, CO",
    "Flat 2, 41 Park Lane, Manchester, UK"
  ],

  // Suppliers for vendor bank changes.
  vendors: ["Kessler Steel", "Brightline Freight", "Okafor & Sons Pallets", "NorthGate Packaging", "Meridian Office Supply", "Teesdale Fasteners", "Bluewater Courier Co."],

  // Groups that don't exist (Groups tab), for the noSuchGroup tell.
  fakeGroups: ["Finance-Payroll-Admins", "Exec-Office-All", "Payroll-Exports", "HR-Confidential-2", "Global-Admins-Mail", "Board-Papers"],

  // A genuine caller's debrief sometimes ends with one of these.
  quips: [
    "They were nice about it, too.",
    "They'll tell everyone in the kitchen how helpful you were.",
    "They said thank you three times. One of them was sarcastic, but still.",
    "Somewhere, a team lead just un-clenched."
  ],

  // Background staff get a ticket now and then.
  staffTickets: [
    { type: "other", summary: "Asked if the cloud is a real cloud." },
    { type: "software_install", summary: "Wanted a screensaver of their dog installed. Approved, the dog is very good." },
    { type: "account_unlock", summary: "Locked out after typing password into the username box." },
    { type: "password_reset", summary: "Forgot password after a long weekend." },
    { type: "other", summary: "Reported the mouse was broken. Mouse was upside down." },
    { type: "access_request", summary: "Asked for access to 'the internet'. Clarified." }
  ]
};
