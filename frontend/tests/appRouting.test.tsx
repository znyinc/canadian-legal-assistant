/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../src/components/LanguageToggle', () => ({
  LanguageToggle: () => <div>Language Toggle</div>,
}));

vi.mock('../src/pages/HomePage', () => ({
  default: () => <div>Home Page</div>,
}));

vi.mock('../src/pages/NuanceChatPage', () => ({
  default: () => <div>Semantic Intake Page</div>,
}));

vi.mock('../src/pages/MatterDetailPage', () => ({
  default: () => <div>Matter Detail Page</div>,
}));

vi.mock('../src/pages/CaseLawPage', () => ({
  CaseLawPage: () => <div>Case Law Page</div>,
}));

vi.mock('../src/pages/SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}));

import App from '../src/App';

describe('App intake routing', () => {
  it('renders semantic intake at /matters/new', () => {
    render(
      <MemoryRouter initialEntries={['/matters/new']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Semantic Intake Page')).toBeInTheDocument();
  });

  it('redirects the removed structured review route to semantic intake', () => {
    render(
      <MemoryRouter initialEntries={['/matters/new/review']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Semantic Intake Page')).toBeInTheDocument();
  });

  it('redirects the app root away from the legacy structured intake', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText('Semantic Intake Page')).toBeInTheDocument();
  });
});
