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
// Simple in-memory rate limiter per IP for upload endpoint
const uploadRateMap = new Map<string, { count: number; resetAt: number }>();
const uploadLimiterWindowMs = 15 * 60 * 1000; // 15 minutes
const uploadLimiterMax = 20; // 20 uploads per window per IP
function uploadLimiter(req: Request, res: Response, next: Function) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const entry = uploadRateMap.get(key);
  if (!entry || now > entry.resetAt) {
    uploadRateMap.set(key, { count: 1, resetAt: now + uploadLimiterWindowMs });
    return next();
  }
  if (entry.count >= uploadLimiterMax) {
    return res.status(429).json({ error: 'Too many uploads. Please try again later.' });
  }
  entry.count += 1;
  uploadRateMap.set(key, entry);
  return next();
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const safeId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const uploadPath = path.join(config.uploadDir, safeId);
    await fs.mkdir(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    // Sanitize original name to prevent path traversal and strip problematic chars
    const base = path.basename(file.originalname);
    const safeBase = base.replace(/[\\/\x00]/g, '').replace(/[^\w.\- ]+/g, '_');
    cb(null, `${uniqueSuffix}-${safeBase}`);
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
router.post('/:id', uploadLimiter as any, upload.single('file'), async (req: Request, res: Response) => {
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
    // Ensure the file path is within the upload directory to prevent traversal
    const normalizedPath = path.resolve(req.file.path);
    const safeId = (req.params.id || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const expectedDir = path.resolve(path.join(config.uploadDir, safeId));
    const rel = path.relative(expectedDir, normalizedPath);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Prevent symlink escape: resolve real path and verify it's within expected dir
    const realPath = await fs.realpath(normalizedPath).catch(async () => {
      await fs.unlink(req.file.path).catch(() => {});
      return null;
    });
    if (!realPath || !realPath.startsWith(expectedDir)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Limit concurrent file reads to reduce resource exhaustion
    const MAX_CONCURRENT_READS = 2;
    if ((global as any)._concurrentFileReads == null) (global as any)._concurrentFileReads = 0;
    if ((global as any)._concurrentFileReads >= MAX_CONCURRENT_READS) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(503).json({ error: 'Server busy, try again later' });
    }

    try {
      (global as any)._concurrentFileReads += 1;
      const fileBuffer = await fs.readFile(realPath);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const mimeToType = (mimetype: string) => {
        if (mimetype === 'application/pdf') return 'PDF';
        if (mimetype === 'image/png') return 'PNG';
        if (mimetype === 'image/jpeg') return 'JPG';
        if (mimetype === 'text/plain') return 'TXT';
        if (mimetype === 'message/rfc822' || mimetype === 'application/vnd.ms-outlook') return 'EML';
        return 'OTHER';
      };

      const safeBase = path.basename(req.file.originalname).replace(/[\\/\x00]/g, '').replace(/[^\w.\- ]+/g, '_');

      const result = getApi(req).uploadEvidence({
        filename: safeBase,
        content: fileBuffer,
        type: mimeToType(req.file.mimetype) as any,
        provenance: 'user-provided',
      });

      const evidence = await prisma.evidence.create({
        data: {
          matterId: matter.id,
          filename: safeBase,
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
            filename: safeBase,
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
    } finally {
      (global as any)._concurrentFileReads -= 1;
    }
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
