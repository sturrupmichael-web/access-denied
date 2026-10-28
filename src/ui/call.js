// The phone line window: ringing, the typed-out transcript, the intake form, the
// "Ask a question" menu, the desk actions (Call manager, Send MFA push) and the decision
// buttons. It knows no rules; it reports what the player does through the handlers
// passed to ring().

import { COMPANY } from '../../data/company.js';
import { el, createWindow } from './desktop.js';
import * as stamp from './stamp.js';
import * as audio from '../audio.js';

const TYPE_MS = 16; // per character
const LINE_PAUSE_MS = 350; // between lines, unless a line sets `pause`

const INTAKE_FIELDS = [
  ['name', 'Name', true],
  ['employeeId', 'Employee ID', true],
  ['department', 'Department'],
  ['site', 'Site'],
  ['manager', 'Manager', true],
  ['callback', 'Callback #'],
  ['request', 'Request'],
  ['detail', 'Details'],
];

let win;
let refs;
let typing = null; // { skip, dead } for the transcript being typed
let handlers = null; // see ring()
let caller = null;
let asked = new Set();
let done = new Set(); // desk actions already used on this call

const ACTIONS = {
  callback: { label: '☎ Call manager', busy: 'Calling the manager on file...' },
  mfa: { label: '📱 MFA push', busy: 'Sending a push to the registered phone...' },
};

export function mount(container) {
  win = createWindow({ id: 'call-window', title: 'Line 1 - Idle', icon: '☎', className: 'call-window' });
  refs = {
    status: el('div', { class: 'call-status' }),
    transcript: el('div', { class: 'transcript inset', 'aria-live': 'polite', title: 'Click to skip ahead' }),
    intake: el('dl', { class: 'intake' }),
    stampLayer: el('div', { class: 'stamp-layer' }),
    menu: el('div', { class: 'menu hidden', role: 'menu' }),
  };
  refs.intakeWrap = el('fieldset', { class: 'intake-wrap' }, [
    el('legend', { text: 'Ticket intake (click a name or ID to look it up)' }), refs.intake, refs.stampLayer,
  ]);
  refs.ask = el('button', { class: 'btn ask', type: 'button', text: '? Ask question', 'aria-haspopup': 'menu', onclick: toggleMenu });
  refs.actionButtons = Object.fromEntries(Object.entries(ACTIONS).map(([kind, a]) => [kind,
    el('button', { class: `btn action action-${kind} hidden`, type: 'button', text: a.label, onclick: () => runAction(kind) })]));
  refs.buttons = {
    approve: el('button', { class: 'btn decide approve', type: 'button', text: '✔ Approve', onclick: () => decide('approve') }),
    deny: el('button', { class: 'btn decide deny', type: 'button', text: '✖ Deny', onclick: () => decide('deny') }),
    escalate: el('button', { class: 'btn decide escalate', type: 'button', text: '⇪ Escalate', onclick: () => decide('escalate') }),
  };
  refs.transcript.addEventListener('click', () => {
    if (typing) typing.skip = true;
  });
  document.addEventListener('click', (e) => {
    if (!refs.menu.contains(e.target) && e.target !== refs.ask) refs.menu.classList.add('hidden');
  });
  win.body.append(
    refs.status,
    refs.transcript,
    refs.intakeWrap,
    el('div', { class: 'actions' }, [
      el('div', { class: 'ask-wrap' }, [refs.ask, refs.menu]),
      ...Object.values(refs.actionButtons),
      el('div', { class: 'spacer' }),
      ...Object.values(refs.buttons),
    ]),
  );
  container.append(win.root);
  idle('Waiting for shift to start.');
}

function setButtons(enabled) {
  for (const b of Object.values(refs.buttons)) b.disabled = !enabled;
  const left = (caller?.questions ?? []).filter((q) => !asked.has(q.ask)).length;
  refs.ask.disabled = !enabled || !left;
  for (const [kind, b] of Object.entries(refs.actionButtons)) {
    b.classList.toggle('hidden', !handlers?.actions?.includes(kind));
    b.disabled = !enabled || done.has(kind);
  }
  if (!enabled) refs.menu.classList.add('hidden');
}

function stopTyping() {
  if (typing) typing.dead = true;
  typing = null;
}

export function idle(message) {
  stopTyping();
  handlers = null;
  caller = null;
  win.setTitle('Line 1 - Idle');
  refs.status.className = 'call-status';
  refs.status.replaceChildren(el('span', { class: 'label', text: 'No active call' }));
  refs.transcript.replaceChildren(el('p', { class: 'placeholder', text: message }));
  refs.intake.replaceChildren(el('p', { class: 'empty', text: 'No ticket open.' }));
  stamp.clear(refs.stampLayer, refs.intakeWrap);
  setButtons(false);
}

// Shows an incoming call. callHandlers:
//   actions          desk actions to offer: ['callback', 'mfa']
//   onAnswer()       the player picked up
//   onAsk(question)  the player asked one of caller.questions
//   onAction(kind)   the player used a desk action; returns { result, line }
//   onLookup(text)   the player clicked a name or ID on the intake
//   onDecision(choice)  the stamp has landed: 'approve' | 'deny' | 'escalate'
export function ring(next, callHandlers) {
  idle('Phone is ringing...');
  caller = next;
  handlers = callHandlers;
  asked = new Set();
  done = new Set();
  win.setTitle('Line 1 - Incoming call');
  refs.status.className = 'call-status ringing';
  const answerBtn = el('button', { class: 'btn primary answer', type: 'button', text: '☎ Answer', onclick: answer });
  refs.status.replaceChildren(
    el('span', {}, [el('span', { class: 'label', text: 'Incoming call ' }), el('span', { class: 'number', text: caller.callerId.number })]),
    answerBtn,
  );
  answerBtn.focus();
  audio.play('ring');
}

// Shown in the status line when the clock runs out mid-call.
export function lastCall() {
  if (!caller) return;
  refs.status.querySelector('.skip-hint')?.replaceWith(el('span', { class: 'skip-hint warn', text: '17:00. Finish this call, then go home.' }));
}

function answer() {
  audio.play('click');
  win.setTitle('Line 1 - On call');
  refs.status.className = 'call-status';
  refs.status.replaceChildren(
    el('span', {}, [el('span', { class: 'label', text: 'Connected ' }), el('span', { class: 'number', text: caller.callerId.number })]),
    el('span', { class: 'skip-hint', text: 'Click the transcript to skip ahead' }),
  );
  refs.transcript.replaceChildren();
  renderIntake(caller.claims);
  handlers.onAnswer();
  typeLines(caller.dialogue ?? [], ready);
}

function ready() {
  const hint = refs.status.querySelector('.skip-hint:not(.warn)');
  if (hint) hint.textContent = 'Make your decision';
  setButtons(true);
}

function renderIntake(claims) {
  refs.intake.replaceChildren();
  for (const [key, label, lookup] of INTAKE_FIELDS) {
    let value = claims[key];
    if (value === undefined || value === '') continue;
    if (key === 'request') value = COMPANY.requestTypes[value]?.label ?? value;
    const content = lookup
      ? el('button', { class: 'link', type: 'button', title: `Look up "${value}"`, text: value, onclick: () => handlers?.onLookup(value) })
      : value;
    refs.intake.append(el('dt', { text: label }), el('dd', {}, content));
  }
}

function toggleMenu() {
  audio.play('click');
  const questions = (caller?.questions ?? []).filter((q) => !asked.has(q.ask));
  refs.menu.replaceChildren(...questions.map((q) => el('button', {
    class: 'menu-item', type: 'button', role: 'menuitem', text: q.ask, onclick: () => ask(q),
  })), el('p', { class: 'menu-note', text: `Each question takes about ${COMPANY.timeCosts.question} minutes.` }));
  refs.menu.classList.toggle('hidden');
}

function ask(q) {
  refs.menu.classList.add('hidden');
  asked.add(q.ask);
  handlers.onAsk(q);
  setButtons(false);
  typeLines([{ from: 'agent', text: q.ask }, { from: 'caller', text: q.answer }], ready);
}

function runAction(kind) {
  audio.play('click');
  done.add(kind);
  setButtons(false);
  const outcome = handlers.onAction(kind);
  typeLines([{ from: 'system', text: ACTIONS[kind].busy }, { from: 'system', text: outcome.line, result: outcome.result }], ready);
}

function typeLines(lines, finished) {
  stopTyping();
  const job = { skip: false, dead: false };
  typing = job;
  let i = 0;

  const nextLine = () => {
    if (job.dead) return;
    if (i >= lines.length) {
      typing = null;
      finished();
      return;
    }
    const line = lines[i++];
    const says = el('span', { class: 'says' });
    const who = { agent: 'You:', caller: `${caller.claims.name}:`, system: '»' }[line.from] ?? `${caller.claims.name}:`;
    refs.transcript.append(el('div', { class: `line ${line.from} ${line.result ?? ''}` }, [el('span', { class: 'who', text: who }), says]));

    let n = 0;
    const tick = () => {
      if (job.dead) return;
      if (job.skip) {
        says.textContent = line.text;
        scrollDown();
        setTimeout(nextLine, 0);
        return;
      }
      n += 1;
      says.textContent = line.text.slice(0, n);
      if (n % 4 === 0) audio.play('key');
      scrollDown();
      if (n < line.text.length) setTimeout(tick, TYPE_MS);
      else setTimeout(nextLine, line.pause ?? LINE_PAUSE_MS);
    };
    tick();
  };
  nextLine();
}

function scrollDown() {
  refs.transcript.scrollTop = refs.transcript.scrollHeight;
}

function decide(choice) {
  if (!handlers) return;
  const { onDecision } = handlers;
  handlers = { ...handlers, onDecision: null };
  if (!onDecision) return;
  setButtons(false);
  stamp.slam(refs.stampLayer, refs.intakeWrap, choice).then(() => onDecision(choice));
}
