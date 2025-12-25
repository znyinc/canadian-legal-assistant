import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/export - Export all data as ZIP
router.get('/', async (req: Request, res: Response) => {
  try {
    // Fetch all data
    const matters = await prisma.matter.findMany();
    const evidence = await prisma.evidence.findMany();
    const documents = await prisma.document.findMany();
    const auditEvents = await prisma.auditEvent.findMany();

    // Create zip archive in memory
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="legal-assistant-export-${new Date().toISOString().split('T')[0]}.zip"`
    );

    archive.pipe(res);

    // Add manifest file
    const manifest = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      contents: {
        mattersCount: matters.length,
        evidenceCount: evidence.length,
        documentsCount: documents.length,
        auditEventsCount: auditEvents.length,
      },
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'MANIFEST.json' });

    // Add data files
    archive.append(JSON.stringify(matters, null, 2), { name: 'matters.json' });
    archive.append(JSON.stringify(evidence, null, 2), { name: 'evidence.json' });
    archive.append(JSON.stringify(documents, null, 2), { name: 'documents.json' });
    archive.append(JSON.stringify(auditEvents, null, 2), { name: 'audit_log.json' });

    // Add evidence files if they exist
    if (fs.existsSync('./uploads')) {
      archive.directory('./uploads/', 'evidence_files');
    }

    // Add README
    const readme = `# Canadian Legal Assistant Export

This export contains all your legal matter data, evidence files, generated documents, and audit logs.

## Contents

- **matters.json**: All matters with classifications and forum maps
- **evidence.json**: Evidence metadata with file hashes and credibility scores
- **documents.json**: Generated documents and packages
- **audit_log.json**: Complete audit trail with timestamps
- **evidence_files/**: Uploaded evidence files organized by matter
- **MANIFEST.json**: Export metadata and statistics

## Data Protection

This export contains sensitive legal information. Please:
- Store in a secure location
- Do not share with unauthorized parties
- Follow applicable data protection regulations
- Maintain confidentiality of personal and sensitive information

## Retention

Keep this export according to your data retention policy and legal hold requirements.
`;
    archive.append(readme, { name: 'README.md' });

    await archive.finalize();
  } catch (error) {
    console.error('Export failed:', error);
    res.status(500).json({
      error: 'Failed to create export',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/export/package/:packageId - Download specific document package as ZIP
router.get('/package/:packageId', async (req: Request, res: Response) => {
  try {
    const doc = await prisma.document.findFirst({
      where: { packageId: req.params.packageId },
      include: { matter: true },
    });

    if (!doc) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }

    const packageData = JSON.parse(doc.packageData);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const date = new Date(doc.createdAt).toISOString().split('T')[0];
    const packageName = packageData.package?.packageName || 'documents';
    const filename = `${packageName}-${date}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    archive.pipe(res);

    // Add each draft as a separate file
    if (packageData.drafts) {
      packageData.drafts.forEach((draft: any, index: number) => {
        const draftContent = `# ${draft.title}\n\n${draft.sections?.map((s: any) => `## ${s.heading}\n\n${s.content}`).join('\n\n') || 'No content'}`;
        archive.append(draftContent, { name: `${index + 1}-${draft.title}.md` });
      });
    }

    // Add package metadata
    const metadata = {
      packageId: doc.packageId,
      generatedAt: doc.createdAt,
      matter: {
        id: doc.matter.id,
        description: doc.matter.description,
        domain: doc.matter.domain,
      },
      contents: packageData,
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'package-metadata.json' });

    // Add README
    const readme = `# Legal Document Package

Generated: ${new Date(doc.createdAt).toLocaleString()}
Matter: ${doc.matter.description}
Domain: ${doc.matter.domain}

## Contents

${packageData.drafts?.map((d: any, i: number) => `${i + 1}. ${d.title}`).join('\n') || 'No documents'}

## Disclaimer

⚠️ This package contains legal information, not legal advice. Consult with a qualified lawyer for advice specific to your situation.
`;
    archive.append(readme, { name: 'README.txt' });

    await archive.finalize();
  } catch (error) {
    console.error('Package download failed:', error);
    res.status(500).json({
      error: 'Failed to download package',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
