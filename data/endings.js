/* =============================================================================
 * ENDINGS: the screens that end a game.
 * -----------------------------------------------------------------------------
 * Meter events point at an ending by id when a meter runs out (data/meters.js).
 * After the last day in days.js, the first FINALE entry whose `if` holds picks
 * the ending (conditions are described at the top of data/story.js).
 *
 * Ending fields:
 *   title    string   the window title
 *   heading  string
 *   body     Array    paragraphs: a string, or { text, if } to show it only
 *                     when the condition holds. "{leaks}" in the text becomes
 *                     the list of what the threat actor stole (story.js LEAKS).
 *   win      boolean  Optional. true = the player made it (a finale).
 * ========================================================================== */
export const ENDINGS = {
  promotion: {
    title: "Promotion",
    heading: "You've been promoted to Tier 2.",
    win: true,
    body: [
      "Bev calls you into her office on Friday afternoon. There's a cake. It says CONGRATULATIONS in blue icing, and underneath, smaller, SORRY ABOUT THE PHONES.",
      { text: "The 0199 caller tried every trick they had, for two whole weeks, and they left with nothing. Security has printed their call log and pinned it to the wall like a trophy.", if: { leakedAny: false } },
      { text: "The 0199 caller didn't get much: {leaks}. Security says that's still the best fortnight they've had all year.", if: { leakedAny: true } },
      "Raj is delighted. He's shown you his chart. You're on it now, at the top, in green.",
      "Starting Monday, you take the escalations. Somebody new starts on Tier 1. You leave them a pastry with a little almond on top."
    ]
  },
  survived: {
    title: "End of probation",
    heading: "You made it to Friday. The second one.",
    win: true,
    body: [
      "Your probation is over, and Bev has decided to keep you. She says this in the tone people use for a dog that has eaten a sofa but is otherwise a good dog.",
      { text: "The 0199 caller got away with {leaks}. Security will be cleaning that up for a while.", if: { leakedAny: true } },
      { text: "Too many real employees were turned away or left waiting these two weeks. Bev has booked you onto a course called \"Saying Yes Safely\".", if: { week: { wrongfulDenials: { atLeast: 9 } } } },
      { text: "Too many attackers got through. Bev has booked you onto a course called \"Saying No Nicely\".", if: { week: { breaches: { atLeast: 3 } } } },
      { text: "Your callers gave you an average CSAT under 55% over your probation. Bev reads every survey. Every single one.", if: { week: { csat: { atMost: 54 } } } },
      { text: "Bev's patience with you is now mostly sticky notes and coffee.", if: { meters: { patience: { atMost: 39 } } } },
      "No promotion this time. Next week the phones open at 9:00 again, and so does the 0199 caller."
    ]
  },
  reassigned: {
    title: "Reassignment notice",
    heading: "You've been reassigned.",
    body: [
      "Effective immediately, you're moving to Asset Management, where you'll be counting monitors in the basement.",
      { text: "Security is still working out what the 0199 caller took: {leaks}.", if: { leakedAny: true } },
      "Security asks that you never be allowed near a password reset again. HR has agreed. The monitors have no comment."
    ]
  },
  pip: {
    title: "Performance Improvement Plan",
    heading: "Performance Improvement Plan",
    body: [
      "Bev has run out of patience, and HR has run out of sticky notes for your file.",
      "You'll spend the next 90 days shadowing Raj from Tier 2. He's very excited. He's made a slideshow."
    ]
  }
};

/* FINALE: after the last day, the first entry whose `if` holds. The last entry
 * should have no `if`, so there's always an ending. */
export const FINALE = [
  // A good probation (both weeks): at most two breaches, few wrongful denials, happy
  // callers, and Bev isn't out of patience.
  { ending: "promotion", if: { week: { breaches: { atMost: 2 }, wrongfulDenials: { atMost: 8 }, csat: { atLeast: 55 } }, meters: { patience: { atLeast: 40 } } } },
  { ending: "survived" }
];
