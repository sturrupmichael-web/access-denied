// localStorage wrapper. Every key is prefixed with "accessDenied:" so saves never collide
// with the other games on michaelsturrup.com. If storage is blocked (private mode, quota,
// some browsers on file://), values are kept in memory for the session and the game
// carries on.

export const PREFIX = 'accessDenied:';
const memory = {};

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw !== null) return JSON.parse(raw);
  } catch {
    // Blocked or corrupt: fall back to memory.
  }
  return Object.hasOwn(memory, key) ? memory[key] : fallback;
}

export function save(key, value) {
  memory[key] = value;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function remove(key) {
  delete memory[key];
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Nothing to do.
  }
}
