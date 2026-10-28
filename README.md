# Access Denied

A Papers, Please-style game set on an IT service desk. You're a Tier 1 agent at Halvorsen
Dynamics, taking calls for password resets, unlocks, access requests and installs. Most
callers are who they say they are, but some are social engineers. Check each caller's claims
against your desk tools, then Approve, Deny or Escalate.

The company, the people and the numbers are made up. This is a personal project.

**Status: Phase 1.** One shift of four calls with the AD Lookup tool and the
Approve/Deny/Escalate stamps. The full shift, more tools, meters and the story come in
later phases.

```
dev.html          the page for development (loads src/ as ES modules)
index.html        the built page (npm run build), one self-contained file; not in git
data/             all the content: company, employees, rules, callers, days (see data/schema.md)
src/              the game: shift.js, verdict.js, checks.js, ui/ (windows, call, AD Lookup, stamp)
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

1. Read the morning briefing. It lists the verification rules in effect today. Click
   **Clock in**.
2. Click **Answer** when the phone rings. The transcript types out. Click it to skip ahead.
3. Check the ticket intake against **AD Lookup**: search the name or the employee ID and
   click a result to see the record.
4. Stamp it: **Approve**, **Deny**, or **Escalate** (always safe, but slow). The call review
   explains what the checks found and who the caller really was.

The speaker icon in the taskbar mutes the sound. The setting is saved in `localStorage`
as `accessDenied:muted`.

## Add content

All of it lives in `data/`, and nothing in `src/` needs to change to add callers, employees
or days. [data/schema.md](data/schema.md) explains how the files fit together and how a
call is judged, and each file lists its fields at the top.

## Tests

`npm test` checks the content files for broken references, checks that each Day 1 caller
gets the verdict its story intends, and plays a full shift in headless Chromium on
`dev.html`, on the built `index.html`, and on `index.html` opened from disk. Run
`npm run build` first so the built page is tested too. `npm test -- node` skips the browser.

## Deploy

Every push to `main` runs the tests (`.github/workflows/test.yml`). When they pass, the
Deploy workflow builds `index.html` and publishes it to GitHub Pages. Turn this on once
under **Settings > Pages > Source: GitHub Actions**. Because the account's main site uses
michaelsturrup.com, the game is served at `https://michaelsturrup.com/<repo-name>/`.
