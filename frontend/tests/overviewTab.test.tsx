/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import OverviewTab from '../src/components/OverviewTab';

describe('OverviewTab (UI): pillar explanation display', () => {
  it('shows pillar explanation with burden and overview and next steps', async () => {
    const classification = { domain: 'civil-negligence', pillar: 'Civil' };
    const forumMap = { primaryForum: { name: 'Small Claims Court', type: 'court' }, alternatives: [] };
    const pillarExplanation = {
      burdenOfProof: 'Balance of probabilities',
      overview: 'This is a civil matter about negligence.',
      nextSteps: ['Collect photos', 'Obtain repair estimates']
    };

    const user = userEvent.setup();
    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} pillarExplanation={pillarExplanation} />);

    // Classification details are collapsed by default - click to expand
    const expandButton = screen.getByRole('button', { name: /Technical Classification Details/i });
    await user.click(expandButton);

    expect(screen.getByText(/Legal pillar:/)).toBeInTheDocument();
    expect(screen.getByText(/Balance of probabilities/)).toBeInTheDocument();
    expect(screen.getByText(/This is a civil matter about negligence/)).toBeInTheDocument();
    expect(screen.getByText(/Collect photos/)).toBeInTheDocument();
  });

  it('renders gracefully when pillarExplanation is missing', () => {
    const classification = { domain: 'insurance', pillar: 'Civil' };
    const forumMap = { primaryForum: { name: 'Tribunal', type: 'tribunal' }, alternatives: [] };
    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} />);
    expect(screen.queryByText(/Legal pillar:/)).toBeNull();
  });

  it('shows alternatives and escalation paths when provided', () => {
    const classification = { domain: 'insurance', pillar: 'Civil' } as any;
    const forumMap = {
      primaryForum: { name: 'Small Claims Court', type: 'court' },
      alternatives: [{ id: 'ALT1', name: 'Divisional Court', type: 'court' }],
      escalation: [{ id: 'ESC1', name: 'Court of Appeal', type: 'court' }],
      rationale: 'Amount within Small Claims threshold.'
    } as any;

    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} pillarExplanation={null as any} />);

    expect(screen.getByText(/Alternative Forums/)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Path/)).toBeInTheDocument();
    expect(screen.getByText(/Divisional Court/)).toBeInTheDocument();
    expect(screen.getByText(/Court of Appeal/)).toBeInTheDocument();
    expect(screen.getAllByText(/Amount within Small Claims threshold/).length).toBeGreaterThan(0);
  });

  it('renders deadline alerts when provided', () => {
    const classification = { domain: 'civil-negligence', pillar: 'Civil' } as any;
    const forumMap = { primaryForum: { name: 'Small Claims Court', type: 'court' }, alternatives: [] } as any;
    const alerts = [
      {
        urgency: 'warning',
        daysRemaining: 5,
        limitationPeriod: {
          name: 'Municipal Notice Requirement',
          period: '10 days',
          description: 'Notice needed within 10 days',
          consequence: 'Missing it can bar your claim',
        },
        message: '5 days remaining to send notice',
        actionRequired: 'Send written notice to the municipality',
        encouragement: "Don't panic",
      },
    ];

    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} deadlineAlerts={alerts} />);

    expect(screen.getByText(/Important Deadlines/i)).toBeInTheDocument();
    expect(screen.getByText(/Municipal Notice Requirement/)).toBeInTheDocument();
    expect(screen.getByText(/5 days remaining to send notice/)).toBeInTheDocument();
    expect(screen.getByText(/Send written notice/)).toBeInTheDocument();
  });
});