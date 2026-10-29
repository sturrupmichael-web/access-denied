// Groups: shared mailboxes and distribution lists, who owns them, and whether the owner
// has to approve new members.

import { GROUPS } from '../../../data/groups.js';
import { el } from '../desktop.js';
import { findEmployee } from '../../verdict.js';
import { directorySearch, recordList, nothingSelected } from './search.js';

export const id = 'groups';
export const label = 'Groups';

let finder;
let record;

const matchGroups = (query) => {
  const q = query.trim().toLowerCase();
  return GROUPS.filter((g) => g.name.toLowerCase().includes(q));
};

export function mount(panel) {
  record = el('div', { class: 'record inset' });
  finder = directorySearch({
    label: 'Search shared mailboxes and lists',
    placeholder: 'Group name',
    match: matchGroups,
    columns: [['Group', (g) => g.name], ['Type', (g) => (g.kind === 'mailbox' ? 'Shared mailbox' : 'List')], ['Access', (g) => (g.restricted ? 'Restricted' : 'Open')]],
    onSelect: show,
    onClear: () => record.replaceChildren(nothingSelected()),
  });
  panel.append(finder.root, record);
}

export const search = (q) => finder.search(q);
export const reset = () => finder.reset();

function show(group) {
  const owner = findEmployee(group.owner);
  record.replaceChildren(el('h3', { text: group.name }), recordList([
    ['Type', group.kind === 'mailbox' ? 'Shared mailbox' : 'Distribution list'],
    ['Access', el('span', { class: group.restricted ? 'status-locked' : 'status-active', text: group.restricted ? 'RESTRICTED: owner approves members' : 'OPEN: anyone can join' })],
    ['Owner', owner ? `${owner.name} (${owner.id})` : group.owner],
    ['About', group.about],
  ]));
}
