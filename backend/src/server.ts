import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import { config } from './config.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getModelRouter, TaskType } from './core/router/ModelRouter.js';
import mattersRouter from './routes/matters.js';
import evidenceRouter from './routes/evidence.js';
import documentsRouter from './routes/documents.js';
import auditRouter from './routes/audit.js';
import caselawRouter from './routes/caselaw.js';
import exportRouter from './routes/export.js';
import kitsRouter from './routes/kits.js';
import conversationalRouter from './routes/conversational.js';
import workflowsRouter from './routes/workflows.js';
import settingsRouter from './routes/settings.js';

const app = express();

// Middleware
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  next();
});
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(apiKeyAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create and register domain modules and a shared IntegrationAPI
import { DomainModuleRegistry } from '../../src/core/domains/DomainModuleRegistry';
import { InsuranceDomainModule } from '../../src/core/domains/InsuranceDomainModule';
import { LandlordTenantDomainModule } from '../../src/core/domains/LandlordTenantDomainModule';
import { CivilNegligenceDomainModule } from '../../src/core/domains/CivilNegligenceDomainModule';
import { CriminalDomainModule } from '../../src/core/domains/CriminalDomainModule';
import { MunicipalPropertyDamageModule } from '../../src/core/domains/MunicipalPropertyDamageModule';
import { LegalMalpracticeDomainModule } from '../../src/core/domains/LegalMalpracticeDomainModule';
import { EstateSuccessionDomainModule } from '../../src/core/domains/EstateSuccessionDomainModule';
import { IntegrationAPI } from '../../src/api/IntegrationAPI';

function createApp() {
  // Register domain modules in a shared registry
  const registry = new DomainModuleRegistry();
  registry.register(new InsuranceDomainModule());
  registry.register(new LandlordTenantDomainModule());
  registry.register(new CivilNegligenceDomainModule());
  registry.register(new CriminalDomainModule());
  registry.register(new MunicipalPropertyDamageModule());
  registry.register(new LegalMalpracticeDomainModule());
  registry.register(new EstateSuccessionDomainModule());

  const workflowLlmClient = {
    enabled: config.nuanceLlmEnabled,
    async generateResearchNarrative(request: {
      matter: { description: string; domain: string; province: string; disputeAmount?: number | null };
      query: string;
      authorityBundle: unknown;
    }) {
      const router = getModelRouter();
      const response = await router.route({
        taskType: TaskType.PLAIN_LANGUAGE,
        preferredLane: 'deep-reason',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: [
              'You are assisting a Canadian legal information workflow.',
              'Use only the supplied authority bundle as the legal authority base.',
              'Do not invent authorities.',
              'Respond with concise narrative text only.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: JSON.stringify({
              matter: request.matter,
              query: request.query,
              authorityBundle: request.authorityBundle,
            }),
          },
        ],
      });

      return {
        content: response.content,
        model: response.model,
      };
    },
  };

  // Create shared IntegrationAPI instance with registry
  const integrationApi = new IntegrationAPI({ registry, workflowLlmClient });

  // Attach to app locals for route handlers to use
  (app as any).locals.integrationApi = integrationApi;

  // API routes
  app.use('/api/matters', mattersRouter);
  app.use('/api/evidence', evidenceRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/caselaw', caselawRouter);
  app.use('/api/export', exportRouter);
  app.use('/api/kits', kitsRouter);
  app.use('/api/conversational', conversationalRouter);
  app.use('/api/workflows', workflowsRouter);
  app.use('/api/settings', settingsRouter);

  // Error handling
  app.use(errorHandler);

  return app;
}

// Start server when not in test mode
let server: any;
if (process.env.NODE_ENV !== 'test') {
  const serverApp = createApp();
  server = serverApp.listen(config.port, () => {
    console.log(`🚀 Canadian Legal Assistant API running on port ${config.port}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`🔐 API key auth: ${config.apiKeyEnabled ? 'enabled' : 'disabled'}`);
    console.log(`🌐 CORS origin: ${config.corsOrigin}`);
  });
}

export { createApp };

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }
});
