import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';
import { CourtFormsCatalog } from '../services/courtFormsCatalog.js';
import { getAuthorizedFormLinks } from '../services/authorizedFormLinks.js';

const router = Router();
const courtFormsCatalog = new CourtFormsCatalog();
// Use IntegrationAPI instance attached to app.locals when available
function getApi(req: Request) {
  return ((req.app as any).locals.integrationApi as IntegrationAPI) ?? new IntegrationAPI();
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\r?\n/g, '\\n');
}

function renderDraftText(draft: any): string {
  const sections = Array.isArray(draft.sections) ? draft.sections : [];
  const sectionText = sections
    .map((section: any) => {
      const heading = String(section.heading || 'Section');
      const content = String(section.content || '');
      return `${heading}\n${content}`;
    })
    .join('\n\n');

  return `${String(draft.title || 'Legal Draft')}\n\n${sectionText}`.trim();
}

function buildSimplePdfBuffer(title: string, body: string): Buffer {
  const lines = body.split(/\r?\n/).slice(0, 60);
  const textLines = [title, ...lines];
  let y = 780;
  const operations = ['BT', '/F1 11 Tf'];
  textLines.forEach((line) => {
    operations.push(`72 ${y} Td (${escapePdfText(line)}) Tj`);
    y -= 14;
    operations.push('0 0 Td');
  });
  operations.push('ET');
  const stream = operations.join('\n');

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj',
    `5 0 obj << /Length ${Buffer.byteLength(stream, 'utf8')} >> stream\n${stream}\nendstream endobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const xref: number[] = [0];
  objects.forEach((obj) => {
    xref.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${obj}\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i < xref.length; i += 1) {
    pdf += `${xref[i].toString().padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, 'utf8');
}

function buildSimpleWordBuffer(title: string, body: string): Buffer {
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, '<br/>');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapedTitle}</title></head><body><h1>${escapedTitle}</h1><p>${escapedBody}</p></body></html>`;
  return Buffer.from(html, 'utf8');
}

function deriveFormIds(requestedTemplates: string[] | undefined, domain: string | undefined): string[] {
  const requested = new Set<string>();
  (requestedTemplates || []).forEach((tpl) => {
    if (tpl.includes('form7a')) requested.add('form-7a-small-claims');
    if (tpl.includes('/t1') || tpl.includes('ltb-form-t1')) requested.add('ltb-form-t1');
    if (tpl.includes('/l1') || tpl.includes('ltb-form-l1')) requested.add('ltb-form-l1');
    if (tpl.includes('victim')) requested.add('victim-impact-statement');
  });

  if (requested.size > 0) {
    return Array.from(requested);
  }

  if (domain === 'civil-negligence' || domain === 'legalMalpractice' || domain === 'consumerProtection' || domain === 'insurance') {
    requested.add('form-7a-small-claims');
  }
  if (domain === 'landlordTenant') {
    requested.add('ltb-form-t1');
    requested.add('ltb-form-l1');
  }
  if (domain === 'criminal') {
    requested.add('victim-impact-statement');
  }

  return Array.from(requested);
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
    requestedTemplates: data.requestedTemplates as string[] | undefined,
    description: matter.description || classification.notes?.join(' ') || '',
    matterId: matter.id
  });

  const formIds = deriveFormIds(data.requestedTemplates as string[] | undefined, classification.domain);
  const localTemplateFiles = courtFormsCatalog.findMatches(formIds, { domain: classification.domain });
  const officialFormLinks = getAuthorizedFormLinks(formIds);
  const missingConcreteTemplates = formIds.filter(
    (formId) => !localTemplateFiles.some((entry) => entry.filename.toLowerCase().includes(formId.split('-')[1] || '')),
  );

  const enrichedResult = {
    ...result,
    downloads: {
      localTemplateFiles,
      officialFormLinks,
      missingConcreteTemplates,
      fallbackRequired: missingConcreteTemplates.length > 0,
    },
  };

  // Generate package ID
  const packageId = `pkg-${matter.id}-${Date.now()}`;

  // Store document package
  const doc = await prisma.document.create({
    data: {
      matterId: matter.id,
      packageId,
      packagePath: `./packages/${packageId}`,
      packageData: JSON.stringify(enrichedResult),
    },
  });

  await prisma.auditEvent.create({
    data: {
      matterId: matter.id,
      action: 'documentGenerated',
      details: JSON.stringify({ packageId }),
    },
  });

  res.json({ ...enrichedResult, packageId });
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

// GET /api/documents/:packageId/download/:format?draftIndex=0
router.get('/:packageId/download/:format', async (req: Request, res: Response) => {
  const format = String(req.params.format || '').toLowerCase();
  if (!['pdf', 'word'].includes(format)) {
    res.status(400).json({ error: 'Unsupported format. Use pdf or word.' });
    return;
  }

  const doc = await prisma.document.findFirst({
    where: { packageId: req.params.packageId },
  });

  if (!doc) {
    res.status(404).json({ error: 'Document package not found' });
    return;
  }

  const payload = JSON.parse(doc.packageData || '{}');
  const drafts = Array.isArray(payload?.drafts) ? payload.drafts : [];
  const draftIndex = Number(req.query.draftIndex ?? 0);
  if (!Number.isInteger(draftIndex) || draftIndex < 0 || draftIndex >= drafts.length) {
    res.status(400).json({ error: 'Invalid draftIndex for this package' });
    return;
  }

  const draft = drafts[draftIndex];
  const title = String(draft.title || `Draft-${draftIndex + 1}`);
  const body = renderDraftText(draft);
  const safeBase = title.replace(/[^a-zA-Z0-9-_]+/g, '_');

  if (format === 'pdf') {
    const buffer = buildSimplePdfBuffer(title, body);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeBase}.pdf"`);
    res.send(buffer);
    return;
  }

  const wordBuffer = buildSimpleWordBuffer(title, body);
  res.setHeader('Content-Type', 'application/msword');
  res.setHeader('Content-Disposition', `attachment; filename="${safeBase}.doc"`);
  res.send(wordBuffer);
});

export default router;
