// Plays a call on a phone: one window at a time, switched from the taskbar, and nothing
// spilling off the side of the screen. Starts in portrait (375x667) and turns the phone to
// landscape at the end.

import { assert } from './harness.mjs';

export const browser = true;
export const pages = ['dev.html', 'index.html'];
export const viewport = { width: 375, height: 667 };

// Whether the element is shown and sits wholly inside the screen.
const onScreen = (page, selector) => page.locator(selector).first().evaluate((node) => {
  const r = node.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5;
});

const noSideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth
  && [...document.querySelectorAll('.window-body, .taskbar, .actions')].every((n) => !n.offsetParent || getComputedStyle(n).overflowX === 'hidden' || n.scrollWidth <= n.clientWidth));

async function skipDialogs(page) {
  while (await page.locator('.overlay').count()) await page.click('.overlay .btn.primary');
}

export const tests = [
  ['the title screen and the taskbar fit a portrait phone', async (page) => {
    await page.waitForSelector('.title-window');
    assert(await onScreen(page, '.title-window'), 'title screen on screen');
    for (const s of ['.win-btn[data-view="call"]', '.win-btn[data-view="tools"]', '#mute-btn', '#settings-btn', '#clock', '#queue', '#meter-breach'])
      assert(await onScreen(page, s), `${s} on screen`);
    assert(await noSideScroll(page), 'nothing wider than the screen');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
  ['Line 1 shows alone, with the stamps on screen', async (page) => {
    await page.click('.title-window >> text=New game');
    assert(await onScreen(page, '.overlay .btn.primary'), 'briefing button on screen');
    await skipDialogs(page);
    assert(await page.isVisible('#call-window') && !(await page.isVisible('#desk-tools')), 'only Line 1 shows');
    await page.click('.answer');
    await page.click('.transcript');
    await page.waitForSelector('.decide.approve:not([disabled])');
    for (const s of ['.decide.approve', '.decide.deny', '.decide.escalate', '.ask']) assert(await onScreen(page, s), `${s} on screen`);
    assert(await noSideScroll(page), 'nothing wider than the screen');
  }],
  ['looking up a name brings up Desk Tools, and the taskbar goes back', async (page) => {
    await page.click('.intake .link >> text=HD-10423');
    assert(await page.isVisible('#desk-tools') && !(await page.isVisible('#call-window')), 'only Desk Tools shows');
    assert((await page.textContent('#panel-ad .record')).includes('LOCKED'), 'AD shows Priya locked');
    assert(await onScreen(page, '#panel-ad .find'), 'Find Now on screen');
    assert(await noSideScroll(page), 'nothing wider than the screen');
    await page.click('.win-btn[data-view="call"]');
    assert(await page.isVisible('#call-window') && !(await page.isVisible('#desk-tools')), 'back on Line 1');
  }],
  ['the call review fits, and the next call comes up on Line 1', async (page) => {
    await page.click('.decide.approve');
    await page.waitForSelector('.overlay .verdict-banner');
    assert(await onScreen(page, '.overlay .window'), 'call review on screen');
    await page.click('.win-btn[data-view="tools"]');
    await page.click('.overlay .btn.primary');
    await page.waitForSelector('.answer');
    assert(await page.isVisible('#call-window'), 'a ringing phone brings up Line 1');
  }],
  ['turned to landscape, the call still fits without scrolling', async (page) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.click('.answer');
    await page.click('.transcript');
    await page.waitForSelector('.decide.approve:not([disabled])');
    for (const s of ['.decide.approve', '.decide.escalate', '.win-btn[data-view="tools"]', '#clock']) assert(await onScreen(page, s), `${s} on screen`);
    assert(await page.evaluate(() => { const b = document.querySelector('#call-window .window-body'); return b.scrollHeight <= b.clientHeight; }), 'call window does not scroll');
    assert(await noSideScroll(page), 'nothing wider than the screen');
    assert(!page.errors.length, page.errors.join('\n'));
  }],
];
