/* =============================================================================
 * DAYS: one entry per shift, in order.
 * -----------------------------------------------------------------------------
 * Day fields:
 *   day         number   1, 2, 3, ... Must be unique.
 *   title       string   Shown on the briefing ("Orientation").
 *   weekday     string   Flavour text for the memo header.
 *   briefing    string[] Paragraphs of the morning memo from your boss.
 *   addRules    string[] Rule ids (rules.js) that switch on today and stay on.
 *   removeRules string[] Optional. Rule ids that switch off from today.
 *   callers     Array    The call queue, in order. Each entry is a caller id
 *                        from callers.js, or { procedural: n } for n random
 *                        callers from data/pools.js. Callers still waiting at
 *                        the end of the shift count as missed.
 *   bossNotes            End-of-shift note from your boss. The first that applies:
 *     breach      string   you approved at least one attacker
 *     complaints  string   you wrongly denied or missed a genuine caller
 *     clean       string   neither
 * ========================================================================== */
export const DAYS = [
  {
    day: 1,
    title: "Orientation",
    weekday: "Monday",
    briefing: [
      "Welcome to the Service Desk. You're Tier 1 now, which means you're the first thing between " +
        "Halvorsen Dynamics and everyone on the internet who wants into it.",
      "Today's rule is simple. Before you touch anyone's account, look them up in AD and make sure " +
        "the name and employee ID they give you actually match. Real IDs look like HD-12345.",
      "The phones open at 9:00 and close at 17:00. Anyone still waiting at five is somebody else's " +
        "problem tomorrow, and they'll be grumpy about it. If you're not sure, Escalate. Tier 2 will grumble, " +
        "but grumbling is cheaper than a breach."
    ],
    addRules: ["identity-match"],
    callers: [
      "d1-priya-unlock", "d1-rick-reset", "d1-whitacre-reset", "d1-dale-install",
      "d1-tomasz-access", "d1-kevin-admin", "d1-carla-unlock", "d1-marcus-fake", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "Security flagged a password reset you approved this morning. The real account owner never called. " +
        "We caught it, this time. Tomorrow, read the AD record letter by letter. - Bev",
      complaints:
        "A couple of real employees are telling everyone the new person hung up on them. " +
        "Being careful is good. Being careful with the wrong people is a ticket backlog. - Bev",
      clean:
        "Not bad for a first day. Somebody brought pastries and the coffee machine works again. " +
        "Tomorrow we start checking HR status too. Don't be late. - Bev"
    }
  },
  {
    day: 2,
    title: "People leave. Accounts don't.",
    weekday: "Tuesday",
    briefing: [
      "Bad news from Audit. HR has been terminating people, and nobody has been telling IT. " +
        "Some of those AD accounts are still switched on.",
      "From today, check the HR Roster as well as AD. If HR says terminated, deny, no matter how nice they are " +
        "or how well their account works. If they're on leave, escalate and let Tier 2 confirm with their manager.",
      "Also: yesterday's dodgy callers all used the same callback number. Whoever it is will try again. " +
        "The Ticket History and Caller ID tabs are there for a reason. - Bev"
    ],
    addRules: ["hr-active"],
    callers: [
      "d2-hannah-install", "d2-dale-again", "d2-nadia-reset", "d2-wendy-access", "d2-owen-leave",
      "d2-priya-software", "d2-gordon-vpn", "d2-felix-reset", "d2-imogen-fake", "d2-raj-unlock", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "We just spent the afternoon disabling an account you handed back to someone we fired. " +
        "HR Roster. Every call. I'm not saying it again. - Bev",
      complaints:
        "Real employees were turned away today. A few of them found my desk in person. " +
        "Please let them reach you instead. - Bev",
      clean:
        "Clean day. Audit is happy, which has never happened before. I don't know how to feel. " +
        "More rules are coming tomorrow, and the phones get busier. - Bev"
    }
  },
  {
    day: 3,
    title: "Where are you calling from?",
    weekday: "Wednesday",
    briefing: [
      "Yesterday's terminated-employee calls went well, mostly. Today, Security wants us looking at where calls come from.",
      "Check the Caller ID tab on every call. If the area code doesn't match the employee's site, ask them a verification question " +
        "before you do anything. People travel, so a strange number alone isn't a no. But a strange number and a wrong answer is.",
      "If you skip the question on a mismatch, escalate it. And yes, our friend with the 0199 number is still out there. - Bev"
    ],
    addRules: ["caller-location"],
    callers: [
      "d3-felix-travel", "d3-carla-reset", "d3-gloria-fake", { procedural: 2 },
      "d3-tomasz-install", "d3-whitaker-voip", "d3-wendy-unlock", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "One of today's calls came from halfway around the world and you let it in. " +
        "When Caller ID looks wrong, ask the question. Every time. - Bev",
      complaints:
        "Real employees, some of them on business trips, got turned away today. A strange number is a reason to ask, not a reason to hang up. - Bev",
      clean:
        "Good work. Security says the overseas calls dropped off after lunch, which means word is getting around. " +
        "Tomorrow: admin requests get a callback. - Bev"
    }
  },
  {
    day: 4,
    title: "Call the manager",
    weekday: "Thursday",
    briefing: [
      "Admin rights are what attackers actually want, so from today every admin or privileged request needs a callback.",
      "Use the Call manager button. It rings the manager in the directory, not the name the caller gives you, so an attacker can't hand you their accomplice. " +
        "If the manager confirms, go ahead. If they say no, deny, even if the caller is real. If nobody picks up, escalate.",
      "It costs you a few minutes per call. It costs an attacker everything. - Bev"
    ],
    addRules: ["manager-callback"],
    callers: [
      "d4-aisha-admin", "d4-rick-reset", "d4-dale-fake", { procedural: 2 },
      "d4-raj-admin", "d4-tomasz-admin", "d4-imogen-admin", "d4-marcus-admin", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "Someone has admin rights today who shouldn't. We're rotating credentials all night. " +
        "Admin request means callback. No callback means escalate. - Bev",
      complaints:
        "A few managers say their people were turned away even though they would have said yes. Make the call before you decide. - Bev",
      clean:
        "Four days in and you're making Tier 2 look slow. Don't tell Raj I said that. " +
        "Tomorrow is the big one: MFA on every password reset. - Bev"
    }
  },
  {
    day: 5,
    title: "Push it",
    weekday: "Friday",
    briefing: [
      "It's Friday, and Security has saved their favourite rule for last. Every password reset now needs an approved MFA push.",
      "MFA push sends a notification to the phone registered on the account, not the phone the caller is using. " +
        "Approved means it's really them. Denied means the real owner just told you it isn't. No response means escalate.",
      "Expect people to beg you to skip it. Their phone is dead, it's in the car, they're boarding a plane. " +
        "Some of them will even be telling the truth. Don't skip it. - Bev"
    ],
    addRules: ["mfa-reset"],
    callers: [
      "d5-priya-reset", "d5-felix-reset", "d5-hannah-fake", { procedural: 2 },
      "d5-dale-reset", "d5-carla-admin", { procedural: 2 }, "d5-rick-fake"
    ],
    bossNotes: {
      breach:
        "An attacker got a reset through on the day we turned MFA on. I don't even know what to say. Monday, we talk. - Bev",
      complaints:
        "Lots of real people stuck without a password going into the weekend. Escalate the ones who can't do the push. Don't hang up on them. - Bev",
      clean:
        "That's a week. You caught our 0199 friend every time they called, and they called a lot. " +
        "Have a good weekend. You've earned it. Next week, the calls get weirder. - Bev"
    }
  },

  /* ---- Week two: the rest of your probation. Each day adds two new kinds of call. ---- */
  {
    day: 6,
    title: "New phone, who dis?",
    weekday: "Monday",
    briefing: [
      "Welcome to week two. You survived the basics, so now you get the fun stuff: the calls attackers actually use in the real world.",
      "First, MFA device swaps. \"I got a new phone, move my authenticator\" is how SIM-swap takeovers start. Before you move anything, " +
        "use Call desk phone. It hangs up and rings the desk number in AD. If the person at that desk says it wasn't them, deny.",
      "Second, our own team. People will ring up claiming to be IT Security and ask you to read back someone's details. " +
        "Only do it if AD has them in SEC-Operations AND they're calling from their own desk phone. Real Security people call from their desks. " +
        "Usually while eating crisps. - Bev"
    ],
    addRules: ["mfa-swap", "no-readback"],
    callers: [
      "d6-priya-mfa", "d6-yusuf-readback", { procedural: 2 }, "d6-marguerite-mfa-fake", "d6-rick-mfa",
      { procedural: 2 }, "d6-mei-fake", { procedural: 1 }
    ],
    bossNotes: {
      breach:
        "Security says someone used today to get a foothold. Phones and phone numbers are identity now. Treat them that way. - Bev",
      complaints:
        "A few people with brand-new phones are now stuck with no MFA at all. If their desk phone confirms it's them, it's them. - Bev",
      clean:
        "Not a single authenticator moved to a stranger's phone. Yusuf from Security sent a thumbs-up emoji. He has never sent an emoji. - Bev"
    }
  },
  {
    day: 7,
    title: "Who owns this?",
    weekday: "Tuesday",
    briefing: [
      "Today is about other people's stuff: shared mailboxes, distribution lists, and the files of people who've left.",
      "There's a new Groups tab in Desk Tools. Open groups, anyone can join. Restricted ones need the owner's OK, so use Call group owner. " +
        "If the group doesn't exist, it's a made-up name, so deny.",
      "Leavers: we never reopen a leaver's account, not even \"just for an hour\". Their files go to whoever HR approved, and the HR Roster says who. " +
        "Their own manager with no HR approval yet: escalate. Anyone else: deny. - Bev"
    ],
    addRules: ["group-owner", "leaver-data"],
    callers: [
      "d7-dale-kurt", { procedural: 2 }, "d7-tomasz-oncall", "d7-gordon-mailbox-fake", { procedural: 2 },
      "d7-imogen-nadia", "d7-raj-fake", { procedural: 1 }
    ],
    bossNotes: {
      breach:
        "Someone is now reading a mailbox they shouldn't be. Groups have owners for a reason. Ring the owner. - Bev",
      complaints:
        "Real people couldn't get onto lists they were allowed on. Open groups are open. Check the tab before you say no. - Bev",
      clean:
        "Leavers stayed left, and every mailbox has the right people in it. HR sent a card. Lorraine signed it, which I'm told is rare. - Bev"
    }
  },
  {
    day: 8,
    title: "Hardware, software, nowhere",
    weekday: "Wednesday",
    briefing: [
      "Laptops today. Two kinds of call: someone wants a remote session, or someone has lost their laptop.",
      "Remote sessions: we use HD Assist, and only HD Assist. If a caller wants you to install some other tool, " +
        "that's how attackers get a remote back door. And search the asset tag they give you. It has to be theirs in AD.",
      "Lost laptops: the device must be theirs, and the replacement ships to their own site or the home address in the HR Roster. " +
        "\"Send it to my hotel\" sounds reasonable, and it's exactly what a thief would say. - Bev"
    ],
    addRules: ["remote-tool", "lost-device"],
    callers: [
      "d8-carla-remote", { procedural: 2 }, "d8-felix-laptop", "d8-tomasz-fake", { procedural: 2 },
      "d8-wendy-laptop", "d8-hannah-laptop-fake", { procedural: 1 }
    ],
    bossNotes: {
      breach:
        "There's a company laptop on its way to somebody who doesn't work here, or a remote tool on one that does. Asset tags. Addresses. Every time. - Bev",
      complaints:
        "Some people with genuinely lost laptops are still without one. If the tag and the address check out, help them. - Bev",
      clean:
        "Every laptop went where it should. Asset Management cried a little. Happy tears, they say. - Bev"
    }
  },
  {
    day: 9,
    title: "Follow the money",
    weekday: "Thursday",
    briefing: [
      "Today is about money and time. Two calls attackers love: changing a supplier's bank details, and extending a contractor's account.",
      "Vendor bank changes: the caller must be in AP-BankChanges in AD, and it's privileged, so their manager must confirm. " +
        "\"The CFO asked me to\" is not a group membership.",
      "Contractor extensions: check the HR Roster. Contractors only, at most 90 days, and their sponsor (their manager) must confirm. " +
        "If the contract has already ended, the HR rule handles it. Ended means ended. - Bev"
    ],
    addRules: ["vendor-change", "contractor-extension"],
    callers: [
      "d9-oksana-vendor", { procedural: 2 }, "d9-sven-extension", "d9-kyle-fake", { procedural: 2 },
      "d9-lucia-fake", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "Finance is on the phone to the bank, trying to claw back a payment. I'm going to need a minute. And a coffee. And a new career. - Bev",
      complaints:
        "Treasury and a couple of contractors couldn't get their work done today. They checked out. Let them through. - Bev",
      clean:
        "Not one penny went anywhere it shouldn't. Marguerite smiled at me in the corridor. I didn't know she could. - Bev"
    }
  },
  {
    day: 10,
    title: "Everything, everywhere",
    weekday: "Friday",
    briefing: [
      "Last day of your probation. No new rules today. Everything you've learned is on, all at once, and the phones are going to be busy.",
      "Security thinks our 0199 friend is saving something big for today. Whatever they try, it'll sound urgent, and it'll sound like someone you know.",
      "Check the tools. Use the actions. Escalate when you're unsure. And if you get through today clean, there's cake. I've seen it. - Bev"
    ],
    callers: [
      "d10-priya-list", { procedural: 3 }, "d10-marguerite-vendor-fake", { procedural: 3 }, "d10-rick-reset", { procedural: 2 }
    ],
    bossNotes: {
      breach:
        "Right at the end, somebody got through. We'll talk about it on Monday. For now, go home. - Bev",
      complaints:
        "Last day, and some real people still got turned away. You know the rules now. Trust them, and trust the people who pass them. - Bev",
      clean:
        "Two weeks. Every kind of call there is, and you handled them. Come and find me. Bring a fork. - Bev"
    }
  }
];
