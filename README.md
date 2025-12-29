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

### What pillars mean
- **Criminal**: Offences prosecuted by the state (e.g., assault, theft). Burden: beyond a reasonable doubt. Seek police/lawyer help for urgent risk.
- **Civil**: Disputes between parties for money or specific performance (e.g., negligence, contracts). Burden: balance of probabilities.
- **Administrative**: Tribunal or regulator processes (e.g., LTB, HRTO, licensing). Burden: often balance of probabilities or statute-specific tests.
- **Quasi-criminal**: Regulatory/by-law offences (e.g., tickets, provincial offences). Burden: statute-specific, can include penalties.
- **Unknown/ambiguous**: Provide more facts. When unsure or facing deadlines, contact a lawyer or community legal clinic.
- Examples: “Slip and fall at a store” → Civil; “By-law ticket + assault” → Ambiguous (Quasi-criminal + Criminal).

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
- **10 Domain Modules**: Insurance, Landlord/Tenant, Employment, Civil Negligence, Municipal Property Damage, Criminal (info-only), OCPP Filing, Tree Damage Classifier, Consumer Protection, + generic
- Domain-specific templates:
  - **Insurance**: Complaint letters, ombudsman submissions, regulator complaints
  - **Landlord/Tenant**: LTB intake checklists, notices, evidence packs
  - **Employment**: MOL complaint guidance, ESA vs wrongful dismissal routing, severance templates
  - **Civil Negligence**: Demand notice, Small Claims Form 7A scaffold, evidence checklist
  - **Municipal**: 10-day notice templates, municipal property damage guidance
  - **Criminal**: Victim services guide, complainant role explanation, evidence checklist (informational only)
  - **Consumer Protection**: CPO complaint guide, chargeback request guide, service dispute letter, unfair practice documentation
  - **OCPP Filing**: Toronto Region PDF/A compliance validation
- Municipal 10-day notice detection: auto-flags tree/property damage requiring municipal notice
- Quick actions: "Generate Form 7A" button for civil negligence matters
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
    │   ├── models/       # TypeScript interfaces (11 domain types)
    │   ├── authority/    # Authority registry (Ontario + federal)
    │   ├── evidence/     # Evidence processing, PII redaction, timeline generation
    │   ├── triage/       # Classification, pillar detection, forum routing, journey tracking
    │   ├── documents/    # Drafting engine, document packager
    │   ├── domains/      # 10 domain modules (insurance, L/T, employment, civil, municipal, criminal, consumer, OCPP, tree damage, generic)
    │   ├── actionPlan/   # Action plan generator (action-first UX)
    │   ├── language/     # Plain language translator, readability scorer, term dictionary
    │   ├── limitation/   # Limitation periods engine (12 Ontario periods)
    │   ├── cost/         # Cost calculator, fee waiver guidance
    │   ├── ocpp/         # OCPP validator (Toronto Region PDF/A compliance)
    │   ├── upl/          # UPL compliance, disclaimers, A2I Sandbox framework
    │   ├── audit/        # Audit logging, manifest builder
    │   ├── lifecycle/    # Data lifecycle manager (export, delete, retention)
    │   └── caselaw/      # CanLII client, citation formatter
    ├── api/
    │   └── IntegrationAPI.ts  # Unified API wrapper (intake, evidence, documents, lifecycle)
    └── data/             # Seed data (authorities: ON-SMALL, ON-SC, ON-OCJ, LTB, HRTO, etc.)
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

**Core library** (327 tests, 51 files):
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

**Production Ready** (Tasks 1-24 Complete):
- ✅ Core library with 10 domain modules (insurance, L/T, employment, civil, municipal, criminal, consumer, OCPP, tree damage, generic)
- ✅ Integration API with evidence processing, document generation, lifecycle management
- ✅ Backend Express server with REST API (matters, evidence, documents, audit, caselaw, export endpoints)
- ✅ Full-stack React UI with action-first UX:
  - Matter intake & automatic classification
  - Evidence upload with drag-drop, timeline generation, gap detection
  - Document generation with domain-specific templates
  - Case law search (CanLII integration)
  - Data export/delete with legal hold protection
  - Audit log viewer
- ✅ Ontario Legal Navigator features:
  - Four Pillars classification (Criminal, Civil, Administrative, Quasi-Criminal)
  - Five-stage journey tracker (Understand → Options → Prepare → Act → Resolve)
  - Plain language translation (30+ legal terms with tooltips)
  - Limitation periods engine (12 Ontario periods with deadline alerts)
  - Cost calculator with fee waiver guidance
  - Action plan generator with empathetic messaging
- ✅ October 2025 Ontario Court Reforms:
  - Small Claims Court limit raised to $50,000
  - OCPP validation for Toronto Region filings (PDF/A format, naming conventions)
  - Comprehensive PDF/A conversion guide
- ✅ Database (Prisma + SQLite) with pillar fields and journey tracking
- ✅ **327 tests passing** (51 test files), 0 Snyk high-severity issues
- ✅ E2E testing with Playwright (5 E2E specs: golden-path, journey, pillar, action-plan)
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Responsive design (mobile 375px+, tablet 768px+, desktop 1024px+)
- ✅ UPL compliance with Safe Harbor language and multi-pathway presentation
- ✅ A2I Sandbox preparation framework

**System Capabilities**:
- 10 domain modules covering Ontario's most common legal issues
- Action-first UX with 6 React components (acknowledgment, immediate actions, role explainer, pathways, warnings, next steps)
- Empathy-focused design with encouraging language and anxiety reduction
- Complete audit trail with SHA-256 hashing and source tracking
- Legal hold support for active litigation
- 60-day retention with configurable extensions

## License

Private - Canadian Legal Assistant Project

## Support

For questions, issues, or feature requests, refer to project documentation or contact maintainers.
