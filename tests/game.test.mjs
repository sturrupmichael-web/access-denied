// Plays Day 1 in a real browser: the briefing, each call, an AD search, the stamps and
// the end of shift. Runs on dev.html, the built index.html over HTTP, and index.html
// opened straight from disk.

import { assert } from './harness.mjs';

export const browser = true;
export const pages = ['dev.html', 'index.html', 'file:index.html'];

async function playCall(page, choice) {
  await page.click('.answer');
  await page.click('.transcript'); // skip the typing
  await page.waitForSelector('.decide.approve:not([disabled])');
  await page.click(`.decide.${choice}`);
  await page.waitForSelector('.overlay');
  return page.textContent('.overlay .verdict-banner');
}

export const tests = [
  ['boots to the briefing with no errors', async (page) => {
    await page.waitForSelector('.overlay');
    const text = await page.textContent('.overlay');
    assert(text.includes('Name and employee ID must match Active Directory'), 'briefing should list the Day 1 rule');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['AD Lookup finds an employee by ID and shows the record', async (page) => {
    await page.click('text=Clock in');
    await page.fill('#ad-lookup input', 'HD-12266');
    await page.click('#ad-lookup button[type=submit]');
    const record = await page.textContent('#ad-lookup .record');
    assert(record.includes('Jonathan Whittaker') && record.includes('Marguerite Dunleavy (HD-10540)'), record);
  }],
  ['a full shift plays through to the summary', async (page) => {
    assert((await playCall(page, 'approve')).includes('Correct'), 'Priya should be a correct approve');
    await page.click('.overlay .btn.primary');
    assert((await playCall(page, 'approve')).includes('Against policy'), 'approving the misspelled name is against policy');
    assert((await page.textContent('.overlay')).includes('handed an attacker the keys'), 'should flag the breach');
    await page.click('.overlay .btn.primary');
    assert((await playCall(page, 'deny')).includes('Against policy'), 'denying Dale is against policy');
    await page.click('.overlay .btn.primary');
    assert((await playCall(page, 'escalate')).includes('Escalated'), 'escalating Kevin is safe');
    await page.click('.overlay .btn.primary');
    const summary = await page.textContent('.overlay .stats');
    assert(/Calls handled4/.test(summary) && /Breaches allowed1/.test(summary) && /wrongly denied1/.test(summary), summary);
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['mute is saved under the accessDenied: prefix', async (page) => {
    await page.click('#mute-btn');
    const saved = await page.evaluate(() => localStorage.getItem('accessDenied:muted'));
    // Some browsers give file:// pages no localStorage; the game must still run there.
    assert(saved === 'true' || page.url().startsWith('file:'), `saved: ${saved}`);
  }],
];
