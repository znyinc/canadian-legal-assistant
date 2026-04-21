import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file — override shell env vars so .env is authoritative
dotenvConfig({ path: path.join(__dirname, '..', '.env'), override: true });

function buildConfig() {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // API security
    apiKeyEnabled: process.env.API_KEY_ENABLED === 'true',
    apiKey: process.env.API_KEY || '',
    
    // CORS
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    
    // File storage
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    
    // CanLII API
    canliiApiKey: process.env.CANLII_API_KEY || '',

    // Local runtime editing for env-backed provider settings
    allowRuntimeEnvEditing: process.env.ALLOW_RUNTIME_ENV_EDITING === 'true',

    // LLM feature flag — auto-enabled when any provider API key is present
    nuanceLlmEnabled:
      process.env.NUANCE_LLM_ENABLED === 'true' ||
      !!(
        process.env.LITELLM_BASE_URL ||
        process.env.ANTHROPIC_API_KEY ||
        process.env.OPENAI_API_KEY ||
        process.env.GEMINI_API_KEY
      ),
    nuanceLlmModel: process.env.NUANCE_LLM_MODEL ?? 'qwen2.5:32b',
    // Kept for backward compatibility — new code should use openaiApiKey / ModelRouter
    nuanceLlmApiKey: process.env.OPENAI_API_KEY ?? '',
    nuanceLlmBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',

    // LiteLLM proxy configuration
    liteLlmBaseUrl: process.env.LITELLM_BASE_URL ?? '',
    liteLlmApiKey: process.env.LITELLM_API_KEY ?? '',

    // Optional semantic search through the BYOK semantic-router/LiteLLM embeddings path
    semanticSearchEnabled: process.env.SEMANTIC_SEARCH_ENABLED === 'true',
    semanticSearchBaseUrl: process.env.SEMANTIC_SEARCH_BASE_URL ?? '',
    semanticSearchApiKey: process.env.SEMANTIC_SEARCH_API_KEY ?? '',
    semanticSearchEmbeddingModel: process.env.SEMANTIC_SEARCH_EMBEDDING_MODEL ?? 'embedding',
    semanticSearchMinScore: parseFloat(process.env.SEMANTIC_SEARCH_MIN_SCORE ?? '0.25'),

    // Multi-model router keys
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  };
}

export const config = buildConfig();

export function reloadRuntimeConfig() {
  Object.assign(config, buildConfig());
  return config;
}
