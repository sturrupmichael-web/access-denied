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
    phone: "(330) 555-0100",
    ad: { status: "locked", lastLogon: "Yesterday 22:14", groups: ["All Staff", "Executive Team", "VIP Support"] },
    hr: { status: "active", startDate: "2004-01-05", endDate: null },
    tickets: [
      { id: "INC-40977", when: "Yesterday 21:58", type: "password_reset", summary: "Forgot password. Again. Wrote it on a napkin, lost napkin.", status: "Resolved" },
      { id: "INC-40731", when: "Mon 07:40", type: "password_reset", summary: "Forgot password after the weekend.", status: "Resolved" },
      { id: "INC-40388", when: "Last Thu", type: "other", summary: "Asked if the internet was down. It was airplane mode.", status: "Resolved" }
    ]
  },

  // ---- Facilities ----------------------------------------------------------
  {
    id: "HD-10077", name: "Gloria Okafor",
    title: "Facilities Manager", department: "Facilities", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0131",
    ad: { status: "active", lastLogon: "Today 07:58", groups: ["All Staff", "BRK-Facilities", "Badge Admins"] },
    hr: { status: "active", startDate: "2012-06-18", endDate: null }
  },
  {
    // The nice receptionist.
    id: "HD-10423", name: "Priya Raman",
    title: "Receptionist", department: "Facilities", site: "BRK", manager: "HD-10077",
    phone: "(330) 555-0142",
    ad: { status: "locked", lastLogon: "12 days ago", groups: ["All Staff", "BRK-Front Desk", "Visitor Mgmt"] },
    hr: { status: "active", startDate: "2019-03-11", endDate: null },
    tickets: [
      { id: "INC-38820", when: "3 weeks ago", type: "other", summary: "Brought the desk cookies. Not a ticket, but logged for morale.", status: "Closed" }
    ]
  },
  {
    id: "HD-12415", name: "Wendy Achterberg",
    title: "Office Coordinator", department: "Facilities", site: "DEN", manager: "HD-10077",
    phone: "(303) 555-0122",
    ad: { status: "active", lastLogon: "Today 07:15", groups: ["All Staff", "DEN-Office", "Visitor Mgmt"] },
    hr: { status: "active", startDate: "2022-08-01", endDate: null }
  },

  // ---- Logistics -----------------------------------------------------------
  {
    id: "HD-10311", name: "Teresa Vu",
    title: "Director of Logistics", department: "Logistics", site: "DEN", manager: "HD-10002",
    phone: "(303) 555-0117",
    ad: { status: "active", lastLogon: "Today 06:40", groups: ["All Staff", "DEN-Logistics", "WMS-Admins"] },
    hr: { status: "active", startDate: "2010-09-01", endDate: null }
  },
  {
    // The angry warehouse manager.
    id: "HD-11850", name: "Dale Brannigan",
    title: "Warehouse Manager", department: "Logistics", site: "DEN", manager: "HD-10311",
    phone: "(303) 555-0163",
    ad: { status: "active", lastLogon: "Today 05:12", groups: ["All Staff", "DEN-Warehouse", "WMS-Users", "WMS-Supervisors"] },
    hr: { status: "active", startDate: "2015-02-23", endDate: null },
    tickets: [
      { id: "INC-40804", when: "Mon 06:02", type: "software_install", summary: "Scanner sync app missing on dock PC 4.", status: "Resolved" },
      { id: "INC-40112", when: "Last Wed", type: "software_install", summary: "Scanner sync app missing on dock PC 4. Caller used capital letters.", status: "Resolved" }
    ]
  },
  {
    id: "HD-12588", name: "Carla Mendes",
    title: "Forklift Team Lead", department: "Logistics", site: "DEN", manager: "HD-11850",
    phone: "(720) 555-0158",
    ad: { status: "locked", lastLogon: "Yesterday 14:31", groups: ["All Staff", "DEN-Warehouse", "WMS-Users"] },
    hr: { status: "active", startDate: "2020-05-04", endDate: null }
  },

  // ---- Finance -------------------------------------------------------------
  {
    id: "HD-10540", name: "Marguerite Dunleavy",
    title: "Finance Controller", department: "Finance", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0108",
    ad: { status: "active", lastLogon: "Today 08:31", groups: ["All Staff", "FIN-Controllers", "SAP-Approvers"] },
    hr: { status: "active", startDate: "2008-11-03", endDate: null }
  },
  {
    id: "HD-12266", name: "Jonathan Whittaker", aliases: ["Jon Whittaker"],
    title: "Accounts Payable Specialist", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0176",
    ad: { status: "active", lastLogon: "Today 08:47", groups: ["All Staff", "FIN-AP", "SAP-Users"] },
    hr: { status: "active", startDate: "2021-04-12", endDate: null }
  },
  {
    id: "HD-11204", name: "Marcus Bell",
    title: "Payroll Specialist", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0185",
    ad: { status: "active", lastLogon: "Today 08:02", groups: ["All Staff", "FIN-Payroll", "SAP-Users"] },
    hr: { status: "active", startDate: "2017-10-16", endDate: null }
  },
  {
    // Terminated last week. Someone forgot to disable his AD account.
    id: "HD-11477", name: "Gordon Fitch",
    title: "Senior Accountant", department: "Finance", site: "BRK", manager: "HD-10540",
    phone: "(330) 555-0191",
    ad: { status: "active", lastLogon: "9 days ago", groups: ["All Staff", "FIN-GL", "SAP-Users", "VPN-Users"] },
    hr: { status: "terminated", startDate: "2014-03-03", endDate: "2026-10-20" }
  },

  // ---- Sales ---------------------------------------------------------------
  {
    id: "HD-10688", name: "Imogen Castellanos",
    title: "VP Sales, EMEA", department: "Sales", site: "LDS", manager: "HD-10002",
    phone: "+44 113 496 0123",
    ad: { status: "active", lastLogon: "Today 04:05", groups: ["All Staff", "Sales-EMEA", "CRM-Admins"] },
    hr: { status: "active", startDate: "2016-07-04", endDate: null }
  },
  {
    id: "HD-13001", name: "Felix Ambrose",
    title: "Account Executive", department: "Sales", site: "LDS", manager: "HD-10688",
    phone: "+44 113 496 0187",
    ad: { status: "active", lastLogon: "Yesterday 17:02", groups: ["All Staff", "Sales-EMEA", "CRM-Users"] },
    hr: { status: "active", startDate: "2023-01-09", endDate: null }
  },
  {
    // On parental leave. Policy says escalate.
    id: "HD-12033", name: "Owen Pritchard",
    title: "Account Executive", department: "Sales", site: "LDS", manager: "HD-10688",
    phone: "+44 113 496 0144",
    ad: { status: "active", lastLogon: "5 weeks ago", groups: ["All Staff", "Sales-EMEA", "CRM-Users"] },
    hr: { status: "leave", startDate: "2021-02-15", endDate: "2026-12-01", note: "Parental leave" }
  },
  {
    // Terminated three weeks ago. AD account still active.
    id: "HD-12907", name: "Nadia Petrov",
    title: "Inside Sales Rep", department: "Sales", site: "DEN", manager: "HD-10688",
    phone: "(720) 555-0139",
    ad: { status: "active", lastLogon: "19 days ago", groups: ["All Staff", "Sales-US", "CRM-Users"] },
    hr: { status: "terminated", startDate: "2022-05-16", endDate: "2026-10-09" },
    tickets: [
      { id: "INC-39950", when: "3 weeks ago", type: "access_request", summary: "Asked for an export of the full CRM contact list.", status: "Closed - denied" }
    ]
  },
  {
    id: "HD-13122", name: "Hannah Liu",
    title: "Sales Operations Analyst", department: "Sales", site: "BRK", manager: "HD-10688",
    phone: "(330) 555-0127",
    ad: { status: "active", lastLogon: "Today 08:55", groups: ["All Staff", "Sales-US", "CRM-Users", "BI-Viewers"] },
    hr: { status: "active", startDate: "2024-06-03", endDate: null }
  },

  // ---- Engineering ---------------------------------------------------------
  {
    id: "HD-10950", name: "Aisha Karimi",
    title: "Engineering Manager", department: "Engineering", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0112",
    ad: { status: "active", lastLogon: "Today 08:20", groups: ["All Staff", "ENG-All", "ENG-Leads", "BuildFarm-Admins"] },
    hr: { status: "active", startDate: "2013-01-14", endDate: null }
  },
  {
    id: "HD-11731", name: "Tomasz Nowak",
    title: "Software Engineer", department: "Engineering", site: "BRK", manager: "HD-10950",
    phone: "(330) 555-0168",
    ad: { status: "active", lastLogon: "Today 08:49", groups: ["All Staff", "ENG-All"] },
    hr: { status: "active", startDate: "2026-10-19", endDate: null },
    tickets: [
      { id: "INC-40652", when: "Last Mon", type: "other", summary: "New starter laptop setup.", status: "Resolved" }
    ]
  },

  // ---- IT ------------------------------------------------------------------
  {
    // Your boss.
    id: "HD-12890", name: "Bev Kowalczyk",
    title: "Service Desk Manager", department: "IT", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0150",
    ad: { status: "active", lastLogon: "Today 07:30", groups: ["All Staff", "IT-ServiceDesk", "IT-Tier2", "Helpdesk-Admins"] },
    hr: { status: "active", startDate: "2011-03-14", endDate: null }
  },
  {
    id: "HD-12701", name: "Raj Patel",
    title: "Tier 2 Support Engineer", department: "IT", site: "BRK", manager: "HD-12890",
    phone: "(330) 555-0153",
    ad: { status: "locked", lastLogon: "Today 08:58", groups: ["All Staff", "IT-ServiceDesk", "IT-Tier2"] },
    hr: { status: "active", startDate: "2018-09-24", endDate: null },
    tickets: [
      { id: "INC-40990", when: "Today 08:59", type: "account_unlock", summary: "Locked himself out testing the lockout policy.", status: "Open" }
    ]
  }
];
