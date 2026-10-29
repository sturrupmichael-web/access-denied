// Policy Binder: today's verification rules, plus reference tables (ID format, sites).

import { COMPANY } from '../../../data/company.js';
import { el } from '../desktop.js';

export const id = 'policy';
export const label = 'Policy';

let box;

export function mount(panel) {
  box = el('div', { class: 'record inset binder' });
  panel.append(box);
}

export const reset = () => {};

// rules: the rules in effect. The ones the day adds are marked NEW.
export function setDay(day, rules) {
  box.replaceChildren(
    el('h3', { text: `Verification policy, Day ${day.day}` }),
    el('ol', { class: 'rules' }, rules.map((r) => el('li', {}, [
      el('strong', { text: r.title }),
      (day.addRules ?? []).includes(r.id) && el('span', { class: 'new-badge', text: 'NEW' }),
      el('p', { text: r.binderText }),
    ]))),
    el('h3', { class: 'sub', text: 'Reference' }),
    el('p', { text: `Employee IDs look like ${COMPANY.employeeIdExample}.` }),
    ...references(rules.map((r) => r.id)).map((text) => el('p', { text })),
    el('table', { class: 'ticket-table' }, [
      el('thead', {}, el('tr', {}, ['Site', 'City', 'Region', 'Area codes'].map((h) => el('th', { text: h })))),
      el('tbody', {}, COMPANY.sites.map((s) => el('tr', {}, [s.name, s.city, s.region, s.areaCodes.join(', ')].map((t) => el('td', { text: t }))))),
    ]),
  );
}

// Reference lines for the rules in effect that need one.
function references(ids) {
  const on = (id) => ids.includes(id);
  return [
    on('no-readback') && `Security staff are in the ${COMPANY.securityGroup} AD group.`,
    on('remote-tool') && `The only approved remote tool is ${COMPANY.approvedRemoteTool}.`,
    on('vendor-change') && `Vendor bank changes need the ${COMPANY.requestTypes.vendor_change.needsGroup} AD group.`,
    on('contractor-extension') && `Contractor extensions: ${COMPANY.maxExtensionDays} days at most.`,
  ].filter(Boolean);
}
