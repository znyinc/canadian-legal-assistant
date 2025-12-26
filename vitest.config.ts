import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: [
      'tests/integration/matterPersistence.test.ts',
      'tests/integration/matterPillarField.test.ts',
      'tests/serverApp.test.ts'
    ]
  }
});
