// Phone number helpers. Numbers are written the way the data files write them:
// "(330) 555-0142" for North America, "+44 113 496 0123" for the UK.

import { COMPANY } from '../data/company.js';

// "(330) 555-0142" -> "330", "+44 113 496 0123" -> "+44 113", "+44 7700 900461" -> "+44 7700"
export function areaCode(number) {
  const n = String(number ?? '').trim();
  const nanp = n.match(/^\((\d{3})\)/);
  if (nanp) return nanp[1];
  const intl = n.match(/^(\+\d+)\s+(\d+)/);
  return intl ? `${intl[1]} ${intl[2]}` : n;
}

// Is this number local to the site? (siteId is a company.sites id.)
export function isLocalTo(number, siteId) {
  const site = COMPANY.sites.find((s) => s.id === siteId);
  return !!site && site.areaCodes.includes(areaCode(number));
}
