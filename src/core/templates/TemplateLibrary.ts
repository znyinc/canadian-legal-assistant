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
