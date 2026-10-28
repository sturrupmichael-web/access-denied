# Content files

Everything you can see in the game comes from the five files in this folder. Each one is a
plain JavaScript file that exports one table, so you can write comments next to anything.
Each file also has its fields listed in a comment at the top. This page shows how the files
fit together.

```
company.js     sites, departments, request types, the employee ID format, shift timing
directory.js   the real employees: what AD Lookup, HR Roster, Org Chart and Tickets show
rules.js       the verification policy: each rule and the checks behind it
callers.js     the phone calls: what each caller claims, says, and really is
days.js        the shifts: briefing, which rules switch on, the call queue
```

## How a call is judged

You never write an answer key. When the player stamps a call:

1. The game gathers every rule switched on so far. A day's `addRules` turn rules on, and
   they stay on for every later day unless a day lists them in `removeRules`.
2. Each rule runs its `checks` (small functions in `src/checks.js`) against the
   caller's `claims` and the `directory`.
3. If no check fails, policy says **Approve**. If any fail, policy says the rule's `onFail`
   (`deny` beats `escalate` when several fail). A check can ask for a different answer for
   its own failure: in the HR rule, terminated means deny but on leave means escalate.
4. The player's choice is compared with policy. `attacker: true` on the caller decides
   whether approving it counts as a breach, and whether denying a genuine caller
   counts as a wrongful denial.

So to make a social engineer, give them `attacker: true` and **claims that don't match the
directory** in a way today's rules catch. A misspelled name, an ID with four digits, or an
ID nobody has all fail the Day 1 rule. To make a tricky genuine caller, make them rude or
rushed but keep every detail right.

If a story beat needs a fixed answer whatever the rules say, set `expected` on the caller.

A caller's `questions` feed the **Ask a question** menu. Use them for color, or to give the
player a second way to spot a tell ("Who's your manager?" answered with the wrong name).

The **Caller ID** tab remembers every number that called and the name it gave, across
days. Reusing an attacker's `callerId.number` on a later day lets an alert player link the
calls. The recurring threat actor uses `(234) 555-0199` and the callback `(330) 555-0199`.

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

## Adding content

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
