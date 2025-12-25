import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';
import { config } from '../config.js';

const router = Router();
const prisma = new PrismaClient();
// Use IntegrationAPI instance attached to app.locals when available
function getApi(req: Request) {
  return ((req.app as any).locals.integrationApi as IntegrationAPI) ?? new IntegrationAPI();
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(config.uploadDir, req.params.id);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSize },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'message/rfc822',
      'application/vnd.ms-outlook',
      'text/plain',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, PNG, JPG, EML, MSG, TXT'));
    }
  },
});

// POST /api/matters/:id/evidence - Upload evidence file
router.post('/:id', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const matter = await prisma.matter.findUnique({
      where: { id: req.params.id },
    });

    if (!matter) {
      res.status(404).json({ error: 'Matter not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Read file and compute hash
    const fileBuffer = await fs.readFile(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Upload to IntegrationAPI
    const mimeToType = (mimetype: string) => {
      if (mimetype === 'application/pdf') return 'PDF';
      if (mimetype === 'image/png') return 'PNG';
      if (mimetype === 'image/jpeg') return 'JPG';
      if (mimetype === 'text/plain') return 'TXT';
      // EML/MSG handling
      if (mimetype === 'message/rfc822' || mimetype === 'application/vnd.ms-outlook') return 'EML';
      return 'OTHER';
    };

    const result = getApi(req).uploadEvidence({
      filename: req.file.originalname,
      content: fileBuffer,
      type: mimeToType(req.file.mimetype) as any,
      provenance: 'user-provided',
    });

    // Store in database
    const evidence = await prisma.evidence.create({
      data: {
        matterId: matter.id,
        filename: req.file.originalname,
        mimeType: req.file.mimetype,
        filePath: req.file.path,
        fileSize: req.file.size,
        fileHash,
        evidenceIndex: JSON.stringify(result.index),
        metadata: JSON.stringify(result.index.metadata),
      },
    });

    await prisma.auditEvent.create({
      data: {
        matterId: matter.id,
        action: 'evidenceUploaded',
        details: JSON.stringify({
          filename: req.file.originalname,
          evidenceId: evidence.id,
        }),
      },
    });

    res.status(201).json({
      evidence,
      timeline: result.timeline,
      gaps: result.gaps,
      alerts: result.alerts,
    });
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    throw error;
  }
});

// GET /api/matters/:id/evidence - List evidence for matter
router.get('/:id', async (req: Request, res: Response) => {
  const evidence = await prisma.evidence.findMany({
    where: { matterId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  res.json(evidence);
});

// GET /api/matters/:id/timeline - Get timeline with gaps
router.get('/:id/timeline', async (req: Request, res: Response) => {
  const evidence = await prisma.evidence.findMany({
    where: { matterId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });

  const indices = evidence.map(e => JSON.parse(e.evidenceIndex || '{}'));

  // Build timeline from evidence (simplified - real implementation would use TimelineAssessor)
  const timeline = {
    events: indices
      .filter(idx => idx.date)
      .map(idx => ({
        date: idx.date,
        event: idx.summary || 'Evidence uploaded',
        evidenceId: idx.id,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  };

  res.json(timeline);
});

export default router;
