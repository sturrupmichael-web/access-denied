// The Desk Tools window: one tab per tool. Each tool module in tools/ exports
// { id, label, mount(panel), reset() } and optionally search(query), setCaller(caller)
// and setDay(day, rules).

import { el, createWindow, showView } from './desktop.js';
import * as audio from '../audio.js';
import * as adLookup from './tools/adLookup.js';
import * as hrRoster from './tools/hrRoster.js';
import * as orgChart from './tools/orgChart.js';
import * as tickets from './tools/tickets.js';
import * as callerId from './tools/callerId.js';
import * as policyBinder from './tools/policyBinder.js';

const TOOLS = [adLookup, hrRoster, orgChart, tickets, callerId, policyBinder];

let tabs;
let active = TOOLS[0];

export function mount(container) {
  const win = createWindow({ id: 'desk-tools', title: 'Desk Tools', icon: '🗂', className: 'tools-window' });
  const tablist = el('div', { class: 'tabs', role: 'tablist' });
  const panels = el('div', { class: 'tab-panels' });
  tabs = TOOLS.map((tool) => {
    const tab = el('button', { class: 'tab', type: 'button', role: 'tab', id: `tab-${tool.id}`, text: tool.label, onclick: () => select(tool, true) });
    const panel = el('div', { class: 'tab-panel', role: 'tabpanel', id: `panel-${tool.id}`, 'aria-labelledby': `tab-${tool.id}` });
    tool.mount(panel);
    tablist.append(tab);
    panels.append(panel);
    return { tool, tab, panel };
  });
  win.body.append(tablist, panels);
  container.append(win.root);
  select(active);
}

export function select(tool, clicked = false) {
  if (clicked) audio.play('click');
  active = tool;
  for (const t of tabs) {
    const on = t.tool === tool;
    t.tab.setAttribute('aria-selected', String(on));
    t.tab.classList.toggle('active', on);
    t.panel.hidden = !on;
  }
}

export const selectById = (id) => select(TOOLS.find((t) => t.id === id) ?? TOOLS[0]);

// Searches the active tool, or AD Lookup if the active tool has no search.
export function searchFor(query) {
  showView('tools');
  if (!active.search) select(adLookup);
  active.search(query);
}

export function newCall(caller) {
  for (const t of TOOLS) {
    t.reset();
    t.setCaller?.(caller);
  }
}

export function setDay(day, rules) {
  for (const t of TOOLS) t.setDay?.(day, rules);
}
