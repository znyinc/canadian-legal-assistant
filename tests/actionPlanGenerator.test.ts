import { describe, it, expect } from 'vitest';
import { ActionPlanGenerator } from '../src/core/actionPlan/ActionPlanGenerator';
import { MatterClassification } from '../src/core/models';

describe('ActionPlanGenerator', () => {
  const generator = new ActionPlanGenerator();

  describe('Criminal Domain', () => {
    it('generates empathetic acknowledgment for criminal cases', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
        urgency: 'high',
      };

      const plan = generator.generate(classification);

      expect(plan.acknowledgment).toContain('dealing with criminal charges');
      expect(plan.acknowledgment).toContain('stressful');
    });

    it('includes critical criminal immediate actions', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
        urgency: 'high',
      };

      const plan = generator.generate(classification);

      expect(plan.immediateActions).toHaveLength(3);
      
      const occurrenceAction = plan.immediateActions.find(a => a.id === 'criminal-occurrence');
      expect(occurrenceAction).toBeDefined();
      expect(occurrenceAction?.priority).toBe('urgent');
      expect(occurrenceAction?.title).toContain('Police Occurrence Number');

      const medicalAction = plan.immediateActions.find(a => a.id === 'criminal-medical');
      expect(medicalAction).toBeDefined();
      expect(medicalAction?.priority).toBe('urgent');
      expect(medicalAction?.title).toContain('Medical Attention');

      const victimServicesAction = plan.immediateActions.find(a => a.id === 'criminal-victim-services');
      expect(victimServicesAction).toBeDefined();
      expect(victimServicesAction?.priority).toBe('soon');
      expect(victimServicesAction?.title).toContain('Victim Services');
    });

    it('clarifies complainant role (not prosecutor)', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.roleExplanation.title).toContain('Criminal Complainant');
      expect(plan.roleExplanation.summary).toContain('witness');
      expect(plan.roleExplanation.summary).toContain('not the prosecutor');
      expect(plan.roleExplanation.whatYouAreNot).toContain('You are NOT the prosecutor (the Crown Attorney is)');
      const dropCharges = plan.roleExplanation.whatYouAreNot.some(s => s.includes('drop charges'));
      expect(dropCharges).toBe(true);
    });

    it('includes peace bond settlement pathway', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const peaceBond = plan.settlementPathways.find(p => p.title.includes('Peace Bond'));
      expect(peaceBond).toBeDefined();
      expect(peaceBond?.title).toContain('810');
      expect(peaceBond?.typical).toBe(false);
    });

    it('includes critical "what to avoid" for criminal cases', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const noContact = plan.whatToAvoid.find(a => a.action.includes('contact the accused'));
      expect(noContact).toBeDefined();
      expect(noContact?.severity).toBe('critical');

      const noSocial = plan.whatToAvoid.find(a => a.action.includes('social media'));
      expect(noSocial).toBeDefined();
      expect(noSocial?.severity).toBe('critical');

      const noAlter = plan.whatToAvoid.find(a => a.action.includes('alter evidence'));
      expect(noAlter).toBeDefined();
      expect(noAlter?.severity).toBe('critical');
    });

    it('offers victim services and evidence checklist next steps', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const victimServicesOffer = plan.nextStepOffers.find(o => o.id === 'victim-services-guide');
      expect(victimServicesOffer).toBeDefined();
      expect(victimServicesOffer?.documentType).toBe('victim_services_guide');

      const evidenceOffer = plan.nextStepOffers.find(o => o.id === 'evidence-checklist');
      expect(evidenceOffer).toBeDefined();
      expect(evidenceOffer?.documentType).toBe('criminal_evidence_checklist');

      const roleOffer = plan.nextStepOffers.find(o => o.id === 'complainant-role');
      expect(roleOffer).toBeDefined();
      expect(roleOffer?.documentType).toBe('complainant_role_guide');
    });
  });

  describe('Civil Negligence Domain', () => {
    it('generates appropriate acknowledgment for civil cases', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
        urgency: 'medium',
      };

      const plan = generator.generate(classification);

      expect(plan.acknowledgment).toContain('property damage or injury');
      expect(plan.acknowledgment).toContain('overwhelming');
    });

    it('includes evidence preservation and demand letter actions', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const evidenceAction = plan.immediateActions.find(a => a.id === 'civil-evidence');
      expect(evidenceAction).toBeDefined();
      expect(evidenceAction?.priority).toBe('urgent');
      expect(evidenceAction?.title).toContain('Preserve and Photograph Evidence');

      const demandAction = plan.immediateActions.find(a => a.id === 'civil-demand');
      expect(demandAction).toBeDefined();
      expect(demandAction?.priority).toBe('soon');
      expect(demandAction?.title).toContain('Demand Letter');
    });

    it('clarifies plaintiff role and burden of proof', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.roleExplanation.title).toContain('Plaintiff');
      expect(plan.roleExplanation.summary).toContain('balance of probabilities');
      const beyondReasonableDoubt = plan.roleExplanation.whatYouAreNot.some(s => s.includes('beyond a reasonable doubt'));
      expect(beyondReasonableDoubt).toBe(true);
    });

    it('includes pre-trial settlement and court trial pathways', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const settlement = plan.settlementPathways.find(p => p.title.includes('Pre-Trial Settlement'));
      expect(settlement).toBeDefined();
      expect(settlement?.typical).toBe(true);
      expect(settlement?.pros).toContain('Faster resolution (months vs years)');

      const trial = plan.settlementPathways.find(p => p.title.includes('Court'));
      expect(trial).toBeDefined();
      expect(trial?.typical).toBe(false);
    });

    it('warns against repairing before photographing', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const repairWarning = plan.whatToAvoid.find(a => a.action.includes('repair damage before photographing'));
      expect(repairWarning).toBeDefined();
      expect(repairWarning?.severity).toBe('critical');
    });

    it('offers demand letter and evidence guide', () => {
      const classification: MatterClassification = {
        domain: 'civil-negligence',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const demandOffer = plan.nextStepOffers.find(o => o.id === 'demand-letter');
      expect(demandOffer).toBeDefined();
      expect(demandOffer?.documentType).toBe('demand_letter');

      const evidenceOffer = plan.nextStepOffers.find(o => o.id === 'evidence-guide');
      expect(evidenceOffer).toBeDefined();
      expect(evidenceOffer?.documentType).toBe('civil_evidence_guide');
    });
  });

  describe('Municipal Property Damage Domain', () => {
    it('includes critical 10-day notice action', () => {
      const classification: MatterClassification = {
        domain: 'municipalPropertyDamage',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const noticeAction = plan.immediateActions.find(a => a.id === 'municipal-notice');
      expect(noticeAction).toBeDefined();
      expect(noticeAction?.priority).toBe('urgent');
      expect(noticeAction?.title).toContain('10-Day Municipal Notice');
      expect(noticeAction?.timeframe).toContain('Within 10 days');
    });

    it('includes insurance subrogation pathway', () => {
      const classification: MatterClassification = {
        domain: 'municipalPropertyDamage',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const subrogation = plan.settlementPathways.find(p => p.title.includes('Insurance Subrogation'));
      expect(subrogation).toBeDefined();
      expect(subrogation?.typical).toBe(true);
      expect(subrogation?.description).toContain('homeowner\'s insurance');
    });

    it('offers municipal notice template', () => {
      const classification: MatterClassification = {
        domain: 'municipalPropertyDamage',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const noticeOffer = plan.nextStepOffers.find(o => o.id === 'municipal-notice');
      expect(noticeOffer).toBeDefined();
      expect(noticeOffer?.title).toContain('10-Day Municipal Notice');
      expect(noticeOffer?.documentType).toBe('municipal_notice');
    });
  });

  describe('Landlord-Tenant Domain', () => {
    it('generates appropriate acknowledgment', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.acknowledgment).toContain('landlord-tenant dispute');
    });

    it('includes LTB evidence and application actions', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const evidenceAction = plan.immediateActions.find(a => a.id === 'ltb-evidence');
      expect(evidenceAction).toBeDefined();
      expect(evidenceAction?.title).toContain('Evidence and Documentation');

      const applicationAction = plan.immediateActions.find(a => a.id === 'ltb-application');
      expect(applicationAction).toBeDefined();
      expect(applicationAction?.title).toContain('LTB Application');
    });

    it('clarifies tenant applicant role', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.roleExplanation.title).toContain('Tenant Applicant');
      expect(plan.roleExplanation.summary).toContain('informal tribunal');
      const noLawyerNeeded = plan.roleExplanation.whatYouAreNot.some(s => s.includes('do NOT need a lawyer'));
      expect(noLawyerNeeded).toBe(true);
    });

    it('warns against withholding rent', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const witholdWarning = plan.whatToAvoid.find(a => a.action.includes('withhold rent'));
      expect(witholdWarning).toBeDefined();
      expect(witholdWarning?.severity).toBe('critical');
      expect(witholdWarning?.reason).toContain('eviction');
    });

    it('offers LTB application and evidence checklist', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const applicationOffer = plan.nextStepOffers.find(o => o.id === 'ltb-application');
      expect(applicationOffer).toBeDefined();
      expect(applicationOffer?.documentType).toBe('ltb_application_guide');

      const evidenceOffer = plan.nextStepOffers.find(o => o.id === 'evidence-checklist');
      expect(evidenceOffer).toBeDefined();
      expect(evidenceOffer?.documentType).toBe('ltb_evidence_checklist');
    });
  });

  describe('Employment Domain', () => {
    it('generates appropriate acknowledgment', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.acknowledgment).toContain('employment issue');
    });

    it('includes documentation and MOL complaint actions', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const docAction = plan.immediateActions.find(a => a.id === 'employment-documentation');
      expect(docAction).toBeDefined();
      expect(docAction?.priority).toBe('urgent');
      expect(docAction?.title).toContain('Document Employment Details');

      const molAction = plan.immediateActions.find(a => a.id === 'employment-mol');
      expect(molAction).toBeDefined();
      expect(molAction?.title).toContain('Ministry of Labour');
    });

    it('clarifies employment complainant role', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.roleExplanation.title).toContain('Employment Complainant');
      expect(plan.roleExplanation.summary).toContain('Ministry of Labour');
      expect(plan.roleExplanation.summary).toContain('civil court');
      const notBothPathways = plan.roleExplanation.whatYouAreNot.some(s => s.includes('NOT required to use both pathways'));
      expect(notBothPathways).toBe(true);
    });

    it('includes negotiated severance pathway', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const severance = plan.settlementPathways.find(p => p.title.includes('Severance'));
      expect(severance).toBeDefined();
      expect(severance?.typical).toBe(true);
      expect(severance?.pros).toContain('Quick resolution');
    });

    it('warns against signing releases without review', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const releaseWarning = plan.whatToAvoid.find(a => a.action.includes('sign a release'));
      expect(releaseWarning).toBeDefined();
      expect(releaseWarning?.severity).toBe('critical');
      expect(releaseWarning?.reason).toContain('waive the right to sue');
    });

    it('offers severance calculator and MOL complaint guide', () => {
      const classification: MatterClassification = {
        domain: 'employment',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const severanceOffer = plan.nextStepOffers.find(o => o.id === 'severance-calculator');
      expect(severanceOffer).toBeDefined();
      expect(severanceOffer?.documentType).toBe('severance_calculator');

      const molOffer = plan.nextStepOffers.find(o => o.id === 'mol-complaint');
      expect(molOffer).toBeDefined();
      expect(molOffer?.documentType).toBe('mol_complaint_guide');
    });
  });

  describe('Default/Other Domain', () => {
    it('generates generic acknowledgment', () => {
      const classification: MatterClassification = {
        domain: 'other',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.acknowledgment).toContain('legal issue');
    });

    it('includes generic evidence gathering action', () => {
      const classification: MatterClassification = {
        domain: 'other',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      expect(plan.immediateActions.length).toBeGreaterThan(0);
      
      const evidenceAction = plan.immediateActions.find(a => a.id === 'general-evidence');
      expect(evidenceAction).toBeDefined();
      expect(evidenceAction?.title).toContain('Evidence and Documentation');
    });
  });

  describe('Universal Features', () => {
    it('always includes complete package offer', () => {
      const classification: MatterClassification = {
        domain: 'criminal',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const packageOffer = plan.nextStepOffers.find(o => o.id === 'complete-package');
      expect(packageOffer).toBeDefined();
      expect(packageOffer?.title).toContain('Complete Documentation Package');
    });

    it('always includes "understand your options" avoidance', () => {
      const classification: MatterClassification = {
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
      };

      const plan = generator.generate(classification);

      const optionsAvoid = plan.whatToAvoid.find(a => a.action.includes('without understanding your options'));
      expect(optionsAvoid).toBeDefined();
      expect(optionsAvoid?.severity).toBe('caution');
    });

    it('adjusts acknowledgment tone based on urgency', () => {
      const highUrgency: MatterClassification = {
        domain: 'municipalPropertyDamage',
        jurisdiction: 'Ontario',
        urgency: 'high',
      };

      const lowUrgency: MatterClassification = {
        domain: 'municipalPropertyDamage',
        jurisdiction: 'Ontario',
        urgency: 'low',
      };

      const highPlan = generator.generate(highUrgency);
      const lowPlan = generator.generate(lowUrgency);

      expect(highPlan.acknowledgment).toContain('tight timelines');
      expect(lowPlan.acknowledgment).toContain('clear steps');
    });
  });
});
