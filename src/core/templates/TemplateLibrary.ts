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

  'estate/will_challenge_grounds': `# Will Challenge Grounds (Ontario)

**Purpose:** Outline common grounds to challenge a will in Ontario. This is information-only; confirm facts with an estates lawyer.

## Key Grounds
- **Lack of testamentary capacity:** Testator did not understand making a will, property, or potential beneficiaries
- **Undue influence:** Pressure or coercion affected the testator's choices
- **Failure of formalities:** Will not properly signed/witnessed under the Succession Law Reform Act
- **Suspicious circumstances:** Sudden changes, isolation, or beneficiary involvement in preparation

## Immediate Steps
- Collect all versions of the will and codicils (dates, signatures)
- Gather medical records around the will-signing date
- Identify witnesses and their contact information
- Preserve communications (emails, letters) related to the will

## Evidence to Gather
- Medical notes on cognition and capacity
- Witness affidavits about signing conditions
- Timeline of events leading to the will change
- Proof of dependency or support history (if applicable)

## Where Issues Are Heard
- Ontario Superior Court of Justice (Estates / Probate). Confirm local probate office details.

**Reminder:** Court deadlines and procedures vary. Consult counsel for litigation strategy.`,

  'estate/probate_application_guide': `# Probate / Certificate of Appointment — Guide (Ontario)

**Purpose:** Help you prepare for a probate application (Certificate of Appointment of Estate Trustee). Use current official forms from Ontario Court forms site.

## Core Steps
1) Identify the correct application type (with will / without will)
2) Obtain an original or court-certified copy of the will (if any)
3) Complete required court forms (current versions from forms.mgcs.gov.on.ca)
4) Calculate and pay Estate Administration Tax (if applicable)
5) Serve required beneficiaries and file proof of service
6) File the application package with the Superior Court of Justice (Estates)

## Documents Checklist
- Original will and any codicils
- Proof of death (death certificate)
- Affidavit of execution of will (or alternative proof)
- Draft Certificate of Appointment
- Estate asset list and values (for tax calculation)
- Proof of service on beneficiaries and those entitled on intestacy

## Tips
- Use consistent asset valuations (attach statements/appraisals)
- Keep copies of all filings and receipts
- Check local probate office for booking/filing procedures

**Note:** This is informational. Always use the latest official probate forms and confirm local requirements.`,

  'estate/estate_dispute_notice': `# Estate Dispute Notice (Information)

**Context:** For disputes about an estate trustee's conduct (delay, accounting issues, conflicts) or contested administration steps.

## Issues Commonly Raised
- Lack of disclosure or accounting
- Delays distributing assets
- Conflict of interest or self-dealing
- Failure to safeguard estate assets

## Information to Include
- Estate name and court file number (if any)
- Your relationship to the deceased and standing
- Specific concerns (dates, amounts, assets involved)
- Requests (accounting, passing of accounts, removal/replacement of trustee)

## Next Steps (Informational)
- Request an accounting in writing with a clear deadline
- Preserve correspondence and financial records
- Consider court processes: passing of accounts, motions for directions
- For serious misconduct, legal advice is strongly recommended

**Reminder:** This notice is informational and not a formal pleading. Court relief requires proper filings in the Superior Court of Justice (Estates).`,

  'estate/dependant_support_procedure': `# Dependant Support Claim — Procedure (Ontario)

**Legal Basis:** Succession Law Reform Act, Part V. Strict timelines apply.

## Who May Qualify
- Spouse (married or qualifying common-law)
- Children (minor/adult dependent)
- Parents, siblings, or others the deceased supported or was legally obligated to support

## Deadline
- Typically **6 months from the issuance of probate/Certificate of Appointment** to start a claim against the estate. Act promptly; late claims may require court permission.

## Key Steps
1) Identify dependency and support history (financial records, receipts)
2) Obtain probate details (court file, issuance date)
3) Prepare evidence of needs and estate assets
4) File a dependant support application in the Superior Court of Justice (Estates)
5) Serve estate trustee and affected beneficiaries

## Evidence Checklist
- Proof of relationship and dependency
- Income/expense statements and budgets
- Medical or caregiving records (if relevant)
- Estate asset/liability summary

## Remedies the Court May Order
- Periodic payments, lump sums, property transfers, or trust arrangements

**Reminder:** Court forms and timelines are strict. Seek legal advice promptly if the 6-month window is approaching or has passed.`,

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

**Remember:** You did the right thing by reporting. The system is designed to protect you and pursue accountability.`,

      'criminal/next_steps_checklist': `# Criminal Case — 10-Step Next Steps Checklist (Information)

This is a practical checklist of what typically needs to happen next in a criminal matter, based on Ontario law and procedure.

---

## 1. Immediate Criminal Process (Police & Crown)

**Status of the Accused**
- Police will either release the accused with conditions (undertaking/recognizance) OR hold them for a bail hearing within 24 hours

**What to Confirm with Police**
- [ ] Obtain the **police occurrence number** (file number) for reference
- [ ] Confirm whether **release conditions** include:
  - No contact / no communication with you
  - No attendance near your residence
  - Residence restrictions
  - Curfew or other conditions
- [ ] Confirm the **next court date** (first appearance)

**Timeline:** This happens within 24-72 hours of arrest

---

## 2. Your Role as Complainant / Witness (Non-Prosecution)

**Critical Concept:** You are **NOT prosecuting** the case; the **Crown Attorney** is.

- [ ] Understand that the Crown Attorney decides whether to proceed
- [ ] You cannot "drop charges" (only Crown can withdraw)
- [ ] Your job is to provide evidence and possibly testify

**Your Responsibilities:**
- [ ] Provide a full written statement (if not already done)
- [ ] Ensure police have all relevant evidence
- [ ] Identify any witnesses

---

## 3. Medical & Documentation Steps (Very Important)

Even if injuries seem minor, medical documentation strengthens the case.

- [ ] Seek medical attention (ER, walk-in clinic, family doctor)
- [ ] Request copies of:
  - Medical notes
  - Dated photographs of injuries
- [ ] Keep medical records safely (digital copies + originals)

**Why:** Medical evidence directly supports assault charges and Victim Impact Statement.

---

## 4. Victim Services (Strongly Recommended)

Contact **Victim Services Ontario** or request a referral from police.

**Contact Info:**
- Toronto: 416-314-2447 or email vcars@ontario.ca
- Other regions: Search "Victim/Witness Assistance Program" + your city
- Online: https://www.ontario.ca/page/get-help-victim-services

**Services Provided (Free):**
- [ ] Court accompaniment at hearings
- [ ] Case updates on bail conditions and trial progress
- [ ] Help preparing a Victim Impact Statement
- [ ] Safety planning
- [ ] Referrals to counseling and emergency services

---

## 5. Peace Bond / Restraining Options (If Needed)

Depending on the accused's release conditions:

- [ ] Crown may seek stricter bail conditions
- [ ] You may apply for a **Section 810 Peace Bond** (if ongoing fear)
  - Civil court order requiring accused to keep the peace
  - Stay away from you, your home, your workplace
- [ ] Can also pursue a civil restraining order (separate from criminal case)

**Typical for:** Neighbor disputes, escalating conflicts, safety concerns

---

## 6. Civil Liability (Separate Track – Optional)

Criminal charges ≠ compensation. You may separately pursue damages.

- [ ] Small Claims Court (Ontario) for:
  - Property damage
  - Medical expenses
  - Related losses
- [ ] Superior Court (if damages exceed $100,000)

**Evidence Needed:**
- [ ] Photos of damage
- [ ] Repair/medical estimates
- [ ] Invoices and receipts

**Timeline:** Can file anytime while within limitation period (usually 2 years for assault)

---

## 7. Victim Impact Statement (Later Stage)

If the accused is convicted or pleads guilty, you may submit a **Victim Impact Statement (VIS)**.

- [ ] Start keeping notes now on:
  - Physical injuries and recovery
  - Emotional impact (fear, stress, sleep disruption)
  - Impact on daily life (work, relationships, property use)
  - Financial costs
  - Ongoing safety concerns

**How It Works:**
- [ ] Victim Services will help you draft it
- [ ] You can read it in court or have Victim Services read it
- [ ] Judge considers it at sentencing

---

## 8. What You Should Avoid

- [ ] **Do NOT contact the accused directly** — violates no-contact conditions and jeopardizes case
- [ ] **Do NOT post publicly about the incident** on social media — can undermine your credibility
- [ ] **Do NOT delete messages, photos, or evidence** — preserve everything as-is
- [ ] **Do NOT alter the scene** before police documentation is complete
- [ ] **Do NOT downplay injuries later** — consistency matters in court
- [ ] **Do NOT discuss the case with the accused's friends** or mutual contacts

---

## 9. Likely Legal Trajectory (High-Level Overview)

Based on typical Ontario criminal charges:

**Assault (Section 266):**
- **Strength:** Strong, especially with medical documentation and witnesses
- **Likely Outcomes:**
  - Peace bond with no-contact conditions
  - Probation with conditions (anger management, counseling, restitution)
  - Possible jail time (depending on severity and record)

**Uttering Threats (Section 264.1):**
- **Strength:** Credible, especially if specific and arson-related
- **Likely Outcomes:**
  - Peace bond
  - Probation with conditions
  - Alcohol-related conditions

**Combined Charges:**
- Typically result in probation + conditions
- Anger management and/or alcohol counseling often required
- No-contact orders standard

---

## 10. If You Want Next-Step Help

The following are available to you:
- [ ] Draft a timeline statement for police/Crown
- [ ] Prepare your Victim Impact Statement (later, after conviction)
- [ ] Understand criminal vs. civil strategy
- [ ] Connect with Victim Services for ongoing support

---

## Important Contacts

| Issue | Contact | Phone |
|-------|---------|-------|
| Victim Services | Toronto V/WAP | 416-314-2447 |
| Police (emergency) | 911 | — |
| Police (non-emergency) | Your local police | Check local listings |
| Crown Attorney | Court office | Call your local Crown office |
| Counseling | Mental Health Crisis | 1-833-456-4566 |
| Assaulted Women | Women's Helpline | 1-866-863-0511 |

---

## Key Takeaway

You've done the right thing by reporting. The system is designed to investigate, prosecute, and protect you. Work closely with police and Victim Services. The Crown handles prosecution — your role is to cooperate as a witness.`
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

**Tip:** For unfair practices, Consumer Protection Ontario may investigate the business. For monetary compensation, you must pursue Small Claims Court separately.`,

      // Legal Malpractice Templates
      'malpractice/lawpro_notice': `# LawPRO Immediate Notification Guide

**What is LawPRO?**
LawPRO (Lawyers' Professional Indemnity Company) is the mandatory professional liability insurer for all Ontario lawyers in private practice.

**Why notify LawPRO?**
Your lawyer {{lawyerName}} has a professional obligation to report potential malpractice claims to LawPRO immediately. This is not optional.

**Who should notify?**
- **The defendant lawyer** ({{lawyerName}}) must report, **OR**
- **Your new lawyer** can notify LawPRO on your behalf

**What happens next?**
1. LawPRO acknowledges the claim
2. Assigns a claims examiner
3. Investigates the facts
4. Often attempts early settlement if liability is clear

**Your case:**
- Client: {{clientName}}
- Discovery date: {{discoveryDate}}
- Original matter: {{originalClaimType}}
- Missed deadline: {{missedDeadline}}

**Important:**
- Missed limitation periods are among the clearest forms of legal negligence
- LawPRO often acknowledges liability early in these cases
- This is NOT adversarial yet — most cases settle before litigation

**Next steps:**
1. Retain independent counsel (different lawyer)
2. Preserve all evidence (retainer agreement, emails, admission of error)
3. Do NOT sign any releases
4. Your new lawyer will send formal notice to LawPRO

**LawPRO Contact:**
- Phone: 416-598-5800 (Toronto)
- Website: www.lawpro.ca
- Claims reporting is handled through the insured lawyer or their new counsel

**This is information only, not legal advice. Consult a lawyer specializing in legal malpractice.**`,

      'malpractice/case_within_case': `# Case-Within-a-Case Analysis Framework

**What is "Case Within a Case"?**
In legal malpractice, you must prove TWO things:
1. The lawyer was negligent (missed deadline, etc.)
2. **But for** that negligence, you would have won the original claim

This is called the "case within a case" doctrine.

**Your Original Claim:**
- Type: {{originalClaimType}}
- Potential damages: {{potentialDamages}}
- Missed deadline: {{missedDeadline}}

**Four Elements to Prove:**

### 1. Duty of Care
✔ **Established by retainer agreement**
- Your lawyer owed you professional duties under the retainer

### 2. Breach of Standard of Care
✔ **Missing a limitation deadline = prima facie negligence**
- A "reasonably competent solicitor" knows and tracks limitation periods
- This breach is almost always established by admission

### 3. Causation (The "Case Within a Case")
⚠ **You must show the original claim had a reasonable prospect of success**
- NOT certainty — just "loss of a chance"
- Gather evidence from the original incident:
  - Photos, incident reports
  - Medical records (if injury)
  - Witness statements
  - Expert opinions (if needed)

**Assessment factors:**
- Strength of liability evidence
- Quantum (amount) of damages
- Credibility of witnesses
- Contributory negligence risk
- Typical awards for similar cases

### 4. Damages
⚠ **NOT automatically the full claim amount**
- Courts assess: **Likelihood of success × Original claim value**
- Example: 60% chance × $100,000 = $60,000 recoverable
- Plus: Legal costs already incurred
- Plus: Interest

**What you need to do:**
1. **Document the original claim thoroughly**
   - Preserve all evidence from original incident
   - Get expert opinions on liability and damages
   - Research comparable case awards

2. **Quantify realistic damages**
   - Not the amount you claimed
   - The amount you likely would have recovered

3. **Get expert evidence**
   - Often requires another lawyer to opine on standard of care
   - May need expert on the original claim (e.g., engineer, doctor)

**This is information only, not legal advice. Consult a legal malpractice specialist.**`,

      'malpractice/expert_instruction': `# Expert Witness Instruction Letter — Legal Malpractice

**To:** [Expert Lawyer Name]

**From:** {{clientName}} (via counsel)

**Date:** [Current date]

**Re:** Expert Opinion on Standard of Care — Legal Malpractice Claim

---

**Background:**

I am seeking an expert opinion on whether the conduct of {{lawyerName}} constituted a breach of the standard of care expected of a reasonably competent solicitor in Ontario.

**Facts:**

1. **Original matter:** {{originalClaimType}}
2. **Limitation deadline:** {{missedDeadline}}
3. **Retainer:** [Date retainer signed, scope of work]
4. **Lawyer's admission:** [Email/letter where lawyer admitted missing deadline]
5. **Consequence:** Claim is now statute-barred; client has lost right to sue

**Questions for Expert Opinion:**

1. **Standard of Care:**
   - What is the expected standard of care for tracking limitation periods in Ontario?
   - Are tickler systems, calendaring software, or diary systems considered mandatory?

2. **Breach:**
   - Does missing a statutory limitation deadline constitute a breach of the standard of care?
   - Are there any circumstances where missing {{missedDeadline}} would NOT be negligent?

3. **Causation (if applicable):**
   - What evidence would be needed to assess the merits of the original {{originalClaimType}} claim?
   - What is the typical range of settlements/awards for similar claims?

**Documents Enclosed:**

- Retainer agreement
- Email admission from {{lawyerName}}
- Timeline of key dates
- [Evidence from original claim, if available]

**Timeline:**

Please provide your preliminary assessment within [timeframe]. A formal written opinion will be required if this proceeds to litigation.

**Your Qualifications:**

We are seeking an expert with:
- Active Ontario bar membership
- Experience in [relevant practice area]
- Familiarity with professional negligence standards
- No conflict of interest with {{lawyerName}} or their firm

**Fee Arrangement:**

[To be discussed]

**Next Steps:**

If you are available and willing to provide this opinion, please confirm by [date]. We will then forward complete documentary evidence and discuss timeline.

**This is information only, not legal advice. Template must be customized by your malpractice counsel.**`,

      'malpractice/demand_letter': `# Formal Demand Letter — Legal Malpractice Claim

**DELIVERED BY:** [Email and Registered Mail]

**TO:**
{{lawyerName}}
[Law Firm Name]
[Address]

**CC:** LawPRO (Lawyers' Professional Indemnity Company)

**FROM:**
{{clientName}}
[Address]

**DATE:** [Current date]

**RE: NOTICE OF LEGAL MALPRACTICE CLAIM**

---

Dear {{lawyerName}}:

## 1. Introduction

This letter constitutes formal notice of a professional negligence claim arising from your representation of me in [original matter type: {{originalClaimType}}].

## 2. Facts

On or about [date], I retained you to pursue a claim for {{originalClaimType}}.

In Ontario, the Limitations Act, 2002 generally provides a **two-year limitation period** for such claims. The deadline to file my Statement of Claim was **{{missedDeadline}}**.

On {{discoveryDate}}, I discovered that no claim had been filed. In your email dated [date], you admitted to "missing the diary date" and acknowledged that the limitation period had expired.

## 3. Consequence

As a direct result of your negligence, my right to pursue the original claim is now **legally extinguished**. I have lost the opportunity to recover damages estimated at **{{potentialDamages}}**.

## 4. Elements of Malpractice

### Duty of Care
✔ Established by our retainer agreement dated [date]

### Breach of Standard of Care
✔ Missing a statutory limitation deadline is prima facie negligence

### Causation
The original claim had a reasonable prospect of success, supported by:
- [List key evidence: photos, medical records, witness statements, etc.]

### Damages
- Lost claim value: {{potentialDamages}}
- Legal costs incurred: [amount]
- Interest

## 5. Demand for Resolution

I invite you (and LawPRO on your behalf) to acknowledge liability and engage in settlement discussions without the need for litigation.

**Deadline:** Please respond within **21 days** of receipt of this letter.

If I do not receive a substantive response, I will:
1. Retain independent legal counsel
2. Proceed with a Statement of Claim in Ontario Superior Court of Justice
3. Seek full damages, costs, and interest

## 6. Preservation of Evidence

Please preserve all files, emails, calendar entries, and other documents related to my retainer. Spoliation of evidence will be separately actionable.

## 7. No Waiver

This letter does not constitute a waiver of any rights or limitation periods. I reserve all rights and remedies.

---

**Enclosures:**
- Copy of retainer agreement
- Copy of your admission email dated [date]
- [Timeline of events]

**Contact:**
[Your phone/email]

**This is information only, not legal advice. Have your malpractice lawyer review and customize before sending.**`,

      'malpractice/evidence_checklist': `# Evidence Preservation Checklist — Legal Malpractice Claims

**Purpose:** Gather and preserve ALL evidence related to both (1) the lawyer's negligence and (2) the merits of the original claim.

---

## Part A: Evidence of Lawyer's Negligence

### 1. Retainer Agreement
- [ ] Original signed retainer agreement
- [ ] Any amendments or modifications
- [ ] Fee arrangement details
- [ ] Scope of work definition

### 2. Communications
- [ ] **Admission of error:** Email/letter where lawyer acknowledged missing deadline
- [ ] All emails between you and lawyer
- [ ] Text messages
- [ ] Voicemails (transcribe and save audio)
- [ ] Meeting notes or memos

### 3. Limitation Period Evidence
- [ ] Date of original incident ({{missedDeadline}} calculation)
- [ ] Proof of when limitation period expired
- [ ] Statute text (Limitations Act, 2002)
- [ ] Any correspondence about filing timeline

### 4. Discovery Date
- [ ] How you discovered the error (court portal screenshot, etc.)
- [ ] Date of discovery: {{discoveryDate}}
- [ ] Initial reaction communications

### 5. Financial Records
- [ ] Invoices from lawyer
- [ ] Trust statements
- [ ] Payment receipts
- [ ] Legal costs incurred to date

---

## Part B: Evidence of Original Claim Merits (Case-Within-Case)

**Original claim type:** {{originalClaimType}}

### 6. Incident Documentation
- [ ] Photos of scene/property damage/injuries
- [ ] Incident reports (police, workplace, property management)
- [ ] Witness names and contact information
- [ ] Witness statements (if available)

### 7. Medical Evidence (if injury claim)
- [ ] Medical records from treating physicians
- [ ] Diagnostic reports (X-rays, MRI, CT scans)
- [ ] Treatment invoices and receipts
- [ ] Prognosis reports

### 8. Financial Losses
- [ ] Lost income documentation (pay stubs, tax returns)
- [ ] Out-of-pocket expenses (receipts)
- [ ] Future loss estimates (if applicable)

### 9. Expert Evidence (if needed)
- [ ] Expert reports on liability (e.g., engineer for slip-and-fall)
- [ ] Expert reports on damages (e.g., medical expert, economist)
- [ ] Comparable case awards research

### 10. Comparable Cases
- [ ] Research similar claims in your jurisdiction
- [ ] Typical settlement ranges
- [ ] Jury verdict reports (if available)

---

## Part C: Next Steps

### 11. Immediate Actions
- [ ] **Do NOT destroy anything** — every email, note, receipt matters
- [ ] Make copies of all documents
- [ ] Organize chronologically
- [ ] Create a master timeline
- [ ] Secure digital files (backup to cloud and external drive)

### 12. Consult Independent Counsel
- [ ] Find a lawyer who specializes in legal malpractice
- [ ] Provide them with complete evidence package
- [ ] Do NOT contact original lawyer for documents (your new lawyer will do this)

### 13. LawPRO Notification
- [ ] Your new lawyer will send notice to LawPRO
- [ ] LawPRO will assign a claims examiner
- [ ] Be prepared for investigation and questions

---

**Deadline to Preserve:**
Legal malpractice limitation period in Ontario is **2 years from discovery** of the negligence.

Discovery date: {{discoveryDate}}
**Your deadline:** [Calculate 2 years from discovery]

**Do NOT delay.** Early action improves settlement prospects.

**This is information only, not legal advice. Consult a legal malpractice specialist immediately.**`
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

  // Alias for consistency with domain modules
  render(templateId: string, context: Record<string, string | number | undefined>): string {
    return this.renderTemplate(templateId, context);
  }

  /**
   * Ontario Forms Repository: Official URLs for fillable forms
   * Source: Central Forms Repository (forms.mgcs.gov.on.ca), Ontario Court Forms, Tribunals Ontario
   */
  ontarioFormsRepository(): Record<string, { url: string; type: string; description: string }> {
    return {
      'form-7a-small-claims': {
        url: 'https://ontariocourtforms.on.ca/en/superior-court-of-justice/statement-of-claim/',
        type: 'PDF Fillable',
        description: 'Small Claims Court - Statement of Claim (Form 7A)'
      },
      'ltb-form-t1': {
        url: 'https://tribunalsontario.ca/ltb/forms-filing-and-fees/',
        type: 'PDF Fillable',
        description: 'Landlord & Tenant Board - Tenant Application (T1 Application)'
      },
      'ltb-form-l1': {
        url: 'https://tribunalsontario.ca/ltb/forms-filing-and-fees/',
        type: 'PDF Fillable',
        description: 'Landlord & Tenant Board - Landlord Application (L1 Eviction)'
      },
      'family-forms-portal': {
        url: 'https://www.ontario.ca/page/file-family-court-documents-online',
        type: 'Online Portal',
        description: 'Family Court Forms - My Ontario Account Required'
      },
      'central-forms-repository': {
        url: 'https://forms.mgcs.gov.on.ca/en/',
        type: 'Multi-Ministry Repository',
        description: 'Ontario Central Forms Repository - All Government Forms'
      },
      'ontario-court-forms': {
        url: 'https://ontariocourtforms.on.ca/en/',
        type: 'Court-Specific',
        description: 'Ontario Court Forms - Family, Civil, Small Claims, Criminal'
      },
      'superior-court-rules-forms': {
        url: 'https://ontariocourtforms.on.ca/en/rules-of-civil-procedure-forms/',
        type: 'Rules of Civil Procedure',
        description: 'Superior Court - Rules of Civil Procedure Forms'
      },
      'hrto-forms': {
        url: 'https://tribunalsontario.ca/hrto/',
        type: 'Tribunal Forms',
        description: 'Human Rights Tribunal of Ontario - Application and Replies'
      },
      'lat-forms': {
        url: 'https://tribunalsontario.ca/lat/',
        type: 'Tribunal Forms',
        description: 'Licence Appeal Tribunal - Accident Benefits Dispute Forms'
      },
      'legal-aid-forms-library': {
        url: 'https://www.legalaid.on.ca/lawyers-legal-professionals/forms-library/',
        type: 'Reference',
        description: 'Legal Aid Ontario Forms Library (Professional Reference)'
      }
    };
  }

  /**
   * Generate a forms reference section for documents
   * Lists official Ontario forms relevant to the matter type
   */
  generateFormsReference(matterType: string): string {
    const formsMap: Record<string, string[]> = {
      'small-claims': ['form-7a-small-claims', 'ontario-court-forms', 'central-forms-repository'],
      'landlord-tenant': ['ltb-form-t1', 'ltb-form-l1', 'tribunalsontario-portal'],
      'family': ['family-forms-portal', 'central-forms-repository'],
      'human-rights': ['hrto-forms', 'central-forms-repository'],
      'accident-benefits': ['lat-forms', 'central-forms-repository'],
      'civil-negligence': ['superior-court-rules-forms', 'ontario-court-forms', 'central-forms-repository'],
      default: ['central-forms-repository', 'ontario-court-forms']
    };

    const formIds = formsMap[matterType] || formsMap['default'];
    const formsRepo = this.ontarioFormsRepository();
    const forms = formIds.map(id => formsRepo[id]).filter(Boolean);

    if (forms.length === 0) return '';

    let markdown = '## Official Ontario Forms\n\n';
    forms.forEach(form => {
      markdown += `- **${form.description}** (${form.type})\n  ${form.url}\n\n`;
    });

    return markdown;
  }
}
