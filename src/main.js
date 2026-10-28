// Access Denied. Checks the content files, builds the desktop, then starts Day 1 or offers
// to continue a saved game. `window.accessDenied` is for the tests and for poking at the
// game from the console.

import { validateData } from './validate.js';
import { initTaskbar } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as toolbox from './ui/toolbox.js';
import { showWelcomeBack } from './ui/screens.js';
import * as shift from './shift.js';
import * as state from './state.js';
import * as clock from './clock.js';
import * as verdict from './verdict.js';
import { DAYS } from '../data/days.js';

const problems = validateData();
for (const p of problems) console.warn(`[Access Denied] ${p}`);

initTaskbar();
const workspace = document.getElementById('workspace');
call.mount(workspace);
toolbox.mount(workspace);

const newGame = () => {
  state.newGame();
  shift.begin(shift.firstDay());
};

const saved = state.savedShift();
const progress = state.progress();
if (saved && shift.dayExists(saved.day)) {
  const total = DAYS.find((d) => d.day === saved.day).callers.length;
  showWelcomeBack(`You're partway through Day ${saved.day}: ${saved.callIndex} of ${total} calls done, and the clock says ${clock.format(saved.minutes)}.`, [
    { label: 'New game', onClick: newGame },
    { label: `Restart Day ${saved.day}`, onClick: () => shift.begin(saved.day) },
    { label: 'Continue', primary: true, onClick: () => shift.begin(saved.day, saved) },
  ]);
} else if (progress && shift.dayExists(progress.nextDay) && progress.nextDay !== shift.firstDay()) {
  showWelcomeBack(`Your next shift is Day ${progress.nextDay}.`, [
    { label: 'New game', onClick: newGame },
    { label: `Start Day ${progress.nextDay}`, primary: true, onClick: () => shift.begin(progress.nextDay) },
  ]);
} else {
  shift.begin(shift.firstDay());
}

window.accessDenied = { problems, shift, state, clock, verdict };
document.getElementById('boot')?.remove();
