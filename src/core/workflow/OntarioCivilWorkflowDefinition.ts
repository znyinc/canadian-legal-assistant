import { DecisionGate, WorkflowDefinition, WorkflowPhase, WorkflowStep, WorkflowTrack } from '../models';

function step(
  id: string,
  phaseId: string,
  title: string,
  description: string,
  artifactType: string,
  tracks?: WorkflowTrack[],
): WorkflowStep {
  return {
    id,
    phaseId,
    title,
    description,
    artifactType,
    recommended: true,
    tracks,
  };
}

function phase(id: string, title: string, description: string, steps: WorkflowStep[]): WorkflowPhase {
  return {
    id,
    title,
    description,
    status: 'not-started',
    steps,
  };
}

function gate(id: string, title: string, triggerPhaseId: string, questions: string[]): DecisionGate {
  return {
    id,
    title,
    triggerPhaseId,
    questions,
  };
}

export const ONTARIO_CIVIL_WORKFLOW_DEFINITION: WorkflowDefinition = {
  id: 'ontario-civil-self-rep',
  version: '1.0.0',
  jurisdiction: 'Ontario',
  title: 'Ontario Civil Self-Representation Workflow',
  summary: 'Phase-driven workflow for Ontario civil self-representation with decision gates and official-source research support.',
  phases: [
    phase('phase-7', 'Phase 7: Court Rules & Jurisdiction', 'Identify limitation risk, forum, ADR posture, and filing/service requirements.', [
      step('limitation-period-verification', 'phase-7', 'Limitation Period Verification', 'Assess limitation deadlines and discoverability risk.', 'limitation-memo'),
      step('adr-mapping', 'phase-7', 'ADR Mapping', 'Review mediation, arbitration, ombudsman, and early resolution pathways.', 'adr-analysis'),
      step('court-selection-matrix', 'phase-7', 'Court Selection Matrix', 'Confirm the correct Ontario civil forum and procedural track.', 'court-selection-analysis'),
      step('rules-of-court-inventory', 'phase-7', 'Rules Inventory', 'Create a practical rules quick-reference for the selected track.', 'rules-index'),
      step('filing-requirements-checklist', 'phase-7', 'Filing & Service Checklist', 'Prepare filing, service, proof-of-service, and notice requirements.', 'filing-service-checklist'),
      step('virtual-hearing-rules', 'phase-7', 'Virtual Hearing Checklist', 'Summarize likely remote/in-person filing and hearing protocols.', 'virtual-hearing-checklist'),
    ]),
    phase('phase-8', 'Phase 8: Evidence Organization & Strategy', 'Organize evidence into admissible, persuasive artifacts.', [
      step('evidence-audit', 'phase-8', 'Evidence Audit', 'Inventory evidence and map it to the claim or defence.', 'evidence-audit'),
      step('privilege-review', 'phase-8', 'Privilege Review', 'Separate potentially privileged materials from producible materials.', 'privilege-log'),
      step('digital-evidence-authentication', 'phase-8', 'Digital Evidence Authentication', 'Capture authenticity notes for electronic evidence.', 'digital-authentication-log'),
      step('chain-of-custody-documentation', 'phase-8', 'Chain of Custody', 'Track origin, storage, and handling of evidence.', 'chain-of-custody-log'),
      step('hearsay-and-admissibility-analysis', 'phase-8', 'Hearsay & Admissibility', 'Review hearsay risk and witness requirements.', 'admissibility-review'),
      step('adverse-inference-analysis', 'phase-8', 'Adverse Inference Analysis', 'Identify missing evidence and spoliation risk.', 'adverse-inference-map'),
      step('financial-and-statistical-evidence', 'phase-8', 'Damages Package', 'Organize damages calculations, mitigation, and support.', 'damages-package'),
      step('evidence-chronology', 'phase-8', 'Evidence Chronology', 'Build a dated chronology with supporting evidence.', 'evidence-chronology'),
      step('exhibit-organization', 'phase-8', 'Exhibit List', 'Create a master exhibit list and reference map.', 'exhibit-list'),
    ]),
    phase('phase-8-5', 'Phase 8.5: Discovery & Disclosure', 'Prepare for civil production and examinations.', [
      step('litigation-hold-and-preservation', 'phase-8-5', 'Litigation Hold', 'Issue a preservation notice and scope the hold.', 'litigation-hold-notice', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('affidavit-of-documents', 'phase-8-5', 'Affidavit of Documents', 'Prepare Schedule A, B, and C materials.', 'affidavit-of-documents', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('document-production', 'phase-8-5', 'Production Review', 'Track your production and review the opponent’s production.', 'production-review', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('examination-for-discovery-preparation', 'phase-8-5', 'Discovery Preparation', 'Prepare discovery answers, admissions, and undertakings.', 'discovery-prep', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('undertakings-management', 'phase-8-5', 'Undertakings Tracker', 'Track undertakings given and received.', 'undertakings-tracker', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('proportionality-and-discovery-scope', 'phase-8-5', 'Proportionality Memo', 'Assess whether discovery scope is proportionate.', 'proportionality-memo', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
    ]),
    phase('phase-8-7', 'Phase 8.7: Expert Evidence', 'Assess whether expert evidence is needed and how it affects the case.', [
      step('expert-necessity-assessment', 'phase-8-7', 'Expert Necessity Assessment', 'Evaluate whether expert evidence is required.', 'expert-necessity-memo'),
      step('expert-selection-and-engagement', 'phase-8-7', 'Expert Engagement Checklist', 'Outline how to retain and brief an expert.', 'expert-engagement-checklist'),
      step('expert-report-requirements', 'phase-8-7', 'Rule 53 Compliance', 'Track report timing and minimum Rule 53 requirements.', 'rule-53-compliance'),
      step('joint-expert-consideration', 'phase-8-7', 'Joint Expert Assessment', 'Consider whether a joint expert is appropriate.', 'joint-expert-analysis'),
      step('challenging-opponent-expert', 'phase-8-7', 'Opponent Expert Challenge Plan', 'Prepare to challenge qualifications, assumptions, and methodology.', 'opponent-expert-challenge'),
    ]),
    phase('phase-9', 'Phase 9: Pleadings & Motion Materials', 'Prepare the core litigation record before settlement and pre-trial work.', [
      step('pleadings-drafting', 'phase-9', 'Pleadings & Motion Support', 'Draft pleadings, affidavits, and motion materials.', 'pleadings-support'),
    ]),
    phase('phase-9-5', 'Phase 9.5: Settlement Economics & Pre-Trial Posture', 'Model settlement ranges, Rule 49 exposure, mediation strategy, and pre-trial readiness.', [
      step('rule-49-offer-strategy', 'phase-9-5', 'Rule 49 Offer Strategy', 'Prepare or review offers to settle and mediation posture.', 'rule-49-strategy', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
      step('mandatory-mediation-preparation', 'phase-9-5', 'Mediation Brief', 'Prepare settlement economics and mediation materials.', 'mediation-brief'),
      step('pre-trial-conference-preparation', 'phase-9-5', 'Pre-Trial Brief', 'Prepare the pre-trial conference brief and settlement authority memo.', 'pre-trial-brief', ['ontario-superior-simplified', 'ontario-superior-ordinary']),
    ]),
    phase('phase-10', 'Phase 10: Testimony & Trial Materials', 'Prepare witness examinations, objections, and trial binders.', [
      step('testimony-and-cross-prep', 'phase-10', 'Testimony & Cross-Examination Prep', 'Prepare direct, cross, re-examination, and objections.', 'testimony-prep'),
      step('trial-organization', 'phase-10', 'Trial Package', 'Build trial scheduling, authorities, judge notes, and day-of materials.', 'trial-package'),
    ]),
    phase('phase-12', 'Phase 12: Judgment Review', 'Assess the outcome, omissions, and practical enforcement implications.', [
      step('judgment-analysis', 'phase-12', 'Judgment Analysis', 'Analyze the decision, omissions, and practical consequences.', 'judgment-analysis'),
    ]),
    phase('phase-12-5', 'Phase 12.5: Appeal & Costs Decision Layer', 'Evaluate appeal viability, stay needs, appellate record scope, and costs risk.', [
      step('appeal-and-stay-workflow', 'phase-12-5', 'Appeal & Stay Workflow', 'Assess appeal deadlines, grounds, and stay needs.', 'appeal-workflow'),
      step('appellate-record-checklist', 'phase-12-5', 'Appellate Record Checklist', 'List transcripts, exhibits, and appellate record needs.', 'appellate-record-checklist'),
      step('costs-submissions', 'phase-12-5', 'Costs Submissions', 'Prepare bill of costs or response to the opponent’s costs claim.', 'costs-submission'),
    ]),
    phase('phase-13', 'Phase 13: Ongoing Risk Management', 'Track deadlines, compliance posture, and post-decision escalation triggers.', [
      step('risk-management-dashboard', 'phase-13', 'Risk Management Dashboard', 'Track deadlines, costs, compliance, and escalation triggers.', 'risk-dashboard'),
    ]),
  ],
  gates: [
    gate('gate-1', 'Gate 1: Jurisdiction & ADR', 'phase-7', [
      'Is this the right court or track?',
      'Should ADR be pursued first?',
      'Is the limitation period intact or imminent?',
      'Do you understand the procedural requirements enough to proceed?',
      'What is the realistic cost exposure if you lose?',
    ]),
    gate('gate-2', 'Gate 2: Evidence Sufficiency', 'phase-8', [
      'Do you have evidence for each required element of the claim or defence?',
      'Are there critical evidence gaps you cannot fill?',
      'Does privilege review remove material evidence from production?',
      'Would missing evidence likely result in an adverse inference?',
      'Is the evidence clear enough to persuade a judge?',
    ]),
    gate('gate-3', 'Gate 3: Post-Discovery', 'phase-8-5', [
      'Did discovery strengthen or weaken the case?',
      'Did the opponent produce unexpected damaging evidence?',
      'Are your discovery answers defensible at trial?',
      'Are all undertakings fulfilled?',
      'Has the cost-benefit analysis materially changed?',
    ]),
    gate('gate-4', 'Gate 4: Pre-Trial', 'phase-9-5', [
      'Did the pre-trial process reveal judicial concern about the merits?',
      'Have reasonable settlement options been considered?',
      'Is there a Rule 49 offer that materially changes cost exposure?',
      'Are you practically ready for trial?',
      'Does continuing still make economic sense?',
    ]),
    gate('gate-5', 'Gate 5: Post-Judgment', 'phase-12-5', [
      'Did the judge make a legal or palpable factual error?',
      'Is there a realistic prospect of success on appeal?',
      'Can you afford appeal costs and possible further costs awards?',
      'Is a stay needed while appeal options are assessed?',
      'Should the judgment be accepted and the matter closed?',
    ]),
  ],
};

