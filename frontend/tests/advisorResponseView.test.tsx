import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdvisorResponseView, { CaseProfile, ActionPlan } from '../src/components/AdvisorResponseView';

const baseProfile: CaseProfile = {
  empathyHook: "I know this feels like a gut-punch, but we can navigate it together.",
  plainSummary: "Your lawyer missed the filing deadline on a $100,000 slip-and-fall claim.",
  keyInsight: "A missed deadline can create a malpractice claim with clearer liability.",
  lostVsGained: [
    { lost: "Right to sue the store", gained: "Potential malpractice claim" },
    { lost: "Uncertain negligence case", gained: "Clear missed-deadline proof" },
  ],
  thingsToKnow: [
    { title: "Case within a case", detail: "Prove the original would have won and the lawyer breached duty." },
    { title: "New 2-year clock", detail: "Runs from discovery of the malpractice." },
    { title: "Insurance", detail: "LawPRO coverage improves collectability." },
  ],
};

const basePlan: ActionPlan = {
  acknowledgment: "You are dealing with potential legal malpractice. This can feel heavy, but there are steps.",
  immediateActions: [
    {
      id: 'a1',
      priority: 'urgent',
      title: 'Send complaint to lawyer',
      description: 'Create a written record that the deadline was missed.',
      timeframe: 'Within 48 hours',
    },
    {
      id: 'a2',
      priority: 'soon',
      title: 'Request full client file',
      description: 'Ask for all documents, emails, and notes.',
      timeframe: 'Within 7 days',
    },
    {
      id: 'a3',
      priority: 'when-ready',
      title: 'Consult malpractice lawyer',
      description: 'Discuss filing and collectability.',
      timeframe: 'Within 30 days',
    },
  ],
  roleExplanation: {
    responsibilities: ['Keep evidence organized', 'Communicate in writing'],
    whatYouAreNot: ['You are not the prosecutor'],
  },
  settlementPathways: [],
  whatToAvoid: [
    { action: "Don't delay", reason: 'The new limitation period has started.', severity: 'critical' },
  ],
  nextStepOffers: [
    { id: 'demand', title: 'Demand Letter', description: 'Formal letter to your lawyer', actionLabel: 'Generate Demand Letter', documentType: 'malpractice/demand_letter' },
  ],
};

describe('AdvisorResponseView', () => {
  it('renders narrative sections and timeline', () => {
    render(
      <AdvisorResponseView
        caseProfile={baseProfile}
        classification={{ domain: 'legalMalpractice', forum: 'Superior Court' }}
        actionPlan={basePlan}
        generateOptions={basePlan.nextStepOffers.map((o) => ({
          label: o.actionLabel,
          documentType: o.documentType || o.id,
          description: o.description,
        }))}
      />
    );

    expect(screen.getByText(/gut-punch/i)).toBeInTheDocument();
    expect(screen.getByText(/Your Situation in Plain English/i)).toBeInTheDocument();
    expect(screen.getByText(/Key Insight/i)).toBeInTheDocument();
    expect(screen.getByText(/What You Lost vs What You May Have Gained/i)).toBeInTheDocument();
    expect(screen.getByText(/Case within a case/i)).toBeInTheDocument();
    expect(screen.getByText(/Send complaint to lawyer/i)).toBeInTheDocument();
    expect(screen.getByLabelText('pathway-diagram')).toBeInTheDocument();
    expect(screen.getByText(/What Not to Do/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate Demand Letter/i)).toBeInTheDocument();
    expect(screen.getByText(/Legal information only/i)).toBeInTheDocument();
  });

  it('calls onGenerate when an action button is clicked', async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();

    render(
      <AdvisorResponseView
        caseProfile={baseProfile}
        classification={{ domain: 'legalMalpractice', forum: 'Superior Court' }}
        actionPlan={basePlan}
        onGenerate={onGenerate}
        generateOptions={basePlan.nextStepOffers.map((o) => ({
          label: o.actionLabel,
          documentType: o.documentType || o.id,
        }))}
      />
    );

    await user.click(screen.getByText(/Generate Demand Letter/i));
    expect(onGenerate).toHaveBeenCalledWith('malpractice/demand_letter');
  });
});
