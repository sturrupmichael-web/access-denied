// Ticket History: someone's recent tickets. Lots of resets in a short time is a tell.

import { COMPANY } from '../../../data/company.js';
import { el } from '../desktop.js';
import { directorySearch, nothingSelected } from './search.js';

export const id = 'tickets';
export const label = 'Tickets';

let finder;
let record;

export function mount(panel) {
  record = el('div', { class: 'record inset' });
  finder = directorySearch({
    label: 'Search Ticket History',
    columns: [['Name', (e) => e.name], ['Employee ID', (e) => e.id], ['Tickets', (e) => String(e.tickets?.length ?? 0)]],
    onSelect: show,
    onClear: () => record.replaceChildren(nothingSelected()),
  });
  panel.append(finder.root, record);
}

export const search = (q) => finder.search(q);
export const reset = () => finder.reset();

function show(emp) {
  const tickets = emp.tickets ?? [];
  const resets = tickets.filter((t) => t.type === 'password_reset').length;
  record.replaceChildren(
    el('h3', { text: `${emp.name} (${emp.id})` }),
    el('p', { class: 'org-summary', text: tickets.length ? `${tickets.length} recent ticket(s), ${resets} password reset(s).` : 'No recent tickets.' }),
    tickets.length ? el('table', { class: 'ticket-table' }, [
      el('thead', {}, el('tr', {}, ['Ticket', 'When', 'Type', 'Summary', 'Status'].map((h) => el('th', { text: h })))),
      el('tbody', {}, tickets.map((t) => el('tr', {}, [
        el('td', { text: t.id }),
        el('td', { text: t.when }),
        el('td', { text: COMPANY.requestTypes[t.type]?.label ?? t.type }),
        el('td', { class: 'wrap', text: t.summary }),
        el('td', { text: t.status }),
      ]))),
    ]) : null,
  );
}
