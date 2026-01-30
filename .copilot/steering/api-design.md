# RESTful API Design Patterns

## URL Structure
```
GET    /api/matters              # List all matters
POST   /api/matters              # Create matter
GET    /api/matters/:id          # Get matter details
PUT    /api/matters/:id          # Update matter
DELETE /api/matters/:id          # Delete matter

POST   /api/matters/:id/evidence       # Upload evidence
GET    /api/matters/:id/evidence/:eid  # Get evidence details

POST   /api/matters/:id/documents      # Generate documents
GET    /api/documents/:id              # Get document details

GET    /api/caselaw/search             # Search CanLII
GET    /api/export                     # Export all data
GET    /api/audit                      # Get audit log
```

## Request/Response Patterns

### Success Response (200/201)
```typescript
// GET /api/matters/:id
{
  "id": "abc123",
  "description": "Tree fell on my car",
  "province": "Ontario",
  "classification": {
    "domain": "civilNegligence",
    "pillar": "civil",
    "jurisdiction": "Ontario",
    "urgency": "moderate",
    "actionPlan": { /* ... */ }
  },
  "createdAt": "2026-01-28T12:00:00Z"
}
```

### Error Response (4xx/5xx)
```typescript
// 400 Bad Request
{
  "error": "Validation failed",
  "details": {
    "description": "Description is required",
    "province": "Invalid province"
  }
}

// 404 Not Found
{
  "error": "Matter not found",
  "matterId": "invalid-id"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Route Handler Pattern
```typescript
// backend/src/routes/matters.ts
import { Router } from 'express';
import { IntegrationAPI } from '../../src/api/IntegrationAPI';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const integrationAPI = req.app.locals.integrationAPI as IntegrationAPI;
    
    // Validate request
    const { description, province, tags } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }
    
    // Call IntegrationAPI
    const result = await integrationAPI.intake({
      classification: {
        domain: req.body.domain,
        jurisdiction: province,
        notes: description,
      },
      description,
      province,
      tags,
    });
    
    // Persist to database
    const matter = await req.app.locals.prisma.matter.create({
      data: {
        description,
        province,
        classification: result.classification as any,
      },
    });
    
    // Audit logging
    await req.app.locals.integrationAPI.auditLogger.log(
      'matter-created',
      req.headers['user-id'] as string,
      { matterId: matter.id }
    );
    
    return res.status(201).json(matter);
  } catch (error) {
    console.error('Error creating matter:', error);
    return res.status(500).json({ 
      error: 'Failed to create matter',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
```

## Middleware Pattern
```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);
  
  // Don't leak internal errors to client
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
  });
}

// Usage in server.ts
app.use(errorHandler);
```

## File Upload Pattern
```typescript
// backend/src/routes/evidence.ts
import multer from 'multer';

const upload = multer({
  dest: './backend/uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.eml', '.msg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not allowed`));
    }
  },
});

router.post('/:matterId/evidence', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Process file with IntegrationAPI
    const result = await integrationAPI.uploadEvidence({
      matterId: req.params.matterId,
      file: {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
      },
    });
    
    return res.status(201).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});
```

## Query Parameters
```typescript
// GET /api/matters?status=active&domain=criminal&limit=10&offset=0
router.get('/', async (req, res) => {
  const {
    status = 'active',
    domain,
    limit = '20',
    offset = '0',
  } = req.query;
  
  const matters = await prisma.matter.findMany({
    where: {
      status: status as string,
      ...(domain && { classification: { path: ['domain'], equals: domain } }),
    },
    take: parseInt(limit as string),
    skip: parseInt(offset as string),
    orderBy: { createdAt: 'desc' },
  });
  
  res.json({ matters, total: matters.length });
});
```

## CORS Configuration
```typescript
// backend/src/server.ts
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
```

## API Versioning (Future)
```typescript
// If API versioning needed later
app.use('/api/v1/matters', mattersRouterV1);
app.use('/api/v2/matters', mattersRouterV2);
```
