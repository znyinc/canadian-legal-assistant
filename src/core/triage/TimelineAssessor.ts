export interface TimeAssessment {
  risk: 'low' | 'medium' | 'high';
  notes: string[];
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
}
