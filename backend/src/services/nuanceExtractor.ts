import { config } from '../config.js';
import { getModelRouter, TaskType } from '../core/router/ModelRouter.js';
import type { RouteDecision } from '../core/router/ModelRoute.js';

type AllowedDomain =
  | 'insurance'
  | 'civil-negligence'
  | 'criminal'
  | 'employment'
  | 'landlordTenant'
  | 'humanRights'
  | 'legalMalpractice'
  | 'consumerProtection'
  | 'municipalPropertyDamage'
  | 'ocppFiling'
  | 'tree-damage'
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
  directAnswer: string;
  immediateActions: string[];
  escalationCriteria: string[];
  singleNextQuestion?: string;
  conciseDisclaimer: string;
  alternativeDomains: Array<{ domain: string; confidence: number; reasoning: string }>;
}

export interface NuanceExtractionResult {
  source: 'llm' | 'fallback';
  model?: string;
  assistantMessage: string;
  context: NuanceFallbackContext & {
    source: 'llm' | 'fallback';
    model?: string;
    routeDecision?: RouteDecision;
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
  'humanRights',
  'legalMalpractice',
  'consumerProtection',
  'municipalPropertyDamage',
  'ocppFiling',
  'tree-damage',
  'estateSuccession',
  'other',
]);

function sanitizeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function sanitizeOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

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

function deriveAmbiguityScore(alternatives: Array<{ confidence: number }>): number {
  if (alternatives.length === 0) {
    return 0;
  }

  const highestAlternative = Math.max(...alternatives.map((item) => item.confidence));
  return Math.min(1, Math.max(0, highestAlternative / 100));
}

function deriveComplexityScore(fullText: string, fallback: NuanceFallbackContext): number {
  const lower = fullText.toLowerCase();
  let score = 0;

  if (fullText.length >= 450) score += 0.2;
  if (fullText.length >= 800) score += 0.1;
  if (fallback.alternativeDomains.length >= 1) score += 0.15;
  if (fallback.alternativeDomains.length >= 2) score += 0.1;
  if (fallback.missingFacts.length >= 3) score += 0.1;
  if ((fullText.match(/\b(and|but|while|because|after|before|then|also)\b/g) || []).length >= 6) score += 0.1;
  if ((fullText.match(/\b\d{4}-\d{2}-\d{2}\b/g) || []).length >= 2) score += 0.1;
  if ((fullText.match(/\$/g) || []).length >= 1) score += 0.05;
  if (['lawyer', 'insurer', 'landlord', 'employer', 'police', 'municipality', 'court', 'tribunal'].filter((token) => lower.includes(token)).length >= 3) {
    score += 0.1;
  }

  return Math.min(1, score);
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
        routeContext: {
          confidence: fallback.confidence,
          ambiguity: deriveAmbiguityScore(fallback.alternativeDomains),
          complexityScore: deriveComplexityScore(fullText, fallback),
          urgency: fallback.urgency,
          latencyBudgetMs: fallback.urgency === 'high' ? 2000 : 4500,
        },
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
              '  "directAnswer": string,',
              '  "immediateActions": string[],',
              '  "escalationCriteria": string[],',
              '  "singleNextQuestion": string,',
              '  "conciseDisclaimer": string,',
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
        : fallback.directAnswer;

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
          routeDecision: llmResponse.routeDecision,
          missingFacts: sanitizeStringArray(parsed.missingFacts, fallback.missingFacts),
          evidenceChecklist: sanitizeStringArray(parsed.evidenceChecklist, fallback.evidenceChecklist),
          directAnswer: sanitizeString(parsed.directAnswer, fallback.directAnswer),
          immediateActions: sanitizeStringArray(parsed.immediateActions, fallback.immediateActions),
          escalationCriteria: sanitizeStringArray(parsed.escalationCriteria, fallback.escalationCriteria),
          singleNextQuestion: sanitizeOptionalString(parsed.singleNextQuestion) ?? fallback.singleNextQuestion,
          conciseDisclaimer: sanitizeString(parsed.conciseDisclaimer, fallback.conciseDisclaimer),
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