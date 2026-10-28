// The directory search box shared by AD Lookup, HR Roster, Org Chart and Ticket History:
// a search field, a results table, and a callback when a row is picked.
// Not a <form>: sandboxed previews (like the Claude app's) block form submission.

import { DIRECTORY } from '../../../data/directory.js';
import { el } from '../desktop.js';
import * as audio from '../../audio.js';

export const matchEmployees = (query) => {
  const q = query.trim().toLowerCase();
  return DIRECTORY.filter((e) =>
    e.id.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    (e.aliases ?? []).some((a) => a.toLowerCase().includes(q)));
};

// columns: [['Header', (emp) => text], ...]. onSelect(emp) shows the record.
// Returns { root, search(query), reset() }.
export function directorySearch({ label, columns, onSelect, onClear }) {
  const input = el('input', { class: 'field inset', type: 'search', placeholder: 'Name or employee ID', 'aria-label': label, autocomplete: 'off' });
  const results = el('div', { class: 'results inset' });
  const hint = (text) => results.replaceChildren(el('p', { class: 'none', text }));

  const search = (query) => {
    input.value = query;
    onClear();
    if (query.trim().length < 2) return hint('Type at least 2 characters.');
    const matches = matchEmployees(query);
    if (!matches.length) return hint(`No objects found matching "${query.trim()}".`);

    const tbody = el('tbody');
    for (const emp of matches) {
      const row = el('tr', { class: 'row', tabindex: '0' }, columns.map(([, cell]) => el('td', { text: cell(emp) })));
      const select = () => {
        for (const r of tbody.querySelectorAll('.selected')) r.classList.remove('selected');
        row.classList.add('selected');
        onSelect(emp);
      };
      row.addEventListener('click', select);
      row.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        select();
      });
      tbody.append(row);
    }
    results.replaceChildren(el('table', {}, [
      el('thead', {}, el('tr', {}, columns.map(([h]) => el('th', { text: h })))),
      tbody,
    ]));
    if (matches.length === 1) tbody.firstChild.click();
  };

  const find = () => {
    audio.play('click');
    search(input.value);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    find();
  });

  const reset = () => {
    input.value = '';
    hint('Enter a name or ID and press Find Now.');
    onClear();
  };

  const root = el('div', { class: 'search' }, [
    el('div', { class: 'search-row', role: 'search' }, [input, el('button', { class: 'btn find', type: 'button', text: 'Find Now', onclick: find })]),
    results,
  ]);
  reset();
  return { root, search, reset };
}

// A label/value grid for a record. Rows with an empty value are skipped.
export function recordList(rows) {
  const dl = el('dl');
  for (const [label, value] of rows) if (value) dl.append(el('dt', { text: label }), el('dd', {}, value));
  return dl;
}

export const nothingSelected = () => el('p', { class: 'placeholder', text: 'No object selected.' });
