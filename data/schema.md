# Content files

Everything you can see in the game comes from the files in this folder. Each one is a
plain JavaScript file that exports one table, so you can write comments next to anything.
Each file also has its fields listed in a comment at the top. This page shows how the files
fit together.

```
company.js     sites, departments, request types, the employee ID format, shift timing
directory.js   the real employees: what AD Lookup, HR Roster, Org Chart and Tickets show
groups.js      shared mailboxes and distribution lists: the Groups tab, and who owns what
rules.js       the verification policy: each rule and the checks behind it
callers.js     the phone calls: what each caller claims, says, and really is
days.js        the shifts: briefing, which rules switch on, the call queue
meters.js      the Breach / CSAT / Patience meters: what moves them, and the emails and
               game overs when they cross a line
endings.js     the endings: game overs, and the finale after the last day
story.js       the inbox emails, what the threat actor can steal, and the condition format
pools.js       names, departments, lines, jokes and phone numbers for random callers and
               the background staff each game adds to the directory
```

## How a call is judged

You never write an answer key. When the player stamps a call:

1. The game gathers every rule switched on so far. A day's `addRules` turn rules on, and
   they stay on for every later day unless a day lists them in `removeRules`.
2. Each rule runs its `checks` (small functions in `src/checks.js`) against the
   caller's `claims`, the `directory`, and what the player did on the call: which questions
   they asked, and the results of the desk actions (Call manager, MFA push, Call desk phone,
   Call group owner).
3. If no check fails, policy says **Approve**. If any fail, policy says the rule's `onFail`
   (`deny` beats `escalate` when several fail). A check can ask for a different answer for
   its own failure: in the HR rule, terminated means deny but on leave means escalate.
4. The player's choice is compared with policy. `attacker: true` on the caller decides
   whether approving it counts as a breach, and whether denying a genuine caller
   counts as a wrongful denial.

So to make a social engineer, give them `attacker: true` and **one thing a careful agent
would catch with today's rules**:

| From | Tell |
| --- | --- |
| Day 1 | a misspelled name, an ID in the wrong format, an ID nobody has |
| Day 2 | claiming to be someone HR has terminated |
| Day 3 | a Caller ID that doesn't match the employee's site, with a `tell` on every question |
| Day 4 | an admin request, with `managerCallback: { result: "denies" }` (the default for attackers) |
| Day 5 | a password reset, with `mfa: { result: "denied" }` (the default for attackers) |
| Day 6 | an MFA swap, with `deskCallback: { result: "denies" }` (the default for attackers); a readback from someone not in SEC-Operations, or not on their own desk phone |
| Day 7 | a restricted group, with `ownerCallback: { result: "denies" }` (the default); a group that doesn't exist; a leaver whose files HR handed to someone else, or who wasn't the caller's report |
| Day 8 | a remote tool that isn't HD Assist; an asset tag that isn't theirs; a replacement laptop shipped anywhere but their site or HR address |
| Day 9 | a vendor change from someone not in AP-BankChanges; an extension for an employee, for more than 90 days, or for an ended contract |

A careful agent asks every question and uses every action the day unlocks. `npm test`
checks that a careful agent denies every attacker and doesn't deny any genuine caller
(except when their own manager says no on the callback). To make a tricky genuine caller,
make them rude, rushed, travelling, or without their phone, but keep every detail right.

If a story beat needs a fixed answer whatever the rules say, set `expected` on the caller.

A caller's `questions` feed the **Ask a question** menu. Use them for color, or to give the
player a second way to spot a tell ("Who's your manager?" answered with the wrong name).

The **Caller ID** tab remembers every number that called and the name it gave, across
days. Reusing an attacker's `callerId.number` on a later day lets an alert player link the
calls. The recurring threat actor uses `(234) 555-0199` and the callback `(330) 555-0199`.

## The story

Three things make the week feel like one story. All of them use the same **conditions**,
listed at the top of `story.js`: what you did with a caller (`approved`, `denied`,
`escalated`, `wronglyDenied`, `answered`), what the threat actor holds (`leaked`), and
totals for today, the week, or the meters.

- **Emails** (`story.js` `EMAILS`): each has a `day`, `at: "start"` (before the briefing)
  or `"end"` (after the last call, before the summary), and an optional `if`. Recurring
  characters write about how you treated them: Priya brings pastries, Dale tapes your
  ticket number to a forklift, Rick asks what his password was.
- **Leaks**: an attacker caller can list `leaks: ["jon-mailbox"]`. Approve that call and
  the threat actor has it: Security emails you that evening, and later calls use it.
- **Variants** (`callers.js`): `variants: [{ if, dialogue, questions, claims, callerId,
  debrief }]`. The first whose `if` holds replaces those parts of the call. The threat
  actor's calls get more convincing with each leak (on Day 4, Gordon's stolen phone list
  lets "Marcus" spoof Marcus's real desk number), and Dale and Priya remember being turned
  away. A variant must keep a tell that day's rules catch; `npm test` checks every one.

The threat actor's leaks, in order: Day 1 "Jonathon Whitaker" (Jon's mailbox), Day 2 Gordon
(VPN and the phone list), Day 3 "Jonathan Whittaker" (the payment approvers group), Day 4
"Marcus" (payroll), Day 5 "Rick" (the CEO's mailbox). Week two: Day 6 "Marguerite" (her MFA)
and "Mei" (Marguerite's mobile and calendar), Day 7 "Jon" (Gordon's mailbox) and "Raj" (the
incident mailbox), Day 8 "Tomasz" (a remote tool) and "Hannah" (a laptop), Day 9 "Kyle" (a
vendor's bank details) and "Lucia" (a forgotten contractor VPN), Day 10 "Marguerite" (the
$2.4 million payment run, which uses the Day 6 leaks).

**Endings** (`endings.js`): meter events end the game early with `reassigned` or `pip`.
After the last day in `days.js`, the summary offers **Finish the week**, and the first
`FINALE` entry whose `if` holds picks the ending: `promotion` for a good week, otherwise
`survived`. Ending paragraphs can be `{ text, if }`, and `{leaks}` in the text lists what
the threat actor got. Add days and the finale moves to the new last day by itself.

## Week two

Days 6 to 10 add eight kinds of call, two a day. Each has its own `requestTypes` entry in
`company.js` and its own rule, and that rule only looks at its own request type, so it never
changes an older call. The calls need a few extra `claims` (listed at the top of
`callers.js`): `subject`/`subjectId` for readbacks and leavers, `group`, `device`, `tool`,
`shipTo`, `vendor` and `days`. The tools to check them: AD Lookup shows devices and
searches asset tags, the HR Roster shows contractors, home addresses and leaver handovers,
and the Groups tab (`groups.js`) shows owners.

## Random callers

Put `{ procedural: 2 }` in a day's `callers` list for two random callers at that point in
the queue. Each one is a new employee built from `pools.js` (name, department, title, site,
phone, laptop, home address), added to the directory for the day so every tool can find
them, plus a call. They can make any request whose rule is on (today's new ones most), and
open, explain and joke from the pools. About a third are attackers, each with one tell from
the table above that today's rules can catch (today's new rules' tells come up most). Genuine
ones are sometimes travelling from Day 3.

Every game also adds `POOLS.staffCount` background coworkers to the directory. They never
call, but they make searches busier and own laptops an attacker might borrow a tag from.

The picks come from a seed saved with the game, so a reload replays the same callers and
staff, and a New game picks new ones. Add names, lines, jokes or phone numbers to
`pools.js` for more variety.

## Scoring

- **Correct**: the stamp matches policy. **Escalated**: you escalated when policy had a
  clear answer (safe, but slow).
- **Breach**: you approved an `attacker: true` caller.
- **Wrongful denial**: you denied a genuine caller that policy said to approve.
- **CSAT**: each genuine caller rates the call: 5 for approved, 3 for escalated, 2 for a
  policy denial, 1 for a wrongful denial or being left in the queue at 17:00, and one less
  if the call took longer than `company.shift.slowCallMinutes`.
- Bev's note at the end comes from the day's `bossNotes`: `breach` if you allowed one,
  `complaints` if you wrongly denied or missed a genuine caller, otherwise `clean`.
- **Meters** (`meters.js`): every stamp moves Breach, CSAT and Patience by the amounts in
  `perCall`, the end of each shift by `perShift`, and each new day by `perDayStart`. Each
  entry in `events` fires once when its meter crosses the line: an email, and optionally
  `sendHome` (the rest of the shift is lost) or `gameOver` with an `ending` from
  `endings.js`. It can fire again only after the meter has gone back across the line.

## Adding content

**A new email:** add it to `EMAILS` in `story.js` with a new `id` and a `day`.

**A new caller:** copy one in `callers.js`, give it a new `id`, and add that id to a day's
`callers` list in `days.js`. Use 555-01xx phone numbers, which are reserved as fictional.

**A new employee:** copy one in `directory.js`. The `id` must match
`company.employeeIdPattern`, `manager` must be another employee's id, and `site` must be
one of the site ids in `company.js`.

**A new day:** add an entry to `days.js` with the next `day` number. Aim for 8 to 12
callers with about a third of them attackers. Eight game hours is about eight real minutes,
so twelve calls is a busy day.

**A new rule:** add it to `rules.js`. If its checks already exist in `src/checks.js`,
that's all. If not, write a function there. It gets `(caller, ctx)` and returns
`{ pass: true }` or `{ pass: false, reason: 'what the player missed' }`.

`npm test` checks the content for broken references (an unknown caller id, a manager
who doesn't exist, a rule with a misspelled check). The same check runs when the game
loads and prints any problems to the browser console (F12).
