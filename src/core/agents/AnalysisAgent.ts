import {
  MatterClassification,
  EvidenceIndex,
  Domain,
  Jurisdiction
} from '../models';
import { MatterClassifier } from '../triage/MatterClassifier';
import { LimitationPeriodsEngine } from '../limitation/LimitationPeriodsEngine';

/**
 * Evidence synthesis result with categorization and analysis
 */
export interface EvidenceSynthesis {
  totalCount: number;
  byType: Record<string, number>;
  timeline: {
    earliest: string | null; // ISO date
    latest: string | null; // ISO date
    coverageGaps: string[];
  };
  credibilityAssessment: {
    strongEvidence: string[];
    weakEvidence: string[];
    conflictingEvidence: string[];
  };
  summary: string;
}

/**
 * Classification confidence analysis with alternatives
 */
export interface ClassificationAnalysis {
  primaryClassification: MatterClassification;
  confidence: number; // 0-100
  alternativeClassifications: {
    domain: Domain;
    jurisdiction: Jurisdiction;
    confidence: number;
    reasoning: string;
  }[];
  ambiguityFlags: string[];
  recommendedClarifications: string[];
}

/**
 * Deadline and urgency analysis
 */
export interface DeadlineAnalysis {
  criticalDeadlines: {
    date: string; // ISO date
    description: string;
    daysRemaining: number;
    urgencyLevel: 'critical' | 'warning' | 'caution' | 'info';
  }[];
  limitationPeriods: {
    type: string;
    expiryDate: string; // ISO date
    daysRemaining: number;
  }[];
  recommendedActionTimeline: string;
}

/**
 * Complete analysis result
 */
export interface AnalysisResult {
  classificationAnalysis: ClassificationAnalysis;
  evidenceSynthesis: EvidenceSynthesis;
  deadlineAnalysis: DeadlineAnalysis;
  overallStrength: 'strong' | 'moderate' | 'weak' | 'insufficient';
  riskFactors: string[];
  opportunities: string[];
  analysisNarrative: string;
}

/**
 * AnalysisAgent: Performs multi-domain classification and evidence synthesis
 * 
 * Responsibilities:
 * - Refine classification based on evidence patterns
 * - Synthesize evidence into coherent timeline and strength assessment
 * - Calculate deadline analysis from limitation periods
 * - Identify risk factors and opportunities
 * - Generate confidence scores with alternatives
 * - Synthesize findings into narrative
 */
export class AnalysisAgent {
  private classifier: MatterClassifier;
  private limitationEngine: LimitationPeriodsEngine;

  constructor(
    classifier?: MatterClassifier,
    limitationEngine?: LimitationPeriodsEngine
  ) {
    this.classifier = classifier ?? new MatterClassifier();
    this.limitationEngine = limitationEngine ?? new LimitationPeriodsEngine();
  }

  /**
   * Analyze evidence index and synthesize findings
   */
  analyze(
    classification: MatterClassification,
    evidenceIndex: EvidenceIndex
  ): AnalysisResult {
    const classificationAnalysis = this.analyzeClassification(classification);
    const evidenceSynthesis = this.synthesizeEvidence(evidenceIndex);
    const deadlineAnalysis = this.analyzeDeadlines(classification);
    const overallStrength = this.assessCaseStrength(
      evidenceSynthesis,
      classificationAnalysis
    );
    const riskFactors = this.identifyRiskFactors(
      classification,
      evidenceSynthesis,
      deadlineAnalysis
    );
    const opportunities = this.identifyOpportunities(
      classification,
      evidenceSynthesis
    );
    const analysisNarrative = this.generateNarrative(
      classification,
      evidenceSynthesis,
      deadlineAnalysis,
      overallStrength,
      riskFactors,
      opportunities
    );

    return {
      classificationAnalysis,
      evidenceSynthesis,
      deadlineAnalysis,
      overallStrength,
      riskFactors,
      opportunities,
      analysisNarrative
    };
  }

  /**
   * Analyze and refine classification
   */
  private analyzeClassification(
    classification: MatterClassification
  ): ClassificationAnalysis {
    // In a full implementation, this would re-classify based on evidence patterns
    // For now, use the provided classification with high confidence
    const confidence = 85; // Assume 85% confidence unless evidence suggests otherwise

    return {
      primaryClassification: classification,
      confidence,
      alternativeClassifications: [],
      ambiguityFlags: [],
      recommendedClarifications: []
    };
  }

  /**
   * Synthesize evidence into coherent analysis
   */
  private synthesizeEvidence(evidenceIndex: EvidenceIndex): EvidenceSynthesis {
    // Count evidence by type
    const byType: Record<string, number> = {};
    let earliest: string | null = null;
    let latest: string | null = null;

    if (evidenceIndex.evidence && evidenceIndex.evidence.length > 0) {
      evidenceIndex.evidence.forEach(ev => {
        const type = ev.type || 'other';
        byType[type] = (byType[type] || 0) + 1;

        if (ev.date) {
          if (!earliest || ev.date < earliest) earliest = ev.date;
          if (!latest || ev.date > latest) latest = ev.date;
        }
      });
    }

    // Calculate coverage gaps in timeline
    const coverageGaps = this.identifyTimelineGaps(earliest, latest);

    // Assess credibility
    const { strongEvidence, weakEvidence, conflictingEvidence } =
      this.assessEvidenceCredibility(evidenceIndex);

    const summary = this.generateEvidenceSummary(
      evidenceIndex.evidence?.length || 0,
      byType,
      earliest,
      latest
    );

    return {
      totalCount: evidenceIndex.evidence?.length || 0,
      byType,
      timeline: {
        earliest,
        latest,
        coverageGaps
      },
      credibilityAssessment: {
        strongEvidence,
        weakEvidence,
        conflictingEvidence
      },
      summary
    };
  }

  /**
   * Analyze deadlines and limitation periods
   */
  private analyzeDeadlines(
    classification: MatterClassification
  ): DeadlineAnalysis {
    // Get relevant limitation periods for this matter
    const relevantPeriods = this.limitationEngine.getRelevantPeriods(
      classification.domain,
      '',
      []
    );

    const criticalDeadlines = relevantPeriods
      .map(period => {
        // Calculate days remaining (mock: would need actual dates)
        const daysRemaining = this.calculateDaysRemaining(period.id);
        const urgencyLevel = this.classifyUrgency(daysRemaining);

        return {
          date: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          description: period.description,
          daysRemaining,
          urgencyLevel
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const limitationPeriods = relevantPeriods.map(period => ({
      type: period.type,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Mock date
      daysRemaining: 365
    }));

    const recommendedActionTimeline = this.generateActionTimeline(
      classification.domain,
      criticalDeadlines
    );

    return {
      criticalDeadlines,
      limitationPeriods,
      recommendedActionTimeline
    };
  }

  /**
   * Calculate days remaining for a limitation period
   */
  private calculateDaysRemaining(periodId: string): number {
    // Mock implementation - in real system would calculate from actual dates
    const daysMap: Record<string, number> = {
      'general-2year': 180,
      'municipal-10day': 5,
      'employment-esa': 90,
      'employment-wrongful': 200
    };
    return daysMap[periodId] || 365;
  }

  /**
   * Classify urgency based on days remaining
   */
  private classifyUrgency(
    daysRemaining: number
  ): 'critical' | 'warning' | 'caution' | 'info' {
    if (daysRemaining < 10) return 'critical';
    if (daysRemaining < 30) return 'warning';
    if (daysRemaining < 90) return 'caution';
    return 'info';
  }

  /**
   * Assess overall case strength
   */
  private assessCaseStrength(
    evidence: EvidenceSynthesis,
    classification: ClassificationAnalysis
  ): 'strong' | 'moderate' | 'weak' | 'insufficient' {
    // Simple heuristic: based on evidence count and classification confidence
    const evidenceScore = Math.min(100, evidence.totalCount * 10);
    const classificationScore = classification.confidence;
    const combinedScore = (evidenceScore + classificationScore) / 2;

    if (combinedScore >= 80) return 'strong';
    if (combinedScore >= 60) return 'moderate';
    if (combinedScore >= 40) return 'weak';
    return 'insufficient';
  }

  /**
   * Identify timeline gaps in evidence
   */
  private identifyTimelineGaps(earliest: string | null, latest: string | null): string[] {
    if (!earliest || !latest) {
      return ['Timeline not fully established from evidence'];
    }

    const gaps: string[] = [];
    const start = new Date(earliest);
    const end = new Date(latest);
    const daysGap = Math.floor(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
    );

    if (daysGap > 30) {
      gaps.push(
        `Large gap in evidence timeline: ${daysGap} days between earliest and latest evidence`
      );
    }

    return gaps;
  }

  /**
   * Assess credibility of evidence
   */
  private assessEvidenceCredibility(
    evidenceIndex: EvidenceIndex
  ): {
    strongEvidence: string[];
    weakEvidence: string[];
    conflictingEvidence: string[];
  } {
    const strong: string[] = [];
    const weak: string[] = [];
    const conflicting: string[] = [];

    if (!evidenceIndex.evidence) {
      return { strongEvidence: strong, weakEvidence: weak, conflictingEvidence: conflicting };
    }

    evidenceIndex.evidence.forEach(ev => {
      // Categorize by credibility score and type
      if (ev.credibilityScore >= 0.8) {
        strong.push(`${ev.type}: ${ev.filename || 'Document'}`);
      } else if (ev.credibilityScore < 0.5) {
        weak.push(`${ev.type}: ${ev.filename || 'Document'}`);
      }

      // Flag evidence that might conflict
      if (ev.tags && ev.tags.includes('conflicting')) {
        conflicting.push(`${ev.type}: ${ev.filename || 'Document'}`);
      }
    });

    return {
      strongEvidence: strong,
      weakEvidence: weak,
      conflictingEvidence: conflicting
    };
  }

  /**
   * Generate evidence summary narrative
   */
  private generateEvidenceSummary(
    count: number,
    byType: Record<string, number>,
    earliest: string | null,
    latest: string | null
  ): string {
    if (count === 0) {
      return 'No evidence has been uploaded yet. The system is ready to help you organize your documents.';
    }

    const typesList = Object.entries(byType)
      .map(([type, count]) => `${count} ${type}`)
      .join(', ');

    let summary = `You have provided ${count} pieces of evidence: ${typesList}.`;

    if (earliest && latest) {
      summary += ` The evidence spans from ${earliest} to ${latest}.`;
    }

    return summary;
  }

  /**
   * Generate recommended action timeline
   */
  private generateActionTimeline(
    domain: Domain,
    criticalDeadlines: AnalysisResult['deadlineAnalysis']['criticalDeadlines']
  ): string {
    if (criticalDeadlines.length === 0) {
      return 'No critical deadlines identified. You can proceed at your pace.';
    }

    const soonest = criticalDeadlines[0];
    if (soonest.urgencyLevel === 'critical') {
      return `URGENT: ${soonest.description} in ${soonest.daysRemaining} days. Take action immediately.`;
    }

    return `Next important deadline: ${soonest.description} in ${soonest.daysRemaining} days.`;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(
    classification: MatterClassification,
    evidence: EvidenceSynthesis,
    deadlines: DeadlineAnalysis
  ): string[] {
    const risks: string[] = [];

    // Risk: Insufficient evidence
    if (evidence.totalCount < 3) {
      risks.push('Limited evidence available - more documentation recommended');
    }

    // Risk: Critical deadlines
    const criticalDeadlines = deadlines.criticalDeadlines.filter(
      d => d.urgencyLevel === 'critical'
    );
    if (criticalDeadlines.length > 0) {
      risks.push(`Critical deadline(s) approaching: ${criticalDeadlines.map(d => d.description).join(', ')}`);
    }

    // Risk: Timeline gaps
    if (evidence.timeline.coverageGaps.length > 0) {
      risks.push(`Timeline gaps in evidence: ${evidence.timeline.coverageGaps.join('; ')}`);
    }

    // Domain-specific risks
    if (classification.domain === 'employment' && !classification.timeline.keyDates?.length) {
      risks.push('Employment timeline not fully documented - key dates needed');
    }

    if (classification.domain === 'landlordTenant' && evidence.totalCount < 5) {
      risks.push('Landlord/tenant disputes typically require extensive documentation');
    }

    return risks;
  }

  /**
   * Identify opportunities
   */
  private identifyOpportunities(
    classification: MatterClassification,
    evidence: EvidenceSynthesis
  ): string[] {
    const opportunities: string[] = [];

    // Opportunity: Strong evidence base
    if (evidence.credibilityAssessment.strongEvidence.length >= 5) {
      opportunities.push(
        'Strong evidence base supports your position - ready for formal proceedings'
      );
    }

    // Opportunity: Multiple pathways
    if (evidence.totalCount > 10) {
      opportunities.push(
        'Extensive evidence provides flexibility in choosing dispute resolution pathway'
      );
    }

    // Domain-specific opportunities
    if (classification.domain === 'insurance' && evidence.totalCount > 0) {
      opportunities.push('Organized evidence supports formal insurance complaint');
    }

    if (classification.domain === 'employment' && evidence.totalCount > 5) {
      opportunities.push('Documentation pattern supports both employment standards and civil claims');
    }

    return opportunities;
  }

  /**
   * Generate comprehensive analysis narrative
   */
  private generateNarrative(
    classification: MatterClassification,
    evidence: EvidenceSynthesis,
    deadlines: DeadlineAnalysis,
    strength: 'strong' | 'moderate' | 'weak' | 'insufficient',
    risks: string[],
    opportunities: string[]
  ): string {
    let narrative = `
## Analysis Summary

**Case Classification:** ${classification.domain} | **Jurisdiction:** ${classification.jurisdiction}

**Overall Strength:** ${strength.toUpperCase()}

### Evidence Status
${evidence.summary}

### Timeline Coverage
${evidence.timeline.earliest && evidence.timeline.latest
      ? `Evidence spans from ${evidence.timeline.earliest} to ${evidence.timeline.latest}.`
      : 'Timeline not yet established.'}

### Deadlines & Urgency
${deadlines.recommendedActionTimeline}

### Key Risks
${risks.length > 0 ? risks.map(r => `- ${r}`).join('\n') : '- No major risks identified'}

### Opportunities
${opportunities.length > 0 ? opportunities.map(o => `- ${o}`).join('\n') : '- Continue gathering evidence'}

### Recommended Next Steps
1. Review the risks and opportunities above
2. Gather additional evidence as recommended
3. Meet the critical deadlines highlighted
4. Consider settlement and litigation pathways
5. Consult with a legal professional as needed
    `.trim();

    return narrative;
  }
}
