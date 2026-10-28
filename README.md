# Access Denied

A Papers, Please-style game set on an IT service desk. You're a Tier 1 agent at Halvorsen
Dynamics, taking calls for password resets, unlocks, access requests and installs. Most
callers are who they say they are, but some are social engineers. Check each caller's claims
against your desk tools, then Approve, Deny or Escalate.

The company, the people and the numbers are made up. This is a personal project.

**Status: Phase 2.** Two full shifts (8 and 10 calls) against the clock, all six desk
tools, verification questions, the end-of-shift summary, and saving. Days 3 to 5, the
manager callback and MFA actions, the meters, and random callers come in Phase 3.

```
dev.html          the page for development (loads src/ as ES modules)
index.html        the built page (npm run build), one self-contained file; not in git
data/             all the content: company, employees, rules, callers, days (see data/schema.md)
src/              the game: shift.js, clock.js, verdict.js, checks.js, state.js (saving),
                  ui/ (windows, call, stamp, dialogs) and ui/tools/ (one file per desk tool)
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

1. Read the morning briefing. It lists the verification rules in effect today, and they
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
5. **? Ask a question** to hear the caller's answer to a verification question. Each one
   costs a few minutes of clock.
6. Stamp it: **Approve**, **Deny** or **Escalate**. Escalating is always safe, but it costs
   ten minutes. The call review explains what the checks found and who the caller really was.
7. At 17:00, or when the queue is empty, the summary shows your calls, breaches, wrongful
   denials, callers left waiting, CSAT, and a note from Bev. Then start the next day.

The game saves after every call. Reload, and it offers to continue where you left off.
Saves use `localStorage` keys starting with `accessDenied:`, so they don't mix with other
games on the site. The speaker icon in the taskbar mutes the sound. Add `?speed=10` to the
address to run the clock ten times faster when testing.

## Add content

All of it lives in `data/`, and nothing in `src/` needs to change to add callers, employees
or days. [data/schema.md](data/schema.md) explains how the files fit together and how a
call is judged, and each file lists its fields at the top.

## Tests

`npm test` checks the content files for broken references, checks that on its day every
attacker is caught by the rules and no genuine caller is denied, and plays through Day 1
and Day 2, the tools, saving and the clock running out in headless Chromium on
`dev.html`, on the built `index.html`, and on `index.html` opened from disk. Run
`npm run build` first so the built page is tested too. `npm test -- node` skips the browser.

## Deploy

Every push to `main` runs the tests (`.github/workflows/test.yml`). When they pass, the
Deploy workflow builds `index.html` and publishes it to GitHub Pages. Turn this on once
under **Settings > Pages > Source: GitHub Actions**. Because the account's main site uses
michaelsturrup.com, the game is served at `https://michaelsturrup.com/<repo-name>/`.
