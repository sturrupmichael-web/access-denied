// AD Lookup desk tool: search the directory by name or employee ID and inspect a record.

import { COMPANY } from '../../data/company.js';
import { DIRECTORY } from '../../data/directory.js';
import { el, createWindow } from './desktop.js';
import * as audio from '../audio.js';

let refs;

const nothingSelected = () => el('p', { class: 'placeholder', text: 'No object selected.' });

export function mount(container) {
  const win = createWindow({ id: 'ad-lookup', title: 'AD Lookup - Users and Computers', icon: '🔍', className: 'ad-window' });
  refs = {
    input: el('input', { class: 'field inset', type: 'search', placeholder: 'Name or employee ID', 'aria-label': 'Search Active Directory', autocomplete: 'off' }),
    results: el('div', { class: 'results inset' }),
    record: el('div', { class: 'record inset' }),
  };
  const form = el('form', { class: 'search-row' }, [refs.input, el('button', { class: 'btn', type: 'submit', text: 'Find Now' })]);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    audio.play('click');
    search(refs.input.value);
  });
  win.body.append(form, refs.results, refs.record);
  container.append(win.root);
  reset();
}

export function reset() {
  refs.input.value = '';
  refs.results.replaceChildren(el('p', { class: 'none', text: 'Enter a name or ID and press Find Now.' }));
  refs.record.replaceChildren(nothingSelected());
}

export function search(query) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) {
    refs.results.replaceChildren(el('p', { class: 'none', text: 'Type at least 2 characters.' }));
    return;
  }
  const matches = DIRECTORY.filter((e) =>
    e.id.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    (e.aliases ?? []).some((a) => a.toLowerCase().includes(q)));

  refs.record.replaceChildren(nothingSelected());
  if (!matches.length) {
    refs.results.replaceChildren(el('p', { class: 'none', text: `No objects found matching "${query.trim()}".` }));
    return;
  }

  const tbody = el('tbody');
  for (const emp of matches) {
    const row = el('tr', { class: 'row', tabindex: '0' }, [el('td', { text: emp.name }), el('td', { text: emp.id }), el('td', { text: emp.department })]);
    const select = () => {
      for (const r of tbody.querySelectorAll('.selected')) r.classList.remove('selected');
      row.classList.add('selected');
      showRecord(emp);
    };
    row.addEventListener('click', select);
    row.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      select();
    });
    tbody.append(row);
  }
  refs.results.replaceChildren(el('table', {}, [
    el('thead', {}, el('tr', {}, [el('th', { text: 'Name' }), el('th', { text: 'Employee ID' }), el('th', { text: 'Department' })])),
    tbody,
  ]));
  if (matches.length === 1) tbody.firstChild.click();
}

function showRecord(emp) {
  const manager = emp.manager && DIRECTORY.find((e) => e.id === emp.manager);
  const site = COMPANY.sites.find((s) => s.id === emp.site);
  const status = emp.ad.status;
  const rows = [
    ['Account', el('span', { class: `status-${status}`, text: status.toUpperCase() })],
    ['Display name', emp.name],
    ['Also known as', emp.aliases?.join(', ')],
    ['Employee ID', emp.id],
    ['Title', emp.title],
    ['Department', emp.department],
    ['Manager', manager ? `${manager.name} (${manager.id})` : 'None'],
    ['Office', site ? `${site.name}, ${site.city}` : emp.site],
    ['Phone', emp.phone],
    ['Last logon', emp.ad.lastLogon],
    ['Groups', el('span', { class: 'groups' }, emp.ad.groups.map((g) => el('span', { class: 'chip', text: g })))],
  ];
  const dl = el('dl');
  for (const [label, value] of rows) if (value) dl.append(el('dt', { text: label }), el('dd', {}, value));
  refs.record.replaceChildren(el('h3', { text: emp.name }), dl);
}
