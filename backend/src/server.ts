import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { config } from './config.js';
import { apiKeyAuth } from './middleware/apiKeyAuth.js';
import { errorHandler } from './middleware/errorHandler.js';
import mattersRouter from './routes/matters.js';
import evidenceRouter from './routes/evidence.js';
import documentsRouter from './routes/documents.js';
import auditRouter from './routes/audit.js';
import caselawRouter from './routes/caselaw.js';
import exportRouter from './routes/export.js';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.disable('x-powered-by');
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
import { IntegrationAPI } from '../../src/api/IntegrationAPI';

function createApp() {
  // Register domain modules in a shared registry
  const registry = new DomainModuleRegistry();
  registry.register(new InsuranceDomainModule());
  registry.register(new LandlordTenantDomainModule());
  registry.register(new CivilNegligenceDomainModule());
  registry.register(new CriminalDomainModule());

  // Create shared IntegrationAPI instance with registry
  const integrationApi = new IntegrationAPI({ registry });

  // Attach to app locals for route handlers to use
  (app as any).locals.integrationApi = integrationApi;

  // API routes
  app.use('/api/matters', mattersRouter);
  app.use('/api/evidence', evidenceRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/audit', auditRouter);
  app.use('/api/caselaw', caselawRouter);
  app.use('/api/export', exportRouter);

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
