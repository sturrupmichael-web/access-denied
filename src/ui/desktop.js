// Window chrome, dialogs, the taskbar, and the tiny DOM helper every UI file uses.

import * as audio from '../audio.js';

// el('div', { class: 'x', text: 'hi', onclick: fn }, [child, 'text', ...])
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : String(c));
  }
  return node;
}

export function createWindow({ id, title, icon, className = '' }) {
  const titleText = el('span', { class: 'title-text', text: title });
  const body = el('div', { class: 'window-body' });
  const root = el('section', { class: `window ${className}`, id, 'aria-label': title }, [
    el('div', { class: 'titlebar' }, [
      el('span', { class: 'title-left' }, [icon && el('span', { 'aria-hidden': 'true', text: icon }), titleText]),
      el('span', { class: 'controls', 'aria-hidden': 'true' }, [el('span', { text: '_' }), el('span', { text: '□' }), el('span', { text: '×' })]),
    ]),
    body,
  ]);
  return { root, body, setTitle: (t) => { titleText.textContent = t; } };
}

// buttons: [{ label, primary, stay, onClick }]. A button closes the dialog before its
// onClick runs, unless it has `stay: true`. Returns { close, setButtons(buttons) }.
export function showModal({ title, icon, content, buttons = [], className = '' }) {
  const win = createWindow({ title, icon, className: `dialog ${className}` });
  win.body.append(...[].concat(content).filter(Boolean));
  const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [win.root]);
  const close = () => overlay.remove();
  const row = el('div', { class: 'dialog-buttons' });
  const setButtons = (list) => {
    row.replaceChildren(...list.map((b) => el('button', {
      class: b.primary ? 'btn primary' : 'btn',
      type: 'button',
      text: b.label,
      onclick: () => {
        audio.play('click');
        if (!b.stay) close();
        b.onClick?.();
      },
    })));
    (row.querySelector('.primary') ?? row.querySelector('button'))?.focus();
  };
  win.body.append(row);
  document.getElementById('modal-root').append(overlay);
  setButtons(buttons);
  return { close, setButtons };
}

// late: the last half hour, when the clock turns red.
export function setClock(text, late = false) {
  const clock = document.getElementById('clock');
  clock.textContent = text;
  clock.classList.toggle('late', late);
}

export function setQueue(text) {
  document.getElementById('queue').textContent = text;
}

// The three meters in the taskbar. values: { breach, csat, patience }, each 0 to 100.
// Bars are updated in place so they slide, and flash when they move the wrong way.
const shown = {};
export function setMeters(values) {
  const box = document.getElementById('meters');
  const bars = [
    ['breach', 'Breach', values.breach, values.breach >= 67 ? 'bad' : values.breach >= 34 ? 'warn' : 'ok', 1],
    ['csat', 'CSAT', values.csat, values.csat <= 35 ? 'bad' : values.csat <= 55 ? 'warn' : 'ok', -1],
    ['patience', 'Patience', values.patience, values.patience <= 25 ? 'bad' : values.patience <= 50 ? 'warn' : 'ok', -1],
  ];
  for (const [id, label, v, level, worse] of bars) {
    let meter = document.getElementById(`meter-${id}`);
    if (!meter) {
      meter = el('div', { class: 'meter', id: `meter-${id}` }, [
        el('span', { class: 'meter-label', text: label }),
        el('span', { class: 'meter-bar inset' }, el('span', { class: 'meter-fill' })),
      ]);
      box.append(meter);
    }
    meter.title = `${label}: ${Math.round(v)} of 100`;
    const fill = meter.querySelector('.meter-fill');
    fill.className = `meter-fill ${level}`;
    fill.style.width = `${v}%`;
    if (shown[id] !== undefined && Math.sign(v - shown[id]) === worse) {
      meter.classList.remove('flash');
      void meter.offsetWidth; // restarts the animation
      meter.classList.add('flash');
    }
    shown[id] = v;
  }
}

export function renderMute() {
  const muteBtn = document.getElementById('mute-btn');
  const muted = audio.isMuted();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
  muteBtn.title = muted ? 'Sound off' : 'Sound on';
}

// onSettings: the gear button in the tray.
export function initTaskbar({ onSettings }) {
  document.getElementById('mute-btn').addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    renderMute();
    audio.play('click');
  });
  document.getElementById('settings-btn').addEventListener('click', () => {
    audio.play('click');
    onSettings();
  });
  renderMute();
}
