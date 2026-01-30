# Validation Patterns (Zod)

## Schema Definition

### Basic Schema
```typescript
import { z } from 'zod';

const MatterSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  province: z.enum(['Ontario', 'BC', 'Alberta', 'Saskatchewan', 'Manitoba', 'Quebec', 'NB', 'NS', 'PEI', 'NL', 'YT', 'NT', 'NU']),
  tags: z.array(z.string()).optional(),
  domain: z.enum(['criminal', 'civilNegligence', 'legalMalpractice', 'consumerProtection', 'landlordTenant', 'employment', 'insurance', 'humanRights', 'municipalPropertyDamage', 'ocppFiling', 'other']).optional(),
});

type MatterInput = z.infer<typeof MatterSchema>;
```

### Nested Schema
```typescript
const ClassificationSchema = z.object({
  domain: z.string(),
  pillar: z.string().optional(),
  jurisdiction: z.string(),
  urgency: z.enum(['critical', 'warning', 'caution', 'info']),
  notes: z.string().optional(),
});

const MatterWithClassificationSchema = z.object({
  description: z.string(),
  province: z.string(),
  classification: ClassificationSchema.optional(),
});
```

### Array Validation
```typescript
const EvidenceArraySchema = z.array(
  z.object({
    filename: z.string(),
    filetype: z.string(),
    filesize: z.number().max(20 * 1024 * 1024, 'File size must be under 20MB'),
  })
).min(1, 'At least one evidence file required');
```

### Optional and Nullable
```typescript
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),           // May be undefined
  phone: z.string().nullable(),                    // May be null
  age: z.number().optional().nullable(),           // May be undefined or null
});
```

## Backend Validation

### Route Validation Pattern
```typescript
import { z } from 'zod';

const CreateMatterSchema = z.object({
  description: z.string().min(10),
  province: z.string(),
  tags: z.array(z.string()).optional(),
});

router.post('/matters', async (req, res) => {
  try {
    // Validate request body
    const validated = CreateMatterSchema.parse(req.body);
    
    // Use validated data
    const matter = await integrationAPI.intake(validated);
    
    return res.status(201).json(matter);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Safe Parsing (Non-Throwing)
```typescript
const result = CreateMatterSchema.safeParse(req.body);

if (!result.success) {
  return res.status(400).json({
    error: 'Validation failed',
    details: result.error.errors,
  });
}

// Use result.data (validated)
const matter = await integrationAPI.intake(result.data);
```

## Frontend Validation

### Form Validation
```typescript
import { z } from 'zod';

const FormSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters'),
  province: z.string().min(1, 'Province is required'),
});

export function NewMatterForm() {
  const [formData, setFormData] = useState({ description: '', province: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate with Zod
    const result = FormSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    
    // Clear errors and submit
    setErrors({});
    await api.createMatter(result.data);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className={errors.description ? 'border-red-500' : ''}
        />
        {errors.description && (
          <p className="text-red-600 text-sm">{errors.description}</p>
        )}
      </div>
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Custom Validation Rules

### Custom Validators
```typescript
const EmailSchema = z.string().refine(
  (val) => val.includes('@') && val.includes('.'),
  { message: 'Invalid email format' }
);

const PhoneSchema = z.string().refine(
  (val) => /^\d{3}-\d{3}-\d{4}$/.test(val),
  { message: 'Phone must be in format XXX-XXX-XXXX' }
);

const DateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)),
  { message: 'Invalid date format' }
);
```

### Transform Values
```typescript
const NumberStringSchema = z.string().transform((val) => parseInt(val, 10));

const TrimmedStringSchema = z.string().transform((val) => val.trim());

const DateFromStringSchema = z.string().transform((val) => new Date(val));
```

## Complex Validation

### Conditional Validation
```typescript
const MatterSchema = z.object({
  domain: z.string(),
  municipalDetails: z.string().optional(),
}).refine(
  (data) => {
    // If municipal domain, require municipal details
    if (data.domain === 'municipalPropertyDamage') {
      return !!data.municipalDetails;
    }
    return true;
  },
  {
    message: 'Municipal details required for municipal property damage cases',
    path: ['municipalDetails'],
  }
);
```

### Union Types
```typescript
const NotificationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('email'),
    email: z.string().email(),
  }),
  z.object({
    type: z.literal('sms'),
    phone: z.string(),
  }),
]);
```

## File Upload Validation
```typescript
const FileUploadSchema = z.object({
  filename: z.string(),
  mimetype: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'text/plain']),
  size: z.number().max(20 * 1024 * 1024, 'File must be under 20MB'),
});

// In route handler
const result = FileUploadSchema.safeParse({
  filename: file.originalname,
  mimetype: file.mimetype,
  size: file.size,
});

if (!result.success) {
  return res.status(400).json({
    error: 'Invalid file',
    details: result.error.errors,
  });
}
```

## API Response Validation
```typescript
// Validate API responses (runtime type safety)
const MatterResponseSchema = z.object({
  id: z.string(),
  description: z.string(),
  classification: ClassificationSchema.optional(),
  createdAt: z.string(),
});

// In API client
async function getMatter(id: string): Promise<Matter> {
  const response = await fetch(`/api/matters/${id}`);
  const data = await response.json();
  
  // Validate response matches expected schema
  return MatterResponseSchema.parse(data);
}
```
