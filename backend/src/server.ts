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
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(apiKeyAuth);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/matters', mattersRouter);
app.use('/api/evidence', evidenceRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/caselaw', caselawRouter);
app.use('/api/export', exportRouter);

// Error handling
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  console.log(`🚀 Canadian Legal Assistant API running on port ${config.port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
  console.log(`🔐 API key auth: ${config.apiKeyEnabled ? 'enabled' : 'disabled'}`);
  console.log(`🌐 CORS origin: ${config.corsOrigin}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
