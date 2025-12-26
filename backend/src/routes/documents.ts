import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';

const router = Router();
const prisma = new PrismaClient();
// Use IntegrationAPI instance attached to app.locals when available
function getApi(req: Request) {
  return ((req.app as any).locals.integrationApi as IntegrationAPI) ?? new IntegrationAPI();
}

const generateSchema = z.object({
  userConfirmedFacts: z.array(z.string()).optional(),
  requestedTemplates: z.array(z.string()).optional()
});

// POST /api/matters/:id/generate - Generate documents
router.post('/:id/generate', async (req: Request, res: Response) => {
  const matter = await prisma.matter.findUnique({
    where: { id: req.params.id },
    include: { evidence: true },
  });

  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  if (!matter.classification) {
    res.status(400).json({ error: 'Matter must be classified first' });
    return;
  }

  const data = generateSchema.parse(req.body);
  const classification = JSON.parse(matter.classification);
  const forumMap = matter.forumMap || '{}';
  
  // Build evidence index from all evidence
  const evidenceIndex = {
    items: matter.evidence.map(e => {
      const parsed = JSON.parse(e.evidenceIndex || '{}');
      return parsed.items || [];
    }).flat(),
    generatedAt: new Date().toISOString(),
    sourceManifest: {
      entries: [],
      accessLog: [],
      compiledAt: new Date().toISOString(),
    },
  };

  const result = getApi(req).generateDocuments({
    classification,
    forumMap,
    timeline: '{}',
    missingEvidence: '[]',
    evidenceIndex,
    sourceManifest: {
      entries: [],
      accessLog: [],
      compiledAt: new Date().toISOString(),
    },
    requestedTemplates: data.requestedTemplates as string[] | undefined
  });

  // Generate package ID
  const packageId = `pkg-${matter.id}-${Date.now()}`;

  // Store document package
  const doc = await prisma.document.create({
    data: {
      matterId: matter.id,
      packageId,
      packagePath: `./packages/${packageId}`,
      packageData: JSON.stringify(result),
    },
  });

  await prisma.auditEvent.create({
    data: {
      matterId: matter.id,
      action: 'documentGenerated',
      details: JSON.stringify({ packageId }),
    },
  });

  res.json({ ...result, packageId });
});

// GET /api/matters/:id/documents - List documents for matter
router.get('/:id/documents', async (req: Request, res: Response) => {
  const documents = await prisma.document.findMany({
    where: { matterId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });

  res.json(documents);
});

// GET /api/documents/:packageId - Get specific document package
router.get('/:packageId', async (req: Request, res: Response) => {
  const doc = await prisma.document.findFirst({
    where: { packageId: req.params.packageId },
  });

  if (!doc) {
    res.status(404).json({ error: 'Document package not found' });
    return;
  }

  res.json(JSON.parse(doc.packageData));
});

export default router;
