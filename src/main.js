// Access Denied. Checks the content files, builds the desktop, then shows the title screen,
// which starts a new game or continues a saved one. `window.accessDenied` is for the tests
// and for poking at the game from the console.

import { validateData } from './validate.js';
import { initTaskbar, setMeters } from './ui/desktop.js';
import * as call from './ui/call.js';
import * as toolbox from './ui/toolbox.js';
import { showTitle, showSettings } from './ui/screens.js';
import * as shift from './shift.js';
import * as state from './state.js';
import * as clock from './clock.js';
import * as verdict from './verdict.js';
import * as meters from './meters.js';
import * as settings from './settings.js';
import * as story from './story.js';

const problems = validateData();
for (const p of problems) console.warn(`[Access Denied] ${p}`);

// Opening Settings mid-shift stops the clock until it's closed.
function openSettings() {
  const wasRunning = clock.isRunning();
  clock.pause();
  showSettings(() => {
    if (wasRunning) clock.start();
  });
}

const applyMotion = (s) => document.body.classList.toggle('no-motion', !s.motion);
applyMotion(settings.get());
settings.onChange(applyMotion);

initTaskbar({ onSettings: openSettings });
setMeters(meters.current());
meters.onChange(setMeters);
const workspace = document.getElementById('workspace');
call.mount(workspace);
toolbox.mount(workspace);

const newGame = () => {
  state.newGame();
  meters.reset();
  setMeters(meters.current());
  shift.begin(shift.firstDay());
};
shift.setGameOverHandler(newGame);

function title() {
  const saved = state.savedShift();
  const progress = state.progress();
  let save = null;
  if (saved && shift.dayExists(saved.day)) {
    save = {
      text: `You're partway through Day ${saved.day}: ${saved.callIndex} calls done, and the clock says ${clock.format(saved.minutes)}.`,
      onContinue: () => shift.begin(saved.day, saved),
      restart: { label: `Restart Day ${saved.day}`, onClick: () => shift.begin(saved.day) },
    };
  } else if (progress && shift.dayExists(progress.nextDay) && progress.nextDay !== shift.firstDay()) {
    save = { text: `Your next shift is Day ${progress.nextDay}.`, onContinue: () => shift.begin(progress.nextDay) };
  }
  showTitle({ save, onNewGame: newGame, onSettings: () => showSettings() });
}
title();

window.accessDenied = { problems, shift, state, clock, verdict, meters, story, settings };
document.getElementById('boot')?.remove();
