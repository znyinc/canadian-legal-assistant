export type Pillar = 'Criminal' | 'Civil' | 'Administrative' | 'Quasi-Criminal' | 'Unknown';

export class PillarClassifier {
  private matchAny(text: string, list: string[]) {
    const t = (text || '').toLowerCase();
    return list.some((k) => t.includes((k || '').toLowerCase()));
  }

  classify(text: string): Pillar {
    const t = (text || '');

    if (!t.trim()) return 'Unknown';

    const matches = this.detectAllPillars(t);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      // If multiple pillars found, prefer Criminal if present, otherwise return Unknown to force manual review
      if (matches.includes('Criminal')) return 'Criminal';
      return 'Unknown';
    }

    return 'Unknown';
  }

  // Return all matching pillars in the text
  detectAllPillars(text: string): Pillar[] {
    const t = (text || '').toLowerCase();
    const results: Pillar[] = [];

    const criminal = ['assault', 'theft', 'robbery', 'murder', 'homicide', 'sexual assault', 'uttering threats', 'possession'];
    const quasi = ['by-law', 'bylaw', 'penalty', 'ticket', 'parking ticket', 'municipal fine', 'provincial offence', 'offence'];
    const admin = ['landlord', 'ltb', 'hrto', 'fsra', 'ombudsman', 'licensing', 'regulator', 'tribunal', 'hearing', 'permit', 'appeal'];
    const civil = ['negligence', 'tort', 'property damage', 'small claims', 'breach of contract', 'damages', 'personal injury', 'slip and fall', 'defamation', 'defamatory'];

    if (this.matchAny(t, criminal)) results.push('Criminal');
    if (this.matchAny(t, quasi)) results.push('Quasi-Criminal');
    if (this.matchAny(t, admin)) results.push('Administrative');
    if (this.matchAny(t, civil)) results.push('Civil');

    return results;
  }
}