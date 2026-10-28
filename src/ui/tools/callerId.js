// Caller ID: the number on the current call, where it geolocates, and which names
// have called from it before (this shift and earlier ones).

import { el } from '../desktop.js';
import * as state from '../../state.js';
import { recordList } from './search.js';

export const id = 'callerid';
export const label = 'Caller ID';

let box;

export function mount(panel) {
  box = el('div', { class: 'record inset callerid' });
  panel.append(box);
  setCaller(null);
}

export const reset = () => {};

export function setCaller(caller) {
  if (!caller) {
    box.replaceChildren(el('p', { class: 'placeholder', text: 'No active call.' }));
    return;
  }
  const { number, location } = caller.callerId;
  const earlier = state.callLog().filter((c) => c.number === number && !(c.day === state.current().day && c.name === caller.claims.name));
  box.replaceChildren(
    el('h3', { text: 'Line 1' }),
    recordList([
      ['Incoming number', el('span', { class: 'big-number', text: number })],
      ['Geolocates to', location],
      ['Line type', caller.callerId.lineType],
    ]),
    el('h3', { class: 'sub', text: 'Earlier calls from this number' }),
    earlier.length
      ? el('ul', { class: 'earlier' }, earlier.map((c) => el('li', { text: `Day ${c.day}: called as "${c.name}"` })))
      : el('p', { class: 'placeholder', text: 'None on record.' }),
  );
}
