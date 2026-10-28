// Dialog moments: the morning briefing, the call review, the end of shift, and the
// welcome-back prompt when there's a saved game.

import { COMPANY } from '../../data/company.js';
import { el, showModal } from './desktop.js';

const VERB = { approve: 'Approve', deny: 'Deny', escalate: 'Escalate' };

// buttonLabel: "Clock in" for a fresh shift, "Back to work" when resuming one.
export function showBriefing(day, rules, onStart, buttonLabel = 'Clock in') {
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
    el('p', { class: 'debrief', text: `Calls in the queue: ${day.callers.length}. Phones open ${COMPANY.shift.start} to ${COMPANY.shift.end}. The policy is in the Policy tab all day.` }),
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

export function showResult(caller, evaluation, graded, nextLabel, onNext) {
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
  ].flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));

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

// For a saved game: options are [{ label, primary, onClick }].
export function showWelcomeBack(message, options) {
  showModal({
    title: `${COMPANY.deskName} - Welcome back`,
    icon: '💾',
    content: el('p', { text: message }),
    buttons: options,
  });
}
