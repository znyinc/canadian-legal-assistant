import { config } from '../config.js';
import { getModelRouter, TaskType } from '../core/router/ModelRouter.js';

type AllowedDomain =
  | 'insurance'
  | 'civil-negligence'
  | 'criminal'
  | 'employment'
  | 'landlordTenant'
  | 'legalMalpractice'
  | 'consumerProtection'
  | 'municipalPropertyDamage'
  | 'estateSuccession'
  | 'other';

export interface NuanceFallbackContext {
  domain: AllowedDomain;
  jurisdiction: string;
  urgency?: 'low' | 'medium' | 'high';
  confidence: number;
  scenarioType: string;
  incidentSummary: string;
  likelyTrack: string;
  remediationPattern: string;
  missingFacts: string[];
  evidenceChecklist: string[];
  alternativeDomains: Array<{ domain: string; confidence: number; reasoning: string }>;
}

export interface NuanceExtractionResult {
  source: 'llm' | 'fallback';
  model?: string;
  assistantMessage: string;
  context: NuanceFallbackContext & {
    source: 'llm' | 'fallback';
    model?: string;
    readyToImport: boolean;
    importPayload: {
      description: string;
      domain?: string;
      jurisdiction?: string;
      urgency?: 'low' | 'medium' | 'high';
    };
  };
}

const allowedDomains = new Set<AllowedDomain>([
  'insurance',
  'civil-negligence',
  'criminal',
  'employment',
  'landlordTenant',
  'legalMalpractice',
  'consumerProtection',
  'municipalPropertyDamage',
  'estateSuccession',
  'other',
]);

function normalizeJsonContent(content: unknown): string | null {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts = content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item && typeof item === 'object' && 'text' in item && typeof (item as { text?: unknown }).text === 'string') {
          return (item as { text: string }).text;
        }

        return '';
      })
      .filter(Boolean);

    return textParts.length > 0 ? textParts.join('\n') : null;
  }

  return null;
}

function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function sanitizeStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);

  return items.length > 0 ? items : fallback;
}

function sanitizeAlternativeDomains(
  value: unknown,
  fallback: Array<{ domain: string; confidence: number; reasoning: string }>
): Array<{ domain: string; confidence: number; reasoning: string }> {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const domain = typeof (item as { domain?: unknown }).domain === 'string' ? (item as { domain: string }).domain : '';
      const confidence = typeof (item as { confidence?: unknown }).confidence === 'number' ? (item as { confidence: number }).confidence : 0;
      const reasoning = typeof (item as { reasoning?: unknown }).reasoning === 'string' ? (item as { reasoning: string }).reasoning : '';

      return domain ? { domain, confidence, reasoning } : null;
    })
    .filter((item): item is { domain: string; confidence: number; reasoning: string } => Boolean(item))
    .slice(0, 3);

  return cleaned.length > 0 ? cleaned : fallback;
}

export class NuanceExtractor {
  async extract(fullText: string, fallback: NuanceFallbackContext): Promise<NuanceExtractionResult | null> {
    if (!config.nuanceLlmEnabled) {
      return null;
    }

    try {
      const router = getModelRouter();
      const llmResponse = await router.route({
        taskType: TaskType.PLAIN_LANGUAGE,
        temperature: 0.2,
        responseFormat: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              'You extract structured legal-intake nuance for a Canadian legal information assistant.',
              'You must not provide legal advice or strategy.',
              'Return JSON only.',
              'Use the fallback context as a safety rail, but improve the wording and nuance if the facts support it.',
              'Allowed domains: insurance, civil-negligence, criminal, employment, landlordTenant, legalMalpractice, consumerProtection, municipalPropertyDamage, estateSuccession, other.',
              'Schema:',
              '{',
              '  "assistantMessage": string,',
              '  "incidentSummary": string,',
              '  "domain": string,',
              '  "jurisdiction": string,',
              '  "urgency": "low" | "medium" | "high",',
              '  "scenarioType": string,',
              '  "likelyTrack": string,',
              '  "remediationPattern": string,',
              '  "missingFacts": string[],',
              '  "evidenceChecklist": string[],',
              '  "alternativeDomains": [{ "domain": string, "confidence": number, "reasoning": string }],',
              '  "readyToImport": boolean',
              '}',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify({
              incidentText: fullText,
              fallback,
            }),
          },
        ],
      });

      const rawContent = normalizeJsonContent(llmResponse.content);
      if (!rawContent) {
        return null;
      }

      const jsonContent = extractJsonObject(rawContent);
      if (!jsonContent) {
        return null;
      }

      const parsed = JSON.parse(jsonContent) as Record<string, unknown>;
      const suggestedDomain = typeof parsed.domain === 'string' && allowedDomains.has(parsed.domain as AllowedDomain)
        ? parsed.domain as AllowedDomain
        : fallback.domain;
      const suggestedJurisdiction = typeof parsed.jurisdiction === 'string' && parsed.jurisdiction.trim()
        ? parsed.jurisdiction.trim()
        : fallback.jurisdiction;
      const suggestedUrgency = parsed.urgency === 'low' || parsed.urgency === 'medium' || parsed.urgency === 'high'
        ? parsed.urgency
        : fallback.urgency;
      const incidentSummary = typeof parsed.incidentSummary === 'string' && parsed.incidentSummary.trim()
        ? parsed.incidentSummary.trim()
        : fallback.incidentSummary;
      const likelyTrack = typeof parsed.likelyTrack === 'string' && parsed.likelyTrack.trim()
        ? parsed.likelyTrack.trim()
        : fallback.likelyTrack;
      const remediationPattern = typeof parsed.remediationPattern === 'string' && parsed.remediationPattern.trim()
        ? parsed.remediationPattern.trim()
        : fallback.remediationPattern;
      const assistantMessage = typeof parsed.assistantMessage === 'string' && parsed.assistantMessage.trim()
        ? parsed.assistantMessage.trim()
        : 'I refined the intake summary and likely track based on the details you shared.';

      return {
        source: 'llm',
        model: llmResponse.model,
        assistantMessage,
        context: {
          confidence: fallback.confidence,
          domain: suggestedDomain,
          jurisdiction: suggestedJurisdiction,
          urgency: suggestedUrgency,
          scenarioType: typeof parsed.scenarioType === 'string' && parsed.scenarioType.trim()
            ? parsed.scenarioType.trim()
            : fallback.scenarioType,
          incidentSummary,
          likelyTrack,
          remediationPattern,
          source: 'llm',
          model: llmResponse.model,
          missingFacts: sanitizeStringArray(parsed.missingFacts, fallback.missingFacts),
          evidenceChecklist: sanitizeStringArray(parsed.evidenceChecklist, fallback.evidenceChecklist),
          alternativeDomains: sanitizeAlternativeDomains(parsed.alternativeDomains, fallback.alternativeDomains),
          readyToImport: typeof parsed.readyToImport === 'boolean' ? parsed.readyToImport : true,
          importPayload: {
            description: incidentSummary,
            domain: suggestedDomain,
            jurisdiction: suggestedJurisdiction,
            urgency: suggestedUrgency,
          },
        },
      };
    } catch {
      return null;
    }
  }
}