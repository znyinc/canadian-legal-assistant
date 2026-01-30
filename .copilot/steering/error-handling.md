# Error Handling Patterns

## Frontend Error Handling

### API Call Error Pattern
```typescript
async function fetchMatter(id: string): Promise<Matter> {
  try {
    const response = await fetch(`/api/matters/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch matter');
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
}
```

### Component Error State
```typescript
export function MatterDetailPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await api.createMatter(data);
      navigate('/matters');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4" role="alert">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      {/* Form content */}
    </div>
  );
}
```

### Form Validation Errors
```typescript
interface ValidationErrors {
  description?: string;
  province?: string;
}

const [errors, setErrors] = useState<ValidationErrors>({});

const validate = (): boolean => {
  const newErrors: ValidationErrors = {};
  
  if (!formData.description.trim()) {
    newErrors.description = 'Description is required';
  }
  
  if (!formData.province) {
    newErrors.province = 'Province is required';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validate()) {
    return;
  }
  
  // Proceed with submission
};
```

## Backend Error Handling

### Route Error Pattern
```typescript
router.post('/matters', async (req, res) => {
  try {
    // Validation
    if (!req.body.description) {
      return res.status(400).json({
        error: 'Validation failed',
        details: { description: 'Description is required' },
      });
    }
    
    // Business logic
    const matter = await integrationAPI.intake(req.body);
    
    // Success response
    return res.status(201).json(matter);
    
  } catch (error) {
    console.error('Error creating matter:', error);
    
    // Distinguish error types
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.message,
      });
    }
    
    if (error instanceof NotFoundError) {
      return res.status(404).json({
        error: 'Resource not found',
        message: error.message,
      });
    }
    
    // Generic server error
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  }
});
```

### Global Error Handler
```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Unhandled error:', err);
  
  // Log to audit system
  req.app.locals.integrationAPI?.auditLogger.log(
    'error',
    'system',
    { error: err.message, stack: err.stack }
  );
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

// Register in server.ts
app.use(errorHandler);
```

### Custom Error Classes
```typescript
// src/core/errors/CustomErrors.ts
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

// Usage
if (!user) {
  throw new NotFoundError('User', userId);
}
```

## Core Library Error Handling

### Domain Module Errors
```typescript
class LegalMalpracticeDomainModule extends BaseDomainModule {
  async buildDrafts(classification: MatterClassification): Promise<DocumentDraft[]> {
    // Validate required data
    if (!classification.notes) {
      throw new ValidationError('Classification notes required for legal malpractice cases');
    }
    
    const lawyerName = this.extractLawyerName(classification.notes);
    if (!lawyerName) {
      // Soft error - return draft with missing confirmation
      return [{
        title: 'LawPRO Notification',
        content: template,
        documentType: 'notification',
        missingConfirmations: ['Confirm lawyer name'],
      }];
    }
    
    // Continue with generation
  }
}
```

### Graceful Degradation
```typescript
// If optional service fails, continue with reduced functionality
async function generateDocuments(classification: MatterClassification) {
  let caselaw: CaseLawResult[] = [];
  
  try {
    caselaw = await canLiiClient.search(query);
  } catch (error) {
    console.warn('CanLII search failed, continuing without case law:', error);
    // Don't throw - degrade gracefully
  }
  
  return {
    documents: generateDrafts(classification),
    caselaw, // May be empty array
  };
}
```

### Logging Errors
```typescript
// Use consistent logging
import { logger } from '../utils/logger';

try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', {
    operation: 'riskyOperation',
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
  });
  
  // Re-throw or handle
  throw error;
}
```

## File Upload Errors
```typescript
// Multer error handling
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error(`File type ${file.mimetype} not allowed`));
    }
    cb(null, true);
  },
});

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large (max 20MB)' });
      }
      return res.status(400).json({ error: err.message });
    }
    
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    next();
  });
}, async (req, res) => {
  // Handle successful upload
});
```

## Error Boundaries (React)
```typescript
// Not currently used, but pattern for complex React apps:
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    
    return this.props.children;
  }
}
```
