/* =============================================================================
 * DIRECTORY: the "truth" database. Every real employee lives here.
 * -----------------------------------------------------------------------------
 * The desk tools (AD Lookup, HR Roster, Org Chart, Ticket History) all read
 * from this list. Callers do NOT live here; a caller only *claims* to be one
 * of these people (see callers.js). Attackers can claim IDs that don't exist.
 *
 * Employee fields:
 *   id          string   Employee ID. Must match company.employeeIdPattern.
 *   name        string   Legal name exactly as AD spells it.
 *   aliases     string[] Optional. Nicknames that also count as a name match ("Rick").
 *   title       string   Job title.
 *   department  string   One of company.departments.
 *   site        string   A company.sites id ("BRK", "DEN", "LDS").
 *   manager     string|null  Manager's employee id. null for the CEO.
 *   phone       string   Desk number on file. Use 555-01xx numbers (reserved as fictional).
 *                        "Call desk phone" (Day 6) rings this number.
 *   devices     string[] Optional. Asset tags of the laptops and PCs assigned to them
 *                        ("LT-40100"). AD Lookup shows them, and searching a tag finds
 *                        its owner (Day 8 remote sessions and lost laptops).
 *   ad: {                Active Directory account (AD Lookup)
 *     status     "active" | "disabled" | "locked"
 *     lastLogon  string  Free text shown as-is ("Today 08:52", "3 weeks ago").
 *     groups     string[] Security groups. Privileged ones matter from Day 4.
 *   }
 *   hr: {                HR Roster record
 *     status     "active" | "terminated" | "leave"
 *     startDate  "YYYY-MM-DD"
 *     endDate    "YYYY-MM-DD" | null   termination date, or the date leave ends
 *     note       string   Optional. Shown on the HR Roster ("Parental leave").
 *     address    string   Optional. Home address on file. Replacement laptops may
 *                         ship here or to the employee's site (Day 8).
 *     type       "employee" | "contractor"   Optional, default employee. For a
 *                         contractor, endDate is when the contract ends and their
 *                         manager is their sponsor (Day 9 extensions).
 *     handoverTo string   Optional, leavers only. Employee id HR approved to receive
 *                         the leaver's mailbox and files (Day 7).
 *   }
 *   tickets      Optional. Recent tickets, newest first (Ticket History):
 *                  { id: "INC-40112", when: "Mon 08:14", type: a company.requestTypes key,
 *                    summary: "...", status: "Resolved" | "Open" | "Closed - no response" }
 *
 * The game's "today" is late October 2026, so dates near 2026-10-28 read as recent.
 * ========================================================================== */
export const DIRECTORY = [
  // ---- Executive -----------------------------------------------------------
  {
    // The exec who always forgets his password.
    id: "HD-10002", name: "Richard Halvorsen", aliases: ["Rick Halvorsen", "Rick"],
    title: "Chief Executive Officer", department: "Executive", site: "BRK", manager: null,
    phone: "(330) 555-0100", devices: ["LT-40100"],
    ad: { status: "locked", lastLogon: "Yesterday 22:14", groups: ["All Staff", "Executive Team", "VIP Support"] },
    hr: { status: "active", startDate: "2004-01-05", endDate: null, address: "3 Elm Row, Brookfield, OH" },
    tickets: [
      { id: "INC-40977", when: "Yesterday 21:58", type: "password_reset", summary: "Forgot password. Again. Wrote it on a napkin, lost napkin.", status: "Resolved" },
      { id: "INC-40731", when: "Mon 07:40", type: "password_reset", summary: "Forgot password after the weekend.", status: "Resolved" },
      { id: "INC-40388", when: "Last Thu", type: "other", summary: "Asked if the internet was down. It was airplane mode.", status: "Resolved" }
    ]
  },

  {
    // Rick's assistant. Knows everything, approves nothing.
    id: "HD-13077", name: "Kyle Ferraro",
    title: "Executive Assistant to the CEO", department: "Executive", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0105", devices: ["LT-43010"],
    ad: { status: "active", lastLogon: "Today 07:02", groups: ["All Staff", "Exec-Office-Delegates"] },
    hr: { status: "active", startDate: "2022-01-10", endDate: null, address: "61 Warren Street, Brookfield, OH" }
  },
  {
    // HR. Approves leaver handovers, and knows where the bodies are buried (metaphorically).
    id: "HD-12230", name: "Lorraine Feeney",
    title: "HR Business Partner", department: "HR", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0114", devices: ["LT-43141"],
    ad: { status: "active", lastLogon: "Today 08:10", groups: ["All Staff", "HR-Team", "HRIS-Admins"] },
    hr: { status: "active", startDate: "2014-05-19", endDate: null, address: "27 Lakeview Drive, Brookfield, OH" }
  },

  // ---- Facilities ----------------------------------------------------------
  {
    id: "HD-10077", name: "Gloria Okafor",
    title: "Facilities Manager", department: "Facilities", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0131", devices: ["LT-40231"],
    ad: { status: "active", lastLogon: "Today 07:58", groups: ["All Staff", "BRK-Facilities", "Badge Admins"] },
    hr: { status: "active", startDate: "2012-06-18", endDate: null, address: "40 Maple Court, Brookfield, OH" }
  },
  {
    // The nice receptionist.
    id: "HD-10423", name: "Priya Raman",
    title: "Receptionist", department: "Facilities", site: "BRK", manager: "HD-10077",
    phone: "(330) 555-0142", devices: ["LT-40362"],
    ad: { status: "locked", lastLogon: "12 days ago", groups: ["All Staff", "BRK-Front Desk", "Visitor Mgmt"] },
    hr: { status: "active", startDate: "2019-03-11", endDate: null, address: "77 Kinsman Road, Brookfield, OH" },
    tickets: [
      { id: "INC-38820", when: "3 weeks ago", type: "other", summary: "Brought the desk cookies. Not a ticket, but logged for morale.", status: "Closed" }
    ]
  },
  {
    id: "HD-12415", name: "Wendy Achterberg",
    title: "Office Coordinator", department: "Facilities", site: "DEN", manager: "HD-10077",
    phone: "(303) 555-0122", devices: ["LT-40493"],
    ad: { status: "active", lastLogon: "Today 07:15", groups: ["All Staff", "DEN-Office", "Visitor Mgmt"] },
    hr: { status: "active", startDate: "2022-08-01", endDate: null, address: "114 Federal Boulevard, Denver, CO" }
  },

  // ---- Logistics -----------------------------------------------------------
  {
    id: "HD-10311", name: "Teresa Vu",
    title: "Director of Logistics", department: "Logistics", site: "DEN", manager: "HD-10002",
    phone: "(303) 555-0117", devices: ["LT-40624"],
    ad: { status: "active", lastLogon: "Today 06:40", groups: ["All Staff", "DEN-Logistics", "WMS-Admins"] },
    hr: { status: "active", startDate: "2010-09-01", endDate: null, address: "151 Colfax Avenue, Denver, CO" }
  },
  {
    // The angry warehouse manager.
    id: "HD-11850", name: "Dale Brannigan",
    title: "Warehouse Manager", department: "Logistics", site: "DEN", manager: "HD-10311",
    phone: "(303) 555-0163", devices: ["LT-40755"],
    ad: { status: "active", lastLogon: "Today 05:12", groups: ["All Staff", "DEN-Warehouse", "WMS-Users", "WMS-Supervisors"] },
    hr: { status: "active", startDate: "2015-02-23", endDate: null, address: "8 Downing Street, Denver, CO" },
    tickets: [
      { id: "INC-40804", when: "Mon 06:02", type: "software_install", summary: "Scanner sync app missing on dock PC 4.", status: "Resolved" },
      { id: "INC-40112", when: "Last Wed", type: "software_install", summary: "Scanner sync app missing on dock PC 4. Caller used capital letters.", status: "Resolved" }
    ]
  },
  {
    id: "HD-12588", name: "Carla Mendes",
    title: "Forklift Team Lead", department: "Logistics", site: "DEN", manager: "HD-11850",
    phone: "(720) 555-0158", devices: ["LT-40886"],
    ad: { status: "locked", lastLogon: "Yesterday 14:31", groups: ["All Staff", "DEN-Warehouse", "WMS-Users"] },
    hr: { status: "active", startDate: "2020-05-04", endDate: null, address: "45 York Street, Denver, CO" }
  },

  {
    // Let go on Friday. Dale is not sad about it.
    id: "HD-12644", name: "Kurt Lindgren",
    title: "Picker", department: "Logistics", site: "DEN", manager: "HD-11850",
    phone: "(303) 555-0181", devices: ["PC-00004"],
    ad: { status: "disabled", lastLogon: "4 days ago", groups: ["All Staff", "DEN-Warehouse", "WMS-Users"] },
    hr: { status: "terminated", startDate: "2023-07-03", endDate: "2026-10-30", address: "302 Sheridan Boulevard, Denver, CO", handoverTo: "HD-11850", note: "Files handed over to Dale Brannigan" }
  },
  {
    // A contractor whose contract ran out in August. Her VPN account didn't.
    id: "HD-13355", name: "Lucia Marchetti",
    title: "Contract Inventory Analyst", department: "Logistics", site: "DEN", manager: "HD-10311",
    phone: "(720) 555-0145", devices: ["LT-43272"],
    ad: { status: "active", lastLogon: "8 weeks ago", groups: ["All Staff", "DEN-Logistics", "VPN-Users"] },
    hr: { status: "terminated", type: "contractor", startDate: "2026-02-02", endDate: "2026-08-28", address: "77 Bannock Street, Denver, CO", note: "Contract ended" }
  },

  // ---- Finance -------------------------------------------------------------
  {
    id: "HD-10540", name: "Marguerite Dunleavy",
    title: "Finance Controller", department: "Finance", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0108", devices: ["LT-41017"],
    ad: { status: "active", lastLogon: "Today 08:31", groups: ["All Staff", "FIN-Controllers", "SAP-Approvers", "AP-BankChanges"] },
    hr: { status: "active", startDate: "2008-11-03", endDate: null, address: "82 Chestnut Way, Brookfield, OH" }
  },
  {
    id: "HD-12266", name: "Jonathan Whittaker", aliases: ["Jon Whittaker"],
    title: "Accounts Payable Specialist", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0176", devices: ["LT-41148"],
    ad: { status: "active", lastLogon: "Today 08:47", groups: ["All Staff", "FIN-AP", "SAP-Users"] },
    hr: { status: "active", startDate: "2021-04-12", endDate: null, address: "119 Hubbard Road, Brookfield, OH" }
  },
  {
    id: "HD-11204", name: "Marcus Bell",
    title: "Payroll Specialist", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0185", devices: ["LT-41279"],
    ad: { status: "active", lastLogon: "Today 08:02", groups: ["All Staff", "FIN-Payroll", "SAP-Users"] },
    hr: { status: "active", startDate: "2017-10-16", endDate: null, address: "156 Ridge Road, Brookfield, OH" }
  },
  {
    // Terminated last week. Someone forgot to disable his AD account.
    id: "HD-11477", name: "Gordon Fitch",
    title: "Senior Accountant", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0191", devices: ["LT-41410"],
    ad: { status: "active", lastLogon: "9 days ago", groups: ["All Staff", "FIN-GL", "SAP-Users", "VPN-Users"] },
    hr: { status: "terminated", startDate: "2014-03-03", endDate: "2026-10-20", address: "13 Willow Bend, Brookfield, OH", handoverTo: "HD-10540", note: "Mailbox and files handed over to Marguerite Dunleavy" }
  },

  {
    // Treasury. One of the few people allowed to change a supplier's bank details.
    id: "HD-12480", name: "Oksana Brandt",
    title: "Treasury Specialist", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0172", devices: ["LT-43403"],
    ad: { status: "active", lastLogon: "Today 08:15", groups: ["All Staff", "FIN-Treasury", "SAP-Users", "AP-BankChanges"] },
    hr: { status: "active", startDate: "2019-08-05", endDate: null, address: "9 Fowler Street, Brookfield, OH" }
  },

  // ---- Sales ---------------------------------------------------------------
  {
    id: "HD-10688", name: "Imogen Castellanos",
    title: "VP Sales, EMEA", department: "Sales", site: "LDS", manager: "HD-10002",
    phone: "+44 113 496 0123", devices: ["LT-41541"],
    ad: { status: "active", lastLogon: "Today 04:05", groups: ["All Staff", "Sales-EMEA", "CRM-Admins"] },
    hr: { status: "active", startDate: "2016-07-04", endDate: null, address: "50 Meanwood Close, Leeds, UK" }
  },
  {
    id: "HD-13001", name: "Felix Ambrose",
    title: "Account Executive", department: "Sales", site: "LDS", manager: "HD-10688",
    phone: "+44 113 496 0187", devices: ["LT-41672"],
    ad: { status: "active", lastLogon: "Yesterday 17:02", groups: ["All Staff", "Sales-EMEA", "CRM-Users"] },
    hr: { status: "active", startDate: "2023-01-09", endDate: null, address: "87 Kirkgate Mews, Leeds, UK" }
  },
  {
    // On parental leave. Policy says escalate.
    id: "HD-12033", name: "Owen Pritchard",
    title: "Account Executive", department: "Sales", site: "LDS", manager: "HD-10688",
    phone: "+44 113 496 0144", devices: ["LT-41803"],
    ad: { status: "active", lastLogon: "5 weeks ago", groups: ["All Staff", "Sales-EMEA", "CRM-Users"] },
    hr: { status: "leave", startDate: "2021-02-15", endDate: "2026-12-01", address: "124 Otley Road, Leeds, UK", note: "Parental leave" }
  },
  {
    // Terminated three weeks ago. AD account still active.
    id: "HD-12907", name: "Nadia Petrov",
    title: "Inside Sales Rep", department: "Sales", site: "DEN", manager: "HD-10688",
    phone: "(720) 555-0139", devices: ["LT-41934"],
    ad: { status: "active", lastLogon: "19 days ago", groups: ["All Staff", "Sales-US", "CRM-Users"] },
    hr: { status: "terminated", startDate: "2022-05-16", endDate: "2026-10-09", address: "161 Colfax Avenue, Denver, CO" },
    tickets: [
      { id: "INC-39950", when: "3 weeks ago", type: "access_request", summary: "Asked for an export of the full CRM contact list.", status: "Closed - denied" }
    ]
  },
  {
    id: "HD-13122", name: "Hannah Liu",
    title: "Sales Operations Analyst", department: "Sales", site: "BRK", manager: "HD-10688",
    phone: "(330) 555-0127", devices: ["LT-42065"],
    ad: { status: "active", lastLogon: "Today 08:55", groups: ["All Staff", "Sales-US", "CRM-Users", "BI-Viewers"] },
    hr: { status: "active", startDate: "2024-06-03", endDate: null, address: "18 Bedford Road, Brookfield, OH" }
  },

  // ---- Engineering ---------------------------------------------------------
  {
    id: "HD-10950", name: "Aisha Karimi",
    title: "Engineering Manager", department: "Engineering", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0112", devices: ["LT-42196"],
    ad: { status: "active", lastLogon: "Today 08:20", groups: ["All Staff", "ENG-All", "ENG-Leads", "BuildFarm-Admins"] },
    hr: { status: "active", startDate: "2013-01-14", endDate: null, address: "55 Mill Street, Brookfield, OH" }
  },
  {
    id: "HD-11731", name: "Tomasz Nowak",
    title: "Software Engineer", department: "Engineering", site: "BRK", manager: "HD-10950",
    phone: "(330) 555-0168", devices: ["LT-42327"],
    ad: { status: "active", lastLogon: "Today 08:49", groups: ["All Staff", "ENG-All"] },
    hr: { status: "active", startDate: "2026-10-19", endDate: null, address: "92 Oakwood Drive, Brookfield, OH" },
    tickets: [
      { id: "INC-40652", when: "Last Mon", type: "other", summary: "New starter laptop setup.", status: "Resolved" }
    ]
  },

  {
    // A contractor whose contract ends this Friday. Wants more time.
    id: "HD-13340", name: "Sven Olafsson",
    title: "Contract Build Engineer", department: "Engineering", site: "BRK", manager: "HD-10950",
    phone: "(234) 555-0161", devices: ["LT-43534"],
    ad: { status: "active", lastLogon: "Today 08:41", groups: ["All Staff", "ENG-All", "VPN-Users"] },
    hr: { status: "active", type: "contractor", startDate: "2026-05-04", endDate: "2026-11-06", address: "40 Highland Avenue, Brookfield, OH" }
  },

  // ---- IT ------------------------------------------------------------------
  {
    // Your boss.
    id: "HD-12890", name: "Bev Kowalczyk",
    title: "Service Desk Manager", department: "IT", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0150", devices: ["LT-42458"],
    ad: { status: "active", lastLogon: "Today 07:30", groups: ["All Staff", "IT-ServiceDesk", "IT-Tier2", "Helpdesk-Admins"] },
    hr: { status: "active", startDate: "2011-03-14", endDate: null, address: "129 Elm Row, Brookfield, OH" }
  },
  {
    id: "HD-12701", name: "Raj Patel",
    title: "Tier 2 Support Engineer", department: "IT", site: "BRK", manager: "HD-12890",
    phone: "(330) 555-0153", devices: ["LT-42589"],
    ad: { status: "locked", lastLogon: "Today 08:58", groups: ["All Staff", "IT-ServiceDesk", "IT-Tier2"] },
    hr: { status: "active", startDate: "2018-09-24", endDate: null, address: "166 Maple Court, Brookfield, OH" },
    tickets: [
      { id: "INC-40990", when: "Today 08:59", type: "account_unlock", summary: "Locked himself out testing the lockout policy.", status: "Open" }
    ]
  },
  {
    // Security Operations. The only people who may ask the desk about someone else's account.
    id: "HD-12950", name: "Yusuf Adebayo",
    title: "Security Operations Lead", department: "IT", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0109", devices: ["LT-43665"],
    ad: { status: "active", lastLogon: "Today 06:55", groups: ["All Staff", "SEC-Operations", "SIEM-Admins"] },
    hr: { status: "active", startDate: "2017-02-13", endDate: null, address: "5 Union Street, Brookfield, OH" }
  },
  {
    id: "HD-13260", name: "Mei Lindholm",
    title: "Security Analyst", department: "IT", site: "BRK", manager: "HD-12950",
    phone: "(330) 555-0137", devices: ["LT-43796"],
    ad: { status: "active", lastLogon: "Today 08:05", groups: ["All Staff", "SEC-Operations"] },
    hr: { status: "active", startDate: "2024-09-02", endDate: null, address: "33 Locust Avenue, Brookfield, OH" }
  }
];
