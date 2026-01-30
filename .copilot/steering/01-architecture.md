# Architecture Patterns

## Monorepo Structure
```
legal/
├── src/              # Core library (shared, domain-agnostic)
│   ├── core/         # Domain models, business logic
│   ├── api/          # IntegrationAPI (facade)
│   └── data/         # Static data (authorities, etc.)
├── backend/          # Express REST API
├── frontend/         # React + Vite SPA
└── tests/            # Vitest unit tests
```

## Dependency Flow
```
Frontend → Backend API → IntegrationAPI → Core Library
                              ↓
                         Domain Modules
                              ↓
                    (MatterClassifier, ActionPlanGenerator,
                     DocumentPackager, TemplateLibrary, etc.)
```

## Core Library Principles
1. **Domain-agnostic interfaces:** Models in `src/core/models/`
2. **Extensible via domain modules:** Implement `BaseDomainModule`
3. **No framework dependencies:** Pure TypeScript
4. **Dependency injection:** All components accept dependencies in constructor
5. **Stateless operations:** No internal state mutation

## Backend Architecture
- **Express server:** Thin HTTP layer wrapping IntegrationAPI
- **Prisma ORM:** SQLite for persistence (Matter, Evidence, Document, AuditEvent)
- **Routes:** RESTful endpoints (`/api/matters`, `/api/evidence`, `/api/documents`, etc.)
- **Middleware:** API key auth (optional), error handling, CORS
- **File handling:** Multer uploads to `./uploads/:matterId/`

## Frontend Architecture
- **React Router 6:** Page-based routing (`/`, `/matters/new`, `/matters/:id`, etc.)
- **API service:** Centralized HTTP client (`frontend/src/services/api.ts`)
- **Component hierarchy:** Pages → Components → UI elements
- **State management:** React hooks (useState, useEffect) - no Redux needed
- **Responsive design:** Tailwind mobile-first (375px, 768px, 1024px+)

## Domain Module Pattern
```typescript
class MyDomainModule extends BaseDomainModule {
  domain = 'myDomain' as const;
  
  async buildDrafts(classification: MatterClassification): Promise<DocumentDraft[]> {
    // Use TemplateLibrary to render templates
    // Extract variables from classification
    // Return array of DocumentDraft objects
  }
}
```

## Integration Points
- **IntegrationAPI:** Single facade for all frontend operations
- **DomainModuleRegistry:** Register modules at server bootstrap
- **Dependency injection:** Pass shared services to modules (ActionPlanGenerator, LimitationPeriodsEngine, etc.)
