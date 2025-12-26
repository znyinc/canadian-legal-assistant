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

describe('OverviewTab (UI): ambiguous pillar display', () => {
  it('shows ambiguous note when multiple pillars detected', () => {
    const classification = { domain: 'mixed', pillar: 'Unknown' };
    const forumMap = { primaryForum: { name: 'Unknown', type: 'other' }, alternatives: [] };
    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} pillarMatches={['Criminal', 'Quasi-Criminal']} pillarAmbiguous={true} />);

    expect(screen.getByText(/Ambiguous: multiple legal pillars detected/)).toBeInTheDocument();
    expect(screen.getByText(/Criminal, Quasi-Criminal/)).toBeInTheDocument();
  });
});