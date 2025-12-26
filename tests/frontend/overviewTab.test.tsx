/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock MatterDeadlineAlerts to avoid React hook mismatch in jsdom
vi.mock('../../frontend/src/components/MatterDeadlineAlerts', () => ({
  MatterDeadlineAlerts: () => <div data-testid="matter-deadline-alerts">Deadline alerts</div>,
}));

import OverviewTab from '../../frontend/src/components/OverviewTab';

describe('OverviewTab (UI): pillar explanation display', () => {
  it('shows pillar explanation with burden and overview and next steps', () => {
    const classification = { domain: 'civil-negligence', pillar: 'Civil' };
    const forumMap = { primaryForum: { name: 'Small Claims Court', type: 'court' }, alternatives: [] };
    const pillarExplanation = {
      burdenOfProof: 'Balance of probabilities',
      overview: 'This is a civil matter about negligence.',
      nextSteps: ['Collect photos', 'Obtain repair estimates']
    };

    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} pillarExplanation={pillarExplanation} />);

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
});