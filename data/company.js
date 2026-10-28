/* =============================================================================
 * COMPANY: the fictional employer and its reference data.
 * -----------------------------------------------------------------------------
 * Everything here is lookup data the engine and tools use. Nothing here is a
 * caller or a day. See data/schema.md for the full reference.
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
  departments: ["Executive", "Facilities", "Finance", "IT", "Logistics", "Sales"],

  // Every request a caller can make. A caller's `claims.request` must be one of these keys.
  //   label       - what the intake form shows
  //   privileged  - true for admin-level requests (Day 4 adds a manager-callback rule for these)
  requestTypes: {
    password_reset:   { label: "Password reset",            privileged: false },
    account_unlock:   { label: "Account unlock",            privileged: false },
    access_request:   { label: "Access request",            privileged: false },
    software_install: { label: "Software install",          privileged: false },
    admin_access:     { label: "Admin / privileged access", privileged: true }
  }
};
