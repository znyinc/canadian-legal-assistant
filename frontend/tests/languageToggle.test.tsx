import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import '../src/i18n';
import { LanguageToggle } from '../src/components/LanguageToggle';

describe('LanguageToggle', () => {
  it('switches language to French', async () => {
    const user = userEvent.setup();
    render(<LanguageToggle />);

    const frenchButton = screen.getByRole('button', { name: /français/i });
    await user.click(frenchButton);

    expect(window.localStorage.getItem('cla-language')).toBe('fr');
  });
});
