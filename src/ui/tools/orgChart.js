// Org Chart: the chain of managers above someone, and who reports to them.
// Click any name in the chart to move to that person.

import { DIRECTORY } from '../../../data/directory.js';
import { el } from '../desktop.js';
import { findEmployee } from '../../verdict.js';
import { directorySearch, nothingSelected } from './search.js';

export const id = 'org';
export const label = 'Org Chart';

let finder;
let chart;

export function mount(panel) {
  chart = el('div', { class: 'record inset org' });
  finder = directorySearch({
    label: 'Search the Org Chart',
    columns: [['Name', (e) => e.name], ['Title', (e) => e.title]],
    onSelect: show,
    onClear: () => chart.replaceChildren(nothingSelected()),
  });
  panel.append(finder.root, chart);
}

export const search = (q) => finder.search(q);
export const reset = () => finder.reset();

function node(emp, depth, isFocus) {
  const name = el('button', { class: 'link', type: 'button', text: emp.name, onclick: () => show(emp) });
  return el('li', { class: isFocus ? 'focus' : '', style: `padding-left: ${depth * 18}px` }, [
    depth ? el('span', { class: 'branch', 'aria-hidden': 'true', text: '└ ' }) : null,
    isFocus ? el('strong', {}, emp.name) : name,
    el('span', { class: 'org-title', text: ` - ${emp.title}, ${emp.department}` }),
  ]);
}

function show(emp) {
  const chain = [];
  for (let m = emp.manager && findEmployee(emp.manager); m; m = m.manager && findEmployee(m.manager)) chain.unshift(m);
  const reports = DIRECTORY.filter((e) => e.manager === emp.id);
  const list = el('ul', { class: 'tree' }, [
    ...chain.map((m, i) => node(m, i, false)),
    node(emp, chain.length, true),
    ...reports.map((r) => node(r, chain.length + 1, false)),
  ]);
  chart.replaceChildren(
    el('h3', { text: emp.name }),
    el('p', { class: 'org-summary', text: `Reports to: ${chain.at(-1)?.name ?? 'nobody (top of the company)'}. Direct reports: ${reports.length}.` }),
    list,
  );
}
