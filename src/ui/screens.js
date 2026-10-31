// Dialog moments: the title screen, settings, the inbox, the morning briefing, the call
// review, the end of shift, and the endings.

import { COMPANY } from '../../data/company.js';
import { el, showModal, renderMute } from './desktop.js';
import * as audio from '../audio.js';
import * as settings from '../settings.js';

const VERB = { approve: 'Approve', deny: 'Deny', escalate: 'Escalate' };

// buttonLabel: "Clock in" for a fresh shift, "Back to work" when resuming one.
export function showBriefing(day, rules, queueLength, onStart, buttonLabel = 'Clock in') {
  const memo = el('div', { class: 'memo inset' }, [
    el('div', { class: 'memo-head' }, [
      el('div', { text: 'TO:      Tier 1 Service Desk' }),
      el('div', { text: 'FROM:    Bev Kowalczyk, Service Desk Manager' }),
      el('div', { text: `DATE:    ${day.weekday}, Day ${day.day}` }),
      el('div', { text: `RE:      ${day.title}` }),
    ]),
    ...day.briefing.map((p) => el('p', { text: p })),
    el('p', {}, el('strong', { text: 'Verification policy in effect:' })),
    el('ul', {}, rules.map((r) => el('li', {}, [
      el('strong', { text: r.title }),
      (day.addRules ?? []).includes(r.id) && el('span', { class: 'new-badge', text: 'NEW' }),
      el('br'),
      r.binderText,
    ]))),
    el('p', { class: 'debrief', text: `Calls in the queue: ${queueLength}. Phones open ${COMPANY.shift.start} to ${COMPANY.shift.end}. The policy is in the Policy tab all day.` }),
  ]);
  showModal({
    title: `${COMPANY.deskName} - Morning briefing`,
    icon: '📋',
    content: memo,
    buttons: [{ label: buttonLabel, primary: true, onClick: onStart }],
  });
}

const BANNERS = {
  correct: { cls: 'correct', text: '✔ Correct call' },
  escalated: { cls: 'escalated', text: '⇪ Escalated to Tier 2' },
  wrong: { cls: 'wrong', text: '✖ Against policy' },
};

// meterText: "Breach +34, Patience -25", or empty.
export function showResult(caller, evaluation, graded, meterText, nextLabel, onNext) {
  const banner = BANNERS[graded.outcome];
  const content = [
    el('p', { class: `verdict-banner ${banner.cls}`, text: banner.text }),
    el('p', { text: `You chose ${VERB[graded.choice]}. Policy said ${VERB[graded.policy]}.` }),
  ];
  if (evaluation.failures.length) {
    content.push(
      el('p', {}, el('strong', { text: 'What the checks found:' })),
      el('ul', { class: 'reasons' }, evaluation.failures.map((f) => el('li', { text: f.reason }))),
    );
  } else {
    content.push(el('p', { text: 'Every check passed.' }));
  }
  if (graded.breach) content.push(el('p', { class: 'verdict-banner wrong', text: 'You just handed an attacker the keys.' }));
  else if (graded.wrongfulDenial) content.push(el('p', { class: 'verdict-banner wrong', text: 'A real employee is now very annoyed.' }));
  content.push(el('p', { text: caller.attacker ? 'This caller was a social engineer.' : 'This caller was a genuine employee.' }));
  if (caller.debrief) content.push(el('p', { class: 'debrief', text: caller.debrief }));
  if (meterText) content.push(el('p', { class: 'meter-change', text: meterText }));

  showModal({
    title: 'Call review',
    icon: '📝',
    content,
    buttons: [{ label: nextLabel, primary: true, onClick: onNext }],
  });
}

// buttons: [{ label, primary, onClick }], e.g. "Start Day 2" and "Replay Day 1".
export function showShiftEnd(day, s, note, buttons) {
  const stats = el('dl', { class: 'stats' }, [
    ['Calls handled', s.handled],
    ['Correct decisions', s.correct],
    ['Escalated to Tier 2', s.escalated],
    ['Breaches allowed', s.breaches],
    ['Legit users wrongly denied', s.wrongfulDenials],
    ['Callers left waiting at 17:00', s.missed],
    ['Caller satisfaction (CSAT)', `${s.csat}%`],
    s.sentHome && ['Sent home early', 'Yes'],
  ].filter(Boolean).flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));

  showModal({
    title: `End of shift - Day ${day.day}`,
    icon: '🕔',
    content: [
      stats,
      el('div', { class: 'memo inset' }, [el('div', { class: 'memo-head', text: 'FROM: Bev Kowalczyk' }), el('p', { text: note })]),
    ],
    buttons,
  });
}

// The inbox: emails from meter events (data/meters.js) and the story (data/story.js), each
// { from, subject, body }. Reads them one at a time, then calls onClose. With no emails it
// goes straight to onClose.
export function showInbox(emails, onClose) {
  if (!emails.length) return onClose();
  audio.play(emails.some((e) => /security/i.test(e.from)) ? 'alarm' : 'mail');
  const read = new Set();
  const list = el('ul', { class: 'inbox-list inset', role: 'listbox', 'aria-label': 'Messages' });
  const pane = el('div', { class: 'memo inset email-body' });
  const items = emails.map((email, i) => el('li', {}, el('button', {
    class: 'inbox-item', type: 'button', role: 'option', onclick: () => open(i),
  }, [el('span', { class: 'inbox-from', text: email.from }), el('span', { class: 'inbox-subject', text: email.subject })])));
  list.append(...items);
  let modal;
  let current = 0;
  const open = (i) => {
    current = i;
    read.add(i);
    items.forEach((li, j) => {
      li.firstChild.classList.toggle('unread', !read.has(j));
      li.firstChild.classList.toggle('selected', j === i);
      li.firstChild.setAttribute('aria-selected', j === i ? 'true' : 'false');
    });
    const email = emails[i];
    pane.replaceChildren(
      el('div', { class: 'memo-head' }, [el('div', { text: `FROM:    ${email.from}` }), el('div', { text: `SUBJECT: ${email.subject}` })]),
      ...email.body.split(/\n\n+/).map((p) => el('p', { text: p })),
    );
    pane.scrollTop = 0;
    const unread = emails.findIndex((_, j) => !read.has(j));
    modal?.setButtons([unread === -1
      ? { label: 'Close inbox', primary: true, onClick: onClose }
      : { label: 'Next message ▸', primary: true, stay: true, onClick: () => { audio.play('mail'); open(unread); } }]);
  };
  modal = showModal({
    title: `Inbox - ${emails.length} new message${emails.length > 1 ? 's' : ''}`,
    icon: '✉',
    className: 'inbox-window',
    content: el('div', { class: `inbox email${emails.length > 1 ? '' : ' single'}` }, [list, pane]),
  });
  open(current);
}

// An ending from data/endings.js, already resolved by story.js. recap: the week's totals
// (story.week()) and the meters.
export function showEnding(ending, recap, onNewGame) {
  const rows = [
    ['Days worked', recap.days],
    ['Calls handled', recap.handled],
    ['Correct decisions', recap.correct],
    ['Breaches allowed', recap.breaches],
    ['Legit users wrongly denied', recap.wrongfulDenials],
    ['Average CSAT', `${recap.csat}%`],
    ["Bev's patience", `${Math.round(recap.patience)} of 100`],
  ];
  showModal({
    title: ending.title,
    icon: ending.win ? '🏆' : '📄',
    className: `ending-window ${ending.win ? 'win' : 'lose'}`,
    content: [
      el('div', { class: 'ending-top' }, [
        el('p', { class: 'ending-heading', text: ending.heading }),
        el('div', { class: `stamp ending-stamp ${ending.win ? 'approve' : 'deny'}`, text: ending.win ? 'Approved' : 'Denied' }),
      ]),
      ...ending.body.map((p) => el('p', { text: p })),
      el('dl', { class: 'stats' }, rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
      el('p', { class: 'debrief', text: ending.win ? 'THE END' : 'GAME OVER' }),
    ],
    buttons: [{ label: 'New game', primary: true, onClick: onNewGame }],
  });
}

// The title screen. save: the saved game, or null: { text, onContinue, restart }, where
// restart is an optional extra button { label, onClick }.
export function showTitle({ save, onNewGame, onSettings }) {
  audio.play('startup');
  const again = () => showTitle({ save, onNewGame, onSettings });
  const buttons = [
    save && { label: 'Continue', primary: true, onClick: save.onContinue },
    save?.restart,
    { label: 'New game', primary: !save, onClick: save ? () => confirmNewGame(onNewGame, again) : onNewGame },
    { label: 'How to play', stay: true, onClick: showHowToPlay },
    { label: 'Settings', stay: true, onClick: onSettings },
  ].filter(Boolean);
  showModal({
    title: 'Access Denied',
    icon: '🔒',
    className: 'title-window',
    content: [
      el('div', { class: 'logo', 'aria-label': 'Access Denied' }, [
        el('div', { class: 'logo-access', text: 'ACCESS' }),
        el('div', { class: 'stamp logo-stamp deny', text: 'Denied' }),
      ]),
      el('p', { class: 'tagline', text: `Tier 1, ${COMPANY.name}. Five shifts. One very persistent caller.` }),
      save && el('p', { class: 'save-info inset', text: save.text }),
    ],
    buttons,
  });
}

function confirmNewGame(onYes, onNo) {
  showModal({
    title: 'New game',
    icon: '⚠',
    content: el('p', { text: 'Start over from Day 1? Your saved game will be erased.' }),
    buttons: [{ label: 'Cancel', onClick: onNo }, { label: 'Start over', primary: true, onClick: onYes }],
  });
}

export function showHowToPlay() {
  showModal({
    title: 'How to play',
    icon: '❔',
    content: el('div', { class: 'memo inset' }, [
      el('p', { text: `You're on the ${COMPANY.deskName} phones. Every caller wants something: a reset, an unlock, access, an install. Most are who they say they are. Some aren't.` }),
      el('ul', {}, [
        el('li', { text: 'Answer the phone and read the ticket intake.' }),
        el('li', { text: 'Check what they claim against the Desk Tools: AD, HR, the org chart, tickets and Caller ID. Click a name or ID on the intake to look it up.' }),
        el('li', { text: 'Ask questions, call their manager, or send an MFA push when the policy says to. Each costs a few minutes.' }),
        el('li', { text: "Approve, Deny or Escalate. Each morning's briefing adds a rule, and the Policy tab has all of them." }),
      ]),
      el('p', { text: "Let an attacker in and the Breach meter climbs. Turn real people away and CSAT drops. Do either too often and Bev runs out of patience. Survive your two-week probation and there's a promotion in it." }),
    ]),
    buttons: [{ label: 'Got it', primary: true }],
  });
}

const choice = (label, value, options, onChange) => el('label', { class: 'setting' }, [
  el('span', { text: label }),
  el('select', { onchange: (e) => onChange(e.target.value) }, options.map(([v, text]) => el('option', { value: v, text, selected: v === value }))),
]);

// Settings changes apply as soon as they're made. onClose: after Done.
export function showSettings(onClose) {
  const s = settings.get();
  showModal({
    title: 'Settings',
    icon: '⚙',
    className: 'settings-window',
    content: el('div', { class: 'settings' }, [
      el('fieldset', {}, [
        el('legend', { text: 'Sound' }),
        el('label', { class: 'setting check' }, [
          el('input', { type: 'checkbox', id: 'setting-sound', checked: !audio.isMuted(), onchange: (e) => { audio.setMuted(!e.target.checked); renderMute(); audio.play('click'); } }),
          el('span', { text: 'Sound effects' }),
        ]),
        el('label', { class: 'setting' }, [
          el('span', { text: 'Volume' }),
          el('input', { type: 'range', id: 'setting-volume', min: 0, max: 100, step: 5, value: s.volume, onchange: (e) => { settings.set({ volume: Number(e.target.value) }); audio.play('stamp'); } }),
        ]),
      ]),
      el('fieldset', {}, [
        el('legend', { text: 'Game' }),
        choice('Text speed', s.textSpeed, [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']], (v) => settings.set({ textSpeed: v })),
        choice('Shift length', s.shiftLength, [['relaxed', 'Relaxed (12 minutes)'], ['normal', 'Normal (8 minutes)'], ['brisk', 'Brisk (5 minutes)']], (v) => settings.set({ shiftLength: v })),
        el('label', { class: 'setting check' }, [
          el('input', { type: 'checkbox', id: 'setting-motion', checked: s.motion, onchange: (e) => settings.set({ motion: e.target.checked }) }),
          el('span', { text: 'Animations' }),
        ]),
      ]),
    ]),
    buttons: [{ label: 'Done', primary: true, onClick: onClose }],
  });
}
