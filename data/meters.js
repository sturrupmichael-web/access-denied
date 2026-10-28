/* =============================================================================
 * METERS: the three bars in the taskbar, what moves them, and what happens
 * when they cross a line.
 * -----------------------------------------------------------------------------
 *   breach    0 to 100. Goes up when you approve an attacker. 100 = game over.
 *   csat      0 to 100. Caller satisfaction across the whole game (the
 *             end-of-shift CSAT % is just that day's calls).
 *   patience  0 to 100. Bev's patience. Breaches, complaints and needless
 *             escalations wear it down. 0 = game over.
 * Meters carry over from day to day and are saved with the game.
 * ========================================================================== */
export const METERS = {
  start: { breach: 0, csat: 75, patience: 100 },

  // How each stamped call moves the meters. Several can apply to one call.
  perCall: {
    breach:          { breach: 34, csat: 0,   patience: -25 }, // approved an attacker
    wrongfulDenial:  { breach: 0,  csat: -12, patience: -8 },  // denied a genuine caller policy would approve
    needlessEscalate:{ breach: 0,  csat: -2,  patience: -4 },  // escalated when policy had a clear answer (annoys Tier 2)
    correct:         { breach: 0,  csat: 0,   patience: 2 },   // matched policy
    genuineApproved: { breach: 0,  csat: 3,   patience: 0 },   // a happy real employee
    slowCall:        { breach: 0,  csat: -3,  patience: 0 }    // genuine caller, call longer than company.shift.slowCallMinutes
  },

  // At the end of each shift.
  perShift: {
    missedGenuine:   { breach: 0,  csat: -6,  patience: -3 },  // per genuine caller still waiting at 17:00
    lowCsatDay:      { breach: 0,  csat: 0,   patience: -10, below: 50 } // the day's CSAT % under `below`
  },

  // At the start of each shift: Security cleans up a little overnight.
  perDayStart: { breach: -10, csat: 0, patience: 0 },

  // Events fire when a meter crosses a line. They fire once, and can fire again
  // only after the meter has gone back across the line.
  //   when      { meter, atLeast } or { meter, atMost }
  //   email     shown as a message: { from, subject, body }
  //   effect    optional: "sendHome" (the shift ends now: a lost day)
  //             or "gameOver" with `ending` (an id in data/endings.js)
  //   adjust    optional meter changes when it fires, e.g. { patience: -15 }
  events: [
    {
      id: "security-incident",
      when: { meter: "breach", atLeast: 34 },
      email: {
        from: "Security Operations",
        subject: "SECURITY INCIDENT SI-2291: account takeover",
        body:
          "An account you reset today was used to log in from an address we've never seen. " +
          "We've locked it and opened an incident. Please re-read the verification policy. " +
          "This message has been copied to your manager."
      }
    },
    {
      id: "sent-home",
      when: { meter: "breach", atLeast: 67 },
      effect: "sendHome",
      email: {
        from: "Bev Kowalczyk",
        subject: "Stop taking calls",
        body:
          "Security needs you in a room with them, right now, to go through today's calls one by one. " +
          "Log off. The rest of your queue is going to Tier 2. We'll talk tomorrow."
      }
    },
    {
      id: "breach-max",
      when: { meter: "breach", atLeast: 100 },
      effect: "gameOver",
      ending: "reassigned"
    },
    {
      id: "write-up",
      when: { meter: "csat", atMost: 35 },
      adjust: { patience: -15 },
      email: {
        from: "Bev Kowalczyk",
        subject: "Formal note: customer complaints",
        body:
          "This is the formal part, sorry. I've had more complaints about you this week than about the coffee machine. " +
          "Real employees are being turned away or left waiting. This goes in your file."
      }
    },
    {
      id: "patience-gone",
      when: { meter: "patience", atMost: 0 },
      effect: "gameOver",
      ending: "pip"
    }
  ]
};
