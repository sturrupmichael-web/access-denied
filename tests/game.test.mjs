// Plays the game in a real browser: the briefing, the desk tools, whole shifts, the clock
// running out, and saving. Runs on dev.html, the built index.html over HTTP, and
// index.html opened straight from disk.

import { assert } from './harness.mjs';

export const browser = true;
export const pages = ['dev.html', 'index.html', 'file:index.html'];

// What policy says for the caller on the line.
const policyNow = (page) => page.evaluate(() => {
  const { shift, state, verdict } = window.accessDenied;
  return verdict.evaluate(shift.currentCaller(), state.current().day).correct;
});

async function answer(page) {
  await page.click('.answer');
  await page.click('.transcript'); // skip the typing
  await page.waitForSelector('.decide.approve:not([disabled])');
}

// Answers the ringing call and stamps it (`choice`, or whatever policy says).
async function playCall(page, choice) {
  await answer(page);
  await page.click(`.decide.${choice ?? await policyNow(page)}`);
  await page.waitForSelector('.overlay');
  return page.textContent('.overlay .verdict-banner');
}

// Clicks the dialog's main button, then reads past any emails it leads to.
async function next(page) {
  await page.click('.overlay .btn.primary');
  while (await page.locator('.overlay .email').count()) await page.click('.overlay .btn.primary');
}

export const tests = [
  ['boots to the briefing with no errors', async (page) => {
    await page.waitForSelector('.overlay');
    const text = await page.textContent('.overlay');
    assert(text.includes('Name and employee ID must match Active Directory'), 'briefing should list the Day 1 rule');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['the clock and queue run once the shift starts', async (page) => {
    assert((await page.textContent('#clock')) === '09:00', 'clock starts at 09:00');
    await next(page);
    assert((await page.textContent('#queue')).includes('8 in queue'), await page.textContent('#queue'));
    await page.evaluate(() => window.accessDenied.clock.advance(30));
    assert((await page.textContent('#clock')) === '09:30', await page.textContent('#clock'));
  }],
  ['every desk tool shows its record', async (page) => {
    await answer(page); // Priya
    await page.click('.intake .link >> text=HD-10423'); // clicking the intake ID searches AD
    assert((await page.textContent('#panel-ad .record')).includes('LOCKED'), 'AD shows Priya locked');
    await page.click('#tab-hr');
    await page.fill('#panel-hr input', 'nadia');
    await page.press('#panel-hr input', 'Enter');
    assert((await page.textContent('#panel-hr .record')).includes('TERMINATED'), 'HR shows Nadia terminated');
    await page.click('#tab-org');
    await page.fill('#panel-org input', 'HD-12266');
    await page.click('#panel-org .find');
    const org = await page.textContent('#panel-org .record');
    assert(org.includes('Richard Halvorsen') && org.includes('Marguerite Dunleavy'), org);
    await page.click('#tab-tickets');
    await page.fill('#panel-tickets input', 'rick');
    await page.click('#panel-tickets .find');
    assert((await page.textContent('#panel-tickets .record')).includes('2 password reset'), 'Rick has two resets');
    await page.click('#tab-callerid');
    assert((await page.textContent('#panel-callerid')).includes('(330) 555-0142'), 'Caller ID shows the number');
    await page.click('#tab-policy');
    assert((await page.textContent('#panel-policy')).includes('HD-12345'), 'Policy shows the ID format');
  }],
  ['asking a question types the answer and costs time', async (page) => {
    const before = await page.evaluate(() => window.accessDenied.clock.now());
    await page.click('.ask');
    await page.click('.menu-item >> nth=0');
    await page.waitForSelector('.decide.approve:not([disabled])');
    assert((await page.textContent('.transcript')).includes('Gloria Okafor'), 'Priya answers with her manager');
    const after = await page.evaluate(() => window.accessDenied.clock.now());
    assert(after - before >= 3, `clock moved ${after - before}`);
    assert((await playCallDecision(page, 'approve')).includes('Correct'), 'Priya is a correct approve');
  }],
  ['the rest of Day 1 plays through to the summary and Day 2', async (page) => {
    await next(page);
    assert((await playCall(page, 'approve')).includes('Correct'), 'Rick (alias) is approved'); await next(page);
    assert((await playCall(page, 'approve')).includes('Against policy'), 'approving the misspelled name'); await next(page);
    assert((await playCall(page, 'deny')).includes('Against policy'), 'denying Dale'); await next(page);
    for (let i = 0; i < 4; i++) {
      await playCall(page);
      await next(page);
    }
    const summary = await page.textContent('.overlay .stats');
    assert(/Calls handled8/.test(summary) && /Breaches allowed1/.test(summary) && /wrongly denied1/.test(summary), summary);
    assert((await page.textContent('.overlay')).includes('Security flagged'), 'breach note from Bev');
    await page.click('text=Start Day 2');
    assert((await page.textContent('.overlay')).includes('The employee must be active in the HR Roster'), 'Day 2 briefing');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['Day 2: terminated is denied, on leave is escalated, and the repeat number shows', async (page) => {
    await next(page);
    await playCall(page); await next(page); // Hannah
    await playCall(page); await next(page); // Dale
    await answer(page); // Nadia
    assert((await policyNow(page)) === 'deny', 'Nadia is terminated');
    await page.click('.decide.deny'); await page.waitForSelector('.overlay'); await next(page);
    await playCall(page); await next(page); // Wendy
    await answer(page); // Owen
    assert((await policyNow(page)) === 'escalate', 'Owen is on leave');
    await page.click('.decide.escalate'); await page.waitForSelector('.overlay'); await next(page);
    await playCall(page); await next(page); // Priya
    await answer(page); // Gordon, the threat actor again
    await page.click('#tab-callerid');
    const cid = await page.textContent('#panel-callerid');
    assert(cid.includes('Jonathon Whitaker') && cid.includes('Marcus Bell'), cid);
  }],
  ['the shift is saved and resumes after a reload', async (page) => {
    await page.reload();
    await page.waitForFunction(() => window.accessDenied && !document.getElementById('boot'));
    const text = await page.textContent('.overlay');
    if (page.url().startsWith('file:') && !text.includes('partway')) return; // no storage on file://
    assert(text.includes('partway through Day 2: 6 calls done'), text);
    await page.click('text=Continue');
    await next(page); // briefing: Back to work
    await answer(page);
    assert((await page.textContent('.intake')).includes('Gordon Fitch'), 'resumes at Gordon');
  }],
  ['callers still waiting at 17:00 are missed', async (page) => {
    await page.click('.decide.deny');
    await page.waitForSelector('.overlay');
    await next(page);
    await page.evaluate(() => window.accessDenied.clock.advance(600));
    await page.waitForSelector('.overlay .stats');
    const summary = await page.textContent('.overlay .stats');
    assert(/at 17:003/.test(summary), summary);
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['Day 4: Call manager rings the manager on file, and the meters move', async (page) => {
    await page.evaluate(() => {
      document.getElementById('modal-root').replaceChildren();
      window.accessDenied.shift.begin(4);
    });
    assert((await page.textContent('.overlay')).includes('need a callback'), 'Day 4 briefing');
    await next(page);
    await answer(page); // Aisha
    assert(await page.isVisible('.action-callback'), 'Call manager is offered on Day 4');
    assert(!(await page.isVisible('.action-mfa')), 'MFA is not offered until Day 5');
    await page.click('.action-callback');
    await page.waitForSelector('.decide.approve:not([disabled])');
    assert((await page.textContent('.transcript')).includes('Rick:'), 'the callback reaches Rick, her manager on file');
    assert(await page.isDisabled('.action-callback'), 'one callback per call');
    const before = await page.evaluate(() => window.accessDenied.meters.current().patience);
    assert((await playCallDecision(page, 'approve')).includes('Correct'), 'confirmed admin request is approved');
    assert((await page.textContent('.overlay .meter-change')).includes('CSAT +3'), 'review shows the meter change');
    assert((await page.evaluate(() => window.accessDenied.meters.current().patience)) >= before, 'patience did not drop');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['a full breach meter ends the game with the reassignment ending', async (page) => {
    await page.evaluate(() => localStorage.setItem('accessDenied:meters', JSON.stringify({ breach: 95, csat: 75, patience: 100, tripped: ['security-incident', 'sent-home'] })));
    await page.reload();
    await page.waitForFunction(() => window.accessDenied && !document.getElementById('boot'));
    if (page.url().startsWith('file:') && !(await page.textContent('.overlay')).includes('partway')) return; // no storage on file://
    await page.click('text=Continue');
    await next(page);
    await playCall(page); await next(page); // Rick's reset
    await answer(page); // fake Dale
    await page.click('.decide.approve');
    await page.waitForSelector('.overlay');
    await page.click('.overlay .btn.primary');
    await page.waitForSelector('.ending-heading');
    assert((await page.textContent('.overlay')).includes("You've been reassigned"), await page.textContent('.overlay'));
    await page.click('text=New game');
    assert((await page.textContent('.overlay')).includes('Orientation'), 'New game starts Day 1');
    assert((await page.evaluate(() => window.accessDenied.meters.current().breach)) === 0, 'meters reset');
  }],
  ['mute is saved under the accessDenied: prefix', async (page) => {
    await page.click('#mute-btn');
    const saved = await page.evaluate(() => localStorage.getItem('accessDenied:muted'));
    // Some browsers give file:// pages no localStorage; the game must still run there.
    assert(saved === 'true' || page.url().startsWith('file:'), `saved: ${saved}`);
  }],
];

async function playCallDecision(page, choice) {
  await page.click(`.decide.${choice}`);
  await page.waitForSelector('.overlay');
  return page.textContent('.overlay .verdict-banner');
}
