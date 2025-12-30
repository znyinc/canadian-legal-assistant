# Phase 1 Quick Reference: Domain Modules at a Glance

**Implementation Roadmap:** 55 hours, 7 domain modules, 40+ YAML scenarios

---

## Task 26: EstateSuccessionLawDomainModule ⏱️ 8 Hours

**What:** Wills, estate disputes, and dependant support claims  
**Ontario Statute:** *Succession Law Reform Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `will_challenge`, `dependant_support_claim`, `estate_administration` |
| **Limitation Period** | 2 years from death (or more for discovery) |
| **Key Documents** | 6 (will analysis, court petition scaffold, evidence checklist, etc.) |
| **Tests** | 6 unit tests |
| **Complexity** | Medium (clear Ontario statutory framework) |

**Key Points:**
- Will challenge grounds: undue influence, lack of capacity, formal defects
- Dependant support: Succession Law Reform Act Part V, 6-month deadline
- Estate disputes: trustee duties, beneficiary remedies, fiduciary breaches

**Start Date:** Week 1, Day 1

---

## Task 27: ChildProtectionDomainModule ⏱️ 10 Hours

**⚠️ CRITICAL:** INFORMATION-ONLY with explicit UPL boundaries

**What:** CAS procedures, parental rights, child protection court  
**Ontario Statute:** *Child and Family Services Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `child_protection` (apprehension, court, parental rights) |
| **Limitation Period** | N/A (Crown-directed, not civil limitation) |
| **Key Documents** | 5 (apprehension procedures, parental rights, hearing guide, etc.) |
| **Tests** | 8+ unit tests **+ UPL compliance testing** |
| **Complexity** | High (UPL boundary emphasis) |

**Key Points:**
- ⚠️ MANDATORY: Provide ONLY information, not legal advice
- Explain apprehension procedures and parental acknowledgment rights
- Include CAS contact info and duty counsel information
- Legal aid eligibility must be clearly explained
- Domestic violence and child abuse mandatory reporting obligations

**Special Requirements:**
- Requires 2 additional hours for boundary testing
- Create dedicated UPL compliance test suite
- Ensure disclaimers appear on every page
- No recommendations for specific lawyer or approach

**Start Date:** Week 1, Day 5

---

## Task 28: DebtInsolvencyDomainModule ⏱️ 8 Hours

**What:** Bankruptcy, consumer proposals, debt defense  
**Federal Statute:** *Bankruptcy and Insolvency Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `bankruptcy`, `consumer_proposal`, `debt_defense` |
| **Limitation Period** | Creditors 6 years, Crown 10 years |
| **Key Documents** | 5 (LIP routing, proposal guide, creditor rights, bankruptcy guide, etc.) |
| **Tests** | 7 unit tests |
| **Complexity** | Medium (federal jurisdiction, clear procedures) |

**Key Points:**
- Consumer proposal vs. bankruptcy distinction
- Licensed Insolvency Practitioner (LIP) role and credentials
- Discharge process timeline (0-9 years based on circumstances)
- Credit counseling as prerequisite
- Creditor objection grounds (fraud, undisclosed debts)

**Key Documents Include:**
1. Insolvency overview (when to consider)
2. Licensed Insolvency Practitioner routing
3. Consumer proposal process and approval requirements
4. Bankruptcy procedures and discharge timeline
5. Creditor rights and objection procedures

**Start Date:** Week 2, Day 1

---

## Task 29: VictimCompensationDomainModule ⏱️ 7 Hours

**What:** Criminal Injuries Compensation Board and victim services  
**Ontario Statute:** *Criminal Injuries Compensation Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `crime_victim_compensation`, `civil_suit_from_crime` |
| **Limitation Period** | 2-year application deadline from incident |
| **Key Documents** | 4 (CICB eligibility, application guide, victim services, civil suit info) |
| **Tests** | 6 unit tests |
| **Complexity** | Medium (clear eligibility criteria) |

**Key Points:**
- CICB eligibility criteria (victim status, injury, police cooperation)
- Compensation categories: medical, earnings loss, counseling, pain & suffering
- 2-year application deadline (critical)
- Victim support program integration (Ontario services, safety planning)
- Civil suit options when CICB compensation insufficient
- Victim-offender mediation procedures
- Restitution orders in criminal proceedings

**Key Documents Include:**
1. CICB eligibility assessment
2. Application procedures and evidence requirements
3. Victim support services directory (Ontario)
4. Civil suit options against perpetrators

**Start Date:** Week 2, Day 3

---

## Task 30: PropertyTaxDomainModule ⏱️ 7 Hours

**What:** Property tax appeals and Assessment Review Board  
**Ontario Statute:** *Assessment Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `property_tax_appeal` |
| **Limitation Period** | 45 days from assessment notice (CRITICAL) |
| **Key Documents** | 4 (ARB procedures, MPAC challenge, evidence requirements, appeal guide) |
| **Tests** | 6 unit tests |
| **Complexity** | Medium (clear Ontario procedural framework) |

**Key Points:**
- Assessment Review Board (ARB) jurisdiction and procedure
- MPAC (Municipal Property Assessment Corporation) assessment methodology
- 45-day appeal deadline (CRITICAL)
- Evidence requirements: comparable properties, market conditions, defects
- Expert appraisal and assessment comparables
- Judicial review options for ARB appeals
- Distinguished from tax billing disputes (different process)

**Key Documents Include:**
1. ARB jurisdiction and 45-day deadline guide
2. MPAC assessment challenge procedures
3. Evidence preparation (comparables, expert appraisals, market analysis)
4. Judicial review option for ARB appeals

**Start Date:** Week 2, Day 5

---

## Task 31: CondominiumDomainModule ⏱️ 7 Hours

**What:** Condo disputes and Condominium Authority Tribunal  
**Ontario Statute:** *Condominium Act, 1998*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `condo_disputes` (pets, parking, records, fees) |
| **Limitation Period** | ~90-day mandatory dispute resolution timeline |
| **Key Documents** | 4 (CAT jurisdiction guide, DRS procedures, fee disputes, bylaw challenges) |
| **Tests** | 6 unit tests |
| **Complexity** | Medium (clear tribunal framework) |

**Key Points:**
- CAT jurisdiction and applicable dispute types
- Pet policy, parking, records access, fee disputes, architectural changes
- ~90-day mandatory dispute resolution process
- Owner rights regarding assessment validity and procedures
- Condominium document access rights (Cond. Act s.18)
- Grounds for challenging rules, bylaws, and board determinations
- Fee and special levy dispute procedures

**Key Documents Include:**
1. CAT jurisdiction and dispute type identification
2. Mandatory dispute resolution procedures (~90 days)
3. Fee and special levy dispute analysis
4. Owner document access rights and board decision appeals

**Start Date:** Week 3, Day 1

---

## Task 32: DefamationAntiSLAPPDomainModule ⏱️ 8 Hours

**What:** Defamation law, anti-SLAPP motions, media liability  
**Ontario Statutes:** *Courts of Justice Act* s.137.1, *Libel and Slander Act*

| Aspect | Details |
|--------|---------|
| **YAML Scenarios** | `libel_slander` (including anti-SLAPP procedures) |
| **Limitation Period** | 6-week media notice (if applicable) + 2-year discovery |
| **Key Documents** | 6 (defamation elements, defenses, anti-SLAPP motion, media notice, damages, digital) |
| **Tests** | 8 unit tests |
| **Complexity** | High (complex two-step test, case law dependent) |

**Key Points:**
- Defamation elements: false statement, reputation harm, publication, damages
- Available defenses: truth, opinion, privilege, fair reporting
- 6-week media notice requirement (Libel and Slander Act) - CRITICAL
- Anti-SLAPP motion procedures (CJA s.137.1) - two-step test:
  1. Defamation claim no reasonable prospect of success?
  2. Public interest balance in proceeding?
- Digital platform and social media defamation distinctions
- Platform liability vs. user liability
- Compensatory vs. aggravated/punitive damages
- Cost award risks in defamation cases

**Key Documents Include:**
1. Defamation elements and available defenses
2. Media notice procedures and 6-week deadline
3. Anti-SLAPP motion procedure and two-step test
4. Damages assessment and cost award risks
5. Digital platform and social media considerations
6. Judicial precedents for anti-SLAPP applications

**Reference Cases for Implementation:**
- *Potweed v. Ontario*, 2014 ONCA 151 (anti-SLAPP landmark)
- *Atos Finance v. Sapient Canada*, 2015 ONCA 516 (anti-SLAPP refinement)

**Start Date:** Week 3, Day 3

---

## Implementation Timeline

```
WEEK 1 (20 hours)
├─ Task 26: EstateSuccessionLawDomainModule (8h) ........... COMPLETE
├─ Task 27: ChildProtectionDomainModule (10h) ............. COMPLETE
│           (includes 2h UPL compliance testing)
└─ Task 28: DebtInsolvencyDomainModule (2h start) .......... STARTED

WEEK 2 (20 hours)
├─ Task 28: DebtInsolvencyDomainModule (6h continued) ...... COMPLETE
├─ Task 29: VictimCompensationDomainModule (7h) ........... COMPLETE
└─ Task 30: PropertyTaxDomainModule (7h) .................. COMPLETE

WEEK 3 (15 hours)
├─ Task 31: CondominiumDomainModule (7h) .................. COMPLETE
├─ Task 32: DefamationAntiSLAPPDomainModule (8h) .......... COMPLETE
└─ Integration Testing & Deadline Validation .............. PARALLEL

TOTAL: 55 HOURS ACROSS 7 MODULES
```

---

## Testing Summary

| Task | Unit Tests | UPL Tests | Integration Tests | Total |
|------|-----------|-----------|------------------|-------|
| 26 (Estate) | 6 | - | - | 6 |
| 27 (Child) | 8 | 2+ | - | 10+ |
| 28 (Debt) | 7 | - | - | 7 |
| 29 (Victim) | 6 | - | - | 6 |
| 30 (Tax) | 6 | - | - | 6 |
| 31 (Condo) | 6 | - | - | 6 |
| 32 (Defamation) | 8 | - | - | 8 |
| **TOTAL** | **47** | **2+** | **1+** | **50+** |

---

## Ontario Statutes Referenced

| Task | Primary Statute | Section | Key Concept |
|------|---|---|---|
| 26 | Succession Law Reform Act | Part V | Dependant support claims |
| 27 | Child and Family Services Act | - | CAS procedures |
| 28 | Bankruptcy and Insolvency Act | ss.66-66.38 | Consumer proposals |
| 29 | Criminal Injuries Compensation Act | - | CICB eligibility |
| 30 | Assessment Act | ss.40, 43 | ARB appeals |
| 31 | Condominium Act 1998 | s.18 | Owner document rights |
| 32 | Courts of Justice Act | s.137.1 | Anti-SLAPP motions |
| 32 | Libel and Slander Act | s.5 | 6-week media notice |

---

## Critical Deadlines to Track

| Task | Deadline | Duration | Consequence |
|------|----------|----------|-------------|
| 26 | None (civil discovery rule) | 2 years | Lost right to sue |
| 27 | N/A (Crown-directed) | - | - |
| 28 | Proposal acceptance | 60 months | Debt relief if accepted |
| 29 | CICB application | 2 years | Compensation barred |
| 30 | ARB appeal | 45 days | Assessment finalized |
| 31 | CAT DRS | ~90 days | Proceeding restricted |
| 32 | Media notice | 6 weeks | Can affect proceedings |

---

## Success Indicators

✅ **Each task is complete when:**
1. All domain modules extend BaseDomainModule correctly
2. All limitation periods wire to LimitationPeriodsEngine
3. All plain language templates created (4-6 per module)
4. All unit test targets met (50+ across Phase 1)
5. All YAML scenarios mapped and implemented
6. All Ontario statutes cited with section numbers
7. All UPL compliance requirements met
8. All integration tests passing

---

## Questions During Implementation?

**Design Questions:** Review [design.md](d:\Code\legal\.kiro\specs\canadian-legal-assistant\design.md) Lines 556-720

**Requirements Questions:** Review [requirements.md](d:\Code\legal\.kiro\specs\canadian-legal-assistant\requirements.md) Requirements 20-26

**YAML Mapping Questions:** Review [YAML_INTEGRATION_SUMMARY.md](YAML_INTEGRATION_SUMMARY.md)

**Task Specifics:** Review [tasks.md](d:\Code\legal\.kiro\specs\canadian-legal-assistant\tasks.md) Lines 180-250

---

**Ready to Start?** Begin with Task 26 (EstateSuccessionLawDomainModule) - 8 hours ✅

