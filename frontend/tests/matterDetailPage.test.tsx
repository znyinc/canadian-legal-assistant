/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { getMatter, classifyMatter, generateDocuments } = vi.hoisted(() => ({
  getMatter: vi.fn(),
  classifyMatter: vi.fn(),
  generateDocuments: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  api: {
    getMatter,
    classifyMatter,
    generateDocuments,
  },
}));

vi.mock('../src/pages/EvidencePage', () => ({
  default: () => <div>Evidence Page</div>,
}));

vi.mock('../src/pages/DocumentsPage', () => ({
  default: () => <div>Documents Page</div>,
}));

vi.mock('../src/pages/WorkflowPage', () => ({
  default: () => <div>Workflow Page</div>,
}));

vi.mock('../src/components/OverviewTab', () => ({
  default: () => <div>Overview Tab</div>,
}));

vi.mock('../src/components/GuidanceNarrative', () => ({
  default: () => <div>Guidance Narrative</div>,
}));

import MatterDetailPage from '../src/pages/MatterDetailPage';

describe('MatterDetailPage preflight summary', () => {
  beforeEach(() => {
    getMatter.mockReset();
    classifyMatter.mockReset();
    generateDocuments.mockReset();
  });

  it('shows the stored preflight escalation summary on overview', async () => {
    getMatter.mockResolvedValue({
      id: 'matter-123',
      createdAt: '2026-04-16T10:00:00.000Z',
      description: 'Tenant dispute involving an eviction notice and repair issues.',
      province: 'Ontario',
      domain: 'landlordTenant',
      classification: JSON.stringify({
        domain: 'landlordTenant',
        jurisdiction: 'Ontario',
        actionPlan: {
          immediateActions: [],
          settlementPathways: [],
          nextStepOffers: [],
        },
      }),
      forumMap: JSON.stringify({
        primaryForum: { name: 'Landlord and Tenant Board', type: 'tribunal' },
        alternatives: [],
      }),
      metadata: JSON.stringify({
        structuredAnswers: [
          {
            kind: 'matter-preflight',
            data: {
              summary: 'The intake escalated this matter because it combines eviction pressure, repair issues, and urgent evidence concerns.',
              likelyTrack: 'Landlord and Tenant Board review with evidence preservation.',
              evidenceChecklist: ['N4 notice', 'photos of the leak'],
              confidence: 62,
              reviewRecommended: true,
              routeDecision: {
                lane: 'deep-reason',
                provider: 'litellm',
                model: 'gpt-5.4-mini',
                decisionReason: 'Complexity 0.82 exceeded threshold 0.55.',
              },
            },
          },
        ],
      }),
    });

    render(
      <MemoryRouter initialEntries={['/matters/matter-123']}>
        <Routes>
          <Route path="/matters/:id/*" element={<MatterDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Preflight review summary/i)).toBeInTheDocument();
    expect(screen.getByText(/This matter was escalated before the workspace was created/i)).toBeInTheDocument();
    expect(screen.getByText(/Complexity 0.82 exceeded threshold 0.55/i)).toBeInTheDocument();
    expect(screen.getByText(/N4 notice/i)).toBeInTheDocument();
    expect(screen.getByText(/Landlord and Tenant Board review with evidence preservation/i)).toBeInTheDocument();

    await waitFor(() => expect(getMatter).toHaveBeenCalledWith('matter-123'));
  });
});