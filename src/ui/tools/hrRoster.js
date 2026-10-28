// HR Roster: employment status, which AD doesn't always know about.

import { COMPANY } from '../../../data/company.js';
import { el } from '../desktop.js';
import { directorySearch, recordList, nothingSelected } from './search.js';

export const id = 'hr';
export const label = 'HR Roster';

const STATUS = { active: 'ACTIVE', terminated: 'TERMINATED', leave: 'ON LEAVE' };

let finder;
let record;

export function mount(panel) {
  record = el('div', { class: 'record inset hr' });
  finder = directorySearch({
    label: 'Search the HR Roster',
    columns: [['Name', (e) => e.name], ['Employee ID', (e) => e.id], ['Status', (e) => STATUS[e.hr.status]]],
    onSelect: show,
    onClear: () => record.replaceChildren(nothingSelected()),
  });
  panel.append(finder.root, record);
}

export const search = (q) => finder.search(q);
export const reset = () => finder.reset();

function show(emp) {
  const { hr } = emp;
  const site = COMPANY.sites.find((s) => s.id === emp.site);
  const endLabel = { terminated: 'Terminated on', leave: 'Leave ends' }[hr.status];
  record.replaceChildren(el('h3', { text: emp.name }), recordList([
    ['Employment', el('span', { class: `hr-${hr.status}`, text: STATUS[hr.status] })],
    ['Employee ID', emp.id],
    ['Job title', emp.title],
    ['Department', emp.department],
    ['Work site', site?.name ?? emp.site],
    ['Start date', hr.startDate],
    [endLabel, endLabel && hr.endDate],
    ['Note', hr.note],
  ]));
}
