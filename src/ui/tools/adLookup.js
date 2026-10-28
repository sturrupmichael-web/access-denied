// AD Lookup: the Active Directory account. Status, title, manager, office, groups.

import { COMPANY } from '../../../data/company.js';
import { el } from '../desktop.js';
import { findEmployee } from '../../verdict.js';
import { directorySearch, recordList, nothingSelected } from './search.js';

export const id = 'ad';
export const label = 'AD Lookup';

let finder;
let record;

export function mount(panel) {
  record = el('div', { class: 'record inset' });
  finder = directorySearch({
    label: 'Search Active Directory',
    columns: [['Name', (e) => e.name], ['Employee ID', (e) => e.id], ['Department', (e) => e.department]],
    onSelect: show,
    onClear: () => record.replaceChildren(nothingSelected()),
  });
  panel.append(finder.root, record);
}

export const search = (q) => finder.search(q);
export const reset = () => finder.reset();

function show(emp) {
  const manager = emp.manager && findEmployee(emp.manager);
  const site = COMPANY.sites.find((s) => s.id === emp.site);
  const status = emp.ad.status;
  record.replaceChildren(el('h3', { text: emp.name }), recordList([
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
  ]));
}
