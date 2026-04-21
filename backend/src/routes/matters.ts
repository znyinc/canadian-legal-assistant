import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';
import { ConversationalOrchestrator } from '../services/conversationalOrchestrator.js';
import { MatterClassifier } from '../../../src/core/triage/MatterClassifier.js';

const router = Router();
// Use IntegrationAPI instance attached to app.locals when available
function getApi(req: Request) {
  return ((req.app as any).locals.integrationApi as IntegrationAPI) ?? new IntegrationAPI();
}

const preflightOrchestrator = new ConversationalOrchestrator(new MatterClassifier());

const CREATE_MATTER_DOMAINS = [
  'criminal',
  'insurance',
  'landlordTenant',
  'employment',
  'civilNegligence',
  'civil',
  'municipalPropertyDamage',
  'consumerProtection',
  'humanRights',
  'ocppFiling',
  'family',
  'legalMalpractice',
  'estateSuccession',
  'other',
] as const;

type CreateMatterDomain = (typeof CREATE_MATTER_DOMAINS)[number];

function normalizeCreateMatterDomain(domain?: string): CreateMatterDomain {
  if (!domain) return 'other';

  const normalized = domain.trim();
  if ((CREATE_MATTER_DOMAINS as readonly string[]).includes(normalized)) {
    return normalized as CreateMatterDomain;
  }

  const lowered = normalized.toLowerCase();
  const aliasMap: Record<string, CreateMatterDomain> = {
    'civil-negligence': 'civilNegligence',
    civilnegligence: 'civilNegligence',
    'landlord-tenant': 'landlordTenant',
    landlordtenant: 'landlordTenant',
    'municipal-property-damage': 'municipalPropertyDamage',
    municipalpropertydamage: 'municipalPropertyDamage',
    'consumer-protection': 'consumerProtection',
    consumerprotection: 'consumerProtection',
    'human-rights': 'humanRights',
    humanrights: 'humanRights',
    ocppfiling: 'ocppFiling',
    legalmalpractice: 'legalMalpractice',
    'estate-succession': 'estateSuccession',
    estatesuccession: 'estateSuccession',
  };

  return aliasMap[lowered] || 'other';
}

function getSemanticAnalyzerHandoff(structuredAnswers?: any[]) {
  return (structuredAnswers || []).find((answer) => answer?.kind === 'semantic-analyzer-import');
}

function buildSemanticForumMap(domain: string, jurisdiction: string, handoffData?: Record<string, any>) {
  const normalizedDomain = normalizeCreateMatterDomain(domain);
  const inOntario = jurisdiction === 'ON' || jurisdiction.toLowerCase().includes('ontario');
  const forumByDomain: Record<string, { id: string; name: string; type: 'court' | 'tribunal' | 'regulator' }> = {
    employment: { id: 'ON-MOL', name: 'Ministry of Labour / court pathway to confirm', type: 'regulator' },
    landlordTenant: { id: 'ON-LTB', name: 'Landlord and Tenant Board', type: 'tribunal' },
    criminal: { id: 'ON-OCJ', name: 'Ontario Court of Justice', type: 'court' },
    insurance: { id: 'ON-FSRA', name: 'Insurer process / FSRA pathway to confirm', type: 'regulator' },
    humanRights: { id: 'ON-HRTO', name: 'Human Rights Tribunal of Ontario', type: 'tribunal' },
    municipalPropertyDamage: { id: 'ON-SCJ', name: 'Ontario court pathway to confirm', type: 'court' },
    civilNegligence: { id: 'ON-SCJ', name: 'Small Claims Court or Superior Court to confirm', type: 'court' },
    civil: { id: 'ON-SCJ', name: 'Small Claims Court or Superior Court to confirm', type: 'court' },
  };
  const primary = forumByDomain[normalizedDomain] || { id: 'FORUM-TBD', name: 'Forum to confirm from analyzer output', type: 'court' as const };

  return {
    domain: normalizedDomain,
    primaryForum: {
      ...primary,
      jurisdiction: inOntario ? 'Ontario' : jurisdiction,
    },
    alternatives: [],
    escalation: [],
    rationale: handoffData?.likelyTrack || 'Created from semantic analyzer output; confirm the forum before filing.',
  };
}

// Validation schemas
const createMatterSchema = z.object({
  description: z.string().min(10),
  province: z.string().default('ON'),
  domain: z.enum(CREATE_MATTER_DOMAINS),
  disputeAmount: z
    .preprocess((v) => {
      if (v === '' || v === undefined) return null;
      if (v === null) return null;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed === '') return null;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : v;
      }
      return v;
    }, z.number().nullable().optional()),
  timeline: z.object({
    keyDates: z.array(z.object({
      date: z.string().transform(str => new Date(str)),
      event: z.string(),
    })).optional(),
  }).optional(),
  structuredAnswers: z.array(z.any()).optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const preflightMatterSchema = z.object({
  description: z.string().min(25),
  province: z.string().default('ON'),
  domain: z.string().optional(),
  disputeAmount: z
    .preprocess((v) => {
      if (v === '' || v === undefined) return null;
      if (v === null) return null;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed === '') return null;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : v;
      }
      return v;
    }, z.number().nullable().optional()),
});

const classifyMatterSchema = z.object({
  description: z.string(),
  province: z.string().default('ON'),
  domain: z.string(),
  disputeAmount: z
    .preprocess((v) => {
      if (v === '' || v === undefined) return null;
      if (v === null) return null;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (trimmed === '') return null;
        const num = Number(trimmed);
        return Number.isFinite(num) ? num : v;
      }
      return v;
    }, z.number().nullable().optional()),
  timeline: z.any().optional(),
});

router.post('/preflight', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = preflightMatterSchema.parse(req.body);
    const preflight = await preflightOrchestrator.processNuanceRespond(data.description, []);

    const suggestedDomain = normalizeCreateMatterDomain(
      preflight.context?.domain || data.domain || 'other'
    );

    res.json({
      description: data.description,
      summary: preflight.context?.incidentSummary || data.description,
      domain: suggestedDomain,
      jurisdiction: preflight.context?.jurisdiction || data.province,
      urgency: preflight.context?.urgency || 'medium',
      confidence: preflight.context?.confidence || 0,
      source: preflight.context?.source || 'fallback',
      model: preflight.context?.model,
      routeDecision: preflight.context?.routeDecision,
      directAnswer: preflight.context?.directAnswer,
      likelyTrack: preflight.context?.likelyTrack,
      evidenceChecklist: preflight.context?.evidenceChecklist || [],
      reviewRecommended: (preflight.context?.confidence || 0) < 75,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    next(error);
  }
});

// POST /api/matters - Create new matter
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createMatterSchema.parse(req.body);

    // Create matter with initial domain
    let matter = await prisma.matter.create({
      data: {
        description: data.description,
        province: data.province,
        domain: data.domain,
        disputeAmount: data.disputeAmount,
        metadata: data.structuredAnswers || data.variables ? JSON.stringify({
          structuredAnswers: data.structuredAnswers,
          variables: data.variables,
        }) : null,
      },
    });

    const semanticAnalyzerHandoff = getSemanticAnalyzerHandoff(data.structuredAnswers);

    if (semanticAnalyzerHandoff) {
      const handoffData = semanticAnalyzerHandoff.data || {};
      const existingMetadata = matter.metadata ? JSON.parse(matter.metadata) : {};
      const semanticClassification = {
        id: matter.id,
        domain: data.domain,
        jurisdiction: handoffData.jurisdiction || data.province,
        urgency: handoffData.urgency || data.variables?.semanticUrgency || 'medium',
        confidence: handoffData.confidence || data.variables?.semanticConfidence || 0,
        status: 'semantic-analyzed',
        source: handoffData.source || data.variables?.semanticSource || 'semantic-analyzer',
        model: handoffData.model || data.variables?.semanticModel,
        incidentSummary: handoffData.incidentSummary,
        likelyTrack: handoffData.likelyTrack,
        evidenceChecklist: handoffData.evidenceChecklist,
        immediateActions: handoffData.immediateActions,
      };
      const semanticForumMap = buildSemanticForumMap(data.domain, data.province, handoffData);

      matter = await prisma.matter.update({
        where: { id: matter.id },
        data: {
          classification: JSON.stringify(semanticClassification),
          forumMap: JSON.stringify(semanticForumMap),
          metadata: JSON.stringify({
            ...existingMetadata,
            semanticAnalyzer: {
              source: semanticClassification.source,
              model: semanticClassification.model,
              confidence: semanticClassification.confidence,
              routeDecision: handoffData.routeDecision,
            },
          }),
        },
      });
    }

    // Auto-classify legacy/manual matter creation only. Semantic intake keeps the analyzer output.
    if (!semanticAnalyzerHandoff) {
      try {
        const integrationApi = getApi(req);
        const classification = integrationApi.classifyMatter({
          description: data.description,
          province: data.province,
          disputeAmount: data.disputeAmount ?? undefined
        });

        if (classification?.classification) {
          const nextDomain = classification.classification.domain || data.domain;
          const existingMetadata = matter.metadata ? JSON.parse(matter.metadata) : {};
          const mergedStructuredAnswers = [
            ...(Array.isArray(existingMetadata?.structuredAnswers) ? existingMetadata.structuredAnswers : []),
            ...(data.structuredAnswers || []),
          ];
          const mergedVariables = {
            ...(existingMetadata?.variables || {}),
            ...(data.variables || {}),
          };
          matter = await prisma.matter.update({
            where: { id: matter.id },
            data: {
              domain: nextDomain,
              classification: JSON.stringify(classification.classification),
              forumMap: JSON.stringify(classification.forumMap),
              pillar: classification.pillar,
              pillarMatches: classification.pillarMatches ? JSON.stringify(classification.pillarMatches) : null,
              pillarAmbiguous: classification.pillarAmbiguous ?? null,
              metadata: JSON.stringify({
                ...existingMetadata,
                structuredAnswers: mergedStructuredAnswers,
                variables: mergedVariables,
                classification: classification.classification,
                forumMap: classification.forumMap,
                actionPlan: classification.actionPlan,
                deadlineAlerts: classification.deadlineAlerts,
              }),
            },
          });
        }
      } catch (classifyError) {
        // If classification fails, continue with initial domain
        console.warn('Classification failed, using initial domain:', classifyError);
      }
    }

    await prisma.auditEvent.create({
      data: {
        matterId: matter.id,
        action: 'created',
        details: JSON.stringify({ description: data.description, domain: matter.domain }),
      },
    });

    const conversationalHandoff = (data.structuredAnswers || []).find((answer) => answer?.kind === 'conversational-handoff');
    const handoffSource = conversationalHandoff?.data?.source;
    if (handoffSource && handoffSource !== 'conversational-intake') {
      await prisma.auditEvent.create({
        data: {
          matterId: matter.id,
          action: 'nuanceImported',
          details: JSON.stringify({ source: handoffSource }),
        },
      });
    }

    if (semanticAnalyzerHandoff) {
      await prisma.auditEvent.create({
        data: {
          matterId: matter.id,
          action: 'semanticAnalyzerImported',
          details: JSON.stringify({
            source: semanticAnalyzerHandoff.data?.source || 'semantic-analyzer',
            model: semanticAnalyzerHandoff.data?.model,
          }),
        },
      });
    }

    res.status(201).json(matter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    throw error;
  }
});

// GET /api/matters/:id - Get matter details
router.get('/:id', async (req: Request, res: Response) => {
  const matter = await prisma.matter.findUnique({
    where: { id: req.params.id },
    include: {
      evidence: true,
      documents: true,
    },
  });

  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  res.json(matter);
});

// POST /api/matters/:id/classify - Run triage classification
router.post('/:id/classify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matter = await prisma.matter.findUnique({
      where: { id: req.params.id },
    });

    if (!matter) {
      res.status(404).json({ error: 'Matter not found' });
      return;
    }

    const data = classifyMatterSchema.parse({
      description: matter.description,
      province: matter.province,
      domain: matter.domain,
      disputeAmount: matter.disputeAmount,
      ...req.body,
    });

    const classificationInput = {
      domainHint: data.description,  // Pass description text so classifier can detect keywords
      jurisdictionHint: data.province,
      disputeAmount: data.disputeAmount ?? undefined,
      keyDates: Array.isArray((data as any).timeline?.keyDates)
        ? (data as any).timeline.keyDates
            .map((k: any) => {
              const d = k?.date ?? k;
              const dt = d instanceof Date ? d : new Date(d);
              return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
            })
            .filter(Boolean)
        : undefined,
    };

    // Include the original description so heuristics (e.g., pillar detection) have text to analyze
    const classificationWithNotes = {
      ...classificationInput,
      // Provide raw description so pillar detection has text to analyze
      description: data.description,
      // Also preserve as notes for downstream components that rely on notes
      notes: [data.description].filter(Boolean)
    };
    const result = getApi(req).intake({ classification: classificationWithNotes as any });

    // Persist deadline alerts with classification so reloads can display them
    if (result.deadlineAlerts && Array.isArray(result.deadlineAlerts)) {
      (result.classification as any).deadlineAlerts = result.deadlineAlerts;
    }

    // Persist action plan with classification for later display
    if (result.actionPlan) {
      (result.classification as any).actionPlan = result.actionPlan;
    }

    // persist pillar explanation with classification for later display
    (result.classification as any).pillarExplanation = result.pillarExplanation;

    await prisma.matter.update({
      where: { id: matter.id },
      data: {
        classification: JSON.stringify(result.classification),
        forumMap: JSON.stringify(result.forumMap),
        pillar: result.pillar || null,
        pillarMatches: result.pillarMatches ? JSON.stringify(result.pillarMatches) : null,
        pillarAmbiguous: result.pillarAmbiguous ?? null
      },
    });

    await prisma.auditEvent.create({
      data: {
        matterId: matter.id,
        action: 'classified',
        details: JSON.stringify({ domain: result.classification.domain }),
      },
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    next(error);
  }
});

// DELETE /api/matters/:id - Delete matter
router.delete('/:id', async (req: Request, res: Response) => {
  const matter = await prisma.matter.findUnique({
    where: { id: req.params.id },
  });

  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  if (matter.legalHold) {
    res.status(403).json({
      error: 'Cannot delete matter with active legal hold',
      reason: matter.legalHoldReason,
    });
    return;
  }

  await prisma.matter.delete({
    where: { id: req.params.id },
  });

  await prisma.auditEvent.create({
    data: {
      action: 'deleted',
      details: JSON.stringify({ matterId: req.params.id }),
    },
  });

  res.json({ success: true });
});

// GET /api/matters - List all matters
router.get('/', async (req: Request, res: Response) => {
  const matters = await prisma.matter.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          evidence: true,
          documents: true,
        },
      },
    },
  });

  res.json(matters);
});

export default router;
