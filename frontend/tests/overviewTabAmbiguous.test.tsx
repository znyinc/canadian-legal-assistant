/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import OverviewTab from '../src/components/OverviewTab';

describe('OverviewTab (UI): ambiguous pillar display', () => {
  it('shows ambiguous note when multiple pillars detected', async () => {
    const classification = { domain: 'mixed', pillar: 'Unknown' };
    const forumMap = { primaryForum: { name: 'Unknown', type: 'other' }, alternatives: [] };
    const user = userEvent.setup();
    render(<OverviewTab classification={classification} forumMap={forumMap} classifying={false} onClassify={() => {}} pillarMatches={['Criminal', 'Quasi-Criminal']} pillarAmbiguous={true} />);

    // Ambiguous message is in collapsed classification section - expand it
    const expandButton = screen.getByRole('button', { name: /Technical Classification Details/i });
    await user.click(expandButton);

    expect(screen.getByText(/Ambiguous: multiple legal pillars detected/)).toBeInTheDocument();
    expect(screen.getByText(/Criminal, Quasi-Criminal/)).toBeInTheDocument();
  });
});