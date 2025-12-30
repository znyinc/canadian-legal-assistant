# Specification Amendments Summary
**Date**: 2025-12-30  
**Status**: Complete  
**Amendments Based On**: Gap Analysis Report + YAML Specification Reference

## Overview
This document summarizes all amendments made to the Canadian Legal Assistant specification files (requirements.md, design.md, tasks.md) to address gaps identified in the comprehensive gap analysis report. The amendments expand system coverage from 85-90% to ~95% of Ontario legal scenarios while maintaining UPL compliance and empathy-focused design.

## Files Amended

### 1. Requirements.md (330 → 630 lines)
**Change Type**: Addition of 7 new requirements (R20-R26)

#### Added Requirements

**R20: Wills, Estates & Probate**
- Domain: Estate & Succession Law
- Scope: Will challenge procedures, estate administration, probate timelines, dependant support claims
- Statutory References: Succession Law Reform Act Part V, Rules of Civil Procedure
- Key Deadline: 6-month probate timeline, dependant support claim window
- Status: ✅ Added with full acceptance criteria (7 criteria)

**R21: Child Protection Information Module**
- Domain: Family Protection (Information-Only)
- Scope: CYFSA procedures, CAS apprehension, court procedures, parent rights
- Key Feature: **MANDATORY DISCLAIMER** - Information-only, not legal advice
- Statutory References: Children and Family Services Act (CYFSA)
- Status: ✅ Added with information-only emphasis (7 criteria)

**R22: Debt & Insolvency**
- Domain: Debt Management & Insolvency
- Scope: Bankruptcy, consumer proposals, Licensed Insolvency Practitioner engagement, creditor defenses
- Statutory References: Bankruptcy and Insolvency Act (federal jurisdiction)
- Key Components: Credit counseling prerequisites, discharge implications
- Status: ✅ Added (7 criteria)

**R23: Criminal Injuries Compensation Board**
- Domain: Victim Compensation & Services
- Scope: CICB eligibility, compensation categories, victim support services, civil remedies
- Key Features: Victim-offender mediation, restitution orders, victim impact statements
- Statutory References: CICB Act, victim services legislation
- Status: ✅ Added (7 criteria)

**R24: Property Tax Appeals & MPAC**
- Domain: Property & Municipal Law
- Scope: Assessment Review Board (ARB) procedures, MPAC challenges, evidence requirements
- Key Deadline: 45 days from assessment notice
- Statutory References: Assessment Act, ARB procedures
- Status: ✅ Added (7 criteria)

**R25: Condominium Authority Tribunal**
- Domain: Property & Condominium Law
- Scope: CAT jurisdiction, dispute types (pet, parking, records, fees), board decisions
- Statutory References: Condominium Act, 1998, CAT Act
- Key Timeline: Mandatory dispute resolution (typically 90 days)
- Status: ✅ Added (7 criteria)

**R26: Defamation & Anti-SLAPP**
- Domain: Tort Law (Enhanced)
- Scope: Defamation elements/defenses, anti-SLAPP motion procedures, media notice requirements, digital defamation
- Statutory References: Courts of Justice Act s.137.1, Libel and Slander Act
- Key Feature: **6-week media notice requirement** with procedural impact
- Status: ✅ Added (7 criteria)

### 2. Design.md (778 → 900+ lines)
**Change Type**: Expansion of Domain Modules section

#### Domain Module Enhancements

**Tort Law Expansion**:
- Added: defamation (including anti-SLAPP), occupiers' liability, professional negligence, medical malpractice
- Previous: negligence, intentional torts, strict liability, privacy torts
- Result: More comprehensive tort coverage with specialized categories

**Contract Law Expansion**:
- Added: construction liens, real estate purchase disputes, shareholder agreements
- Previous: breach, remedies, limitation periods, commercial disputes
- Result: Specialized contract dispute handling

**Criminal Law Expansion**:
- Added: CICB, victim services, peace bonds (810 orders), criminal procedure details
- Previous: summary/indictable offences, court processes
- Result: Comprehensive victim support and specialized procedures

**Administrative Law Expansion**:
- Added: property tax appeals (ARB/MPAC), tribunal procedures
- Previous: judicial review, statutory appeals, regulatory compliance
- Result: Specific property tax and assessment challenge procedures

**New Domain Categories Added**:

1. **Estate & Succession Law**
   - Wills & Probate: Estate administration, will challenges, grant of probate
   - Estate Disputes: Estate trustee disputes, interpretation disputes, creditor claims
   - Dependant Support Claims: Petition procedures, eligibility, calculation

2. **Consumer & Debt Management**
   - Consumer Protection: Service refunds, warranty claims, unfair practices (Consumer Protection Ontario)
   - Debt & Insolvency: Bankruptcy, consumer proposals, Licensed Insolvency Practitioner
   - Credit & Collections: Dispute resolution, creditor/debtor protections

3. **Property & Municipal Law**
   - Condominium Law: CAT disputes, pet policies, parking, record access, assessments
   - Property Tax Appeals: ARB procedures, MPAC challenges, evidence requirements
   - Municipal Law: Code enforcement, bylaw disputes, property standards

4. **Victim & Compensation Services**
   - Criminal Injuries Compensation: CICB eligibility, application, victim support
   - Victim Services: Ontario victim programs, counseling, safety planning
   - Civil Remedies for Crime Victims: Options for civil suits against perpetrators

**Authority Database Expansion**:
- Added provincial regulators: Assessment Review Board, CAT, Victim Services Agencies
- Added specialized bodies: Patient Ombudsman, Financial Services Ombudsman
- Enhanced tribunal systems with victim-specific pathways

### 3. Tasks.md (952 → 1,100+ lines)
**Change Type**: Reorganization and expansion of implementation roadmap

#### Task Structure Reorganization

**Renamed Section**: "Ontario Government Forms Integration" → "Gap Analysis Implementation (Tasks 26-31)"
- Reframed to emphasize gap analysis-driven development
- Expanded scope from single task to 6 parallel domain modules + technical enhancements

**New Task Phases**:

**Phase 1: Gap Analysis Implementation (Tasks 26-32, 8 weeks)**

- **Task 26: Estate & Succession Law** (8 hours)
  - EstateSuccessionLawDomainModule
  - 4 templates (will challenge, probate, estate dispute, dependant support)
  - Succession Law Reform Act Part V integration
  - Court routing to Ontario Superior Court
  
- **Task 27: Child Protection Information Module** (10 hours)
  - ChildProtectionDomainModule with information-only disclaimer
  - 5 templates (CAS apprehension, parent rights, hearing procedures, legal aid, safety planning)
  - Mandatory information-only warnings throughout
  - Emergency duty counsel and CAS routing
  
- **Task 28: Debt & Insolvency Module** (8 hours)
  - DebtInsolvencyDomainModule
  - 5 templates (consumer proposal, bankruptcy, credit counseling, LIP locator, creditor defense)
  - Bankruptcy and Insolvency Act Part references
  - Licensed Insolvency Practitioner finder integration
  
- **Task 29: Criminal Injuries Compensation Module** (7 hours)
  - VictimCompensationDomainModule
  - 4 templates (CICB eligibility, application, victim services, civil suit options)
  - Ontario victim support resource network
  - Safe routing for disclosed crime victims
  
- **Task 30: Property Tax Appeals & MPAC Module** (7 hours)
  - PropertyTaxDomainModule
  - 5 templates (appeal explanation, ARB procedures, evidence requirements, expert guidance, judicial review)
  - 45-day appeal deadline integration
  - Comparable property search guidance
  
- **Task 31: Condominium Authority Tribunal Module** (7 hours)
  - CondominiumDomainModule
  - 5 templates (CAT jurisdiction, dispute resolution, pet/parking/records/fees)
  - Condominium Act, 1998 integration
  - Evidence requirements checklist
  
- **Task 32: Enhanced Defamation & Anti-SLAPP Module** (8 hours)
  - Enhance existing TortDomainModule
  - 6 templates (elements/defenses, media notice, anti-SLAPP procedures, SLAPP relief test, digital defamation, costs/damages)
  - Courts of Justice Act s.137.1 implementation
  - Media defendant 6-week notice requirement
  - Cost award risk assessment

**Phase 2: Technical Enhancements (Tasks 33-35, 6 weeks)**

- **Task 33: Progressive Web App (PWA) Support** (10 hours)
  - Service worker for offline caching
  - Offline matter intake and evidence storage
  - manifest.json for installable PWA
  - Offline sync status indicators

- **Task 34: French Language Framework** (20 hours)
  - i18n framework implementation (React Intl)
  - French UI/template translations
  - French legal references (Quebec, federal bilingual)
  - French court/tribunal information

- **Task 35: PDF Accessibility & AODA Compliance** (12 hours)
  - PDF/A-1b format generation
  - Tagged PDF structure (headings, lists, form fields)
  - OCR for scanned documents
  - Accessibility metadata

**Phase 3: Ontario Forms Integration (Task 36, 2 weeks)**

- **Task 36: Ontario Government Forms Integration** (12 hours)
  - Central Forms Repository links
  - Form preparation wizards
  - Evidence-to-form-field mapping
  - Supporting document packages with UPL compliance

**Phase 4: AI Integration Expansion (Tasks 37-42, 12 weeks)**

- **Task 37**: Expanded Legal Taxonomy (15+ domains)
- **Task 38**: Enhanced Authority & Forum Database
- **Task 39-40**: Advanced AI Services (legal research, document generation)
- **Task 41-42**: Core principle maintenance (UPL, empathy, Ontario-first, evidence-grounded)

## Impact Analysis

### Coverage Expansion
- **Before**: 8 domain modules + 85-90% scenario coverage
- **After**: 15+ domain modules + ~95% scenario coverage
- **Added Domains**: 7 new areas (estates, child protection, debt, victim services, property tax, condos, enhanced defamation)

### Requirement Growth
- **Before**: 19 requirements (R1-R19)
- **After**: 26 requirements (R1-R26)
- **New Requirements**: R20-R26 (7 major new areas)

### Task Structure
- **Before**: 25 completed tasks + 8 pending (Tasks 26-33)
- **After**: 25 completed tasks + 17 new implementation tasks (Tasks 26-42)
- **Implementation Roadmap**: 26 weeks phased rollout (Phases 1-4)

### Legal Scenario Coverage by Pillar

**Criminal Law**: Enhanced with victim services, CICB, peace bonds
**Civil Law**: Added 5 new domains (estates, property tax, condos, consumer, debt)
**Administrative Law**: Enhanced with property tax and assessment procedures
**Quasi-Criminal**: No changes (remains covered by existing framework)

## Key Amendments by Category

### Statutory & Procedural Coverage
✅ Succession Law Reform Act Part V (R20)  
✅ Children and Family Services Act (R21, information-only)  
✅ Bankruptcy and Insolvency Act (R22)  
✅ CICB Act & victim services legislation (R23)  
✅ Assessment Act & ARB procedures (R24)  
✅ Condominium Act, 1998 (R25)  
✅ Courts of Justice Act s.137.1 anti-SLAPP (R26)  

### Procedural Deadlines Added
✅ 6-month estate probate timeline (R20)  
✅ 45-day property tax appeal deadline (R24)  
✅ 6-week media notice requirement (R26)  
✅ CAT mandatory dispute resolution (~90 days) (R25)  

### Specialized Routing Added
✅ Licensed Insolvency Practitioner finder (R22)  
✅ Ontario victim services network (R23)  
✅ Assessment Review Board expertise (R24)  
✅ CAT-specialized tribunal routing (R25)  
✅ Defamation/media law specialist routing (R26)  

### Information-Only Boundaries
✅ R21 (child protection) with mandatory disclaimers  
✅ Enhanced UPL compliance language in all new domains  
✅ Professional consultation triggers throughout  

## Design Consistency

All amendments maintain:
- **UPL Compliance**: Strict information-only boundaries with professional consultation triggers
- **Empathy-Focused Design**: Action-first presentation, plain language, anxiety reduction
- **Ontario-First Approach**: Emphasis on Ontario laws while acknowledging national scope
- **Evidence-Grounded Outputs**: All guidance based on user evidence or user-confirmed information
- **Accessibility Standards**: WCAG 2.1 AA compliance maintained across all new content
- **Template Library Approach**: Specialized domain templates with variable interpolation
- **Statutory Citations**: All legal guidance tied to specific Ontario/Canadian statutes

## Next Steps

1. **Phase 1 Implementation** (Tasks 26-32):
   - Create domain modules for new legal areas
   - Implement 30+ new legal templates
   - Add statutory deadline tracking
   - Create specialized routing pathways

2. **Phase 2 Implementation** (Tasks 33-35):
   - PWA offline support for low-connectivity users
   - French language support for bilingual compliance
   - PDF/A accessibility for generated documents

3. **Phase 3 Implementation** (Task 36):
   - Integrate official Ontario government forms
   - Create form preparation wizards
   - Build supporting document packages

4. **Phase 4 Implementation** (Tasks 37-42):
   - Comprehensive AI taxonomy expansion
   - Enhanced authority database
   - Advanced AI services (legal research, document generation)

## Gap Analysis Alignment

This amendment directly addresses all critical gaps identified in gap-analysis-report.md:

| Gap | Addressed By | Status |
|-----|--------------|--------|
| Missing Wills/Estate domain | R20, Task 26 | ✅ Added |
| Missing Child Protection | R21, Task 27 | ✅ Added (info-only) |
| Missing Debt/Insolvency | R22, Task 28 | ✅ Added |
| Missing CICB/Victim Services | R23, Task 29 | ✅ Added |
| Missing Property Tax Appeals | R24, Task 30 | ✅ Added |
| Missing CAT Condos | R25, Task 31 | ✅ Added |
| Under-specified Defamation | R26, Task 32 | ✅ Enhanced |
| PWA Support | Task 33 | ✅ Planned |
| French Language | Task 34 | ✅ Planned |
| PDF Accessibility | Task 35 | ✅ Planned |

## Conclusion

The specification amendments comprehensively address all identified gaps while maintaining the Canadian Legal Assistant's core mission of serving as a compassionate navigator for legal newcomers. The phased implementation roadmap (26 weeks) provides a structured approach to expanding coverage from 85-90% to ~95% of Ontario legal scenarios, with maintained focus on UPL compliance, empathy-focused design, and evidence-grounded outputs.

The amended specifications are now ready for Phase 1 implementation (Gap Analysis Resolution: Tasks 26-32).
