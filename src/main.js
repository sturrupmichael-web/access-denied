// Access Denied. Checks the content files, builds the desktop and starts Day 1.
// `window.accessDenied` is for the tests and for poking at the game from the console.

import { validateData } from './validate.js';
import { initTaskbar } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as adLookup from './ui/adLookup.js';
import * as shift from './shift.js';
import * as state from './state.js';
import * as verdict from './verdict.js';

const problems = validateData();
for (const p of problems) console.warn(`[Access Denied] ${p}`);

initTaskbar();
const workspace = document.getElementById('workspace');
call.mount(workspace);
adLookup.mount(workspace);
shift.start(1);

window.accessDenied = { problems, shift, state, verdict };
document.getElementById('boot')?.remove();
