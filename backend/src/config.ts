import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API security
  apiKeyEnabled: process.env.API_KEY_ENABLED === 'true',
  apiKey: process.env.API_KEY || '',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // File storage
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB default
  
  // CanLII API
  canliiApiKey: process.env.CANLII_API_KEY || '',

  // LLM feature flag (opt-in nuance extraction)
  nuanceLlmEnabled: process.env.NUANCE_LLM_ENABLED === 'true',
  nuanceLlmModel: process.env.NUANCE_LLM_MODEL ?? 'gpt-4o-mini',
  // Kept for backward compatibility — new code should use openaiApiKey / ModelRouter
  nuanceLlmApiKey: process.env.OPENAI_API_KEY ?? '',
  nuanceLlmBaseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',

  // Multi-model router keys
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
};
