# Canadian Legal Assistant

Full-stack application for legal information and document generation (Ontario-first, Canada-wide).

> **⚠️ Legal Information Only** - This system provides legal information, not legal advice. Consult a licensed lawyer for complex matters.

## Architecture

- **Backend**: Express.js + TypeScript + Prisma + SQLite
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Core Library**: TypeScript modules (triage, evidence, documents, domains, audit, lifecycle)

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### Installation & Running

**1. Install all dependencies**:
```bash
npm install
cd backend && npm install && npm run db:push
cd ../frontend && npm install
```

**2. Start backend API** (Terminal 1):
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**3. Start frontend UI** (Terminal 2):
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

**4. Open browser**: http://localhost:5173

## Features

### 1. Matter Intake & Classification
- Describe legal issue (insurance, landlord/tenant, employment, etc.)
- Automatic domain classification and urgency assessment
- Forum routing (tribunal → court → alternative pathways)
- Multi-pathway presentation with legal authority citations

### 2. Evidence Management
- Upload files: PDF, PNG, JPG, EML, MSG, TXT
- Automatic metadata extraction and credibility scoring
- PII redaction (addresses, phone numbers, SIN, etc.)
- Timeline generation with gap detection
- Evidence indexing with cryptographic hashing

### 3. Document Generation
- Domain-specific templates (Insurance: complaint letters; L/T: LTB forms)
- Evidence-grounded drafting with user confirmation
- Standardized packages: drafts + manifests + timeline
- Source citations with URLs and retrieval dates

### 4. Data Lifecycle
- Export all data (matters, evidence, documents)
- Deletion with legal hold protection
- 60-day retention (configurable)
- Comprehensive audit logging

## Project Structure

```
legal/
├── backend/              # Express API server
│   ├── src/
│   │   ├── server.ts     # Main server
│   │   ├── routes/       # API endpoints (matters, evidence, documents, audit)
│   │   ├── middleware/   # Auth, validation, error handling
│   │   └── config.ts     # Environment configuration
│   ├── prisma/           # Database schema (SQLite)
│   └── package.json
├── frontend/             # React web UI
│   ├── src/
│   │   ├── App.tsx       # Main app with routing
│   │   ├── pages/        # HomePage, NewMatterPage, MatterDetailPage, etc.
│   │   ├── services/     # API client
│   │   └── main.tsx      # Entry point
│   └── package.json
└── src/                  # Core library (business logic)
    ├── core/
    │   ├── models/       # TypeScript interfaces
    │   ├── authority/    # Authority registry
    │   ├── evidence/     # Evidence processing
    │   ├── triage/       # Classification & routing
    │   ├── documents/    # Drafting & packaging
    │   ├── domains/      # Domain modules (insurance, L/T)
    │   ├── audit/        # Audit logging
    │   └── lifecycle/    # Data management
    ├── api/
    │   └── IntegrationAPI.ts  # Unified API wrapper
    └── data/             # Seed data (authorities)
```

## API Endpoints

### Matters
- `POST /api/matters` - Create matter
- `GET /api/matters` - List all matters
- `GET /api/matters/:id` - Get matter details
- `POST /api/matters/:id/classify` - Run triage classification
- `DELETE /api/matters/:id` - Delete matter (respects legal hold)

### Evidence
- `POST /api/evidence/:matterId` - Upload evidence file
- `GET /api/evidence/:matterId` - List evidence for matter
- `GET /api/evidence/:matterId/timeline` - Get chronological timeline

### Documents
- `POST /api/documents/:matterId/generate` - Generate document package
- `GET /api/documents/:matterId/documents` - List generated packages
- `GET /api/documents/:packageId` - Get specific package

### Audit
- `GET /api/audit?matterId=...&action=...` - Get audit events

## Testing

**Core library** (81 tests, 27 files):
```bash
npm test
```

**Security scanning**:
```bash
snyk code test
```

## Configuration

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
API_KEY_ENABLED=false
API_KEY=your-secret-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
DATABASE_URL="file:./prisma/dev.db"
```

**Frontend** (automatic proxy via Vite):
- Dev: Proxies `/api` to `http://localhost:3001`
- Prod: Set `VITE_API_BASE` environment variable

## Development

### GitHub Copilot

This repository includes customized [GitHub Copilot instructions](.github/copilot-instructions.md) to help AI assistants understand:
- Project-specific legal compliance requirements (UPL boundaries, disclaimers, citations)
- Architectural patterns (modular services, evidence handling, document generation)
- Development workflows and best practices

Additional instructions in [`.github/instructions/`](.github/instructions/) provide security scanning rules and other specialized guidance.

### Database Management
```bash
cd backend
npm run db:push      # Push schema changes to SQLite
npm run db:studio    # Open Prisma Studio (DB GUI)
npm run db:generate  # Regenerate Prisma Client
```

### Build for Production
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Core library
npm run build
```

## Compliance & Security

### Legal Boundaries
- **Information only**: No advice or recommendations
- **Multi-pathway**: Present options, not single "best" choice
- **Disclaimers**: Every output includes legal information disclaimer
- **Citations**: All authorities cited with URLs + retrieval dates

### Source Access Rules
- **Allowed**: CanLII API, e-Laws, Justice Laws (official sites only)
- **Prohibited**: Web scraping, database reconstruction, paywalled content
- **Enforcement**: Access logging, method validation, blocking

### Data Protection
- **PII redaction**: Automatic (addresses, phone, SIN, DOB, policy numbers)
- **Encryption**: HTTPS in transit (configure for production)
- **Audit logging**: All operations logged with timestamps
- **Legal hold**: Prevents deletion during active litigation
- **Retention**: 60-day default, extendable for legal matters

### Authentication (Optional)
- Set `API_KEY_ENABLED=true` in backend/.env
- Add `X-API-Key` header to API requests
- Future: OAuth/SSO integration

## Documentation

- **User Guide**: [USERGUIDE.md](USERGUIDE.md) - Comprehensive usage instructions
- **Design Spec**: `.kiro/specs/canadian-legal-assistant/design.md`
- **Requirements**: `.kiro/specs/canadian-legal-assistant/requirements.md`
- **Implementation Plan**: `.kiro/specs/canadian-legal-assistant/tasks.md`

## Status

**Completed** (Tasks 1-13):
- ✅ Core library (triage, evidence, documents, domains)
- ✅ Integration API
- ✅ Backend Express server with REST API
- ✅ React frontend with matter intake, evidence upload, document generation
- ✅ Database (Prisma + SQLite)
- ✅ 81 tests passing, 0 Snyk issues

**In Progress** (Task 14):
- Backend API and React UI implemented
- Ready for testing and refinement

**Next Steps** (Tasks 15-16):
- E2E user testing
- Accessibility compliance (WCAG 2.1 AA)
- Responsive design validation
- Final system checkpoint

## License

Private - Canadian Legal Assistant Project

## Support

For questions, issues, or feature requests, refer to project documentation or contact maintainers.
