/**
 * Legal term dictionary with plain language translations.
 * Supports Ontario-specific legal terminology and general legal concepts.
 */

export interface LegalTerm {
  term: string;
  plainLanguage: string;
  explanation: string;
  learnMoreUrl?: string;
  category: 'procedural' | 'substantive' | 'forum' | 'remedy' | 'party' | 'general';
  jurisdiction?: 'ontario' | 'federal' | 'common';
}

export class TermDictionary {
  private terms: Map<string, LegalTerm>;

  constructor() {
    this.terms = new Map();
    this.loadDefaultTerms();
  }

  private loadDefaultTerms(): void {
    const defaultTerms: LegalTerm[] = [
      // Procedural terms
      {
        term: 'plaintiff',
        plainLanguage: 'the person suing',
        explanation: 'The person or organization who starts a civil lawsuit by claiming they were harmed and asking the court for a remedy.',
        category: 'party',
        jurisdiction: 'common',
      },
      {
        term: 'defendant',
        plainLanguage: 'the person being sued',
        explanation: 'The person or organization being sued in a civil case. They must respond to the claims made against them.',
        category: 'party',
        jurisdiction: 'common',
      },
      {
        term: 'claimant',
        plainLanguage: 'the person making a claim',
        explanation: 'The person starting a legal claim at a tribunal or small claims court. Similar to a plaintiff in regular court.',
        category: 'party',
        jurisdiction: 'ontario',
      },
      {
        term: 'respondent',
        plainLanguage: 'the person responding to a claim',
        explanation: 'The person or organization responding to a legal claim at a tribunal. Similar to a defendant in regular court.',
        category: 'party',
        jurisdiction: 'ontario',
      },
      {
        term: 'limitation period',
        plainLanguage: 'deadline to start legal action',
        explanation: 'The time limit for starting a lawsuit or claim. In Ontario, this is usually 2 years from when you discovered the harm, but can vary by situation.',
        category: 'procedural',
        jurisdiction: 'ontario',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/02l24',
      },
      {
        term: 'summary judgment',
        plainLanguage: 'quick court decision without a trial',
        explanation: 'When a judge decides a case without a full trial because the facts are clear and there is no genuine issue requiring a trial.',
        category: 'procedural',
        jurisdiction: 'common',
      },
      {
        term: 'discovery',
        plainLanguage: 'exchanging information before trial',
        explanation: 'The process where both sides share documents and answer questions under oath before trial. Helps both sides know the evidence.',
        category: 'procedural',
        jurisdiction: 'common',
      },
      {
        term: 'affidavit',
        plainLanguage: 'sworn written statement',
        explanation: 'A written statement where you swear or affirm that the facts are true. Used as evidence in court proceedings.',
        category: 'procedural',
        jurisdiction: 'common',
      },
      {
        term: 'interrogatories',
        plainLanguage: 'written questions you must answer',
        explanation: 'Written questions one party sends to another during discovery. You must answer them truthfully in writing under oath.',
        category: 'procedural',
        jurisdiction: 'common',
      },
      
      // Forum terms
      {
        term: 'Landlord and Tenant Board',
        plainLanguage: 'LTB - rental housing tribunal',
        explanation: 'Ontario tribunal that resolves disputes between landlords and tenants about rental housing.',
        category: 'forum',
        jurisdiction: 'ontario',
        learnMoreUrl: 'https://tribunalsontario.ca/ltb/',
      },
      {
        term: 'Small Claims Court',
        plainLanguage: 'court for smaller money claims',
        explanation: 'Ontario court that handles claims up to $50,000 (as of October 2025). Simpler and faster than Superior Court.',
        category: 'forum',
        jurisdiction: 'ontario',
        learnMoreUrl: 'https://www.ontario.ca/page/suing-someone-small-claims-court',
      },
      {
        term: 'Superior Court of Justice',
        plainLanguage: 'main trial court in Ontario',
        explanation: 'Ontario\'s main trial court for serious civil and criminal cases. Handles claims over $50,000 and complex legal issues.',
        category: 'forum',
        jurisdiction: 'ontario',
      },
      {
        term: 'Human Rights Tribunal of Ontario',
        plainLanguage: 'HRTO - discrimination tribunal',
        explanation: 'Ontario tribunal that handles discrimination complaints under the Human Rights Code.',
        category: 'forum',
        jurisdiction: 'ontario',
        learnMoreUrl: 'http://www.sjto.ca/hrto/',
      },
      
      // Substantive law terms
      {
        term: 'negligence',
        plainLanguage: 'carelessness causing harm',
        explanation: 'When someone fails to take reasonable care and that failure causes harm to another person. The basis for many personal injury claims.',
        category: 'substantive',
        jurisdiction: 'common',
      },
      {
        term: 'breach of contract',
        plainLanguage: 'breaking a promise in an agreement',
        explanation: 'When one party fails to fulfill their obligations under a contract without a valid excuse.',
        category: 'substantive',
        jurisdiction: 'common',
      },
      {
        term: 'duty of care',
        plainLanguage: 'responsibility to avoid harming others',
        explanation: 'Legal obligation to act reasonably to avoid causing harm to others. For example, property owners have a duty to keep their property safe.',
        category: 'substantive',
        jurisdiction: 'common',
      },
      {
        term: 'occupiers\' liability',
        plainLanguage: 'property owner\'s responsibility for safety',
        explanation: 'The legal duty of property owners or occupiers to keep their property reasonably safe for visitors.',
        category: 'substantive',
        jurisdiction: 'ontario',
        learnMoreUrl: 'https://www.ontario.ca/laws/statute/90o02',
      },
      {
        term: 'constructive dismissal',
        plainLanguage: 'forced to quit due to employer\'s actions',
        explanation: 'When an employer makes working conditions so bad that an employee has no choice but to quit. Treated legally like being fired.',
        category: 'substantive',
        jurisdiction: 'common',
      },
      
      // Remedy terms
      {
        term: 'damages',
        plainLanguage: 'money compensation for harm',
        explanation: 'Money awarded by a court to compensate someone for loss or injury they suffered.',
        category: 'remedy',
        jurisdiction: 'common',
      },
      {
        term: 'general damages',
        plainLanguage: 'compensation for pain and suffering',
        explanation: 'Money awarded for non-financial losses like pain, suffering, and loss of enjoyment of life.',
        category: 'remedy',
        jurisdiction: 'common',
      },
      {
        term: 'special damages',
        plainLanguage: 'compensation for out-of-pocket expenses',
        explanation: 'Money awarded for specific financial losses you can calculate, like medical bills or lost wages.',
        category: 'remedy',
        jurisdiction: 'common',
      },
      {
        term: 'injunction',
        plainLanguage: 'court order to stop or do something',
        explanation: 'A court order requiring someone to do something or stop doing something.',
        category: 'remedy',
        jurisdiction: 'common',
      },
      {
        term: 'specific performance',
        plainLanguage: 'court order to fulfill a contract',
        explanation: 'A court order requiring someone to complete their obligations under a contract (usually when money damages aren\'t enough).',
        category: 'remedy',
        jurisdiction: 'common',
      },
      
      // General terms
      {
        term: 'burden of proof',
        plainLanguage: 'who must prove their case',
        explanation: 'The responsibility to prove the facts of your case. In civil cases, the person making the claim usually has the burden of proof.',
        category: 'general',
        jurisdiction: 'common',
      },
      {
        term: 'balance of probabilities',
        plainLanguage: 'more likely than not (civil standard)',
        explanation: 'The standard of proof in civil cases. You must show your version of events is more likely true than not (more than 50% likely).',
        category: 'general',
        jurisdiction: 'common',
      },
      {
        term: 'beyond a reasonable doubt',
        plainLanguage: 'very high level of certainty (criminal standard)',
        explanation: 'The standard of proof in criminal cases. The Crown must prove guilt so clearly that a reasonable person would have no real doubt.',
        category: 'general',
        jurisdiction: 'common',
      },
      {
        term: 'vicarious liability',
        plainLanguage: 'being responsible for someone else\'s actions',
        explanation: 'When one person or organization is held responsible for the wrongful actions of another, like an employer being liable for an employee\'s negligence.',
        category: 'general',
        jurisdiction: 'common',
      },
      {
        term: 'joint and several liability',
        plainLanguage: 'each defendant can be made to pay the full amount',
        explanation: 'When multiple defendants can each be held responsible for the full amount of damages, even if they share fault.',
        category: 'general',
        jurisdiction: 'common',
      },
    ];

    defaultTerms.forEach(term => {
      this.terms.set(term.term.toLowerCase(), term);
    });
  }

  /**
   * Look up a legal term and get its plain language translation.
   */
  lookup(term: string): LegalTerm | undefined {
    return this.terms.get(term.toLowerCase());
  }

  /**
   * Get plain language translation for a term, or return the original if not found.
   */
  translate(term: string): string {
    const definition = this.lookup(term);
    return definition?.plainLanguage ?? term;
  }

  /**
   * Add a custom term to the dictionary.
   */
  addTerm(term: LegalTerm): void {
    this.terms.set(term.term.toLowerCase(), term);
  }

  /**
   * Get all terms in a specific category.
   */
  getByCategory(category: LegalTerm['category']): LegalTerm[] {
    return Array.from(this.terms.values()).filter(t => t.category === category);
  }

  /**
   * Search terms by keyword (searches term, plainLanguage, and explanation).
   */
  search(keyword: string): LegalTerm[] {
    const lowerKeyword = keyword.toLowerCase();
    return Array.from(this.terms.values()).filter(term =>
      term.term.toLowerCase().includes(lowerKeyword) ||
      term.plainLanguage.toLowerCase().includes(lowerKeyword) ||
      term.explanation.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * Get all available terms.
   */
  getAllTerms(): LegalTerm[] {
    return Array.from(this.terms.values());
  }
}
