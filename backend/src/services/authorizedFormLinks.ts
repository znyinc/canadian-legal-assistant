export interface AuthorizedFormLink {
  formId: string;
  title: string;
  jurisdiction: 'Ontario' | 'Canada';
  source: string;
  url: string;
  lastVerifiedAt: string;
}

const links: AuthorizedFormLink[] = [
  {
    formId: 'form-7a-small-claims',
    title: 'Form 7A - Plaintiff\'s Claim (Small Claims Court)',
    jurisdiction: 'Ontario',
    source: 'Ontario Court Forms',
    url: 'https://ontariocourtforms.on.ca/en/rules-of-the-small-claims-court-forms/',
    lastVerifiedAt: '2026-04-06',
  },
  {
    formId: 'ltb-form-t1',
    title: 'LTB T1 - Tenant Application for a Rebate',
    jurisdiction: 'Ontario',
    source: 'Landlord and Tenant Board',
    url: 'https://tribunalsontario.ca/ltb/forms/',
    lastVerifiedAt: '2026-04-06',
  },
  {
    formId: 'ltb-form-l1',
    title: 'LTB L1 - Application to Evict Tenant for Non-payment of Rent',
    jurisdiction: 'Ontario',
    source: 'Landlord and Tenant Board',
    url: 'https://tribunalsontario.ca/ltb/forms/',
    lastVerifiedAt: '2026-04-06',
  },
  {
    formId: 'victim-impact-statement',
    title: 'Victim Impact Statement',
    jurisdiction: 'Canada',
    source: 'Department of Justice Canada',
    url: 'https://www.justice.gc.ca/eng/cj-jp/victims-victimes/form-formulaire.html',
    lastVerifiedAt: '2026-04-06',
  },
];

export function getAuthorizedFormLinks(formIds: string[]): AuthorizedFormLink[] {
  if (!formIds.length) {
    return links;
  }

  const wanted = new Set(formIds);
  return links.filter((link) => wanted.has(link.formId));
}
