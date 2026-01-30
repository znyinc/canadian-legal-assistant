# Prisma ORM Patterns

## Schema Definition
```prisma
// backend/prisma/schema.prisma

model Matter {
  id              String   @id @default(uuid())
  description     String
  province        String
  classification  Json?    // Stores MatterClassification
  status          String   @default("active")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  evidence        Evidence[]
  documents       Document[]
  auditEvents     AuditEvent[]
}

model Evidence {
  id              String   @id @default(uuid())
  matterId        String
  filename        String
  filepath        String
  filetype        String
  filesize        Int
  hash            String   // SHA-256
  uploadedAt      DateTime @default(now())
  
  matter          Matter   @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

model Document {
  id              String   @id @default(uuid())
  matterId        String
  title           String
  content         String   // Markdown
  documentType    String
  generatedAt     DateTime @default(now())
  
  matter          Matter   @relation(fields: [matterId], references: [id], onDelete: Cascade)
}

model AuditEvent {
  id              String   @id @default(uuid())
  eventType       String
  userId          String?
  matterId        String?
  details         Json
  timestamp       DateTime @default(now())
  
  matter          Matter?  @relation(fields: [matterId], references: [id], onDelete: SetNull)
}
```

## Query Patterns

### Create
```typescript
const matter = await prisma.matter.create({
  data: {
    description: 'Tree fell on car',
    province: 'Ontario',
    classification: {
      domain: 'civilNegligence',
      jurisdiction: 'Ontario',
      urgency: 'moderate',
    },
  },
});
```

### Find One
```typescript
const matter = await prisma.matter.findUnique({
  where: { id: matterId },
  include: {
    evidence: true,
    documents: true,
  },
});

if (!matter) {
  throw new Error('Matter not found');
}
```

### Find Many with Filters
```typescript
const matters = await prisma.matter.findMany({
  where: {
    province: 'Ontario',
    status: 'active',
    createdAt: {
      gte: new Date('2026-01-01'),
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 20,
  skip: 0,
});
```

### Update
```typescript
const updated = await prisma.matter.update({
  where: { id: matterId },
  data: {
    classification: newClassification,
    updatedAt: new Date(),
  },
});
```

### Delete (Soft Delete Preferred)
```typescript
// Soft delete (preferred for audit trail)
await prisma.matter.update({
  where: { id: matterId },
  data: { status: 'deleted' },
});

// Hard delete (use with caution)
await prisma.matter.delete({
  where: { id: matterId },
});
```

## Transaction Pattern
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Create matter
  const matter = await tx.matter.create({
    data: { description, province },
  });
  
  // Log audit event
  await tx.auditEvent.create({
    data: {
      eventType: 'matter-created',
      matterId: matter.id,
      details: { description },
    },
  });
  
  return matter;
});
```

## JSON Field Queries
```typescript
// Query by JSON field
const civilMatters = await prisma.matter.findMany({
  where: {
    classification: {
      path: ['domain'],
      equals: 'civilNegligence',
    },
  },
});

// Filter by nested JSON property
const urgentMatters = await prisma.matter.findMany({
  where: {
    classification: {
      path: ['urgency'],
      equals: 'critical',
    },
  },
});
```

## Migrations
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npx prisma migrate dev --name add_legal_hold_field

# Apply migrations
npx prisma migrate deploy
```

## Database URL Configuration
```bash
# .env (backend/)
DATABASE_URL="file:./dev.db"  # SQLite for development

# Production (PostgreSQL)
# DATABASE_URL="postgresql://user:password@localhost:5432/legal_db"
```

## Prisma Studio
```bash
# Open database GUI
npm run db:studio
```

## Connection Management
```typescript
// backend/src/server.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'], // Development logging
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.locals.prisma = prisma;
```

## Seeding (if needed)
```typescript
// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed initial data
  await prisma.matter.createMany({
    data: [
      { description: 'Sample matter 1', province: 'Ontario' },
      { description: 'Sample matter 2', province: 'BC' },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
