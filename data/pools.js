/* =============================================================================
 * POOLS: raw material for the random caller generator (src/generator.js).
 * -----------------------------------------------------------------------------
 * A day asks for random callers with { procedural: n } in its `callers` list.
 * Each one is a brand-new employee (added to the directory for that shift, so
 * every desk tool knows them) plus a call, genuine or attacker. Attackers get
 * one tell that the day's rules can catch.
 *
 * Lines can use these placeholders:
 *   {name} {first} {id} {dept} {site} {manager} {app} {detail}
 * Add as many lines as you like; the generator picks at random (the same picks
 * for the same saved game, so a reload doesn't reshuffle the day).
 * ========================================================================== */
export const POOLS = {
  firstNames: [
    "Alex", "Bea", "Chidi", "Dana", "Eli", "Fatima", "Gus", "Hiro", "Ines", "Jamal",
    "Kezia", "Lars", "Mina", "Nico", "Ola", "Pete", "Quinn", "Rosa", "Sanjay", "Tess",
    "Umar", "Val", "Wes", "Xena", "Yusuf", "Zoe", "Bram", "Cleo", "Dev", "Esme",
    "Femi", "Greta", "Hal", "Isla", "Joon", "Kit", "Lena", "Marta", "Noor", "Otis"
  ],
  lastNames: [
    "Abernathy", "Baptiste", "Castellano", "Dimitriou", "Eriksson", "Ferreira", "Gallagher", "Hollis",
    "Iwasaki", "Jablonski", "Kowalski", "Lindqvist", "Mbeki", "Nakamura", "Oyelaran", "Pennington",
    "Quigley", "Rasmussen", "Sorensen", "Thackeray", "Underwood", "Valdivia", "Wexley", "Yardley",
    "Zielinski", "Brightwater", "Cavendish", "Delacroix", "Fairweather", "Hargreaves", "Kettering", "Morrow"
  ],

  // Where generated employees work. `manager` is an existing employee id; the
  // new employee sits at that manager's site.
  departments: {
    Finance:     { manager: "HD-10540", titles: ["AP Clerk", "Billing Analyst", "Treasury Assistant", "Junior Accountant"] },
    Logistics:   { manager: "HD-11850", titles: ["Picker", "Shipping Clerk", "Inventory Controller", "Dock Lead"] },
    Sales:       { manager: "HD-10688", titles: ["Account Manager", "Sales Coordinator", "Bid Writer", "Sales Rep"] },
    Engineering: { manager: "HD-10950", titles: ["QA Engineer", "Software Engineer", "Build Engineer", "Data Engineer"] },
    Facilities:  { manager: "HD-10077", titles: ["Maintenance Tech", "Mailroom Clerk", "Office Assistant"] },
    IT:          { manager: "HD-12890", titles: ["Desktop Support Tech", "Network Analyst"] }
  },

  apps: ["ChartWorks", "the expense portal", "the VPN client", "PDF Wrangler", "the timesheet app", "the label printer driver", "TeamTalk"],

  // What the caller wants, by request type. `detail` goes on the intake form.
  requests: {
    password_reset: {
      problem: [
        "My password expired over the weekend and I can't log in.",
        "I changed my password yesterday and my brain deleted it overnight.",
        "It keeps saying my password is wrong, and I'm sure it isn't. Fairly sure."
      ],
      detail: ["Password expired.", "Forgot password.", "Password not accepted."]
    },
    account_unlock: {
      problem: [
        "I'm locked out. I may have tried my old password a few times. Or eleven.",
        "It says my account is locked and to contact the service desk. So, hi."
      ],
      detail: ["Locked out after failed logins.", "Account locked."]
    },
    access_request: {
      problem: [
        "I need access to the shared {dept} drive. My manager said to call you.",
        "Can I get added to the {dept} distribution list? I keep missing meetings."
      ],
      detail: ["Shared drive access.", "Distribution list access."]
    },
    software_install: {
      problem: [
        "I need {app} installed. It's on the approved list, I checked.",
        "{app} has vanished off my laptop. Can you put it back?"
      ],
      detail: ["Install {app}.", "Reinstall {app}."]
    },
    admin_access: {
      problem: [
        "I need local admin on my laptop for a day to set up {app}.",
        "I need admin rights on the {dept} file server to fix some folder permissions."
      ],
      detail: ["Local admin rights.", "Admin rights on a file server."]
    }
  },

  // How a caller opens, by mood. Any mood can be genuine or an attacker.
  openers: {
    polite: ["Hi there, it's {name} from {dept}. Sorry to bother you.", "Good morning! {name}, {dept}. Hope your day's going well."],
    rushed: ["{name}, {dept}, I'm in a hurry, sorry.", "Hi, {first} from {dept}, I've got two minutes, can we be quick?"],
    rude: ["Yeah, it's {name}. {dept}. Again.", "{name}. {dept}. I've been on hold for ages."],
    nervous: ["Um, hi, is this the help desk? It's {name}, in {dept}.", "Hello? Sorry, I'm {first}, from {dept}. I don't usually call."]
  },

  // Attackers lean on urgency or authority.
  pressure: [
    "My director needs this done in the next ten minutes.",
    "I'm about to walk into a client meeting, so whatever's fastest.",
    "The CEO asked for this personally, if that helps.",
    "Last time someone helped me without all the questions. That was nice."
  ],

  idLines: ["It's {id}.", "{id}.", "{id}, I think. Yes, {id}."],

  // Genuine callers away from their site (from Day 3, Caller ID won't match).
  travel: [
    { number: "(646) 555-0131", location: "New York, NY", line: "I'm at a conference in New York, so I'm on the hotel phone." },
    { number: "(312) 555-0174", location: "Chicago, IL", line: "I'm visiting a customer in Chicago this week." },
    { number: "+44 20 7946 0958", location: "London, UK", line: "I'm calling from a client's office in London." }
  ],

  // Where attackers really are, when the generator gives them a Caller ID tell.
  spoofed: [
    { number: "(888) 555-0166", location: "Unknown (VoIP)" },
    { number: "+63 2 5550 1475", location: "Manila, Philippines" },
    { number: "+7 495 555 0148", location: "Moscow, Russia" },
    { number: "(702) 555-0119", location: "Las Vegas, NV" }
  ]
};
