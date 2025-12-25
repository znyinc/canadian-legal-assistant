import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';

const router = Router();
const prisma = new PrismaClient();
const api = new IntegrationAPI();

// Validation schemas
const createMatterSchema = z.object({
  description: z.string().min(10),
  province: z.string().default('ON'),
  domain: z.enum(['insurance', 'landlordTenant', 'employment', 'other']),
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

// POST /api/matters - Create new matter
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = createMatterSchema.parse(req.body);

    const matter = await prisma.matter.create({
      data: {
        description: data.description,
        province: data.province,
        domain: data.domain,
        disputeAmount: data.disputeAmount,
      },
    });

    await prisma.auditEvent.create({
      data: {
        matterId: matter.id,
        action: 'created',
        details: JSON.stringify({ description: data.description, domain: data.domain }),
      },
    });

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
      domainHint: data.domain,
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

    const result = api.intake({ classification: classificationInput });

    await prisma.matter.update({
      where: { id: matter.id },
      data: {
        classification: JSON.stringify(result.classification),
        forumMap: JSON.stringify(result.forumMap),
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
