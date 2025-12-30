import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('TemplateLibrary - Legal Malpractice Templates', () => {
  const library = new TemplateLibrary();
  const templates = library.domainTemplates();

  describe('LawPRO Notice Template', () => {
    it('should exist and render with variables', () => {
      const rendered = library.renderTemplate('malpractice/lawpro_notice', {
        clientName: 'Quinn Avery',
        lawyerName: 'Morgan Vance',
        originalClaimType: 'slip-and-fall',
        missedDeadline: '2025-01-10',
        discoveryDate: '2025-12-21'
      });

      expect(rendered).toContain('LawPRO Immediate Notification Guide');
      expect(rendered).toContain('Quinn Avery');
      expect(rendered).toContain('Morgan Vance');
      expect(rendered).toContain('slip-and-fall');
      expect(rendered).toContain('2025-01-10');
      expect(rendered).toContain('2025-12-21');
      expect(rendered).toContain('Lawyers\' Professional Indemnity Company');
      expect(rendered).toContain('416-598-5800');
    });

    it('should include key LawPRO guidance', () => {
      const template = templates['malpractice/lawpro_notice'];
      expect(template).toContain('professional obligation to report');
      expect(template).toContain('Missed limitation periods');
      expect(template).toContain('clearest forms of legal negligence');
      expect(template).toContain('NOT adversarial yet');
      expect(template).toContain('Retain independent counsel');
    });
  });

  describe('Case-Within-Case Analysis Template', () => {
    it('should exist and render with variables', () => {
      const rendered = library.renderTemplate('malpractice/case_within_case', {
        clientName: 'Quinn Avery',
        originalClaimType: 'slip-and-fall personal injury',
        potentialDamages: '$100,000',
        missedDeadline: '2025-01-10'
      });

      expect(rendered).toContain('Case-Within-a-Case Analysis Framework');
      expect(rendered).toContain('slip-and-fall personal injury');
      expect(rendered).toContain('$100,000');
      expect(rendered).toContain('2025-01-10');
    });

    it('should include four elements of malpractice', () => {
      const template = templates['malpractice/case_within_case'];
      expect(template).toContain('1. Duty of Care');
      expect(template).toContain('2. Breach of Standard of Care');
      expect(template).toContain('3. Causation');
      expect(template).toContain('4. Damages');
      expect(template).toContain('reasonably competent solicitor');
      expect(template).toContain('loss of a chance');
    });

    it('should explain damages calculation', () => {
      const template = templates['malpractice/case_within_case'];
      expect(template).toContain('NOT automatically the full claim amount');
      expect(template).toContain('Likelihood of success × Original claim value');
      expect(template).toContain('60% chance × $100,000 = $60,000');
    });
  });

  describe('Expert Instruction Letter Template', () => {
    it('should exist and render with variables', () => {
      const rendered = library.renderTemplate('malpractice/expert_instruction', {
        clientName: 'Quinn Avery',
        lawyerName: 'Morgan Vance',
        originalClaimType: 'slip-and-fall',
        missedDeadline: '2025-01-10'
      });

      expect(rendered).toContain('Expert Witness Instruction Letter');
      expect(rendered).toContain('Quinn Avery');
      expect(rendered).toContain('Morgan Vance');
      expect(rendered).toContain('slip-and-fall');
      expect(rendered).toContain('2025-01-10');
    });

    it('should include expert opinion questions', () => {
      const template = templates['malpractice/expert_instruction'];
      expect(template).toContain('Questions for Expert Opinion');
      expect(template).toContain('Standard of Care');
      expect(template).toContain('tickler systems');
      expect(template).toContain('calendaring software');
      expect(template).toContain('breach of the standard of care');
    });

    it('should specify expert qualifications', () => {
      const template = templates['malpractice/expert_instruction'];
      expect(template).toContain('Active Ontario bar membership');
      expect(template).toContain('professional negligence standards');
      expect(template).toContain('No conflict of interest');
    });
  });

  describe('Demand Letter Template', () => {
    it('should exist and render with variables', () => {
      const rendered = library.renderTemplate('malpractice/demand_letter', {
        clientName: 'Quinn Avery',
        lawyerName: 'Morgan Vance',
        originalClaimType: 'slip-and-fall',
        missedDeadline: '2025-01-10',
        potentialDamages: '$100,000',
        discoveryDate: '2025-12-21'
      });

      expect(rendered).toContain('NOTICE OF LEGAL MALPRACTICE CLAIM');
      expect(rendered).toContain('Quinn Avery');
      expect(rendered).toContain('Morgan Vance');
      expect(rendered).toContain('$100,000');
      expect(rendered).toContain('2025-01-10');
      expect(rendered).toContain('2025-12-21');
    });

    it('should include formal demand structure', () => {
      const template = templates['malpractice/demand_letter'];
      expect(template).toContain('## 1. Introduction');
      expect(template).toContain('## 2. Facts');
      expect(template).toContain('## 3. Consequence');
      expect(template).toContain('## 4. Elements of Malpractice');
      expect(template).toContain('## 5. Demand for Resolution');
      expect(template).toContain('**CC:** LawPRO');
      expect(template).toContain('21 days');
    });

    it('should reference Limitations Act, 2002', () => {
      const template = templates['malpractice/demand_letter'];
      expect(template).toContain('Limitations Act, 2002');
      expect(template).toContain('two-year limitation period');
    });
  });

  describe('Evidence Checklist Template', () => {
    it('should exist and render with variables', () => {
      const rendered = library.renderTemplate('malpractice/evidence_checklist', {
        originalClaimType: 'slip-and-fall',
        missedDeadline: '2025-01-10'
      });

      expect(rendered).toContain('Evidence Preservation Checklist');
      expect(rendered).toContain('slip-and-fall');
      expect(rendered).toContain('2025-01-10');
    });

    it('should include Part A: Evidence of Lawyer Negligence', () => {
      const template = templates['malpractice/evidence_checklist'];
      expect(template).toContain('Part A: Evidence of Lawyer\'s Negligence');
      expect(template).toContain('Retainer Agreement');
      expect(template).toContain('Admission of error');
      expect(template).toContain('Limitation Period Evidence');
      expect(template).toContain('Discovery Date');
      expect(template).toContain('Financial Records');
    });

    it('should include Part B: Evidence of Original Claim Merits', () => {
      const template = templates['malpractice/evidence_checklist'];
      expect(template).toContain('Part B: Evidence of Original Claim Merits');
      expect(template).toContain('Case-Within-Case');
      expect(template).toContain('Incident Documentation');
      expect(template).toContain('Medical Evidence');
      expect(template).toContain('Financial Losses');
      expect(template).toContain('Comparable Cases');
    });

    it('should include limitation period warning', () => {
      const template = templates['malpractice/evidence_checklist'];
      expect(template).toContain('2 years from discovery');
      expect(template).toContain('Do NOT delay');
      expect(template).toContain('Early action improves settlement prospects');
    });
  });

  it('should have all 5 malpractice templates registered', () => {
    expect(templates).toHaveProperty('malpractice/lawpro_notice');
    expect(templates).toHaveProperty('malpractice/case_within_case');
    expect(templates).toHaveProperty('malpractice/expert_instruction');
    expect(templates).toHaveProperty('malpractice/demand_letter');
    expect(templates).toHaveProperty('malpractice/evidence_checklist');
  });

  it('should handle missing variables gracefully', () => {
    const rendered = library.renderTemplate('malpractice/lawpro_notice', {
      // No variables provided
    });

    // Template should still render with empty placeholders
    expect(rendered).toContain('LawPRO Immediate Notification Guide');
    expect(rendered).not.toContain('undefined');
    expect(rendered).not.toContain('{{');
  });
});
