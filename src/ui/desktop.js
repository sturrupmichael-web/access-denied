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

// buttons: [{ label, primary, onClick }]. Any button closes the dialog first.
export function showModal({ title, icon, content, buttons = [] }) {
  const win = createWindow({ title, icon, className: 'dialog' });
  win.body.append(...[].concat(content));
  const overlay = el('div', { class: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, [win.root]);
  const close = () => overlay.remove();
  const row = el('div', { class: 'dialog-buttons' }, buttons.map((b) => el('button', {
    class: b.primary ? 'btn primary' : 'btn',
    type: 'button',
    text: b.label,
    onclick: () => {
      audio.play('click');
      close();
      b.onClick?.();
    },
  })));
  win.body.append(row);
  document.getElementById('modal-root').append(overlay);
  (row.querySelector('.primary') ?? row.querySelector('button'))?.focus();
  return { close };
}

export function setClock(text) {
  document.getElementById('clock').textContent = text;
}

export function initTaskbar() {
  const muteBtn = document.getElementById('mute-btn');
  const render = () => {
    const muted = audio.isMuted();
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    muteBtn.title = muted ? 'Sound off' : 'Sound on';
  };
  muteBtn.addEventListener('click', () => {
    audio.setMuted(!audio.isMuted());
    render();
  });
  render();
}
