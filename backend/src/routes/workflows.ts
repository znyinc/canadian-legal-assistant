import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { IntegrationAPI } from '../../../src/api/IntegrationAPI.js';
import { MatterClassification, WorkflowRun } from '../../../src/core/models/index.js';

const router = Router();

function getApi(req: Request) {
  return ((req.app as any).locals.integrationApi as IntegrationAPI) ?? new IntegrationAPI();
}

function parseJson<T>(value?: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function parseMetadata(value?: string | null): Record<string, any> {
  return parseJson<Record<string, any>>(value) || {};
}

function persistMetadata(metadata: Record<string, any>) {
  return JSON.stringify(metadata);
}

async function loadMatterContext(matterId: string) {
  const matter = await prisma.matter.findUnique({
    where: { id: matterId },
    include: {
      evidence: true,
      documents: true,
    },
  });

  if (!matter) {
    return null;
  }

  const metadata = parseMetadata(matter.metadata);
  const workflow = (metadata.workflow || null) as WorkflowRun | null;

  return {
    matter,
    metadata,
    workflow,
    classification: parseJson<MatterClassification>(matter.classification),
    forumMap: parseJson<any>(matter.forumMap),
  };
}

const gateAssessmentSchema = z.object({
  answers: z.record(z.string()),
});

const researchSchema = z.object({
  query: z.string().min(3),
});

router.get('/definitions', async (req: Request, res: Response) => {
  res.json({
    definitions: getApi(req).listWorkflowDefinitions(),
  });
});

router.post('/matters/:id/workflow/start', async (req: Request, res: Response) => {
  const loaded = await loadMatterContext(req.params.id);
  if (!loaded) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const result = getApi(req).getWorkflowState({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow: loaded.workflow,
  });

  loaded.metadata.workflow = result.run;
  await prisma.matter.update({
    where: { id: loaded.matter.id },
    data: {
      metadata: persistMetadata(loaded.metadata),
    },
  });

  await prisma.auditEvent.create({
    data: {
      matterId: loaded.matter.id,
      action: 'workflowStarted',
      details: JSON.stringify({ definitionId: result.run.definitionId, track: result.run.track }),
    },
  });

  res.json(result);
});

router.get('/matters/:id/workflow', async (req: Request, res: Response) => {
  const loaded = await loadMatterContext(req.params.id);
  if (!loaded) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const result = getApi(req).getWorkflowState({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow: loaded.workflow,
  });

  if (JSON.stringify(result.run) !== JSON.stringify(loaded.workflow)) {
    loaded.metadata.workflow = result.run;
    await prisma.matter.update({
      where: { id: loaded.matter.id },
      data: {
        metadata: persistMetadata(loaded.metadata),
      },
    });
  }

  res.json(result);
});

router.post('/matters/:id/workflow/steps/:stepId/generate', async (req: Request, res: Response) => {
  const loaded = await loadMatterContext(req.params.id);
  if (!loaded) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const workflow = loaded.workflow || getApi(req).getWorkflowState({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow: loaded.workflow,
  }).run;

  const result = await getApi(req).generateWorkflowArtifact({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow,
    stepId: req.params.stepId,
  });

  loaded.metadata.workflow = result.run;
  await prisma.matter.update({
    where: { id: loaded.matter.id },
    data: {
      metadata: persistMetadata(loaded.metadata),
    },
  });

  await prisma.auditEvent.create({
    data: {
      matterId: loaded.matter.id,
      action: 'workflowArtifactGenerated',
      details: JSON.stringify({
        stepId: req.params.stepId,
        artifactType: result.artifact.artifactType,
        source: result.artifact.source,
      }),
    },
  });

  res.json(result);
});

router.post('/matters/:id/workflow/gates/:gateId/assess', async (req: Request, res: Response) => {
  const loaded = await loadMatterContext(req.params.id);
  if (!loaded) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const data = gateAssessmentSchema.parse(req.body);
  const workflow = loaded.workflow || getApi(req).getWorkflowState({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow: loaded.workflow,
  }).run;

  const result = getApi(req).assessWorkflowGate({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    forumMap: loaded.forumMap,
    evidence: loaded.matter.evidence.map((item) => ({
      filename: item.filename,
      mimeType: item.mimeType,
      metadata: item.metadata,
    })),
    documents: loaded.matter.documents.map((item) => ({
      packageId: item.packageId,
      packageData: item.packageData,
    })),
    workflow,
    gateId: req.params.gateId,
    answers: data.answers,
  });

  loaded.metadata.workflow = result.run;
  await prisma.matter.update({
    where: { id: loaded.matter.id },
    data: {
      metadata: persistMetadata(loaded.metadata),
    },
  });

  await prisma.auditEvent.create({
    data: {
      matterId: loaded.matter.id,
      action: 'workflowGateAssessed',
      details: JSON.stringify({
        gateId: req.params.gateId,
        outcome: result.result.outcome,
      }),
    },
  });

  res.json(result);
});

router.post('/matters/:id/workflow/research', async (req: Request, res: Response) => {
  const loaded = await loadMatterContext(req.params.id);
  if (!loaded) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const data = researchSchema.parse(req.body);
  const result = await getApi(req).runWorkflowResearch({
    matterId: loaded.matter.id,
    description: loaded.matter.description,
    province: loaded.matter.province,
    domain: loaded.matter.domain,
    disputeAmount: loaded.matter.disputeAmount,
    classification: loaded.classification,
    query: data.query,
  });

  await prisma.auditEvent.create({
    data: {
      matterId: loaded.matter.id,
      action: 'workflowResearchRun',
      details: JSON.stringify({
        query: data.query,
        sourceCount: result.bundle.entries.length,
      }),
    },
  });

  res.json(result);
});

export default router;

