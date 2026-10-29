// The content files are consistent, and every caller gets the verdict its story intends.
// Runs in Node, no browser.

import { assert } from './harness.mjs';
import { validateData } from '../src/validate.js';
import { evaluate, grade, activeRules } from '../src/verdict.js';
import { idealActions } from '../src/actions.js';
import { generateCallers, generateStaff, clearGenerated } from '../src/generator.js';
import { CALLERS } from '../data/callers.js';
import { DAYS } from '../data/days.js';
import { DIRECTORY } from '../data/directory.js';
import * as story from '../src/story.js';
import { save, remove } from '../src/storage.js';
import * as state from '../src/state.js';
import { COMPANY } from '../data/company.js';

// A careful agent's verdict: every question asked, every unlocked action used.
const ideal = (c, day) => evaluate(c, day, idealActions(c, activeRules(day)));

// Attackers must be caught by a careful agent. Genuine callers must not be denied, unless
// their own manager said no on the callback (that's the process working).
function assertFair(c, day) {
  const v = ideal(c, day);
  if (c.attacker) assert(v.correct === 'deny', `day ${day} ${c.id}: attacker should be denied, policy says ${v.correct}`);
  else if (c.managerCallback?.result !== 'denies') assert(v.correct !== 'deny', `day ${day} ${c.id}: genuine caller is denied (${v.failures.map((f) => f.reason)})`);
}

const caller = (id) => CALLERS.find((c) => c.id === id);

export const tests = [
  ['data files have no problems', async () => {
    const problems = validateData();
    assert(!problems.length, problems.join('\n'));
  }],
  ['genuine callers with matching details are approved', async () => {
    for (const id of ['d1-priya-unlock', 'd1-dale-install']) {
      const v = evaluate(caller(id), 1);
      assert(v.correct === 'approve', `${id}: expected approve, got ${v.correct} (${v.failures.map((f) => f.reason)})`);
    }
  }],
  ['a misspelled name is denied', async () => {
    const v = evaluate(caller('d1-whitacre-reset'), 1);
    assert(v.correct === 'deny' && v.failures.length === 1, JSON.stringify(v));
    assert(v.failures[0].reason.includes('Jonathan Whittaker'), v.failures[0].reason);
  }],
  ['a bad ID format is denied once, not reported twice', async () => {
    const v = evaluate(caller('d1-kevin-admin'), 1);
    assert(v.correct === 'deny' && v.failures.length === 1, JSON.stringify(v.failures.map((f) => f.reason)));
  }],
  ['on its day, a careful agent catches every attacker and lets every genuine caller through', async () => {
    for (const day of DAYS) for (const id of day.callers.filter((e) => typeof e === 'string')) assertFair(caller(id), day.day);
  }],
  ['the random generator makes fair callers for every day, and the same seed makes the same callers', async () => {
    for (const day of DAYS) {
      for (let seed = 1; seed <= 40; seed++) {
        clearGenerated();
        const batch = generateCallers(day.day, 4, seed * 7919, activeRules(day.day));
        assert(batch.some((c) => c.attacker), `day ${day.day} seed ${seed}: no attacker in a batch of 4`);
        for (const c of batch) assertFair(c, day.day);
        clearGenerated();
        const again = generateCallers(day.day, 4, seed * 7919, activeRules(day.day));
        assert(JSON.stringify(again) === JSON.stringify(batch), `day ${day.day} seed ${seed}: not repeatable`);
      }
    }
    clearGenerated();
    assert(!DIRECTORY.some((e) => e.generated), 'clearGenerated leaves no generated employees');
  }],
  ['week two: each new kind of call gets the verdict its story intends', async () => {
    const intended = {
      'd6-priya-mfa': 'approve', 'd6-yusuf-readback': 'approve', 'd6-marguerite-mfa-fake': 'deny', 'd6-rick-mfa': 'escalate', 'd6-mei-fake': 'deny',
      'd7-dale-kurt': 'approve', 'd7-tomasz-oncall': 'approve', 'd7-gordon-mailbox-fake': 'deny', 'd7-imogen-nadia': 'escalate', 'd7-raj-fake': 'deny',
      'd8-carla-remote': 'approve', 'd8-felix-laptop': 'approve', 'd8-tomasz-fake': 'deny', 'd8-wendy-laptop': 'approve', 'd8-hannah-laptop-fake': 'deny',
      'd9-oksana-vendor': 'approve', 'd9-sven-extension': 'approve', 'd9-kyle-fake': 'deny', 'd9-lucia-fake': 'deny',
      'd10-priya-list': 'approve', 'd10-marguerite-vendor-fake': 'deny', 'd10-rick-reset': 'approve',
    };
    for (const [id, want] of Object.entries(intended)) {
      const c = caller(id);
      const day = DAYS.find((d) => d.callers.includes(id)).day;
      const v = ideal(c, day);
      assert(v.correct === want, `${id}: expected ${want}, got ${v.correct} (${v.failures.map((f) => f.reason)})`);
    }
  }],
  ['week two: every new rule catches its own tell, and needs its action', async () => {
    const failsOn = (id, rule, actions) => {
      const c = caller(id);
      const day = DAYS.find((d) => d.callers.includes(id)).day;
      const v = evaluate(c, day, actions ?? idealActions(c, activeRules(day)));
      return v.failures.some((f) => f.rule.id === rule) ? v.correct : null;
    };
    assert(failsOn('d6-marguerite-mfa-fake', 'mfa-swap') === 'deny', 'desk callback says no');
    assert(failsOn('d6-priya-mfa', 'mfa-swap', { deskCallback: null }) === 'escalate', 'no desk callback: escalate');
    assert(failsOn('d6-mei-fake', 'no-readback') === 'deny', 'readback from a number that is not their desk phone');
    assert(failsOn('d7-raj-fake', 'group-owner') === 'deny', 'group owner says no');
    assert(failsOn('d7-tomasz-oncall', 'group-owner', { ownerCallback: null }) === 'escalate', 'restricted group, no owner callback: escalate');
    assert(failsOn('d7-gordon-mailbox-fake', 'leaver-data') === 'deny', 'HR handed the leaver to someone else');
    assert(failsOn('d7-imogen-nadia', 'leaver-data') === 'escalate', 'their manager, but no HR handover');
    assert(failsOn('d8-tomasz-fake', 'remote-tool') === 'deny', 'not HD Assist');
    assert(failsOn('d8-hannah-laptop-fake', 'lost-device') === 'deny', 'replacement to a hotel');
    assert(failsOn('d9-kyle-fake', 'vendor-change') === 'deny', 'not in AP-BankChanges');
    assert(failsOn('d9-oksana-vendor', 'manager-callback', { callback: null }) === 'escalate', 'vendor changes are privileged');
    assert(failsOn('d9-lucia-fake', 'hr-active') === 'deny', 'an ended contract is terminated');
    const sven = caller('d9-sven-extension');
    assert(evaluate({ ...sven, claims: { ...sven.claims, days: 180 } }, 9, { callback: 'confirms' }).correct === 'deny', 'more than 90 days');
    const oksana = caller('d9-oksana-vendor');
    assert(evaluate({ ...oksana, claims: { ...oksana.claims, request: 'account_extension', days: 30 } }, 9, { callback: 'confirms' }).correct === 'deny', 'employees are not contractors');
    assert(evaluate(caller('d8-carla-remote'), 5).correct === 'approve', 'week-two rules are off in week one');
  }],
  ['the generator makes every new kind of call, genuine and attacker, and the attackers are caught by that call\'s rule', async () => {
    const ruleFor = { mfa_swap: 'mfa-swap', info_readback: 'no-readback', shared_access: 'group-owner', leaver_access: 'leaver-data', remote_session: 'remote-tool', lost_device: 'lost-device', vendor_change: 'vendor-change', account_extension: 'contractor-extension' };
    const seen = {};
    for (const day of DAYS.filter((d) => d.day >= 6)) {
      for (let seed = 1; seed <= 60; seed++) {
        clearGenerated();
        generateStaff(seed);
        for (const c of generateCallers(day.day, 4, seed * 104729, activeRules(day.day))) {
          assertFair(c, day.day);
          const rule = ruleFor[c.claims.request];
          if (!rule) continue;
          const kind = `${c.claims.request}:${c.attacker ? 'attacker' : 'genuine'}`;
          const v = ideal(c, day.day);
          if (c.attacker && v.failures.some((f) => f.rule.id === rule)) seen[`${kind}:own-rule`] = true;
          seen[kind] = true;
        }
      }
    }
    clearGenerated();
    for (const request of Object.keys(ruleFor)) {
      for (const k of ['genuine', 'attacker', 'attacker:own-rule']) assert(seen[`${request}:${k}`], `never generated ${request} ${k}`);
    }
  }],
  ['every game has its own background staff and random callers, and a save keeps them', async () => {
    clearGenerated();
    const before = DIRECTORY.length;
    const staff = generateStaff(11).map((e) => e.name);
    assert(DIRECTORY.length === before + staff.length && staff.length >= 40, `staff: ${staff.length}`);
    const people = DIRECTORY.map((e) => e.name.toLowerCase());
    assert(new Set(people).size === people.length, 'no two employees share a name');
    const ids = DIRECTORY.map((e) => e.id);
    assert(new Set(ids).size === ids.length, 'no two employees share an ID');
    const tags = DIRECTORY.flatMap((e) => e.devices ?? []);
    assert(new Set(tags).size === tags.length, 'no two employees share an asset tag');
    for (const e of DIRECTORY.filter((x) => x.generated)) {
      assert(DIRECTORY.some((m) => m.id === e.manager) && COMPANY.sites.some((x) => x.id === e.site), `${e.id} has a real manager and site`);
    }
    clearGenerated();
    assert(JSON.stringify(generateStaff(11).map((e) => e.name)) === JSON.stringify(staff), 'same seed, same staff');
    clearGenerated();
    const other = generateStaff(12).map((e) => e.name);
    assert(other.filter((n) => staff.includes(n)).length < staff.length / 4, 'another seed, mostly other people');
    clearGenerated();
    const names = (seed) => generateCallers(1, 6, seed, activeRules(1)).map((c) => `${c.claims.name}|${c.dialogue.map((d) => d.text).join()}`);
    const a = names(101);
    clearGenerated();
    assert(names(202).every((n) => !a.includes(n)), 'another seed, other callers with other lines');
    clearGenerated();
    state.newGame();
    const first = state.gameSeed();
    assert(state.gameSeed() === first, 'the seed stays put within a game');
    state.newGame();
    assert(state.gameSeed() !== first, 'New game picks a new seed');
    state.newGame();
  }],
  ['Day 3: a Caller ID mismatch needs a question, and a wrong answer is a deny', async () => {
    const felix = caller('d3-felix-travel');
    assert(evaluate(felix, 3).correct === 'escalate', 'no question asked: escalate');
    assert(evaluate(felix, 3, { asked: [felix.questions[0]] }).correct === 'approve', 'asked: approve');
    const gloria = caller('d3-gloria-fake');
    assert(evaluate(gloria, 3, { asked: [gloria.questions[0]] }).correct === 'deny', 'a tell answer: deny');
  }],
  ['Days 4 and 5: callbacks and MFA decide admin requests and resets', async () => {
    assert(evaluate(caller('d4-aisha-admin'), 4).correct === 'escalate', 'admin without a callback: escalate');
    assert(evaluate(caller('d4-aisha-admin'), 4, { callback: 'confirms' }).correct === 'approve', 'confirmed: approve');
    assert(evaluate(caller('d4-tomasz-admin'), 4, { callback: 'denies' }).correct === 'deny', 'manager says no: deny');
    assert(evaluate(caller('d4-imogen-admin'), 4, { callback: 'unreachable' }).correct === 'escalate', 'no answer: escalate');
    assert(evaluate(caller('d5-felix-reset'), 5).correct === 'escalate', 'reset without a push: escalate');
    assert(ideal(caller('d5-dale-reset'), 5).correct === 'escalate', 'push timed out: escalate');
    assert(ideal(caller('d5-hannah-fake'), 5).correct === 'deny', 'push denied: deny');
  }],
  ['Day 2: terminated is denied, on leave is escalated', async () => {
    assert(evaluate(caller('d2-nadia-reset'), 2).correct === 'deny', 'Nadia');
    assert(evaluate(caller('d2-owen-leave'), 2).correct === 'escalate', 'Owen');
    assert(evaluate(caller('d2-nadia-reset'), 1).correct === 'approve', 'the HR rule is off on Day 1');
  }],
  ['approving an attacker is a breach and escalating is safe', async () => {
    const c = caller('d1-whitacre-reset');
    const v = evaluate(c, 1);
    assert(grade('approve', c, v).breach, 'approve should be a breach');
    const g = grade('escalate', c, v);
    assert(g.outcome === 'escalated' && !g.breach, JSON.stringify(g));
  }],
  ['every story variant of a caller is still fair on its day', async () => {
    let checked = 0;
    for (const c of CALLERS.filter((x) => x.variants)) {
      const day = DAYS.find((d) => d.callers.includes(c.id))?.day;
      assert(day, `${c.id} has variants but isn't on any day`);
      for (const v of c.variants) {
        const { if: _cond, claims, callerId, ...rest } = v;
        assertFair({ ...c, ...rest, claims: { ...c.claims, ...claims }, callerId: { ...c.callerId, ...callerId } }, day);
        checked += 1;
      }
    }
    assert(checked >= 8, `only ${checked} variants checked`);
  }],
  ['approving the threat actor leaks details that later calls and emails use', async () => {
    remove('decisions');
    const gordon = caller('d2-gordon-vpn');
    assert(story.applyVariant(gordon) === gordon, 'no leak: the plain call');
    assert(!story.emailsFor(1, 'end').some((e) => e.id === 'd1-security-jon'), 'no leak: no Security email');
    save('decisions', { 'd1-whitacre-reset': { day: 1, choice: 'approve', outcome: 'wrong', breach: true } });
    assert(story.leaks().includes('jon-mailbox'), 'the leak is recorded');
    assert(story.applyVariant(gordon).dialogue[1].text.includes('Jon Whittaker'), 'Gordon knows about Jon');
    assert(story.emailsFor(1, 'end').some((e) => e.id === 'd1-security-jon'), 'Security emails about it');
    save('decisions', { 'd2-gordon-vpn': { day: 2, choice: 'approve', outcome: 'wrong', breach: true } });
    assert(story.applyVariant(caller('d4-marcus-admin')).callerId.number === '(330) 555-0185', 'the phone list lets them spoof Marcus');
    remove('decisions');
  }],
  ['emails follow how you treated people, and the finale follows the week', async () => {
    save('decisions', { 'd1-dale-install': { day: 1, choice: 'deny', outcome: 'wrong', wrongfulDenial: true } });
    const ids = story.emailsFor(1, 'end', { escalated: 0 }).map((e) => e.id);
    assert(ids.includes('d1-dale-angry') && !ids.includes('d1-dale-happy') && !ids.includes('d1-raj'), ids.join());
    assert(story.emailsFor(1, 'end', { escalated: 5 }).some((e) => e.id === 'd1-raj'), 'Raj counts escalations');
    remove('decisions');
    save('history', { 1: { handled: 8, correct: 8, breaches: 0, wrongfulDenials: 0, csat: 90 } });
    assert(story.finale().heading.includes('promoted'), 'a clean week is a promotion');
    save('history', { 1: { handled: 8, correct: 4, breaches: 3, wrongfulDenials: 0, csat: 60 } });
    assert(story.finale().heading.includes('Friday'), 'three breaches is no promotion');
    remove('history');
  }],
];
