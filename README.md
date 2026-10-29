# Access Denied

A Papers, Please-style game set on an IT service desk. You're a Tier 1 agent at Halvorsen
Dynamics, taking calls for password resets, unlocks, access requests and installs. Most
callers are who they say they are, but some are social engineers. Check each caller's claims
against your desk tools, then Approve, Deny or Escalate.

The company, the people and the numbers are made up. This is a personal project.

**Status: Phase 4.** A five-day week, each day adding a rule. Six desk tools, verification
questions, manager callbacks and MFA pushes, the Breach / CSAT / Patience meters, random
callers from Day 3, and saving. The story runs through the inbox: coworkers who remember how
you treated them, and a threat actor who comes back every day using whatever you let slip
earlier. The week ends in a promotion, or not. Title screen, settings, synthesized sound.

```
dev.html          the page for development (loads src/ as ES modules)
index.html        the built page (npm run build), one self-contained file; not in git
data/             all the content: company, employees, rules, callers, days, meters, endings,
                  and the pools random callers are built from (see data/schema.md)
src/              the game: shift.js, clock.js, verdict.js, checks.js, actions.js (callback, MFA),
                  meters.js, generator.js (random callers), state.js (saving),
                  ui/ (windows, call, stamp, dialogs) and ui/tools/ (one file per desk tool)
                  story.js (emails, leaks, caller variants, endings), settings.js, audio.js
css/              the Windows 95-style look
build.mjs         builds index.html
tests/            npm test
```

## Run it locally

```sh
npm install
npm run serve            # python3 -m http.server 8000
```

Open <http://localhost:8000/dev.html>. It loads the source straight from `src/` and
`data/`, so refresh to see a change. Opening `dev.html` straight from disk doesn't work,
because browsers won't load ES modules from `file://`.

To try the built page, run `npm run build`. The built `index.html` has everything inside
it, so it runs over the server (<http://localhost:8000/index.html>) or by double-clicking
it.

### How to play

1. On the title screen, pick **New game** (or **Continue**). Check the inbox when it
   opens. Then read the morning briefing. It lists the verification rules in effect today, and they
   stay in the **Policy** tab all shift. Click **Clock in**.
2. The clock runs from 9:00 to 17:00 over about eight real minutes, and pauses while a
   dialog is open. The taskbar shows how many callers are waiting.
3. Click **Answer** when the phone rings. The transcript types out. Click it to skip ahead.
4. Check the ticket intake against the **Desk Tools**. Click a name or ID on the intake to
   search for it in the open tab.
   - **AD Lookup**: the account: status, title, manager, office, groups
   - **HR Roster**: active, terminated or on leave
   - **Org Chart**: who reports to whom
   - **Tickets**: recent tickets, so you can spot a suspicious number of resets
   - **Caller ID**: the incoming number, where it geolocates, and who has called from it before
   - **Policy**: today's rules, the employee ID format and the sites
5. **? Ask question** to hear the caller's answer to a verification question. Each one
   costs a few minutes of clock. From Day 3, a wrong answer means deny.
6. From Day 4, **☎ Call manager** rings the employee's manager from the directory to confirm
   an admin request. From Day 5, **📱 MFA push** pings the account's registered phone before
   a password reset. Each costs clock time and gives a result in the transcript.
7. Stamp it: **Approve**, **Deny** or **Escalate**. Escalating is always safe, but it costs
   ten minutes and annoys Tier 2 when it wasn't needed. The call review explains what the
   checks found, who the caller really was, and how the meters moved.
8. At 17:00, or when the queue is empty, the evening inbox arrives, then the summary: your
   calls, breaches, wrongful denials, callers left waiting, CSAT, and a note from Bev. Then
   start the next day. After Day 5, **Finish the week** shows your ending.

| Day | New rule |
| --- | --- |
| 1 | Name and employee ID must match AD |
| 2 | The employee must be active in HR (terminated: deny, on leave: escalate) |
| 3 | Caller ID must match the employee's site, or ask a verification question |
| 4 | Admin requests need a manager callback |
| 5 | Password resets need an approved MFA push |

**The meters** in the taskbar carry over between days. **Breach** goes up when you approve an
attacker: the first one brings a Security Incident email, the second sends you home for the
rest of the day, and a full meter ends the game ("You've been reassigned"). **CSAT** drops
when real employees are turned away or kept waiting, and too low gets you a formal note.
**Patience** is Bev's: breaches, complaints and needless escalations wear it down, and at zero
you're on a Performance Improvement Plan.

**The story.** Priya, Dale and Rick call more than once, and they remember you. The caller
who keeps using (330) 555-0199 comes back every day as someone else. Each call you approve
for them hands over something real (a mailbox, the phone list, approver rights), Security
emails you about it, and their next call uses it. Survive the week with at most one
breach and Bev's patience intact, and you're promoted to Tier 2.

The game saves after every call. Reload, and the title screen offers to continue.
Saves use `localStorage` keys starting with `accessDenied:`, so they don't mix with other
games on the site. The speaker icon in the taskbar mutes the sound, and the gear opens
**Settings** (volume, text speed, shift length of 5, 8 or 12 minutes, and animations), which
pauses the clock while it's open. Every sound is synthesized with Web Audio, so there are no
sound files. Add `?speed=10` to the address to run the clock ten times faster when testing.

## Add content

All of it lives in `data/`, and nothing in `src/` needs to change to add callers, employees
or days. [data/schema.md](data/schema.md) explains how the files fit together and how a
call is judged, and each file lists its fields at the top.

## Tests

`npm test` checks the content files for broken references, checks that on its day every
attacker is caught by a careful agent and no genuine caller is denied (for the handwritten
callers, every story variant, and random ones from 40 seeds a day), checks the emails,
leaks and finale, and plays through the title screen, Days 1, 2, 4 and 5, the tools, the
desk actions, the inbox, saving, settings, the clock running out, a game over and the final
ending in headless Chromium on
`dev.html`, on the built `index.html`, and on `index.html` opened from disk. Run
`npm run build` first so the built page is tested too. `npm test -- node` skips the browser.

## Deploy

Every push to `main` runs the tests (`.github/workflows/test.yml`). When they pass, the
Deploy workflow builds `index.html` and publishes it to GitHub Pages. Turn this on once
under **Settings > Pages > Source: GitHub Actions**. Because the account's main site uses
michaelsturrup.com, the game is served at `https://michaelsturrup.com/<repo-name>/`.
