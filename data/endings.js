/* =============================================================================
 * ENDINGS: the game-over screens. Meter events point at these by id
 * (data/meters.js). Phase 4 adds the promotion ending for surviving every day.
 *   title    string    the window title
 *   heading  string
 *   body     string[]  paragraphs
 * ========================================================================== */
export const ENDINGS = {
  reassigned: {
    title: "Reassignment notice",
    heading: "You've been reassigned.",
    body: [
      "Effective immediately, you're moving to Asset Management, where you'll be counting monitors in the basement.",
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
