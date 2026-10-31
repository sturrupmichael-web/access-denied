/* =============================================================================
 * COMPANY: the fictional employer, its reference data, and shift timing.
 * -----------------------------------------------------------------------------
 * Everything here is lookup data the engine and tools use. Nothing here is a
 * caller or a day. See data/schema.md for how the files fit together.
 * ========================================================================== */
export const COMPANY = {
  // Shown in window titles and emails.
  name: "Halvorsen Dynamics",
  deskName: "HD ServiceDesk",

  // Regular expression (as a string) every real employee ID must match.
  // Used by the "employeeIdFormat" check. Escape backslashes: "\\d" not "\d".
  employeeIdPattern: "^HD-\\d{5}$",
  // Human-friendly example shown in the Policy Binder and in feedback.
  employeeIdExample: "HD-12345",

  // Offices. Employees reference a site by `id`.
  //   region     - used from Day 3 to compare against Caller ID location
  //   areaCodes  - phone prefixes that count as "local" for this site
  sites: [
    { id: "BRK", name: "Brookfield HQ", city: "Brookfield, OH", region: "US-East", areaCodes: ["330", "234"] },
    { id: "DEN", name: "Denver Distribution Center", city: "Denver, CO", region: "US-West", areaCodes: ["303", "720"] },
    { id: "LDS", name: "Leeds Office", city: "Leeds, UK", region: "UK", areaCodes: ["+44 113"] }
  ],

  // Department names exactly as AD spells them.
  departments: ["Engineering", "Executive", "Facilities", "Finance", "HR", "IT", "Logistics", "Sales"],

  // Every request a caller can make. A caller's `claims.request` must be one of these keys.
  // Ticket History entries use the same keys (or "other").
  //   label       - what the intake form shows
  //   privileged  - true for admin-level requests (Day 4 adds a manager-callback rule for these)
  //   needsGroup  - optional. The AD group the employee must be in to ask for this
  //                 (the "inRequiredGroup" check, Day 9)
  // The second week (Days 6 to 10) adds the requests from mfa_swap down. Each one has its
  // own rule in rules.js; they only come up once that rule is on.
  requestTypes: {
    password_reset:    { label: "Password reset",              privileged: false },
    account_unlock:    { label: "Account unlock",              privileged: false },
    access_request:    { label: "Access request",              privileged: false },
    software_install:  { label: "Software install",            privileged: false },
    admin_access:      { label: "Admin / privileged access",   privileged: true },
    mfa_swap:          { label: "MFA device swap",             privileged: false },
    info_readback:     { label: "Read back a user's details",  privileged: false },
    shared_access:     { label: "Shared mailbox / list access", privileged: false },
    leaver_access:     { label: "Leaver's mailbox or files",   privileged: false },
    remote_session:    { label: "Remote session",              privileged: false },
    lost_device:       { label: "Lost or stolen laptop",       privileged: false },
    vendor_change:     { label: "Vendor bank details change",  privileged: true, needsGroup: "AP-BankChanges" },
    account_extension: { label: "Contractor / VPN extension",  privileged: true },
    other:             { label: "Other",                       privileged: false }
  },

  // Second-week reference data, shown in the Policy Binder once the rule that uses it is on.
  // The AD group whose members may ask for someone else's details (rule "no-readback").
  securityGroup: "SEC-Operations",
  // The only remote support tool the desk will install or connect with (rule "remote-tool").
  approvedRemoteTool: "HD Assist",
  // The longest contractor extension Tier 1 can grant, in days (rule "contractor-extension").
  maxExtensionDays: 90,

  // The shift clock. In-game time runs from `start` to `end` over `realSeconds` of real
  // time (480 real seconds for 8 game hours = one game minute per real second). The clock
  // pauses while a dialog (briefing, call review) is open.
  shift: {
    start: "09:00",
    end: "17:00",
    realSeconds: 480,
    // A genuine caller whose call takes longer than this (game minutes, from Answer to
    // stamp) rates the call one point lower.
    slowCallMinutes: 20
  },

  // Game minutes that actions add on top of the running clock.
  timeCosts: {
    question: 3,   // each "Ask a question"
    callback: 8,   // "Call manager": dialing out, waiting, explaining
    mfa: 4,        // "Send MFA push": waiting for someone to find their phone
    deskCallback: 5,  // "Call desk phone": hanging up and ringing the number on file
    ownerCallback: 8, // "Call group owner": finding out who that even is
    escalate: 10   // handing the call to Tier 2 takes a while
  }
};
