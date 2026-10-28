// The phone line window: ringing, the typed-out transcript, the intake form and the
// decision buttons. It knows no rules; it only reports the player's choice.

import { COMPANY } from '../../data/company.js';
import { el, createWindow } from './desktop.js';
import * as stamp from './stamp.js';
import * as audio from '../audio.js';

const TYPE_MS = 16; // per character
const LINE_PAUSE_MS = 350; // between lines, unless a line sets `pause`

const INTAKE_FIELDS = [
  ['name', 'Name'],
  ['employeeId', 'Employee ID'],
  ['department', 'Department'],
  ['site', 'Site'],
  ['manager', 'Manager'],
  ['callback', 'Callback #'],
  ['request', 'Request'],
  ['detail', 'Details'],
];

let win;
let refs;
let typing = null; // { skip, dead } for the transcript being typed
let onDecision = null;

export function mount(container) {
  win = createWindow({ id: 'call-window', title: 'Line 1 - Idle', icon: '☎', className: 'call-window' });
  refs = {
    status: el('div', { class: 'call-status' }),
    transcript: el('div', { class: 'transcript inset', 'aria-live': 'polite', title: 'Click to skip ahead' }),
    intake: el('dl', { class: 'intake' }),
    stampLayer: el('div', { class: 'stamp-layer' }),
  };
  refs.intakeWrap = el('fieldset', { class: 'intake-wrap' }, [el('legend', { text: 'Ticket intake' }), refs.intake, refs.stampLayer]);
  refs.buttons = {
    approve: el('button', { class: 'btn decide approve', type: 'button', text: '✔ Approve', onclick: () => decide('approve') }),
    deny: el('button', { class: 'btn decide deny', type: 'button', text: '✖ Deny', onclick: () => decide('deny') }),
    escalate: el('button', { class: 'btn decide escalate', type: 'button', text: '⇪ Escalate', onclick: () => decide('escalate') }),
  };
  refs.transcript.addEventListener('click', () => {
    if (typing) typing.skip = true;
  });
  win.body.append(refs.status, refs.transcript, refs.intakeWrap, el('div', { class: 'actions' }, Object.values(refs.buttons)));
  container.append(win.root);
  idle('Waiting for shift to start.');
}

function setButtons(enabled) {
  for (const b of Object.values(refs.buttons)) b.disabled = !enabled;
}

function stopTyping() {
  if (typing) typing.dead = true;
  typing = null;
}

export function idle(message) {
  stopTyping();
  onDecision = null;
  win.setTitle('Line 1 - Idle');
  refs.status.className = 'call-status';
  refs.status.replaceChildren(el('span', { class: 'label', text: 'No active call' }));
  refs.transcript.replaceChildren(el('p', { class: 'placeholder', text: message }));
  refs.intake.replaceChildren(el('p', { class: 'empty', text: 'No ticket open.' }));
  stamp.clear(refs.stampLayer, refs.intakeWrap);
  setButtons(false);
}

// Shows an incoming call. `decided(choice)` fires once the stamp has landed.
export function ring(caller, decided) {
  idle('Phone is ringing...');
  onDecision = decided;
  win.setTitle('Line 1 - Incoming call');
  refs.status.className = 'call-status ringing';
  const answerBtn = el('button', { class: 'btn primary answer', type: 'button', text: '☎ Answer', onclick: () => answer(caller) });
  refs.status.replaceChildren(
    el('span', {}, [el('span', { class: 'label', text: 'Incoming call ' }), el('span', { class: 'number', text: caller.callerId.number })]),
    answerBtn,
  );
  answerBtn.focus();
  audio.play('ring');
}

function answer(caller) {
  audio.play('click');
  win.setTitle('Line 1 - On call');
  refs.status.className = 'call-status';
  const hint = el('span', { class: 'skip-hint', text: 'Click the transcript to skip ahead' });
  refs.status.replaceChildren(
    el('span', {}, [el('span', { class: 'label', text: 'Connected ' }), el('span', { class: 'number', text: caller.callerId.number })]),
    hint,
  );
  refs.transcript.replaceChildren();
  renderIntake(caller.claims);
  typeLines(caller.claims.name, caller.dialogue ?? [], () => {
    hint.textContent = 'Make your decision';
    setButtons(true);
  });
}

function renderIntake(claims) {
  refs.intake.replaceChildren();
  for (const [key, label] of INTAKE_FIELDS) {
    let value = claims[key];
    if (value === undefined || value === '') continue;
    if (key === 'request') value = COMPANY.requestTypes[value]?.label ?? value;
    refs.intake.append(el('dt', { text: label }), el('dd', { text: value }));
  }
}

function typeLines(callerName, lines, done) {
  stopTyping();
  const job = { skip: false, dead: false };
  typing = job;
  let i = 0;

  const nextLine = () => {
    if (job.dead) return;
    if (i >= lines.length) {
      typing = null;
      done();
      return;
    }
    const line = lines[i++];
    const agent = line.from === 'agent';
    const says = el('span', { class: 'says' });
    refs.transcript.append(el('div', { class: `line ${agent ? 'agent' : 'caller'}` }, [
      el('span', { class: 'who', text: `${agent ? 'You' : callerName}:` }),
      says,
    ]));

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
  if (!onDecision) return;
  const report = onDecision;
  onDecision = null;
  setButtons(false);
  stamp.slam(refs.stampLayer, refs.intakeWrap, choice).then(() => report(choice));
}
