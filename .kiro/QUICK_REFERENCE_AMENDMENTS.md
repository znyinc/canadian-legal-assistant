# Quick Reference: Gap Analysis Amendments

## Files Modified ✅

```
.kiro/specs/canadian-legal-assistant/
├── requirements.md       (315 → 385 lines) +7 requirements (R20-R26)
├── design.md            (634 lines) expanded domain modules section  
└── tasks.md             (942 lines) reorganized with Tasks 26-42

.kiro/
├── SPECIFICATION_AMENDMENTS_SUMMARY.md    (NEW - 200+ lines)
└── AMENDMENT_COMPLETION_REPORT.md         (NEW - comprehensive report)
```

## New Requirements (R20-R26)

| Req | Domain | Key Topic | Statute/Deadline | Status |
|-----|--------|-----------|------------------|--------|
| R20 | Estate Law | Wills, probate, estate disputes | Succession Law Reform Act Part V, 6-month timeline | ✅ |
| R21 | Family Protection | Child protection (INFO-ONLY) | CYFSA, emergency routing | ✅ |
| R22 | Insolvency | Bankruptcy, consumer proposals | Bankruptcy & Insolvency Act (federal) | ✅ |
| R23 | Victim Services | CICB, victim compensation | CICB Act, victim programs | ✅ |
| R24 | Property Tax | Assessment appeals (ARB/MPAC) | Assessment Act, 45-day deadline | ✅ |
| R25 | Condominium | CAT disputes, board decisions | Condominium Act 1998, ~90 days | ✅ |
| R26 | Tort Law | Defamation, anti-SLAPP | CJA s.137.1, 6-week notice | ✅ |

## New Domain Modules (Tasks 26-32)

| Task | Domain Module | Hours | Status |
|------|---------------|-------|--------|
| 26 | EstateSuccessionLawDomainModule | 8h | 📋 Planned |
| 27 | ChildProtectionDomainModule (info-only) | 10h | 📋 Planned |
| 28 | DebtInsolvencyDomainModule | 8h | 📋 Planned |
| 29 | VictimCompensationDomainModule | 7h | 📋 Planned |
| 30 | PropertyTaxDomainModule | 7h | 📋 Planned |
| 31 | CondominiumDomainModule | 7h | 📋 Planned |
| 32 | Enhanced TortDomainModule (defamation) | 8h | 📋 Planned |

**Total Phase 1**: 55 hours (8 weeks)

## Technical Enhancements (Tasks 33-35)

| Task | Enhancement | Hours | Status |
|------|-------------|-------|--------|
| 33 | PWA - Offline Support | 10h | 📋 Planned |
| 34 | French Language Framework | 20h | 📋 Planned |
| 35 | PDF/A Accessibility | 12h | 📋 Planned |

**Total Phase 2**: 42 hours (6 weeks)

## Implementation Timeline

```
Phase 1: Gap Analysis Domains (Weeks 1-8, Tasks 26-32)
├─ Week 1-2: Estate & Child Protection modules
├─ Week 3-4: Debt & Victim Services modules  
├─ Week 5-6: Property Tax & Condominium modules
└─ Week 7-8: Defamation enhancement + integration

Phase 2: Technical Enhancements (Weeks 9-14, Tasks 33-35)
├─ Week 9-10: PWA offline support
├─ Week 11-12: French language framework
└─ Week 13-14: PDF/A accessibility

Phase 3: Forms Integration (Weeks 15-16, Task 36)
└─ Ontario government forms integration

Phase 4: AI Expansion (Weeks 17-26, Tasks 37-42)
└─ Comprehensive AI services & taxonomy
```

## Coverage Improvements

### Before
- **Domains**: 8 (Insurance, LTB, Municipal, Employment, Civil, Criminal, Consumer, Legal Malpractice)
- **Requirements**: 19 (R1-R19)
- **Coverage**: 85-90%

### After  
- **Domains**: 15+ (added Estate, Child Protection, Debt, Victim Services, Property Tax, CAT, Enhanced Defamation)
- **Requirements**: 26 (R1-R26)
- **Coverage**: ~95%

## Key Features Added

### R20: Estate & Succession
- Will challenge procedures (lack of capacity, undue influence, formalities)
- Probate administration timeline
- Estate trustee dispute resolution
- Dependant support claims (Part V procedures)
- Tax and debt implications

### R21: Child Protection (Information-Only ⚠️)
- **MANDATORY**: Information-only disclaimer
- CAS apprehension procedures
- Parental rights during investigation
- Court hearing procedures
- Duty counsel and legal aid routing
- Safety planning resources
- Mandatory reporting obligations

### R22: Debt & Insolvency
- Consumer proposals vs bankruptcy comparison
- Credit counseling prerequisites
- Licensed Insolvency Practitioner finder
- Discharge process and asset implications
- Creditor defence identification

### R23: Criminal Injuries Compensation
- CICB eligibility criteria
- Compensation categories (medical, earnings, counseling)
- Application procedures and deadlines
- Victim support programs (Ontario)
- Restitution orders in criminal proceedings
- Victim-offender mediation options

### R24: Property Tax Appeals
- Assessment Review Board (ARB) jurisdiction
- MPAC assessment challenge procedures
- 45-day appeal deadline from notice
- Evidence requirements (comparables, market analysis)
- Expert appraisal guidance
- Judicial review options

### R25: Condominium Authority Tribunal
- CAT jurisdiction and dispute types
- Pet policy disputes
- Parking and access disputes
- Record access rights
- Fee and special levy disputes
- Board decision appeals
- ~90-day mandatory dispute resolution

### R26: Defamation & Anti-SLAPP
- Defamation elements and defenses (truth, opinion, privilege)
- 6-week media notice requirement under Libel and Slander Act
- Anti-SLAPP motion procedures (CJA s.137.1)
- Two-step test for SLAPP relief
- Digital/social media defamation
- Cost award risks and damages assessment
- Platform liability distinctions

## Design Modules Expanded

### New Categories
✅ Estate & Succession Law (will challenges, probate, estate disputes, dependant support)  
✅ Consumer & Debt Management (consumer protection, debt, credit, insolvency)  
✅ Property & Municipal Law (condos, property tax, municipal code)  
✅ Victim & Compensation Services (CICB, victim support, civil remedies)  

### Enhanced Categories
✅ Tort Law: Added defamation (anti-SLAPP), occupiers' liability, professional negligence, medical malpractice  
✅ Contract Law: Added construction liens, real estate disputes, shareholder agreements  
✅ Criminal Law: Added CICB, victim services, peace bonds (810 orders), criminal procedure  
✅ Administrative Law: Added property tax appeals (ARB), tribunal procedures  

## Acceptance Criteria Format

All 7 new requirements follow consistent format with 7 acceptance criteria each:

```
### Requirement X

**User Story:** As [user type], I want [feature], so that [benefit].

#### Acceptance Criteria

1. WHEN [trigger], THE System SHALL [requirement]
2. WHEN [trigger], THE System SHALL [requirement]
3. WHEN [trigger], THE System SHALL [requirement]
4. WHEN [trigger], THE System SHALL [requirement]
5. WHEN [trigger], THE System SHALL [requirement]
6. WHEN [trigger], THE System SHALL [requirement]
7. WHERE [special case], THE System SHALL [requirement]
```

## Statutory References

✅ **R20**: Succession Law Reform Act (Part V - dependant support), Rules of Civil Procedure  
✅ **R21**: Children and Family Services Act (CYFSA), family law procedures  
✅ **R22**: Bankruptcy and Insolvency Act (federal jurisdiction), consumer proposals (ss.66-66.38)  
✅ **R23**: CICB Act, victim services legislation, restitution procedures  
✅ **R24**: Assessment Act, Assessment Review Board procedures, MPAC role  
✅ **R25**: Condominium Act, 1998, CAT procedures  
✅ **R26**: Courts of Justice Act s.137.1 (anti-SLAPP), Libel and Slander Act (media notice)  

## UPL Compliance Notes

- **R21**: Marked as **"Information-Only"** with mandatory disclaimers throughout
- All requirements include professional consultation triggers
- All requirements maintain information-only boundaries
- No requirements provide legal advice
- All requirements include escalation pathways
- All requirements reference authoritative sources

## Next Steps for Implementation

1. **Stakeholder Review** (Week 1)
   - Review R20-R26 for accuracy and completeness
   - Validate UPL compliance (especially R21)
   - Approve implementation timeline

2. **Phase 1 Development** (Weeks 1-8)
   - Create 7 new domain modules
   - Build 30+ specialized templates
   - Add statutory deadline tracking
   - Implement specialized routing

3. **Testing** (Ongoing)
   - Unit tests for each domain module
   - E2E tests for new legal scenarios
   - Accessibility validation (WCAG 2.1 AA)
   - Snyk security scans

4. **Documentation** (Ongoing)
   - Update USERGUIDE.md with new domains
   - Create domain-specific help docs
   - Add new legal references to bibliography

## Files for Reference

📄 **SPECIFICATION_AMENDMENTS_SUMMARY.md** - Comprehensive amendment documentation  
📄 **AMENDMENT_COMPLETION_REPORT.md** - Detailed completion report with verification  
📄 **requirements.md** - Updated with R20-R26 (385 lines)  
📄 **design.md** - Expanded domain modules section (634 lines)  
📄 **tasks.md** - Reorganized with Tasks 26-42 (942 lines)  
📄 **gap-analysis-report.md** - Original gap analysis document (reference)  
📄 **kiro-ontario-legal-assistant.yaml** - System specification (reference)  

---

**Status**: ✅ All amendments complete and documented  
**Date**: December 30, 2025  
**Next Phase**: Phase 1 Implementation (Tasks 26-32)
