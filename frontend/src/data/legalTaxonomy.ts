// Legal taxonomy for comprehensive discovery wizard
// Covers 95% of court-bound matters in Ontario

export type UserRole = 'plaintiff' | 'defendant' | 'administrative' | 'protection';
export type LegalCategory = 'money' | 'family' | 'home' | 'workplace' | 'harm' | 'government' | 'life-planning';

export interface ScenarioOption {
  value: string;
  label: string;
  description?: string;
  domain?: string; // Maps to backend domain
}

export interface CategoryData {
  label: string;
  icon: string;
  plaintiffScenarios: ScenarioOption[];
  defendantScenarios: ScenarioOption[];
  administrativeScenarios?: ScenarioOption[];
  contextPrompt: {
    plaintiff: string;
    defendant: string;
    administrative?: string;
  };
}

export const ROLE_OPTIONS = [
  {
    value: 'plaintiff' as UserRole,
    label: 'I want to take action',
    description: "I've been wronged, hurt, or need to start a case",
  },
  {
    value: 'defendant' as UserRole,
    label: 'Action is being taken against me',
    description: 'I received a summons, ticket, or claim',
  },
  {
    value: 'administrative' as UserRole,
    label: 'I need to manage a process',
    description: 'Divorce, probate, name change, or estate matters',
  },
  {
    value: 'protection' as UserRole,
    label: 'I need urgent protection',
    description: 'Restraining order, safety concerns, or immediate relief',
  },
];

export const LEGAL_TAXONOMY: Record<LegalCategory, CategoryData> = {
  money: {
    label: 'Money & Business',
    icon: '💰',
    plaintiffScenarios: [
      { value: 'unpaid-debt', label: 'Unpaid Debt / Loan', domain: 'civil' },
      { value: 'breach-contract', label: 'Breach of Contract', domain: 'civil' },
      { value: 'consumer-dispute', label: 'Consumer Dispute', domain: 'consumerProtection' },
      { value: 'professional-negligence', label: 'Professional Negligence (Lawyer/Accountant)', domain: 'legalMalpractice' },
      { value: 'business-dispute', label: 'Partnership / Shareholder Dispute', domain: 'civil' },
      { value: 'fraud-scam', label: 'Fraud or Scam', domain: 'civil' },
    ],
    defendantScenarios: [
      { value: 'sued-for-money', label: "I'm being sued for money", domain: 'civil' },
      { value: 'dispute-debt', label: 'I want to dispute a debt collection', domain: 'consumerProtection' },
      { value: 'breach-contract-defense', label: "I'm accused of breaking a contract", domain: 'civil' },
    ],
    contextPrompt: {
      plaintiff: 'Explain what was agreed upon, the total amount owed, and when the last payment (if any) was made. Include any written contracts or receipts.',
      defendant: 'Describe why you believe you do not owe this money, including any payments already made or reasons the contract should not apply.',
    },
  },
  family: {
    label: 'Family & Kids',
    icon: '👨‍👩‍👧',
    plaintiffScenarios: [
      { value: 'divorce-separation', label: 'Divorce / Separation', domain: 'family' },
      { value: 'child-custody', label: 'Child Custody / Decision Making', domain: 'family' },
      { value: 'child-support', label: 'Child Support', domain: 'family' },
      { value: 'spousal-support', label: 'Spousal Support', domain: 'family' },
      { value: 'property-division', label: 'Division of Property', domain: 'family' },
      { value: 'domestic-violence', label: 'Domestic Violence / Protection Order', domain: 'family' },
    ],
    defendantScenarios: [
      { value: 'served-divorce', label: 'I was served with divorce papers', domain: 'family' },
      { value: 'change-custody-order', label: 'I want to change a custody order', domain: 'family' },
      { value: 'change-support-order', label: 'I want to change a support order', domain: 'family' },
    ],
    administrativeScenarios: [
      { value: 'finalize-divorce', label: 'Finalize an uncontested divorce', domain: 'family' },
      { value: 'consent-order', label: 'File a consent order (we agree)', domain: 'family' },
    ],
    contextPrompt: {
      plaintiff: 'Describe your current living situation, any existing agreements regarding children or property, and what you are hoping to achieve.',
      defendant: 'Explain your position on the claims being made and any arrangements you believe are fair for children, support, or property.',
      administrative: 'Describe the agreement you and the other party have reached and what you need the court to formalize.',
    },
  },
  home: {
    label: 'Housing & Property',
    icon: '🏠',
    plaintiffScenarios: [
      { value: 'evict-tenant', label: 'Evicting a tenant', domain: 'landlordTenant' },
      { value: 'unpaid-rent', label: 'Unpaid rent owed to me', domain: 'landlordTenant' },
      { value: 'boundary-dispute', label: 'Boundary / Neighbor dispute', domain: 'civil' },
      { value: 'real-estate-closing', label: 'Real estate closing issue', domain: 'civil' },
      { value: 'property-damage', label: 'Property damage (tree, fence, etc.)', domain: 'municipalPropertyDamage' },
    ],
    defendantScenarios: [
      { value: 'being-evicted', label: "I'm being evicted", domain: 'landlordTenant' },
      { value: 'landlord-issues', label: "Landlord isn't fixing things / harassment", domain: 'landlordTenant' },
      { value: 'sued-property-damage', label: "I'm being sued for property damage", domain: 'civil' },
    ],
    contextPrompt: {
      plaintiff: 'Describe the property issue, including dates of any notices served, amounts owed, and what you have tried to resolve this.',
      defendant: 'Explain the situation from your perspective, including any maintenance requests, payments made, or why you believe the eviction/claim is unfair.',
    },
  },
  workplace: {
    label: 'Work & Employment',
    icon: '💼',
    plaintiffScenarios: [
      { value: 'wrongful-dismissal', label: 'Wrongful Dismissal (Fired)', domain: 'employment' },
      { value: 'unpaid-wages', label: 'Unpaid Wages / Overtime', domain: 'employment' },
      { value: 'workplace-harassment', label: 'Workplace Harassment', domain: 'employment' },
      { value: 'human-rights', label: 'Human Rights Violation (Discrimination)', domain: 'humanRights' },
      { value: 'wsib-appeal', label: 'Workplace Safety / WSIB Appeal', domain: 'other' },
    ],
    defendantScenarios: [
      { value: 'employee-suing', label: 'My employee is suing me', domain: 'employment' },
      { value: 'mol-claim', label: 'Ministry of Labour claim against me', domain: 'employment' },
    ],
    contextPrompt: {
      plaintiff: 'Describe your job role, how long you worked there, why your employment ended, and what you believe you are owed (severance, wages, etc.).',
      defendant: 'Explain the employment relationship, reasons for termination or dispute, and any agreements or contracts in place.',
    },
  },
  harm: {
    label: 'Injury & Accidents',
    icon: '🚑',
    plaintiffScenarios: [
      { value: 'motor-vehicle', label: 'Motor Vehicle Accident', domain: 'civilNegligence' },
      { value: 'slip-fall', label: 'Slip and Fall', domain: 'civilNegligence' },
      { value: 'medical-negligence', label: 'Medical Negligence / Malpractice', domain: 'legalMalpractice' },
      { value: 'defamation', label: 'Defamation (Libel / Slander)', domain: 'civil' },
      { value: 'assault-battery', label: 'Assault / Battery (Civil Claim)', domain: 'civil' },
    ],
    defendantScenarios: [
      { value: 'sued-accident', label: "I'm being sued for an accident", domain: 'civilNegligence' },
      { value: 'accused-defamation', label: "I'm accused of libel or slander", domain: 'civil' },
    ],
    contextPrompt: {
      plaintiff: 'Describe when and where the incident occurred, your injuries or damages, any medical treatment received, and who you believe is responsible.',
      defendant: 'Explain what happened from your perspective and why you believe you are not liable or the claim amount is unreasonable.',
    },
  },
  government: {
    label: 'Government & Police',
    icon: '⚖️',
    plaintiffScenarios: [
      { value: 'appeal-ticket', label: 'Appeal a Traffic Ticket', domain: 'other' },
      { value: 'appeal-bylaw', label: 'Appeal a Municipal Bylaw Ticket', domain: 'other' },
      { value: 'appeal-tribunal', label: 'Appeal a Tribunal Decision', domain: 'other' },
      { value: 'professional-license', label: 'Professional License Issue', domain: 'other' },
    ],
    defendantScenarios: [
      { value: 'criminal-charge', label: "I've been charged with a crime", domain: 'criminal' },
      { value: 'court-date', label: 'I have a criminal court date', domain: 'criminal' },
      { value: 'bail-conditions', label: 'I want to change bail conditions', domain: 'criminal' },
    ],
    contextPrompt: {
      plaintiff: 'Describe the ticket or decision you want to appeal, when you received it, and why you believe it is incorrect.',
      defendant: 'Briefly describe the charges, whether you are currently in custody or on bail conditions, and when your next court date is.',
    },
  },
  'life-planning': {
    label: 'Wills & Estates',
    icon: '📜',
    plaintiffScenarios: [
      { value: 'contest-will', label: 'Contesting a Will', domain: 'estateSuccession' },
      { value: 'probate-application', label: 'Probate Application', domain: 'estateSuccession' },
      { value: 'poa-dispute', label: 'Power of Attorney Dispute', domain: 'estateSuccession' },
      { value: 'trust-management', label: 'Trust Management Issue', domain: 'estateSuccession' },
      { value: 'estate-administration', label: 'Estate Administration', domain: 'estateSuccession' },
    ],
    defendantScenarios: [
      { value: 'challenging-executor', label: "I'm being challenged as executor", domain: 'estateSuccession' },
    ],
    administrativeScenarios: [
      { value: 'make-will', label: 'I need to make a will', domain: 'estateSuccession' },
      { value: 'setup-poa', label: 'Set up Power of Attorney', domain: 'estateSuccession' },
    ],
    contextPrompt: {
      plaintiff: 'Describe the estate issue, your relationship to the deceased, and what action you believe needs to be taken.',
      defendant: 'Explain your role as executor or trustee and the nature of the challenge being made against you.',
      administrative: 'Describe your estate planning goals and any specific concerns about healthcare, finances, or asset distribution.',
    },
  },
};

export const URGENCY_OPTIONS = [
  {
    value: 'court-date',
    label: 'I have a court date scheduled',
    requiresDate: true,
    dateLabel: 'Court Date',
  },
  {
    value: 'served-papers',
    label: 'I was served with legal documents',
    requiresDate: true,
    dateLabel: 'Date Served',
  },
  {
    value: 'discovery',
    label: "I haven't received documents yet",
    requiresDate: true,
    dateLabel: 'When I discovered the problem',
  },
];
