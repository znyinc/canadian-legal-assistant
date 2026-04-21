/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

const { mockNavigate, preflightMatter, createMatter } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  preflightMatter: vi.fn(),
  createMatter: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../src/services/api', () => ({
  api: {
    preflightMatter,
    createMatter,
  },
}));

import IntakeWizard from '../src/components/IntakeWizard';

describe('IntakeWizard preflight review gate', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    preflightMatter.mockReset();
    createMatter.mockReset();
  });

  it('holds creation for review when preflight recommends review', async () => {
    preflightMatter.mockResolvedValue({
      description: 'tenant dispute',
      summary: 'The intake suggests this is a landlord-tenant dispute with eviction pressure and repair issues.',
      domain: 'landlordTenant',
      jurisdiction: 'Ontario',
      urgency: 'high',
      confidence: 62,
      source: 'llm',
      model: 'gpt-5.4-mini',
      routeDecision: {
        lane: 'deep-reason',
        provider: 'litellm',
        model: 'gpt-5.4-mini',
        decisionReason: 'Complexity 0.82 exceeded threshold 0.55.',
      },
      directAnswer: 'This fact pattern mixes eviction risk, habitability issues, and timeline pressure.',
      likelyTrack: 'Landlord and Tenant Board review with evidence preservation.',
      evidenceChecklist: ['N4 notice', 'photos of the leak', 'texts with the landlord'],
      reviewRecommended: true,
    });
    createMatter.mockResolvedValue({ id: 'matter-123' });

    const user = userEvent.setup();
    render(<IntakeWizard province="Ontario" />);

    await user.click(screen.getByRole('button', { name: /Action is being taken against me/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /Housing & Property/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /I'm being evicted/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.click(screen.getByRole('button', { name: /No deadlines yet/i }));
    await user.click(screen.getByRole('button', { name: /^Next$/i }));
    await user.type(screen.getByRole('textbox'), 'My landlord served an N4 notice, there is still a leak, and I have photos and texts showing the unresolved repairs.');
    await user.click(screen.getByRole('button', { name: /Analyze Scenario/i }));

    expect(preflightMatter).toHaveBeenCalledTimes(1);
    expect(createMatter).not.toHaveBeenCalled();

    expect(await screen.findByRole('heading', { name: /Review the intake summary/i })).toBeInTheDocument();
    expect(screen.getByText(/Escalated to deep reasoning during intake/i)).toBeInTheDocument();
    expect(screen.getByText(/Complexity 0.82 exceeded threshold 0.55/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Create Matter Workspace/i }));

    await waitFor(() => expect(createMatter).toHaveBeenCalledTimes(1));
    expect(createMatter.mock.calls[0][0].structuredAnswers[0].kind).toBe('matter-preflight');
    expect(createMatter.mock.calls[0][0].variables.preflightReviewed).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/matters/matter-123');
  });
});