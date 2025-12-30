import { describe, it, expect } from 'vitest';
import { TemplateLibrary } from '../src/core/templates/TemplateLibrary';

describe('Estate & Succession templates', () => {
  const library = new TemplateLibrary();

  it('renders will challenge grounds template', () => {
    const content = library.renderTemplate('estate/will_challenge_grounds', {});
    expect(content).toContain('Will Challenge Grounds');
    expect(content.toLowerCase()).toContain('undue influence');
    expect(content.toLowerCase()).toContain('testamentary capacity');
  });

  it('renders dependant support procedure with 6-month reminder', () => {
    const content = library.renderTemplate('estate/dependant_support_procedure', {});
    expect(content).toContain('6 months');
    expect(content).toContain('Succession Law Reform Act');
  });
});
