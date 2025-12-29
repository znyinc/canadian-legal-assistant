export interface DisclaimerTemplate {
  title: string;
  body: string;
}

export interface PackageTemplate {
  name: string;
  folders: string[];
  files: string[];
  notes?: string[];
}

export class TemplateLibrary {
  disclaimers(): DisclaimerTemplate[] {
    return [
      {
        title: 'Information-Only Disclaimer',
        body:
          'This tool provides legal information, not legal advice. Verify applicability for your jurisdiction. Consult a lawyer or licensed paralegal for advice. Confirm all outputs against current law and your facts.'
      },
      {
        title: 'Source Access Disclaimer',
        body:
          'Use only official APIs or official links (e.g., CanLII, e-Laws, Justice Laws). Include URLs and retrieval/currency dates. Do not scrape or copy restricted content.'
      }
    ];
  }

  packageLayout(): PackageTemplate {
    return {
      name: 'Standard Evidence Package',
      folders: ['evidence/', 'manifests/', 'drafts/', 'logs/'],
      files: [
        'manifests/source_manifest.json',
        'manifests/evidence_index.json',
        'drafts/cover_note.md',
        'drafts/checklist.md',
        'logs/audit.log'
      ],
      notes: [
        'Use ISO dates in filenames where possible (YYYY-MM-DD).',
        'Avoid PII in filenames; redact sensitive info inside documents.'
      ]
    };
  }

  formattingGuidance(): string[] {
    return [
      'Use plain language, short sentences, and bullet lists for steps.',
      'Include source URLs with retrieval dates for citations.',
      'Keep a consistent header order: Summary, Facts, Sources, Options, Next Steps.',
      'For evidence tables, include: id, filename, type, date, provenance, hash, credibility score.'
    ];
  }

  domainTemplates(): Record<string, string> {
    return {
      'civil/demand_notice': `# Demand for Repair or Compensation

**To:** {{respondentName}}

**From:** {{claimantName}}

**Date of incident:** {{incidentDate}}

**Property address:** {{propertyAddress}}

**Summary:**

{{damageDescription}}

**Relief sought:**

- Repair of damage or compensation in the amount of **\${{amountClaimed}}** (if specified)

**Next steps:**

- Please respond within 10 days to arrange repair or payment. If you do not respond, I may pursue Small Claims Court filing. Check municipal by-laws for required notice periods and send to the municipal clerk where appropriate.

\n**Note:** Confirm factual details before sending.`,

      'civil/small_claims_form7a': `# Small Claims Court — Form 7A (Statement of Claim) — Scaffold

1) Claimant: {{claimantName}}

2) Defendant: {{respondentName}}

3) Claim amount: \${{amountClaimed}}

4) Court location (where to file): {{courtLocation}}

5) Date of incident: {{incidentDate}}

6) Particulars of claim:

{{particulars}}

7) Attachments:
- Photos
- Repair estimates
- Correspondence

\n**Instructions:** Fill in exact dates, names, and amounts before filing. Ensure you include all supporting evidence and correspondence references.`,

      'civil/evidence_checklist': `# Evidence Checklist — Property Damage

- [ ] Clear photos of damage (close-up and context)
- [ ] Time-stamped photos or video
- [ ] Repair estimates or receipts
- [ ] Witness names and contact information
- [ ] Any correspondence with owner/occupier/municipality
- [ ] Police reports (if applicable)

**Tip:** Label files with attachment numbers to match the statement of claim.`,

      'criminal/release_conditions_checklist': `# Release Conditions Checklist

**Accused:** {{fullName}}

**Date:** {{date}}

## If Arrested and Released

When released from police custody (on a promise to appear or bail), you must comply with conditions:

### Common Release Conditions

- [ ] Reside at a fixed address (notify court of any address change)
- [ ] Report to a bail supervisor or police (frequency and location specified)
- [ ] Avoid contact with the alleged victim or witnesses
- [ ] Avoid possession of weapons (firearms, knives, etc.)
- [ ] Abstain from alcohol and non-prescription drugs (if ordered)
- [ ] Surrender passport (for serious charges)
- [ ] Keep the peace and be of good behaviour
- [ ] Attend court on all required dates
- [ ] Notify court if moving address

### Your Responsibilities

- Write down all conditions and keep them accessible
- Understand what each condition means for your daily life
- Ask police or your lawyer to clarify any unclear conditions
- Inform your employer/family about reporting requirements
- Plan for transportation to court and bail supervision appointments
- Contact your lawyer immediately if you cannot comply with a condition

**IMPORTANT:** Failure to comply with release conditions is a separate criminal offense and can result in immediate arrest.`,

      'criminal/victim_impact_scaffold': `# Victim Impact Statement — Scaffold (Information)

**Victim:** {{victimRole}}

**Date:** {{date}}

## What is a Victim Impact Statement?

A victim impact statement allows the victim to describe how the crime affected them. It is presented at sentencing to help the judge understand the full impact of the offense.

## Structure

### 1. Your Identity
- Full name and relationship to the accused
- Whether you feel safe sharing personal details in open court

### 2. Physical Effects
- Physical injuries sustained (describe severity and treatment)
- Ongoing pain, disability, or medical follow-up needed
- Impact on daily activities, work, or school

### 3. Emotional Effects
- Psychological impact (fear, anxiety, PTSD, depression, etc.)
- Changes to sense of security or trust
- Impact on relationships or family life

### 4. Financial Effects
- Medical expenses
- Lost wages or income
- Counseling or therapy costs
- Repairs to property

### 5. Time Impact
- Time spent in medical treatment, counseling, or recovery
- Time away from work or school
- Time spent on the criminal process

## Tips for Preparation

- Write in first person ("I was...").
- Be factual and specific about dates, injuries, and costs.
- Emotions are valid; include how you felt (scared, angry, violated, etc.).
- You may have a supporter present (victim services worker, family member, lawyer).
- You can read your statement in court or have someone read it for you.
- If afraid to appear in person, ask the Crown about alternatives.

**Note:** This is informational only. Consult Crown counsel or victim services for guidance on your specific situation.`,

      'criminal/police_crown_process_guide': `# Police and Crown Process Guide — {{offense}} (Information)

**Jurisdiction:** {{province}}

**Purpose:** This guide explains the typical process when police are involved in {{offense}} allegations.

## Initial Police Response

1. **Victim calls 911 or police station**
   - Police attend scene and gather information
   - Witness statements recorded
   - Photos/medical assessment (if necessary)
   - Accused may be arrested or detained

2. **Police Investigation**
   - Formal statement from victim (may be video-recorded)
   - Witness interviews
   - Scene examination and evidence collection
   - Investigation file compiled

## Charging Decision

- **Crown Attorney (prosecutor)** reviews police investigation
- Decides whether to proceed with charges (not the victim)
- Grounds: reasonable and probable cause to believe offense occurred, and it is in the public interest to proceed
- Accused is informed of charges and release conditions

## Release from Custody

- Accused attends a **release (bail) hearing** usually within 24-72 hours
- Police may release accused on own recognizance (promise to appear) with conditions
- Court may set bail with surety (responsible person) or hold for trial
- Common conditions: reside at address, report to bail supervisor, avoid contact with victim, no weapons

## Court Process

### Early Stages
- **First appearance:** Accused advised of rights, Crown provides disclosure
- **Bail review:** If accused remains in custody, can request reconsideration
- **Disclosure:** Victim and Crown must share evidence with accused's lawyer

### Crown Negotiation (if applicable)
- Crown and defense discuss possible resolution (guilty plea to lesser charge, withdrawal, diversion)
- Victim may be consulted about resolution

### Trial
- **Preliminary inquiry** (for indictable offenses): Crown proves enough evidence for trial
- **Trial proper:** Evidence presented, witnesses testify, judge/jury decides guilt
- **Sentencing:** If convicted, judge imposes sentence (ranging from discharge to jail time, depending on severity and criminal history)

## Victim's Role

- **Reporting:** Victim is witness, not a party to the prosecution
- **Crown decides prosecution:** Not the victim's decision
- **Victim services:** May be available to support victim through process
- **Court attendance:** Victim may be called to testify (compelled if subpoenaed)
- **Impact statement:** Can be submitted before sentencing

## Timeline (Typical)

- Days 1-3: Arrest/release hearing
- Weeks 2-8: First appearance, bail decisions, disclosure exchange
- Months 2-6: Crown negotiation or preliminary inquiry
- Months 4-12+: Trial preparation and trial

**Note:** This is informational only. Timelines vary by complexity, court workload, and circumstances. Consult with Crown counsel, victim services, or a lawyer for specific guidance.`
    ,

      'criminal/victim_services_guide': `# Victim Services Ontario — Support Resources (Information)

**Your Role:** As a victim or complainant in a criminal matter, you are NOT responsible for prosecuting the accused. The Crown Attorney handles prosecution. Your role is as a witness and protected party.

## What is Victim Services?

Ontario provides **Victim/Witness Assistance Program (V/WAP)** through the Ministry of the Attorney General. These services help you understand the criminal process and provide support.

### Services Provided (Free)

- **Court preparation:** Explain what to expect at court, how to give testimony
- **Court accompaniment:** A trained worker can accompany you during court appearances
- **Case updates:** Keep you informed about court dates, bail conditions, trial progress
- **Referrals:** Connect you to counseling, shelter, financial assistance programs
- **Safety planning:** Help assess your safety and create a plan

### How to Access

1. **After police report:** Police will provide victim services contact automatically
2. **Self-referral:** Contact your local V/WAP office directly
   - Toronto: 416-314-2447 or email vcars@ontario.ca
   - Other regions: Search "Victim/Witness Assistance Program" + your city
3. **Online:** https://www.ontario.ca/page/get-help-victim-services

## Victim Impact Statement

You have the right to submit a **Victim Impact Statement (VIS)** describing how the crime affected you. This is read at sentencing and helps the judge understand the impact.

### Tips:
- Describe physical, emotional, and financial effects
- Use first person ("I felt...")
- Be honest and specific
- You can read it in court or have someone read it for you

## If You Feel Unsafe

If the accused is released on bail with a no-contact condition:
- Keep a copy of the bail conditions
- Call police immediately if the accused contacts you or breaches conditions
- Document all contact attempts (screenshots, voicemails, dates/times)
- Consider a **peace bond (810 order)** — a civil restraining order

**Emergency:** 911 | **Non-emergency:** Your local police division

## Counseling and Support

- **Victim Services Toronto:** 416-808-7066
- **Assaulted Women's Helpline:** 1-866-863-0511
- **Kids Help Phone:** 1-800-668-6868
- **Mental Health Crisis Line:** 1-833-456-4566

## Remember

- You did the right thing by reporting
- The Crown decides prosecution — it is not your burden
- You are entitled to support throughout the process
- Your safety matters`,

      'criminal/evidence_checklist': `# Criminal Complainant Evidence Checklist (Information)

**Purpose:** This checklist helps you organize information and evidence to assist the police investigation. You are NOT required to gather all of this — the police will investigate. However, preserving evidence promptly can strengthen the case.

## Immediate Actions (First 24-48 Hours)

### Medical Documentation (If Injured)
- [ ] Seek medical attention for any injuries (ER, walk-in clinic, or doctor)
- [ ] Ask for a copy of medical records documenting injuries
- [ ] Take dated photos of visible injuries (bruises, cuts, swelling)
- [ ] Follow up with photos as injuries develop over days

### Police Report
- [ ] File a report (call 911 if emergency, or visit local police station)
- [ ] Obtain the **occurrence number** (file number) for reference
- [ ] Get the officer's name and badge number
- [ ] Request a copy of your statement when available

### Scene Documentation
- [ ] Take photos or video of the scene (if safe to return)
- [ ] Note the exact location, time, and date of the incident
- [ ] Preserve any damaged property (don't repair until after photos)

## Communication Evidence

### Digital Records
- [ ] Screenshot threatening text messages or voicemails (show phone number and timestamps)
- [ ] Screenshot social media posts or messages (include profile info and dates)
- [ ] Preserve emails (forward to yourself or print with full headers)
- [ ] Save voicemails (don't delete — note the date/time and caller ID)

### Witnesses
- [ ] Write down names and contact info of anyone who saw or heard the incident
- [ ] Ask witnesses if they can provide a written statement (optional)
- [ ] Note what each witness observed

## Personal Documentation

### Timeline
- [ ] Write down what happened in chronological order while it's fresh
- [ ] Include dates, times, locations, and who was present
- [ ] Note exact words spoken (especially threats — verbatim if possible)

### Impact
- [ ] Track missed work, appointments, or activities due to incident
- [ ] Keep receipts for medical expenses, repairs, or counseling
- [ ] Note emotional/psychological effects you're experiencing

## What NOT to Do

- ❌ Do not contact the accused (directly or through others)
- ❌ Do not post about the incident on social media
- ❌ Do not delete any messages or evidence — even if upsetting
- ❌ Do not confront witnesses to "coach" their statements

## Providing Evidence to Police

When you provide evidence:
1. Bring originals (or high-quality copies) to police
2. Keep your own copies of everything
3. Don't annotate or edit photos/messages — provide as-is
4. Ask for a receipt or acknowledgment from police

**Note:** This checklist is informational. Police will guide you on what evidence is needed for your specific case. You do not need to have all of this — any information you can provide helps.`,

      'criminal/complainant_role_explained': `# Your Role as a Criminal Complainant — What to Expect (Information)

**Key Concept:** In a criminal case, **you are a witness, not a party.** The prosecution is conducted by the **Crown Attorney** on behalf of the state. You do not need to hire a lawyer for the criminal trial (though you may consult one for advice).

## Understanding Your Role

### You Are:
- A witness providing evidence and testimony
- Entitled to victim services support
- Entitled to submit a Victim Impact Statement at sentencing
- Protected by no-contact conditions (if ordered by court)
- Entitled to case updates through Crown or Victim Services

### You Are NOT:
- Responsible for prosecuting the accused (the Crown does this)
- Obligated to "drop charges" — charging decisions are the Crown's
- Required to hire a lawyer for the criminal case
- The decision-maker on conviction or sentencing

## What the Crown Attorney Does

The Crown Attorney (prosecutor) will:
- Review the police investigation and evidence
- Decide whether to proceed with charges
- Present the case in court
- Call witnesses (possibly including you)
- Recommend sentencing if the accused is convicted

**Note:** You can speak with the Crown about your concerns, but final decisions are theirs.

## What You May Be Asked to Do

1. **Provide a statement to police** (usually already done)
2. **Testify in court** if the case goes to trial
   - You will be asked questions by Crown and defense lawyer
   - Victim services can accompany you
   - You can request accommodations (screen, closed-circuit TV) for safety
3. **Submit a Victim Impact Statement** before sentencing

## Timeline Expectations

| Stage | Typical Timeframe |
|-------|-------------------|
| Arrest/Release | 24-72 hours |
| First Court Appearance | 1-4 weeks |
| Disclosure Exchange | 2-8 weeks |
| Pre-trial/Negotiation | 2-6 months |
| Trial (if proceeding) | 4-12+ months |

Delays are common. Complex cases may take longer.

## Peace Bond (810 Order) Option

If you want additional protection beyond bail conditions, you can apply for a **peace bond** (also called 810 order). This is a civil court order requiring the accused to:
- Keep the peace and be of good behaviour
- Stay away from you, your home, and workplace
- Not possess weapons

**How to Apply:** Contact police or Crown counsel about your safety concerns. They can assist with a peace bond application.

## If Accused Contacts You

If the accused contacts you (in violation of no-contact conditions):
1. **Do not respond**
2. **Document the contact** (screenshots, save voicemails, note date/time)
3. **Call police immediately** — breach of conditions is a separate criminal offense
4. **Contact Victim Services** for support

## Resources

- Victim/Witness Assistance Program: 416-314-2447 (Toronto) or your local V/WAP
- Crime Stoppers (anonymous tips): 1-800-222-TIPS
- Ontario Victim Services: https://www.ontario.ca/page/get-help-victim-services

**Remember:** You did the right thing by reporting. The system is designed to protect you and pursue accountability.`
    ,

  // Landlord and Tenant Board (Ontario) templates
  'ltb/t1_tenant_rights': `# LTB T1 — Tenant Rights Application (Scaffold)

1) Tenant: {{tenantName}}
2) Landlord: {{landlordName}}
3) Rental address: {{rentalAddress}}
4) Issues: {{issuesSummary}}
5) Remedy sought: {{remedy}}

Attachments:
- Lease agreement
- Rent receipts
- Photos, communications

Instructions: Verify current LTB forms and Rules. This scaffold is information-only; complete the official form before filing.`,

  'ltb/t2_eviction': `# LTB T2 — Application about Tenant Rights (Eviction-related) (Scaffold)

1) Tenant: {{tenantName}}
2) Landlord: {{landlordName}}
3) Grounds: {{grounds}}
4) Remedy: {{remedy}}

Evidence:
- Notices served/received
- Photos of conditions
- Communication logs

Note: Follow LTB Rules for service, timelines, and evidence.`,

  'ltb/t6_repairs': `# LTB T6 — Maintenance (Repairs) Application (Scaffold)

1) Tenant: {{tenantName}}
2) Landlord: {{landlordName}}
3) Problems: {{problems}}
4) Dates of requests: {{requestDates}}
5) Remedy requested: {{remedy}}

Evidence:
- Photos of issues
- Work orders/receipts
- Emails/texts to landlord

Tip: Document dates and keep copies of all communications.`,

  // Municipal property damage 10-day notice
  'municipal/10_day_notice': `# Municipal 10-Day Notice (Ontario) — Property Damage

To: Municipal Clerk — {{municipality}}

From: {{claimantName}}
Date of incident: {{incidentDate}}
Location: {{location}}

Summary:
{{summary}}

Notice:
This letter provides notice within 10 days as required under applicable municipal statutes and by-laws for claims arising from road/sidewalk/tree maintenance.

Attachments:
- Photos
- Estimates/receipts
- Witness info

Note: This is information-only. Confirm the correct statute/by-law and filing method.`,

  'municipal/demand_notice': `# Municipal Demand Notice — Property Damage

To: {{municipality}} — Risk Management / Clerk
From: {{claimantName}}
Incident date: {{incidentDate}}
Damage: {{damageDescription}}
Amount claimed: \${{amountClaimed}}

Please respond within 10 days to arrange inspection, repair, or compensation. If not resolved, I may pursue Small Claims Court.

Attachments:
- Photos/videos
- Estimates/receipts
- Correspondence

Reminder: Confirm legal timelines (10-day notice) and correct service address.`
    ,

  // Civil domain — settlement-focused enhancements
  'civil/demand_letter_property_damage': `# Demand Letter — Property Damage (Settlement First)

**To:** {{respondentName}}

**From:** {{claimantName}}

**Date of incident:** {{incidentDate}}

**Location:** {{propertyAddress}}

**Summary of damage:**
{{damageDescription}}

**Request:**
- Repair the damage or pay compensation of **\${{amountClaimed}}** (if known)

**Settlement Path (Typical):**
- Most civil disputes settle through discussion. Please respond within 10 days to arrange repair or payment. If we cannot resolve this, I may proceed with Small Claims Court.

**Attachments:**
- Photos of damage
- Repair estimates
- Relevant communications

**Note:** Confirm facts and amounts before sending. Keep a copy for your records.`,

  'civil/demand_letter_contract_dispute': `# Demand Letter — Contract Dispute (Settlement First)

**To:** {{respondentName}}

**From:** {{claimantName}}

**Contract/date:** {{contractRef}}

**Issue:** {{issueSummary}}

**Request:**
- Perform the contract obligation or compensate **\${{amountClaimed}}** for losses.

**Settlement Path (Typical):**
- Many contract disputes settle without court. Please respond within 10 days to propose a resolution. If unresolved, I may pursue Small Claims or Superior Court depending on the amount.

**Attachments:**
- Contract copy
- Invoices/receipts
- Communications relating to performance issues

**Note:** Verify amounts and timelines. Consider mediation if discussion stalls.`,

  'civil/anticipate_defense': `# Anticipate the Defense — Civil Negligence

When preparing your case, anticipate common defenses and organize your evidence to address them:

**Typical Defenses:**
- **No negligence:** Argues reasonable care was taken.
- **No causation:** Claims damage was not caused by the defendant.
- **Contributory negligence:** Suggests the claimant partly caused the damage.
- **Act of God / unforeseeable event:** Severe weather or sudden failure without negligence.
- **Maintenance records:** Asserts proper inspection and maintenance occurred.
- **Notice compliance:** For municipal claims, argues notice timelines weren’t met.
- **Limitation periods:** Asserts filing deadlines have passed.

**How to Prepare:**
- Gather photos, timelines, and third-party assessments.
- Keep repair estimates and receipts organized.
- Document communications (emails, letters, texts) with dates.
- For municipal matters, keep proof of 10-day notice.
- Confirm jurisdiction and forum routing.

**Outcome Focus:** Settlement is common. Organize evidence to make resolution straightforward.`,

  'civil/arborist_report_guidance': `# Arborist Report Guidance — Tree Damage

**Purpose:** An independent arborist report can help establish cause (disease/rot), foreseeability, and recommended maintenance.

**What to Request:**
- Species and condition of the tree
- Signs of disease, rot, or structural failure
- Likely failure mechanism (root, trunk, limb)
- Maintenance history indicators (visible neglect vs. recent pruning)
- Photos and diagrams of inspection

**Use:** Attach to demand letter or claim. Helps address defenses about unforeseeability or adequate maintenance.`,

  'civil/contractor_estimate_guidance': `# Contractor Estimate Guidance — Property Damage

**Purpose:** Obtain clear repair estimates to establish the scope and cost of damages.

**Checklist:**
- Detailed line-items (materials, labour, disposal)
- Estimated start date and duration
- Warranty or guarantees
- Photos of damage areas
- Company contact and HST/GST number (if applicable)

**Tip:** Get at least two estimates. Label files consistently and reference estimate totals in your demand letter or claim.`,

      'consumer/cpo_complaint': `# Consumer Protection Ontario Complaint Guide

**Your Rights:**
Under the Consumer Protection Act, 2002 (Ontario), consumers have rights regarding:
- Fair and accurate product descriptions
- Written estimates for repairs over $50
- 10-day cooling-off period for door-to-door sales
- Contract cancellation rights in certain situations
- Protection against unfair business practices

**Filing a Complaint with Consumer Protection Ontario:**

1. **Try direct resolution first:** Contact the business in writing with your complaint and supporting documents.

2. **If unresolved, file with Consumer Protection Ontario:**
   - Online: https://www.ontario.ca/page/filing-consumer-complaint
   - Phone: 416-326-8800 (Toronto) / 1-800-889-9768 (toll-free)

3. **What to include:**
   - Business name, address, phone
   - Description of transaction and issue
   - Copies of receipts, contracts, estimates
   - Timeline of events
   - What resolution you're seeking

**Alternatives:**
- Small Claims Court (for amounts up to $50,000)
- Chargeback (for credit card payments — see guidance)
- Better Business Bureau complaint (informal resolution)

**Note:** Consumer Protection Ontario investigates, but does not award compensation. For monetary claims, consider Small Claims Court.`,

      'consumer/chargeback_guide': `# Chargeback Guide — Credit Card Dispute

**What is a chargeback?**
If you paid by credit card and did not receive goods/services as promised, you can request your credit card company reverse the charge (chargeback).

**When to use:**
- Product not delivered
- Service not provided as described
- Unauthorized charge
- Defective product and merchant won't resolve

**How to request:**
1. **Contact your credit card issuer** (number on back of card)
2. **File within timeframe:** Usually 60-120 days from transaction date
3. **Provide documentation:**
   - Transaction details (date, amount, merchant name)
   - Description of issue
   - Evidence (emails, photos, delivery tracking)
   - Steps you took to resolve with merchant

**Outcome:**
- Temporary credit may be issued during investigation
- Final decision in 30-90 days
- If approved, charge is reversed
- If denied, you may still pursue Small Claims Court

**Tip:** Keep all receipts and communications. File chargeback promptly. Consumer Protection Ontario complaint can run in parallel.`,

      'consumer/service_dispute_letter': `# Service Dispute Letter Template

**To:** {{businessName}}

**From:** {{consumerName}}

**Date of service:** {{serviceDate}}

**Contract/Invoice #:** {{contractReference}}

**Issue:**
{{issueSummary}}

**Expected resolution:**
{{resolutionRequested}}

**Deadline:** Please respond within 10 business days to arrange a resolution.

**Your Rights:**
Under the Consumer Protection Act, 2002, consumers have the right to receive services as described and to accurate written estimates for repairs over $50. If this is not resolved, I may:
- File a complaint with Consumer Protection Ontario
- Pursue Small Claims Court filing
- Request a chargeback (if paid by credit card)

**Attachments:**
- Copy of contract or estimate
- Photos or documentation of service issue
- Relevant correspondence

**Note:** Keep a copy for your records. Send by email and/or registered mail for proof of delivery.`,

      'consumer/unfair_practice_documentation': `# Unfair Practice Documentation Checklist

**Purpose:** Document potential unfair business practices under the Consumer Protection Act, 2002.

**Prohibited Practices Include:**
- False, misleading, or deceptive advertising
- Bait-and-switch tactics
- Failure to disclose material facts
- High-pressure sales tactics
- Hidden fees or terms

**Evidence to Gather:**
- Advertisements (print, online, social media)
- Screenshots of website descriptions
- Contract terms (highlight misleading sections)
- Witness statements (if applicable)
- Timeline of events and communications
- Receipts and payment records
- Audio/video recordings (if legally obtained)

**Next Steps:**
1. Send dispute letter to business
2. File Consumer Protection Ontario complaint
3. Consider Small Claims Court for compensation
4. Report to Better Business Bureau (if desired)

**Tip:** For unfair practices, Consumer Protection Ontario may investigate the business. For monetary compensation, you must pursue Small Claims Court separately.`
    };
  }

  renderTemplate(templateId: string, context: Record<string, string | number | undefined>): string {
    const templates = this.domainTemplates();
    const content = templates[templateId];
    if (!content) return '';
    return content.replace(/{{\s*([^}\s]+)\s*}}/g, (_, key) => {
      const val = context[key];
      return val === undefined || val === null ? '' : String(val);
    });
  }
}
