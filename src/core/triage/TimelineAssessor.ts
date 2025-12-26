export interface TimeAssessment {
  risk: 'low' | 'medium' | 'high';
  notes: string[];
}

export interface MunicipalNoticeDetection {
  required: boolean;
  message?: string;
}

export class TimelineAssessor {
  assess(dates: string[]): TimeAssessment {
    if (!dates || dates.length === 0) {
      return { risk: 'high', notes: ['No dates provided; verify limitation and appeal periods.'] };
    }
    const sorted = [...dates].sort();
    const latest = new Date(sorted[sorted.length - 1]);
    const now = new Date();
    const daysAgo = (now.getTime() - latest.getTime()) / (24 * 60 * 60 * 1000);

    const notes: string[] = [];
    let risk: TimeAssessment['risk'] = 'medium';

    if (daysAgo > 730) {
      risk = 'high';
      notes.push('Latest event is >2 years ago; high limitation risk.');
    } else if (daysAgo > 180) {
      risk = 'medium';
      notes.push('Latest event >6 months ago; verify limitation deadlines.');
    } else {
      risk = 'low';
      notes.push('Recent timeline; still verify specific statutory deadlines.');
    }

    // Appeal timelines often 15-30 days
    notes.push('If appeal/judicial review, confirm 15-30 day windows where applicable.');
    return { risk, notes };
  }

  detectMunicipalNotice(matter: any, evidenceIndex?: any): MunicipalNoticeDetection {
    const description = (matter.description || '').toLowerCase();
    const tags = (matter.tags || []).map((t: string) => (t || '').toLowerCase());
    const partyNames = (matter.parties?.names || []).map((n: string) => (n || '').toLowerCase());

    // Heuristic keywords suggesting municipal responsibility
    const municipalKeywords = ['municipal', 'city of', 'town of', 'municipality', 'public road', 'boulevard', 'street tree', 'municipal tree', 'roadside', 'council'];

    const foundInDescription = municipalKeywords.some((k) => description.includes(k));
    const foundInTags = tags.some((t) => municipalKeywords.some((k) => t.includes(k)));
    const foundInParties = partyNames.some((n) => municipalKeywords.some((k) => n.includes(k)));

    // Evidence check: filenames or summaries mentioning municipality
    let foundInEvidence = false;
    if (evidenceIndex && Array.isArray(evidenceIndex.items)) {
      foundInEvidence = evidenceIndex.items.some((it: any) => {
        const s = (it.filename || '') + ' ' + (it.summary || '');
        return municipalKeywords.some((k) => s.toLowerCase().includes(k));
      });
    }

    const required = foundInDescription || foundInTags || foundInParties || foundInEvidence;
    if (required) {
      return {
        required: true,
        message:
          'Municipal notice may be required (10-day notice for municipal property/tree damage). Consider sending a formal notice to the municipal clerk/owner within 10 days; verify with local by-laws.'
      };
    }
    return { required: false };
  }
}
