# TypeScript Standards

## Type Definitions

### Prefer Interfaces for Objects
```typescript
// ✅ Good
interface Matter {
  id: string;
  description: string;
  classification?: MatterClassification;
}

// ❌ Avoid (unless needed for unions)
type Matter = {
  id: string;
  description: string;
};
```

### Use Type for Unions/Aliases
```typescript
// ✅ Good
type Domain = 'criminal' | 'civilNegligence' | 'legalMalpractice' | 'consumerProtection' | 'landlordTenant' | 'employment' | 'insurance' | 'humanRights' | 'municipalPropertyDamage' | 'ocppFiling' | 'other';

type Province = 'Ontario' | 'BC' | 'Alberta' | /* ... */;

type Status = 'active' | 'archived' | 'deleted';
```

## Naming Conventions

### Interfaces
- PascalCase
- Descriptive noun phrases
- Avoid "I" prefix
```typescript
interface MatterClassification { /* ... */ }
interface DocumentDraft { /* ... */ }
interface EvidenceMetadata { /* ... */ }
```

### Types
- PascalCase for type aliases
- camelCase for type parameters
```typescript
type ActionPriority = 'urgent' | 'soon' | 'when-ready';

function map<T, U>(items: T[], fn: (item: T) => U): U[] { /* ... */ }
```

### Enums (Avoid)
Prefer string literal unions over enums:
```typescript
// ✅ Good
type Urgency = 'critical' | 'warning' | 'caution' | 'info';

// ❌ Avoid
enum Urgency {
  CRITICAL = 'critical',
  WARNING = 'warning',
}
```

## Strict Mode
All TypeScript files use strict mode:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

## Null Safety
```typescript
// ✅ Use optional chaining
const name = user?.profile?.name;

// ✅ Use nullish coalescing
const displayName = user?.name ?? 'Anonymous';

// ✅ Type guards
if (classification?.pillar) {
  // pillar is defined here
}

// ❌ Avoid non-null assertion unless absolutely certain
const name = user!.name; // Dangerous
```

## Type Assertions
```typescript
// ✅ Use 'as' syntax
const input = document.querySelector('input') as HTMLInputElement;

// ✅ Use type guards for runtime checks
function isMatterClassification(obj: unknown): obj is MatterClassification {
  return typeof obj === 'object' && obj !== null && 'domain' in obj;
}

// ❌ Avoid angle bracket syntax (conflicts with JSX)
const input = <HTMLInputElement>document.querySelector('input');
```

## Function Signatures
```typescript
// ✅ Explicit return types for public APIs
export function calculateCost(input: CostInput): CostEstimate {
  // ...
}

// ✅ Inferred return types for private/local functions
function formatDate(date: Date) {
  return date.toISOString();
}

// ✅ Async functions
async function fetchMatter(id: string): Promise<Matter> {
  // ...
}
```

## Generic Constraints
```typescript
// ✅ Constrain generics when needed
function processItems<T extends { id: string }>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  items.forEach(item => map.set(item.id, item));
  return map;
}
```

## Utility Types
```typescript
// ✅ Use built-in utility types
type PartialMatter = Partial<Matter>;
type RequiredMatter = Required<Matter>;
type ReadonlyMatter = Readonly<Matter>;
type MatterKeys = keyof Matter;
type MatterWithoutId = Omit<Matter, 'id'>;
type MatterIdOnly = Pick<Matter, 'id'>;
```

## Type Narrowing
```typescript
// ✅ Use discriminated unions
interface Success {
  status: 'success';
  data: Matter;
}

interface Error {
  status: 'error';
  message: string;
}

type Result = Success | Error;

function handleResult(result: Result) {
  if (result.status === 'success') {
    // TypeScript knows result.data exists
    console.log(result.data);
  } else {
    // TypeScript knows result.message exists
    console.error(result.message);
  }
}
```

## Import/Export Patterns
```typescript
// ✅ Named exports preferred
export interface Matter { /* ... */ }
export function createMatter() { /* ... */ }

// ✅ Barrel exports for public API
// src/index.ts
export * from './core/models';
export { IntegrationAPI } from './api/IntegrationAPI';

// ❌ Avoid default exports (except React components)
export default class MyClass { /* ... */ }
```

## Any Type (Avoid)
```typescript
// ❌ Avoid 'any'
function process(data: any) { /* ... */ }

// ✅ Use 'unknown' for truly unknown types
function process(data: unknown) {
  if (typeof data === 'string') {
    // Type narrowing required
  }
}

// ✅ Use generics for flexible types
function process<T>(data: T): T { /* ... */ }
```
