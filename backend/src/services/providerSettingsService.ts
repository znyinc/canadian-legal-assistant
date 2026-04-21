import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'dotenv';
import { config, reloadRuntimeConfig } from '../config.js';
import { refreshRouterRuntimeConfig } from '../core/router/RouterConfig.js';
import { _resetModelRouter } from '../core/router/ModelRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_KEYS = {
  allowRuntimeEnvEditing: 'ALLOW_RUNTIME_ENV_EDITING',
  canliiApiKey: 'CANLII_API_KEY',
  liteLlmBaseUrl: 'LITELLM_BASE_URL',
  liteLlmApiKey: 'LITELLM_API_KEY',
  liteLlmFastProvider: 'LITELLM_FAST_PROVIDER',
  liteLlmSmartProvider: 'LITELLM_SMART_PROVIDER',
  liteLlmFastModel: 'LITELLM_FAST_MODEL',
  liteLlmSmartModel: 'LITELLM_SMART_MODEL',
  openaiApiKey: 'OPENAI_API_KEY',
  openaiBaseUrl: 'OPENAI_BASE_URL',
  openaiFastModel: 'OPENAI_FAST_MODEL',
  openaiSmartModel: 'OPENAI_SMART_MODEL',
  anthropicApiKey: 'ANTHROPIC_API_KEY',
  anthropicBaseUrl: 'ANTHROPIC_BASE_URL',
  claudeFastModel: 'CLAUDE_FAST_MODEL',
  claudeSmartModel: 'CLAUDE_SMART_MODEL',
  geminiApiKey: 'GEMINI_API_KEY',
  geminiBaseUrl: 'GEMINI_BASE_URL',
  geminiFastModel: 'GEMINI_FAST_MODEL',
  geminiSmartModel: 'GEMINI_SMART_MODEL',
  ollamaBaseUrl: 'OLLAMA_BASE_URL',
  ollamaFastModel: 'OLLAMA_FAST_MODEL',
  ollamaSmartModel: 'OLLAMA_SMART_MODEL',
} as const;

const SECRET_FIELDS = new Set([
  'canliiApiKey',
  'liteLlmApiKey',
  'openaiApiKey',
  'anthropicApiKey',
  'geminiApiKey',
]);

export interface ProviderSettingsSnapshot {
  runtimeEditingEnabled: boolean;
  sourceFile: string;
  values: {
    liteLlmBaseUrl: string;
    liteLlmApiKeySet: boolean;
    liteLlmFastProvider: string;
    liteLlmSmartProvider: string;
    liteLlmFastModel: string;
    liteLlmSmartModel: string;
    openaiApiKeySet: boolean;
    openaiBaseUrl: string;
    openaiFastModel: string;
    openaiSmartModel: string;
    anthropicApiKeySet: boolean;
    anthropicBaseUrl: string;
    claudeFastModel: string;
    claudeSmartModel: string;
    geminiApiKeySet: boolean;
    geminiBaseUrl: string;
    geminiFastModel: string;
    geminiSmartModel: string;
    ollamaBaseUrl: string;
    ollamaFastModel: string;
    ollamaSmartModel: string;
    canliiApiKeySet: boolean;
  };
}

export interface ProviderSettingsUpdate {
  canliiApiKey?: string;
  liteLlmBaseUrl?: string;
  liteLlmApiKey?: string;
  liteLlmFastProvider?: string;
  liteLlmSmartProvider?: string;
  liteLlmFastModel?: string;
  liteLlmSmartModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiFastModel?: string;
  openaiSmartModel?: string;
  anthropicApiKey?: string;
  anthropicBaseUrl?: string;
  claudeFastModel?: string;
  claudeSmartModel?: string;
  geminiApiKey?: string;
  geminiBaseUrl?: string;
  geminiFastModel?: string;
  geminiSmartModel?: string;
  ollamaBaseUrl?: string;
  ollamaFastModel?: string;
  ollamaSmartModel?: string;
}

function getEnvFilePath(): string {
  return process.env.RUNTIME_SETTINGS_ENV_PATH || path.join(__dirname, '..', '..', '.env');
}

function serializeEnvValue(value: string): string {
  if (value === '') {
    return '';
  }

  if (/[\s#"]/u.test(value)) {
    return JSON.stringify(value);
  }

  return value;
}

async function readEnvFile(): Promise<{ path: string; content: string; parsed: Record<string, string> }> {
  const envPath = getEnvFilePath();
  const content = await fs.readFile(envPath, 'utf8');
  return {
    path: envPath,
    content,
    parsed: parse(content),
  };
}

function isSecretSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export async function getProviderSettingsSnapshot(): Promise<ProviderSettingsSnapshot> {
  const envFile = await readEnvFile();
  const env = envFile.parsed;

  return {
    runtimeEditingEnabled: config.allowRuntimeEnvEditing,
    sourceFile: path.basename(envFile.path),
    values: {
      liteLlmBaseUrl: env[ENV_KEYS.liteLlmBaseUrl] ?? '',
      liteLlmApiKeySet: isSecretSet(env[ENV_KEYS.liteLlmApiKey]),
      liteLlmFastProvider: env[ENV_KEYS.liteLlmFastProvider] || 'auto',
      liteLlmSmartProvider: env[ENV_KEYS.liteLlmSmartProvider] || 'auto',
      liteLlmFastModel: env[ENV_KEYS.liteLlmFastModel] ?? 'litellm-fast',
      liteLlmSmartModel: env[ENV_KEYS.liteLlmSmartModel] ?? 'litellm-smart',
      openaiApiKeySet: isSecretSet(env[ENV_KEYS.openaiApiKey]),
      openaiBaseUrl: env[ENV_KEYS.openaiBaseUrl] ?? 'https://api.openai.com/v1',
      openaiFastModel: env[ENV_KEYS.openaiFastModel] ?? 'gpt-4.1-nano',
      openaiSmartModel: env[ENV_KEYS.openaiSmartModel] ?? 'gpt-4.1-mini',
      anthropicApiKeySet: isSecretSet(env[ENV_KEYS.anthropicApiKey]),
      anthropicBaseUrl: env[ENV_KEYS.anthropicBaseUrl] ?? 'https://api.anthropic.com/v1',
      claudeFastModel: env[ENV_KEYS.claudeFastModel] ?? 'claude-haiku-4-5',
      claudeSmartModel: env[ENV_KEYS.claudeSmartModel] ?? 'claude-haiku-4-5',
      geminiApiKeySet: isSecretSet(env[ENV_KEYS.geminiApiKey]),
      geminiBaseUrl: env[ENV_KEYS.geminiBaseUrl] ?? 'https://generativelanguage.googleapis.com/v1beta',
      geminiFastModel: env[ENV_KEYS.geminiFastModel] ?? 'gemini-2.5-flash-lite',
      geminiSmartModel: env[ENV_KEYS.geminiSmartModel] ?? 'gemini-2.5-flash',
      ollamaBaseUrl: env[ENV_KEYS.ollamaBaseUrl] ?? 'http://localhost:11434',
      ollamaFastModel: env[ENV_KEYS.ollamaFastModel] ?? 'llama3:latest',
      ollamaSmartModel: env[ENV_KEYS.ollamaSmartModel] ?? 'llama3:latest',
      canliiApiKeySet: isSecretSet(env[ENV_KEYS.canliiApiKey]),
    },
  };
}

export async function updateProviderSettings(input: ProviderSettingsUpdate): Promise<ProviderSettingsSnapshot> {
  const envFile = await readEnvFile();
  const current = { ...envFile.parsed };

  const nextByField: Record<string, string | undefined> = {
    canliiApiKey: input.canliiApiKey,
    liteLlmBaseUrl: input.liteLlmBaseUrl,
    liteLlmApiKey: input.liteLlmApiKey,
    liteLlmFastProvider: input.liteLlmFastProvider,
    liteLlmSmartProvider: input.liteLlmSmartProvider,
    liteLlmFastModel: input.liteLlmFastModel,
    liteLlmSmartModel: input.liteLlmSmartModel,
    openaiApiKey: input.openaiApiKey,
    openaiBaseUrl: input.openaiBaseUrl,
    openaiFastModel: input.openaiFastModel,
    openaiSmartModel: input.openaiSmartModel,
    anthropicApiKey: input.anthropicApiKey,
    anthropicBaseUrl: input.anthropicBaseUrl,
    claudeFastModel: input.claudeFastModel,
    claudeSmartModel: input.claudeSmartModel,
    geminiApiKey: input.geminiApiKey,
    geminiBaseUrl: input.geminiBaseUrl,
    geminiFastModel: input.geminiFastModel,
    geminiSmartModel: input.geminiSmartModel,
    ollamaBaseUrl: input.ollamaBaseUrl,
    ollamaFastModel: input.ollamaFastModel,
    ollamaSmartModel: input.ollamaSmartModel,
  };

  for (const [field, envKey] of Object.entries(ENV_KEYS)) {
    if (field === 'allowRuntimeEnvEditing') {
      current[envKey] = current[envKey] ?? (config.allowRuntimeEnvEditing ? 'true' : 'false');
      continue;
    }

    const incoming = nextByField[field];
    if (incoming === undefined) {
      continue;
    }

    if (SECRET_FIELDS.has(field)) {
      if (incoming.trim().length > 0) {
        current[envKey] = incoming.trim();
      }
      continue;
    }

    current[envKey] = incoming.trim();
  }

  const originalLines = envFile.content.split(/\r?\n/u);
  const updatedKeys = new Set<string>();

  const rewrittenLines = originalLines.map((line) => {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=/u);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!(key in current)) {
      return line;
    }

    updatedKeys.add(key);
    return `${key}=${serializeEnvValue(current[key] ?? '')}`;
  });

  for (const [key, value] of Object.entries(current)) {
    if (!updatedKeys.has(key)) {
      rewrittenLines.push(`${key}=${serializeEnvValue(value ?? '')}`);
    }
  }

  await fs.writeFile(envFile.path, rewrittenLines.join('\n'), 'utf8');

  for (const [key, value] of Object.entries(current)) {
    process.env[key] = value;
  }

  reloadRuntimeConfig();
  refreshRouterRuntimeConfig();
  _resetModelRouter();

  return getProviderSettingsSnapshot();
}