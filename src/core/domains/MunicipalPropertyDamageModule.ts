import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';

/**
 * Municipal Property Damage Domain Module
 *
 * This module handles claims against municipalities for property damage including:
 * - Tree damage (municipal trees causing property damage)
 * - Sidewalk/road damage (settlement, potholes, flooding)
 * - Water/drainage issues (overflow, municipal maintenance failure)
 * - Street sign/utility pole damage
 *
 * Critical: 10-day notice requirement under Municipal Act, s.44
 * Exceptions: Emergency situations may reduce notice period
 * Authority: Municipal Act, 2001 (Ontario); specific municipal bylaws
 */
export class MunicipalPropertyDamageModule extends BaseDomainModule {
  domain = 'municipalPropertyDamage' as const;

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
    const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];

    // Check if this is an urgent situation (notice period may be expired)
    const isUrgent = input.classification.urgency === 'high' || this.checkForExpiredNoticeDeadline(input);

    const drafts: DocumentDraft[] = [
      // Critical: 10-day notice guidance
      this.createMunicipalNoticeGuide(input, refs, isUrgent),

      // Municipal Act and authority rules
      this.createMunicipalLiabilityGuide(input, refs),

      // Evidence checklist for municipal claims
      this.createMunicipalEvidenceChecklist(input, refs),

      // Claim preparation (Notice of Claim & supporting letter)
      this.createClaimPreparationGuide(input, refs),

      // Appeal/escalation pathway (Ombudsman, claims tribunal)
      this.createMunicipalEscalationGuide(input, refs)
    ];

    return drafts;
  }

  private checkForExpiredNoticeDeadline(input: DomainModuleInput): boolean {
    // Check if timeline suggests damage occurred > 10 days ago
    if (input.timeline) {
      return input.timeline.toLowerCase().includes('over 10 days') ||
             input.timeline.toLowerCase().includes('more than 10 days') ||
             input.timeline.toLowerCase().includes('expired');
    }
    return false;
  }

  private createMunicipalNoticeGuide(input: DomainModuleInput, refs: any[], isUrgent: boolean): DocumentDraft {
    const urgentWarning = isUrgent 
      ? `⚠️ URGENT: Your notice period may have EXPIRED. Municipal Act requires notice within 10 days of damage. If more than 10 days have passed, contact municipality IMMEDIATELY and consider legal action without delay. Consult a lawyer.`
      : `✅ Notice deadline: Within 10 days of discovering damage. You are within the deadline.`;

    return this.drafting.createDraft({
      title: 'Municipal Property Damage — 10-Day Notice Requirement (CRITICAL)',
      sections: [
        {
          heading: 'CRITICAL: 10-Day Notice Requirement (Municipal Act, s.44)',
          content: `Ontario law requires a 10-day notice before suing a municipality for property damage.

**Notice Requirement:**
• Must be given within 10 days of discovering damage
• Must identify the municipality, specific damage location, and description of damage
• Must provide estimate of costs to repair if available
• Must include contact information (phone, email, address)

**Exception:** Emergencies (active danger to person/property) may bypass notice (consult lawyer)

${urgentWarning}`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'How to Give Notice to Municipality',
          content: `**Step 1: Identify the right municipality**
□ Is damage caused by city/town (local) or regional/county infrastructure?
□ Is damage caused by provincial highway (contact Ministry of Transportation)?
□ Some services (utilities) contracted to third party (TBC)

**Step 2: Locate contact information**
□ Municipality website → "Claims" or "Damage Reports"
□ City Hall front desk phone number
□ Parks and Recreation (tree damage)
□ Works/Public Works (road, sidewalk, water)

**Step 3: Send written notice**
□ Email or registered mail (proof of delivery required)
□ Include: Date of damage, location, description, estimated cost, contact info
□ Keep copy for your records

**Step 4: Document response**
□ Track when municipality received notice
□ Note any response from municipality
□ If no response in 30 days, follow up

Example municipalities:
• City of Toronto: claims@toronto.ca, 311 hotline
• City of Ottawa: claims@ottawa.ca
• Regional municipalities: check their websites`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Notice Template (Use This)',
          content: `[Your Name]
[Your Address]
[Your Phone]
[Your Email]
[Date]

[Municipality Name]
Claims/Risk Management Department
[Address]

RE: NOTICE OF PROPERTY DAMAGE CLAIM

To the [Municipality Name]:

I am providing formal notice of property damage to my property located at:
[Your Property Address]

**Date of Damage:** [Date discovered]
**Nature of Damage:** [Describe: tree damage, pothole, water damage, etc.]
**Cause:** [Describe: tree from municipal property, settlement from infrastructure, etc.]
**Estimated Cost of Repair:** $[Amount]

**Evidence attached:**
□ Photos of damage
□ Repair estimate(s)
□ Proof of original condition (if available)

I will pursue a claim for damages unless this matter is resolved to my satisfaction. I reserve all rights.

Sincerely,
[Your Signature]
[Your Printed Name]

---
Proof: Keep email receipt or Canada Post tracking number.`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Timeline After Notice',
          content: `After giving notice:
• Day 0–10: Give formal notice to municipality
• Day 11–30: Municipality may respond with offer/denial/request for more info
• Day 30–90: Negotiate with municipality claims adjuster
• Day 90+: If no resolution, consult lawyer about Small Claims (up to $50,000) or Superior Court claim
• Limitation period: 2 years from discovery of damage (track original date)

⏰ Do NOT wait—if approaching 2-year limit, file claim to stop limitation period.`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createMunicipalLiabilityGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Municipal Liability & Legal Authority (Municipal Act, 2001)',
      sections: [
        {
          heading: 'When Is a Municipality Liable?',
          content: `Municipalities are NOT automatically liable for all damage. You must prove:

1. **Duty of Care:** Municipality had a duty to inspect/maintain the property
   - Tree on municipal property → duty to inspect for hazards
   - Municipal road/sidewalk → duty to maintain in safe condition
   - Municipal drainage system → duty to inspect/maintain

2. **Breach of Duty:** Municipality failed to meet that duty
   - Failed to inspect (tree obviously dangerous)
   - Ignored known hazard (reported pothole ignored)
   - Neglected standard maintenance (no sweeping, clearing)

3. **Causation:** The breach caused your damage
   - Tree fell and hit your home → clear causation
   - Pothole caused vehicle damage → causation shown
   - Flooded basement from blocked drain → causation shown

4. **Quantifiable Loss:** You can prove your costs
   - Repair estimate from contractor
   - Medical bills (if injury occurred)
   - Replacement cost of damaged items`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Municipal Immunity & Exceptions (M.A. s.304)',
          content: `Important: Municipalities have LIMITED immunity for:
• Emergency response (police, fire, ambulance actions)
• Discretionary decisions (which roads to fix, which trees to trim)
• Infrastructure planning decisions

BUT municipalities are NOT immune for:
• Negligent inspection (failing to notice obvious hazard)
• Negligent maintenance (not fixing known hazard)
• Negligent property management

Key case: *Anns v. Merton London Borough Council*
- Duty owed IF foreseeable injury likely
- Foreseeable = reasonable person would expect injury

Example: Dead tree on municipal land obviously will fall → foreseeable harm → liability possible`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Different Types of Municipal Damage Claims',
          content: `**Tree Damage:**
□ Is tree on municipal property? (Check property map or survey)
□ Was tree obviously dead/hazardous? (Photos, arborist report)
□ Did municipality ignore complaints? (File access request for prior complaints)
→ Claim: Negligent failure to inspect/maintain

**Road/Sidewalk Damage:**
□ Is damage result of pothole/settlement? (Photos, engineer report)
□ Was road recently maintained? (Public Works records)
□ Was damage reported to municipality before your incident? (Check records)
→ Claim: Negligent maintenance of road surface

**Water/Drainage Damage:**
□ Does municipal storm drain exist near property? (Utility locates)
□ Was drain capacity exceeded/blocked? (Engineering assessment)
□ Did municipality know of drainage problem? (File access request)
→ Claim: Negligent maintenance of drainage infrastructure

**Utility Pole/Sign Damage:**
□ Is utility pole municipal or private? (Check utility company)
□ Was pole in poor repair? (Condition report)
□ Did municipality ignore reports? (Access request)
→ Claim: Negligent inspection of infrastructure`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Liability Limits & Damages Cap',
          content: `**Municipal Act Caps:**
As of 2025, limits vary:
• Small Claims: up to $50,000 (jurisdiction limit)
• Superior Court: No limit but consider cost-benefit

**Recoverable Damages:**
✓ Direct repair costs (contractor quotes)
✓ Temporary housing (if uninhabitable)
✓ Lost contents (if destroyed)
✓ Reasonable expenses (inspection, assessment)

❌ Not recoverable:
- Diminished property value (unless proven by expert)
- Emotional distress (Ontario does not award)
- Punitive damages (rare in property claims)

**Liability Insurance:**
Most municipalities carry liability insurance ($10M+ typical)
→ Claim against municipality insurer, not individual officials`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createMunicipalEvidenceChecklist(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Evidence Checklist for Municipal Claims',
      sections: [
        {
          heading: 'Evidence Collection Checklist',
          content: `**Photos & Visual Evidence:**
□ Photos of damage (taken same day if possible)
□ Photos from multiple angles
□ Photo showing location (address visible if possible)
□ Photo comparing before/after (if available)
□ Date-stamped if device supports it

**Repair Documentation:**
□ Contractor estimate (2–3 quotes recommended)
□ Invoice for repairs completed
□ Receipts for materials purchased
□ Builder's declaration (if contractor unavailable)

**Property Records:**
□ Property survey showing municipal property line
□ Deed showing property boundaries
□ Tax assessment showing property ownership
□ Title report (from Land Titles Office)

**Municipality Records (request via Freedom of Information Act):**
□ Tree inspection reports (if tree damage)
□ Road maintenance records
□ Prior complaints about same hazard
□ Work orders for repairs
□ Inspection schedules
→ File FOI request with municipality (typically $5 fee)

**Expert Reports:**
□ Arborist report (for tree damage)
□ Engineer report (for road/drainage damage)
□ Building inspector report (for structural damage)

**Medical/Loss Documentation (if applicable):**
□ Medical bills (if injury resulted)
□ Proof of loss (insurance claim, inventory)
□ Receipts for temporary accommodations`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Timeline & Incident Documentation',
          content: `Create detailed timeline:

**Day of Incident:**
□ Date & time of damage discovered
□ Weather conditions (heavy rain, wind, snow)
□ First signs of problem noticed
□ Immediate actions taken (photos, calls, etc.)

**Prior Complaints:**
□ Any prior complaints about this hazard?
□ When were complaints made?
□ How did municipality respond?
□ Any written confirmation of complaints?

**Post-Incident:**
□ When did you report to municipality?
□ How was report made (phone, email, in person)?
□ Who did you speak with?
□ What response did you receive?

**Repair & Costs:**
□ When were repairs obtained?
□ Who performed repairs?
□ Total cost paid
□ Insurance coverage (did insurance pay?)`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createClaimPreparationGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Municipal Claim Preparation — Notice of Claim & Demand Letter',
      sections: [
        {
          heading: 'Notice of Claim (After 10-Day Notice Period)',
          content: `**Timing:** File after 10 days notice and municipality denies claim or fails to respond

**Contents:**
1. Your information (name, address, phone, email, insurance details if applicable)
2. Municipality's information (name, claims contact, address)
3. Date of damage & date notice given to municipality
4. Detailed description of damage (location, what was damaged, how)
5. Estimated cost to repair (include contractor quotes)
6. Legal basis for claim (Municipal Act, s.44 notice given, negligence)
7. Proof of loss (receipts, estimates, photos)
8. Amount claimed (repair cost + reasonable expenses)

**Claim Options:**
- Small Claims (up to $50,000 limit)
- Superior Court claim (no limit, but more expensive)
- CANCELLED Claims tribunal (if applicable)**

**Timeline:**
- Small Claims: File within 2 years of damage discovery
- Superior Court: File within 2 years (not within 15 years for limitation)`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Demand Letter (Before Formal Claim)',
          content: `Send demand letter 30 days after giving notice:

[Your Name]
[Date]

[Municipality Name]
Claims Department
[Address]

RE: DEMAND FOR COMPENSATION — Property Damage Claim

Dear Claims Manager,

I am writing to demand compensation for property damage caused by [municipality's] negligence.

**Facts:**
- Damage occurred: [date]
- Location: [your property address]
- Cause: [describe, e.g., "tree from municipal property fell on my home"]
- Notice given: [date], via [method]

**Legal Basis:**
[Municipality] had a duty to inspect/maintain this property and failed, causing my damage.

**Damages:**
- Repair cost: $[amount] (see attached estimate)
- [Other losses: e.g., temporary housing $X, lost contents $Y]
- Total: $[amount]

**Demand:**
I demand payment of $[amount] within 14 days. If not paid, I will file a claim in Small Claims Court / Superior Court for damages plus court costs.

Sincerely,
[Your Signature]
[Your Name]

**Attachment:** Repair estimate, photos, notice copy`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createMunicipalEscalationGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Escalation & Appeals for Municipal Claims',
      sections: [
        {
          heading: 'Escalation Pathways If Municipality Denies Claim',
          content: `**Path 1: Ombudsman Ontario (for complaint about process, not decision)**
• Jurisdiction: Can review if municipality process was unfair/improper
• Timeframe: Complaint within 12 months of decision
• Outcome: Recommendation for reconsideration (not binding)
• Cost: Free
→ Website: www.ombudsman.on.ca

**Path 2: Municipal Court Claims Tribunal (if applicable)**
• Jurisdiction: Some municipalities have formal review process
• Available: Check if your municipality has a tribunal
• Timeframe: Usually 30–60 days after denial
• Outcome: Binding decision on claim
• Cost: Filing fee ($50–200)

**Path 3: Small Claims Court**
• Jurisdiction: Up to $50,000
• Process: Small claims procedure (simpler, faster than Superior Court)
• Timeline: 6–12 months from filing to trial
• Cost: Filing fee ($100–200) + service costs
• Outcome: Judge decides; can appeal if legal error

**Path 4: Superior Court**
• Jurisdiction: Unlimited damages
• Process: Full civil litigation (complex, expensive)
• Timeline: 2–4 years from filing to trial
• Cost: Lawyer fees $5,000–$50,000+
• Outcome: Judge or jury decides`,
          evidenceRefs: refs,
          confirmed: true
        },
        {
          heading: 'Timeline Summary: From Damage to Resolution',
          content: `**Weeks 0–1: Document & Report**
- Document damage (photos, video, estimates)
- Call municipality to report

**Weeks 1–2: Give Written 10-Day Notice**
- Send formal notice via email/registered mail
- Keep proof of delivery

**Weeks 3–6: Wait for Municipality Response**
- Municipality has 30 days to respond
- May request more information
- May make settlement offer

**Week 6–8: Negotiate**
- Contact claims adjuster
- Provide additional evidence if requested
- Attempt settlement negotiation

**Week 8–12: If No Resolution**
- Send formal Demand Letter
- Give 14 days for payment

**Week 12+: File Formal Claim**
- Small Claims Court: 6–12 months to resolution
- Superior Court: 2–4 years to resolution

**Total Timeline:**
- Best case: 3–4 months (negotiated settlement)
- Typical case: 12–18 months (Small Claims)
- Complex case: 3–5 years (Superior Court + appeal)`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }
}
