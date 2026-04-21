import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { getProviderSettingsSnapshot, updateProviderSettings } from '../services/providerSettingsService.js';

const router = Router();

const providerSettingsSchema = z.object({
  canliiApiKey: z.string().optional(),
  liteLlmBaseUrl: z.string().optional(),
  liteLlmApiKey: z.string().optional(),
  liteLlmFastProvider: z.string().optional(),
  liteLlmSmartProvider: z.string().optional(),
  liteLlmFastModel: z.string().optional(),
  liteLlmSmartModel: z.string().optional(),
  openaiApiKey: z.string().optional(),
  openaiBaseUrl: z.string().optional(),
  openaiFastModel: z.string().optional(),
  openaiSmartModel: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  anthropicBaseUrl: z.string().optional(),
  claudeFastModel: z.string().optional(),
  claudeSmartModel: z.string().optional(),
  geminiApiKey: z.string().optional(),
  geminiBaseUrl: z.string().optional(),
  geminiFastModel: z.string().optional(),
  geminiSmartModel: z.string().optional(),
  ollamaBaseUrl: z.string().optional(),
  ollamaFastModel: z.string().optional(),
  ollamaSmartModel: z.string().optional(),
});

router.get('/providers', async (_req: Request, res: Response) => {
  if (!config.allowRuntimeEnvEditing) {
    res.status(403).json({ error: 'Runtime provider settings editing is disabled.' });
    return;
  }

  const snapshot = await getProviderSettingsSnapshot();
  res.json(snapshot);
});

router.put('/providers', async (req: Request, res: Response) => {
  if (!config.allowRuntimeEnvEditing) {
    res.status(403).json({ error: 'Runtime provider settings editing is disabled.' });
    return;
  }

  const parsed = providerSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation error', details: parsed.error.errors });
    return;
  }

  const snapshot = await updateProviderSettings(parsed.data);
  res.json(snapshot);
});

export default router;