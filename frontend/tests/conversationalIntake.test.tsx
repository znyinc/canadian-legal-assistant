/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import ConversationalIntake from '../src/components/ConversationalIntake';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ConversationalIntake nuance branch', () => {
  it('lets the user open deeper reason/cause chat before drafting text', async () => {
    const onOpenNuance = vi.fn();
    const user = userEvent.setup();

    render(
      <ConversationalIntake
        onComplete={vi.fn()}
        onCancel={vi.fn()}
        onOpenNuance={onOpenNuance}
      />,
    );

    const button = screen.getByRole('button', { name: /Open deeper reason\/cause chat/i });
    expect(button).toBeEnabled();

    await user.click(button);

    expect(onOpenNuance).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
        source: 'conversational-intake',
      }),
    );
  });
});