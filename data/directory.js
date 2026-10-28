/* =============================================================================
 * DIRECTORY: the "truth" database. Every real employee lives here.
 * -----------------------------------------------------------------------------
 * The desk tools (AD Lookup, HR Roster, Org Chart) all read from this list.
 * Callers do NOT live here; a caller only *claims* to be one of these people
 * (see callers.js). Attackers can claim IDs that don't exist at all.
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
 *   ad: {                Active Directory account
 *     status     "active" | "disabled" | "locked"
 *     lastLogon  string  Free text shown as-is ("Today 08:52", "3 weeks ago").
 *     groups     string[] Security groups. Privileged ones matter from Day 4.
 *   }
 *   hr: {                HR Roster record (tool arrives in Phase 2)
 *     status     "active" | "terminated" | "leave"
 *     startDate  "YYYY-MM-DD"
 *     endDate    "YYYY-MM-DD" | null   termination or leave end date
 *   }
 *   tickets      Optional. Recent tickets for the Ticket History tool (Phase 2).
 * ========================================================================== */
export const DIRECTORY = [
  {
    id: "HD-10002", name: "Richard Halvorsen", aliases: ["Rick Halvorsen", "Rick"],
    title: "Chief Executive Officer", department: "Executive", site: "BRK", manager: null,
    phone: "(330) 555-0100",
    ad: { status: "active", lastLogon: "Yesterday 22:14", groups: ["All Staff", "Executive Team", "VIP Support"] },
    hr: { status: "active", startDate: "2004-01-05", endDate: null }
  },
  {
    id: "HD-10077", name: "Gloria Okafor",
    title: "Facilities Manager", department: "Facilities", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0131",
    ad: { status: "active", lastLogon: "Today 07:58", groups: ["All Staff", "BRK-Facilities", "Badge Admins"] },
    hr: { status: "active", startDate: "2012-06-18", endDate: null }
  },
  {
    id: "HD-10423", name: "Priya Raman",
    title: "Receptionist", department: "Facilities", site: "BRK", manager: "HD-10077",
    phone: "(330) 555-0142",
    ad: { status: "locked", lastLogon: "12 days ago", groups: ["All Staff", "BRK-Front Desk", "Visitor Mgmt"] },
    hr: { status: "active", startDate: "2019-03-11", endDate: null }
  },
  {
    id: "HD-10311", name: "Teresa Vu",
    title: "Director of Logistics", department: "Logistics", site: "DEN", manager: "HD-10002",
    phone: "(303) 555-0117",
    ad: { status: "active", lastLogon: "Today 06:40", groups: ["All Staff", "DEN-Logistics", "WMS-Admins"] },
    hr: { status: "active", startDate: "2010-09-01", endDate: null }
  },
  {
    id: "HD-11850", name: "Dale Brannigan",
    title: "Warehouse Manager", department: "Logistics", site: "DEN", manager: "HD-10311",
    phone: "(303) 555-0163",
    ad: { status: "active", lastLogon: "Today 05:12", groups: ["All Staff", "DEN-Warehouse", "WMS-Users", "WMS-Supervisors"] },
    hr: { status: "active", startDate: "2015-02-23", endDate: null }
  },
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
    // Terminated in HR but nobody disabled the AD account. A Day 2 trap.
    id: "HD-12907", name: "Nadia Petrov",
    title: "Inside Sales Rep", department: "Sales", site: "DEN", manager: "HD-10688",
    phone: "(720) 555-0139",
    ad: { status: "active", lastLogon: "19 days ago", groups: ["All Staff", "Sales-US", "CRM-Users"] },
    hr: { status: "terminated", startDate: "2022-05-16", endDate: "2026-10-09" }
  },
  {
    id: "HD-12890", name: "Bev Kowalczyk",
    title: "Service Desk Manager", department: "IT", site: "BRK", manager: "HD-10002",
    phone: "(330) 555-0150",
    ad: { status: "active", lastLogon: "Today 07:30", groups: ["All Staff", "IT-ServiceDesk", "IT-Tier2", "Helpdesk-Admins"] },
    hr: { status: "active", startDate: "2011-03-14", endDate: null }
  }
];
