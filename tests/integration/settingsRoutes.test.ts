import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

vi.mock('../../backend/src/config', () => {
  const config = {
    port: 3001,
    nodeEnv: 'test',
    apiKeyEnabled: false,
    apiKey: '',
    corsOrigin: 'http://localhost:5173',
    uploadDir: './uploads',
    maxFileSize: 10485760,
    canliiApiKey: '',
    allowRuntimeEnvEditing: true,
    nuanceLlmEnabled: false,
    nuanceLlmModel: 'qwen2.5:32b',
    nuanceLlmApiKey: '',
    nuanceLlmBaseUrl: 'http://localhost:11434',
    liteLlmBaseUrl: 'http://localhost:4000',
    liteLlmApiKey: '',
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    ollamaBaseUrl: 'http://localhost:11434',
  };

  return {
    config,
    reloadRuntimeConfig: () => config,
  };
});

import { createApp } from '../../backend/src/server';

describe('Settings routes integration', () => {
  let envDir: string;
  let envPath: string;

  beforeEach(async () => {
    envDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cla-settings-'));
    envPath = path.join(envDir, '.env');
    await fs.writeFile(
      envPath,
      [
        'ALLOW_RUNTIME_ENV_EDITING=true',
        'LITELLM_BASE_URL=http://localhost:4000',
        'LITELLM_API_KEY=',
        'LITELLM_FAST_PROVIDER=auto',
        'LITELLM_SMART_PROVIDER=auto',
        'LITELLM_FAST_MODEL=litellm-fast',
        'LITELLM_SMART_MODEL=litellm-smart',
        'OPENAI_API_KEY=',
        'OPENAI_BASE_URL=https://api.openai.com/v1',
        'OPENAI_FAST_MODEL=gpt-4.1-nano',
        'OPENAI_SMART_MODEL=gpt-4.1-mini',
        'ANTHROPIC_API_KEY=',
        'ANTHROPIC_BASE_URL=https://api.anthropic.com/v1',
        'CLAUDE_FAST_MODEL=claude-haiku-4-5',
        'CLAUDE_SMART_MODEL=claude-haiku-4-5',
        'GEMINI_API_KEY=',
        'GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta',
        'GEMINI_FAST_MODEL=gemini-2.5-flash-lite',
        'GEMINI_SMART_MODEL=gemini-2.5-flash',
        'OLLAMA_BASE_URL=http://localhost:11434',
        'OLLAMA_FAST_MODEL=llama3:latest',
        'OLLAMA_SMART_MODEL=llama3:latest',
        'CANLII_API_KEY=',
      ].join('\n'),
      'utf8'
    );
    process.env.RUNTIME_SETTINGS_ENV_PATH = envPath;
  });

  afterEach(async () => {
    delete process.env.RUNTIME_SETTINGS_ENV_PATH;
    await fs.rm(envDir, { recursive: true, force: true });
  });

  it('returns provider settings status from the env file', async () => {
    const app = createApp();

    const response = await request(app).get('/api/settings/providers');

    expect(response.status).toBe(200);
    expect(response.body.runtimeEditingEnabled).toBe(true);
    expect(response.body.values.liteLlmBaseUrl).toBe('http://localhost:4000');
    expect(response.body.values.liteLlmFastProvider).toBe('auto');
    expect(response.body.values.liteLlmSmartProvider).toBe('auto');
    expect(response.body.values.openaiApiKeySet).toBe(false);
    expect(response.body.values.geminiFastModel).toBe('gemini-2.5-flash-lite');
  });

  it('updates provider settings and rewrites the env file', async () => {
    const app = createApp();

    const response = await request(app)
      .put('/api/settings/providers')
      .send({
        liteLlmBaseUrl: 'http://localhost:4100',
        liteLlmApiKey: 'proxy-key-123',
        liteLlmFastProvider: 'anthropic',
        liteLlmSmartProvider: 'gemini',
        openaiApiKey: 'openai-key-456',
        openaiSmartModel: 'gpt-5.4-mini',
        geminiFastModel: 'gemini-2.5-flash-lite',
      });

    expect(response.status).toBe(200);
    expect(response.body.values.liteLlmBaseUrl).toBe('http://localhost:4100');
    expect(response.body.values.liteLlmApiKeySet).toBe(true);
    expect(response.body.values.liteLlmFastProvider).toBe('anthropic');
    expect(response.body.values.liteLlmSmartProvider).toBe('gemini');
    expect(response.body.values.openaiApiKeySet).toBe(true);
    expect(response.body.values.openaiSmartModel).toBe('gpt-5.4-mini');
    expect(response.body.values.geminiFastModel).toBe('gemini-2.5-flash-lite');

    const persisted = await fs.readFile(envPath, 'utf8');
    expect(persisted).toContain('LITELLM_BASE_URL=http://localhost:4100');
    expect(persisted).toContain('LITELLM_API_KEY=proxy-key-123');
    expect(persisted).toContain('LITELLM_FAST_PROVIDER=anthropic');
    expect(persisted).toContain('LITELLM_SMART_PROVIDER=gemini');
    expect(persisted).toContain('OPENAI_API_KEY=openai-key-456');
    expect(persisted).toContain('OPENAI_SMART_MODEL=gpt-5.4-mini');
    expect(persisted).toContain('GEMINI_FAST_MODEL=gemini-2.5-flash-lite');
  });
});