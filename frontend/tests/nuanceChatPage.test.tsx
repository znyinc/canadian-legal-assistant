/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

const { mockNavigate, sendNuanceChatMessage, createMatter } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  sendNuanceChatMessage: vi.fn(),
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
    sendNuanceChatMessage,
    createMatter,
  },
}));

vi.mock('../src/components/ConversationalInterface', () => ({
  ConversationalInterface: ({ onMessageSend }: { onMessageSend: (message: string) => Promise<string> }) => (
    <button onClick={() => void onMessageSend('I was fired yesterday without warning.')}>Send seed message</button>
  ),
}));

import NuanceChatPage from '../src/pages/NuanceChatPage';

describe('NuanceChatPage semantic analyzer handoff', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    sendNuanceChatMessage.mockReset();
    createMatter.mockReset();
  });

  it('creates a matter workspace directly from semantic analyzer output', async () => {
    sendNuanceChatMessage.mockResolvedValue({
      message: 'The route likely depends on the termination reason and records.',
      context: {
        source: 'llm',
        model: 'gpt-5.4-mini',
        confidence: 84,
        domain: 'employment',
        jurisdiction: 'Ontario',
        urgency: 'medium',
        incidentSummary: 'Employment termination dispute.',
        likelyTrack: 'Likely employment standards or wrongful dismissal review.',
        remediationPattern: 'Clarify the employer reason and preserve written records.',
        missingFacts: ['What reason did the employer give?'],
        evidenceChecklist: ['termination letter', 'employment contract'],
        directAnswer: 'This looks like an employment matter, but the employer reason still changes the path.',
        immediateActions: ['Preserve the termination notice.'],
        escalationCriteria: ['If they allege cause, the record matters.'],
        singleNextQuestion: 'What reason did the employer give? ',
        conciseDisclaimer: 'Legal information only.',
        readyToImport: true,
        importPayload: {
          description: 'Employment termination dispute.',
          domain: 'employment',
          jurisdiction: 'Ontario',
          urgency: 'medium',
        },
      },
    });
    createMatter.mockResolvedValue({ id: 'matter-123' });

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/matters/new']}>
        <NuanceChatPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Send seed message/i }));

    await waitFor(() => expect(sendNuanceChatMessage).toHaveBeenCalledTimes(1));

    expect(screen.queryByRole('button', { name: /Review In Structured Intake/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Create Matter Workspace/i }));

    await waitFor(() => expect(createMatter).toHaveBeenCalledTimes(1));
    expect(createMatter).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Employment termination dispute.',
      province: 'ON',
      domain: 'employment',
      structuredAnswers: expect.arrayContaining([
        expect.objectContaining({
          kind: 'semantic-analyzer-import',
          data: expect.objectContaining({
            source: 'llm',
            model: 'gpt-5.4-mini',
            incidentSummary: 'Employment termination dispute.',
          }),
        }),
      ]),
      variables: expect.objectContaining({
        semanticAnalyzerImported: true,
        semanticSource: 'llm',
      }),
    }));
    expect(mockNavigate).toHaveBeenLastCalledWith('/matters/matter-123');
  });
});
