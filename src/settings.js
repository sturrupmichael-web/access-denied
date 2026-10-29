// Player settings, saved under "accessDenied:settings". Mute is saved on its own
// ("accessDenied:muted", see audio.js) because the taskbar button toggles it mid-shift.
//   volume      0 to 100
//   textSpeed   'slow' | 'normal' | 'fast' | 'instant': how fast the transcript types
//   shiftLength 'relaxed' | 'normal' | 'brisk': how many real minutes a shift takes
//   motion      true = animations on. Off also when the system asks for reduced motion.

import { load, save } from './storage.js';

export const DEFAULTS = { volume: 70, textSpeed: 'normal', shiftLength: 'normal', motion: true };

// Milliseconds per typed character.
export const TEXT_SPEEDS = { slow: 32, normal: 16, fast: 6, instant: 0 };

// Multiplies how fast the shift clock runs. Normal is 8 real minutes.
export const SHIFT_LENGTHS = { relaxed: 8 / 12, normal: 1, brisk: 8 / 5 };

let settings = { ...DEFAULTS, ...load('settings', {}) };
const listeners = [];

export const get = () => ({ ...settings });
export const onChange = (fn) => listeners.push(fn);

export function set(patch) {
  settings = { ...settings, ...patch };
  save('settings', settings);
  for (const fn of listeners) fn(get());
}
