import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';

export class LandlordTenantDomainModule extends BaseDomainModule {
  domain = 'landlordTenant' as const;

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
    const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];

    const mkDraft = (title: string, summary: string, confirmedFacts: boolean): DocumentDraft => {
      const sections = [
        {
          heading: 'Facts',
          content: `${summary} See attached timeline for key dates and supporting evidence references.`,
          evidenceRefs: refs,
          confirmed: confirmedFacts
        },
        {
          heading: 'Requests',
          content: 'Sets out requested actions consistent with LTB processes (confirm before filing).',
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Next Steps',
          content: 'This draft is informational; confirm correctness and file the appropriate LTB form or notice.',
          evidenceRefs: [],
          confirmed: true
        }
      ];

      return this.drafting.createDraft({
        title,
        sections,
        evidenceIndex: input.evidenceIndex,
        jurisdiction: input.classification.jurisdiction,
        requireConfirmations: true
      });
    };

    const drafts: DocumentDraft[] = [
      mkDraft('LTB Intake Checklist', 'Captures tenancy details, rent amounts, and issues for LTB intake.', true),
      mkDraft('Notice to Resolve Issue', 'Outlines the issue and requests resolution before formal LTB filing.', false),
      mkDraft('Evidence Pack Cover', 'Summarizes attachments for an LTB hearing or mediation.', true)
    ];

    // Enhanced T1 Application (Tenant Rights - Rent, Services, Utilities, Illegal Entry)
    drafts.push(this.createT1Application(input, refs));
    
    // Enhanced T2 Application (Tenant Rights - Harassment, Eviction Issues)
    drafts.push(this.createT2Application(input, refs));
    
    // Enhanced T6 Application (Tenant Rights - Maintenance, Repairs, Vital Services)
    drafts.push(this.createT6Application(input, refs));

    return drafts;
  }

  private createT1Application(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'LTB Form T1 — Tenant Rights Application',
      sections: [
        {
          heading: 'When to Use Form T1',
          content: `Use T1 for issues like:
• Rent increases above guideline without notice
• Landlord collected illegal fees (key deposits, NSF charges)
• Landlord failed to provide services or utilities included in rent
• Landlord entered unit illegally without proper notice
• Security deposit not returned within time limits

⚠️ Filing Deadline: Within 1 year of the incident/breach (check specific timelines for rent issues).`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Required Information',
          content: `You will need:
✓ Rental address and unit number
✓ Landlord's full legal name and address for service
✓ Your tenancy start date and current rent amount
✓ Detailed description of each issue with dates
✓ Evidence: receipts, photos, emails, notices, bank statements
✓ Calculation of compensation you're requesting`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Service Requirements',
          content: `After filing:
1. Serve copy of application on landlord (in person, mail, or courier)
2. File Certificate of Service with LTB
3. Landlord has 20 days to respond
4. LTB will schedule hearing (check portal for updates)

📧 Recommended: Use registered mail or process server for proof of service.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Evidence Checklist',
          content: `Gather and organize:
□ Lease agreement showing rent and included services
□ Photos/videos of conditions with timestamps
□ Communication with landlord (emails, texts, letters)
□ Receipts for expenses caused by landlord's breach
□ Witness statements (if applicable)
□ Timeline of events (dates + brief descriptions)

💡 Tip: Label each piece of evidence clearly (e.g., "Exhibit A: Landlord email dated...")`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Next Steps',
          content: `1. Download current T1 form from LTB website: https://tribunalsontario.ca/ltb/
2. Complete form with facts from your evidence
3. Calculate compensation requested (rent reductions, out-of-pocket costs)
4. File online via Tribunals Ontario Portal or by mail
5. Serve landlord and file Certificate of Service
6. Prepare for hearing: organize evidence, practice explaining your case

⚖️ Legal Information Only: This is not legal advice. Consider consulting a tenant duty counsel or community legal clinic for complex issues.`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createT2Application(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'LTB Form T2 — Tenant Rights Application (Eviction-Related)',
      sections: [
        {
          heading: 'When to Use Form T2',
          content: `Use T2 for serious issues like:
• Landlord harassment or substantial interference with enjoyment
• Landlord's conduct coerced tenant to move out
• Landlord withheld or discontinued vital services (heat, water)
• Landlord changed locks or removed belongings illegally
• Landlord gave invalid eviction notice

⚠️ Filing Deadline: Within 1 year of the incident. For ongoing harassment, file as soon as possible.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Required Information',
          content: `You will need:
✓ Rental address and landlord's legal name
✓ Detailed description of harassment/interference with specific dates
✓ How landlord's actions affected your living conditions
✓ Evidence: texts, emails, photos, witness statements, police reports
✓ Medical records (if harassment caused health issues)
✓ Compensation requested: rent abatement, moving costs, damages`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Service Requirements',
          content: `Same as T1:
1. File application with LTB
2. Serve landlord within prescribed time
3. File Certificate of Service
4. Attend hearing on scheduled date

⚠️ If eviction notice is invalid, T2 can stop or delay eviction. Consider filing T2 + motion to stay eviction.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Evidence Checklist',
          content: `Critical evidence for T2:
□ Diary/log of incidents (dates, times, what happened)
□ Communications from landlord (threatening texts, emails)
□ Photos/videos of harassment or property interference
□ Witness statements from neighbors or visitors
□ Police reports (if you called police)
□ Medical records showing stress/health impact
□ Proof of expenses (hotel costs if forced to leave)

💡 Tip: Pattern of behavior is key — show repeated/ongoing harassment, not isolated incidents.`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Next Steps',
          content: `1. Download current T2 form: https://tribunalsontario.ca/ltb/
2. Describe each incident clearly with dates and impact
3. State what relief you're seeking (stop harassment, rent abatement, compensation)
4. File and serve promptly (especially if eviction notice is involved)
5. Prepare detailed evidence package
6. Consider contacting tenant duty counsel for hearing preparation

🚨 Emergency: If landlord locked you out or turned off heat/water, file T2 immediately and request urgent hearing.`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createT6Application(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'LTB Form T6 — Tenant Rights Application (Maintenance & Repairs)',
      sections: [
        {
          heading: 'When to Use Form T6',
          content: `Use T6 for maintenance and repair issues:
• Landlord failed to maintain property in good repair
• Repairs needed affect health, safety, or housing standards
• Landlord delayed or refused to make necessary repairs
• Vital services (heat, hot water, electricity) not working
• Pest infestations (bedbugs, cockroaches, mice)

⚠️ Filing Deadline: Within 1 year of first notifying landlord. File sooner for health/safety issues.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'BEFORE Filing T6',
          content: `Critical first steps:
1️⃣ Give landlord written notice of repair issue (email or letter)
2️⃣ Give reasonable time to repair (depends on severity)
3️⃣ Document landlord's failure to repair
4️⃣ Call municipal bylaw if health/safety issue (get inspection report)

📋 Municipal inspection report is powerful evidence — request it before filing T6.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Required Information',
          content: `You will need:
✓ List of all repair issues with dates first reported
✓ Copy of written notice(s) to landlord
✓ Photos/videos showing repair issues (dated)
✓ Municipal inspection reports (if obtained)
✓ Evidence of landlord's response or lack thereof
✓ Calculation: rent abatement, repair costs paid, out-of-pocket expenses
✓ Statement of impact on health/safety/enjoyment`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Evidence Checklist',
          content: `Strong T6 evidence includes:
□ Written notice to landlord (emails, texts, letters) with dates
□ Photos/videos of repair issues (multiple dates to show ongoing)
□ Municipal property standards inspection report
□ Receipts for repairs you paid for (if emergency)
□ Medical records (if health affected by conditions)
□ Timeline showing: reported → landlord response → current state
□ Witness statements from other tenants with same issues

💡 Tip: Take photos weekly to show problem persists — dates are critical.`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Remedies You Can Request',
          content: `Common T6 remedies:
• Rent abatement (reduction for period of disrepair)
• Order landlord to complete repairs within timeline
• Reimbursement for repairs you paid for
• Compensation for damaged belongings (e.g., mold ruined furniture)
• Authorization to arrange repairs (deduct from rent)

📊 Calculate rent abatement: Estimate % reduction based on severity and duration.`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Next Steps',
          content: `1. Download current T6 form: https://tribunalsontario.ca/ltb/
2. List each repair issue separately with dates
3. Attach municipal inspection report (if obtained)
4. Calculate compensation: abatement + out-of-pocket costs
5. File online or by mail, serve landlord, file Certificate of Service
6. Prepare for hearing: organize photos by date, timeline of notices

🏛️ At Hearing: Be specific about dates, show evidence of notice to landlord, explain health/safety impact.`,
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
