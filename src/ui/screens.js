// Dialog moments: the morning briefing, the call review, and the end of shift.

import { COMPANY } from '../../data/company.js';
import { el, showModal } from './desktop.js';

const VERB = { approve: 'Approve', deny: 'Deny', escalate: 'Escalate' };

export function showBriefing(day, rules, onStart) {
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
      (day.addRules ?? []).includes(r.id) && ' (new)',
      el('br'),
      r.binderText,
    ]))),
  ]);
  showModal({
    title: `${COMPANY.deskName} - Morning briefing`,
    icon: '📋',
    content: memo,
    buttons: [{ label: 'Clock in', primary: true, onClick: onStart }],
  });
}

const BANNERS = {
  correct: { cls: 'correct', text: '✔ Correct call' },
  escalated: { cls: 'escalated', text: '⇪ Escalated to Tier 2' },
  wrong: { cls: 'wrong', text: '✖ Against policy' },
};

export function showResult(caller, evaluation, graded, isLast, onNext) {
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
    buttons: [{ label: isLast ? 'End shift' : 'Next call', primary: true, onClick: onNext }],
  });
}

export function showShiftEnd(day, s, onRestart) {
  const stats = el('dl', { class: 'stats' }, [
    ['Calls handled', s.handled],
    ['Correct decisions', s.correct],
    ['Escalated', s.escalated],
    ['Breaches allowed', s.breaches],
    ['Legit users wrongly denied', s.wrongfulDenials],
  ].flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })]));

  showModal({
    title: `End of shift - Day ${day.day}`,
    icon: '🕔',
    content: [
      stats,
      el('div', { class: 'memo inset' }, [el('div', { class: 'memo-head', text: 'FROM: Bev Kowalczyk' }), el('p', { text: day.bossNote })]),
      el('p', { class: 'debrief', text: 'Phase 1 build: more days, tools and meters arrive in later phases.' }),
    ],
    buttons: [{ label: `Replay Day ${day.day}`, primary: true, onClick: onRestart }],
  });
}
