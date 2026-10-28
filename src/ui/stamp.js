// The Approve / Deny / Escalate stamp that slams onto the intake form.

import { el } from './desktop.js';
import * as audio from '../audio.js';

const LABELS = { approve: 'Approved', deny: 'Denied', escalate: 'Escalated' };
const HOLD_MS = 900; // how long the stamp sits there before the call review opens

// layer: an absolutely positioned element over the form. shake: the element that thuds.
export function slam(layer, shake, kind) {
  layer.replaceChildren(el('div', { class: `stamp ${kind}`, text: LABELS[kind] }));
  shake.classList.remove('thud');
  void shake.offsetWidth; // restarts the animation
  shake.classList.add('thud');
  audio.play('stamp');
  return new Promise((resolve) => setTimeout(resolve, HOLD_MS));
}

export function clear(layer, shake) {
  layer.replaceChildren();
  shake.classList.remove('thud');
}
