import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';

/**
 * Employment Law Router Domain Module
 *
 * This module routes employment disputes to the appropriate forum:
 * - ESA (Employment Standards Act) administrative complaints → Ministry of Labour
 * - Common law wrongful dismissal → Superior Court (or Small Claims under $50K)
 *
 * Key distinction: ESA provides LIMITED remedies (wages, severance), common law provides BROADER remedies
 * (damages for manner of dismissal, lost benefits, reputation) but requires litigation.
 *
 * Authority: Employment Standards Act, 2000 (Ontario); common law wrongful dismissal principles
 */
export class EmploymentLawRouterModule extends BaseDomainModule {
  domain = 'employment' as const;

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
    const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];

    const drafts: DocumentDraft[] = [
      // ESA vs Common Law decision tree
      this.createESAvsCommonLawGuide(input, refs),

      // Ministry of Labour ESA complaint process
      this.createESAComplaintGuide(input, refs),

      // Common law wrongful dismissal litigation
      this.createWrongfulDismissalGuide(input, refs),

      // Severance and termination pay requirements
      this.createSeverancePayGuide(input, refs),

      // Notice requirements analysis
      this.createNoticeRequirementsGuide(input, refs),

      // Evidence and documentation checklist
      this.createEmploymentEvidenceChecklist(input, refs),

      // Limitation periods and deadlines
      this.createEmploymentLimitationGuide(input, refs),

      // Interim relief and quick actions
      this.createInterimReliefGuide(input, refs)
    ];

    return drafts;
  }

  private createESAvsCommonLawGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'ESA Complaint vs Common Law Wrongful Dismissal — Which Path?',
      sections: [
        {
          heading: 'Quick Decision Tree',
          content: `**Are you seeking ONLY unpaid wages, vacation pay, or severance?**
→ YES: ESA complaint to Ministry of Labour
   • Free to file
   • 2-year claim period
   • Decisions within 6-12 months
   • Limited to statutory remedies

→ NO: Also claiming damages for manner of dismissal, lost benefits, reputation harm?
   • Consider common law wrongful dismissal litigation
   • Can claim broader damages
   • Requires lawyer (more expensive)
  • Claims may exceed Small Claims limit ($50K)

**Do you have a contract specifying notice period or severance?**
→ YES: Contract may limit or exceed ESA minimums
   • Review contract carefully with lawyer
   • May choose ESA or common law depending on contract terms
   • Employer must provide greater of contract or ESA minimums

→ NO: ESA minimums apply (2 weeks notice + severance)
   • Claim any shortfall to MOL
   • Or sue for wrongful dismissal if seeking broader damages`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'ESA Complaint (Ministry of Labour Route)',
          content: `**When to choose ESA complaint:**
✓ Owed unpaid wages (regular pay, overtime)
✓ Not paid vacation pay or statutory holiday pay
✓ Entitled to severance but not paid
✓ Due notice but dismissed without notice/pay-in-lieu
✓ Claims under $50,000
✓ Want quick resolution (6-12 months vs 2-3 years litigation)

**When NOT to choose ESA complaint:**
✗ Claiming damages for manner of dismissal (unfair treatment)
✗ Seeking lost pension benefits (beyond severance)
✗ Claiming damages for emotional distress/reputational harm
✗ Contract gives you BETTER severance than ESA
✗ Employer claims you were fired "for cause" (ESA allows mitigation)`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Common Law Wrongful Dismissal (Court Litigation Route)',
          content: `**When to choose common law wrongful dismissal:**
✓ Dismissed without proper notice or pay-in-lieu
✓ Claim includes damages beyond unpaid wages (lost benefits, damages for manner)
✓ Contract promised specific severance exceeding ESA
✓ Employer conducted dismissal in abusive/humiliating manner
✓ Claims likely exceed Small Claims limit
✓ Seeking broader remedies than Ministry can award

**When NOT to choose common law wrongful dismissal:**
✗ Only claiming unpaid wages (ESA faster, free)
✗ Cannot afford lawyer/litigation costs
✗ Want resolution quickly (litigation takes 2-3 years)
✗ Fired "for cause" with good documentation (harder to win)
✗ Claims under $50,000 (use Small Claims instead)`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Key Differences',
          content: `| Factor | ESA Complaint | Common Law Lawsuit |
|--------|---------------|-------------------|
| Cost | FREE to file | $5,000-$50,000+ lawyer fees |
| Timeline | 6-12 months | 2-4 years |
| Remedies | Unpaid wages, severance only | Broader damages (benefits, manner, emotional distress) |
| Burden of Proof | Lower; MOL helps | Higher; you prove wrongful dismissal |
| "For Cause" Defense | Weak (ESA doesn't allow) | Strong defense if documented |
| Small Claims | N/A | Yes, if under $50K |
| Limitation Period | 2 years from event | 2 years from dismissal |
| Appeal | Limited (Director review) | Full court appeal available |`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createESAComplaintGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Ministry of Labour ESA Complaint — How to File',
      sections: [
        {
          heading: 'Eligibility for ESA Complaint',
          content: `**You can file with Ministry of Labour (MOL) if:**
✓ You were an employee (not independent contractor)
✓ Dismissed and owed unpaid wages, vacation pay, or severance
✓ Claim is within 2 years of when money was owed
✓ You have documentation of employment (pay stubs, contract, emails)

**You CANNOT claim via MOL:**
✗ Contract breach claims (use court instead)
✗ Discrimination/harassment (file human rights complaint with HRTO instead)
✗ Health & safety violations (report to Ministry of Labour Labour Inspectorate)`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'What the MOL Will Award',
          content: `**ESA Payment Limits:**
• Unpaid wages: Full amount owed (up to 2 years back)
• Overtime: If employer failed to pay overtime premiums
• Vacation pay: 2-4 weeks depending on years of service
• Statutory holiday pay: If not paid when entitled
• Severance pay: 2 weeks (Ontario minimum)
• Termination pay: 2 weeks + severance if notice not given

**What MOL WILL NOT Award:**
✗ Damages for manner of dismissal
✗ Lost benefits (pension, insurance)
✗ Emotional distress
✗ Punitive damages
✗ Damages for reputational harm

**Example:**
Dismissed after 5 years without 2 weeks notice
• Owed: 2 weeks notice pay (or pay-in-lieu) + 2 weeks severance = 4 weeks gross pay
• Also owed: All unpaid wages since dismissal
• NOT owed: Damages for humiliating dismissal or lost health benefits`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'How to File MOL Complaint',
          content: `**Step 1: Gather Documentation**
□ Employment contract (if any)
□ Pay stubs (last 3-6 months)
□ Emails/texts showing employment relationship
□ Record of termination date
□ Calculation of wages owed (or severance owed)
□ Any written termination communication (letter, email)

**Step 2: Contact Ministry of Labour**
• Phone: 1-800-531-5551 (toll-free)
• Online: www.ontario.ca/employment-standards
• In-person: Service Ontario office (by appointment)

**Step 3: File Complaint**
• Form available online or by phone
• Include: Your name, employer name, dates, wages owed, documentation
• No filing fee
• MOL will investigate at no cost to you

**Step 4: MOL Investigation**
• MOL assigns investigator
• Investigator contacts employer for response
• You may be asked to provide more documents
• Process typically 6-12 months

**Step 5: Decision**
• MOL issues compliance order
• Employer must pay or appeal to Director
• If unhappy, can apply for Director review (limited grounds)`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Timeline & What to Expect',
          content: `**Month 1:** File complaint with MOL
**Month 2-3:** MOL contacts employer, requests response
**Month 4-8:** Investigation period, document exchanges
**Month 8-10:** MOL makes decision, issues compliance order
**Month 10-12:** Employer pays or appeals

**If employer refuses to pay:**
• MOL can prosecute (though resource-limited)
• You can file in Small Claims Court with MOL order as evidence
• Enforcement via Small Claims judgment

**Key Advantage:** No lawyer needed; MOL does investigation for free`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createWrongfulDismissalGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Common Law Wrongful Dismissal — Court Litigation Guide',
      sections: [
        {
          heading: 'What is Wrongful Dismissal?',
          content: `Common law wrongful dismissal occurs when an employer:
1. **Terminated without proper notice** (per common law, not ESA)
   • Common law notice period = length of service (e.g., 3 months for 3 years)
   • ESA provides only 2 weeks (minimum)
   • Common law OFTEN requires longer notice

2. **Provided inadequate severance**
   • ESA requires 2 weeks; common law may require MORE
   • Wrongful dismissal claims compensate for inadequate notice

3. **Dismissed in "bad faith"**
   • Without cause alleged or proven
   • In humiliating/abusive manner
   • Without following contractual procedures
   • May claim damages for manner of dismissal

**Example:**
Employee with 10-year service dismissed without notice.
• ESA minimum: 2 weeks notice
• Common law notice: 3-24 months (depends on job, age, availability of substitute)
• Shortfall: 2 years in unpaid notice = $150,000+ damages`,
          evidenceRefs: refs,
          confirmed: true
        },
        {
          heading: 'Calculating Wrongful Dismissal Damages',
          content: `**Notice Period Analysis:**
Courts consider:
• Length of service (longer = more notice)
• Age and position (senior roles = longer)
• Availability of comparable employment
• Economic conditions
• Industry standards

**Typical Notice Periods (Common Law):**
• <2 years service: 2-4 weeks
• 2-5 years service: 1-3 months
• 5-10 years service: 2-6 months
• 10+ years service: 3-24 months (sometimes more)

**Damages Calculation:**
Base = Gross salary × notice period months + other compensation

Example: $60,000/year × 12 months notice = $60,000 wrongful dismissal claim

**Additional Damages (if applicable):**
+ Lost benefits (extended health, pension contributions)
+ Lost bonus (if pattern established)
+ Loss of reputation (rare, must prove actual loss)
- Mitigation (wages earned in new job reduce damages)
- Notice given by employer (reduces damages)`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Where to Sue & Procedure',
          content: `**Small Claims Court (for claims under $50,000):**
✓ Faster (12-18 months)
✓ Simpler procedure
✓ No lawyer requirement
✓ Lower court costs
✗ Limited remedies
✗ Limited appeal rights

**Superior Court (for claims over $50,000):**
✓ Larger damage awards possible
✓ Full appeal rights
✓ Complex claims
✗ Expensive (lawyer fees $10,000-$50,000+)
✗ Longer timeline (2-4 years)
✗ More formal procedure

**Process:**
1. Consult employment lawyer (most offer free consultation)
2. File claim (Statement of Claim in Superior Court or claim in Small Claims)
3. Defendant has 20 days to respond
4. Discovery phase (exchange documents, depositions)
5. Mediation/settlement negotiations
6. Trial (if no settlement)`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Defending Against "For Cause" Termination',
          content: `**Employer may claim "just cause" for termination:**
This means immediate dismissal without notice/severance is justified.

**For cause must meet STRICT standard:**
• Willful misconduct (not mere poor performance)
• Gross insubordination
• Dishonesty/theft
• Violence or threat to safety
• Persistent failure to perform after warnings
• Material breach of employment contract

**Important:** Burden is ON EMPLOYER to prove just cause.

**Your defense strategy:**
1. Deny the alleged misconduct
2. Show employer conduct (discriminatory, abusive, breach of contract)
3. Demonstrate employer's own breaches (unpaid overtime, unsafe conditions)
4. Show inconsistent discipline (others not fired for same conduct)
5. Prove lack of progressive discipline

**Common just cause failures (courts overrule):**
✗ Single absence or lateness
✗ Minor policy breach with no prior warning
✗ Performance issues (requires warnings, opportunity to improve)
✗ Off-duty conduct (unless affects employment)
✗ Honest mistakes in judgment`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createSeverancePayGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Severance Pay & Termination Pay Requirements (Ontario)',
      sections: [
        {
          heading: 'ESA Minimum Severance & Termination Pay',
          content: `**When employer must provide severance (ESA):**
1. **Severance Pay (2 weeks)** — If laid off/terminated without cause
   • 2 weeks gross pay at termination
   • Owed if employed 12+ months (typically)
   • NOTE: Severance is SEPARATE from notice

2. **Termination Pay** — If notice of termination not given
   • = notice period × daily wage
   • OR pay-in-lieu to stop income loss
   • Minimum 2 weeks (ESA)

**Exception:** No severance if:
✗ Fired for just cause
✗ Refused suitable alternative employment
✗ Temporary layoff (may recall)

**Example:**
Employed 5 years, $60,000/year salary, dismissed with no notice
• Owed: 2 weeks severance (ESA minimum)
• Owed: 2 weeks termination pay (ESA minimum, since no notice given)
• Common law may owe ADDITIONAL notice (3-6 months depending on circumstances)`,
          evidenceRefs: refs,
          confirmed: true
        },
        {
          heading: 'When LARGER Severance May Be Owed',
          content: `**Contract may specify larger severance:**
Review employment contract for:
□ Severance clause (specifies amount/multiple of salary)
□ Golden parachute (senior employee protection)
□ Change of control clause (severance if business sold)
□ Termination definition (for cause vs without cause)

**Employer must provide GREATER OF:**
• What contract says, OR
• What ESA requires

**Example:**
Contract says: "2 months severance per year of service"
You have 10 years service → 20 months severance owed
ESA only provides 2 weeks → Claim 20 months (contract applies)

**Common law wrongful dismissal may add:**
• Additional notice period damages (months of lost salary)
• Lost benefits (employer contribution to health/pension)
• Lost bonus (if pattern of bonus established)
• Damages for manner of dismissal (if abusive termination)

**Total potential recovery example:**
10-year employee, $100,000/year:
• ESA severance: 2 weeks = $3,846
• Contract severance: 20 months = $166,667
• Common law notice period: 6 months = $50,000
• Lost benefits: $10,000
• **Total potential: ~$230,000**`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Calculating Your Severance Claim',
          content: `**Checklist to calculate what you are owed:**

**1. ESA Minimum Severance (all employees)**
☐ Date hired: ______
☐ Date terminated: ______
☐ Years of service: ______
☐ Gross weekly pay: ______
☐ ESA severance (2 weeks): $______

**2. Termination Pay (if no notice given)**
☐ Gross weekly pay: ______
☐ Notice period provided: _____ weeks (0 if immediate)
☐ Weeks still owed: ______
☐ Termination pay owed: $______

**3. Contract Severance (if better than ESA)**
☐ Employment contract exists? YES / NO
☐ Severance clause? ______
☐ Severance amount: $______
☐ Is it better than ESA? YES / NO
☐ Claim contract amount: $______

**4. Common Law Additional Notice (consultation needed)**
☐ Total years service: ______
☐ Age: ______
☐ Position held: ______
☐ Market for your role: ______
☐ Estimate additional notice period (with lawyer): _____ months
☐ Monthly salary: $______
☐ Potential common law notice damages: $______

**5. Other Components**
☐ Unpaid vacation pay: $______
☐ Unpaid overtime: $______
☐ Lost benefits value: $______
☐ Lost bonus (if applicable): $______

**TOTAL CLAIM: $______**`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createNoticeRequirementsGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Notice Requirements — ESA vs Common Law',
      sections: [
        {
          heading: 'ESA Minimum Notice Requirements',
          content: `Ontario Employment Standards Act (ESA) requires:

**Minimum Notice Periods:**
• 2 weeks notice if employed 12 months or more
• 1 week notice if employed 3 months to <12 months
• No notice if employed <3 months (at-will employment)

**OR:**
• Pay-in-lieu of notice (continue salary until notice period expires)

**Notice Requirement Details:**
✓ Must be in WRITING (email counts)
✓ Notice must state termination date or amount owed
✓ Must be given BEFORE or ON last day of work
✓ Cannot require employee to "work through" notice if paid

**ESA Exemptions (may not apply):**
✗ Temporary layoff (company may recall)
✗ Shortage of work (temporary)
✗ Just cause termination (no notice required)

**Example:**
Employed 4 years, no contract
• ESA requires: 2 weeks written notice
• If no notice: Pay 2 weeks wages in lieu
• Common law may require: 3-6 months additional (depends on circumstances)`,
          evidenceRefs: refs,
          confirmed: true
        },
        {
          heading: 'Common Law Notice Periods (How Much Notice Is Fair?)',
          content: `Courts analyze notice based on **3 factors:**

**1. Length of Service**
• <2 years: 2 weeks to 1 month
• 2-5 years: 1-3 months
• 5-10 years: 2-6 months
• 10+ years: 3-24 months (sometimes more)

**2. Age & Position**
• Senior executives: LONGER notice (harder to replace)
• Entry-level: SHORTER notice (easier to find replacement)
• Older workers: LONGER notice (harder to find new job)
• Younger workers: SHORTER notice

**3. Availability of Similar Employment**
• Specialized role: LONGER notice (harder to find)
• Common role: SHORTER notice
• Difficult job market: LONGER notice
• Strong job market: SHORTER notice

**Example Calculation:**
Finance Manager, age 52, 8 years service, $90,000/year
• Length of service factor: 4 months
• Age & seniority factor: +2 months
• Market availability factor: +1 month
• **Total common law notice: ~7 months** = $52,500

Compare to ESA: 2 weeks = $3,462
Common law provides $49,038 MORE in damages`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Mitigation — Impact of Finding New Job',
          content: `**Important Legal Concept: Mitigation**

When dismissed, you have a DUTY to:
✓ Actively search for new employment
✓ Accept suitable alternative employment
✓ Limit damages to what ESA provides PLUS reasonable notice period

**How mitigation reduces your claim:**
If notice period is 6 months but you find job after 3 months:
• Original claim: $50,000 (6 months notice)
• Mitigation: Subtract new job income: -$25,000
• Final award: $25,000

**Courts look at:**
• Did you apply for jobs? (must show effort)
• Did you accept suitable offers?
• Would reasonable person have found job sooner?
• What was job market like?

**Impact on damages:**
• Early employment = REDUCES damages
• Good faith job search = Shows reasonableness
• Refusing suitable work = Undermines claim
• Poor job market = Courts more forgiving`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createEmploymentEvidenceChecklist(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Employment Dispute — Evidence Checklist',
      sections: [
        {
          heading: 'Employment Relationship Documentation',
          content: `**Proving you were an employee (not contractor):**
□ Employment contract
□ Job offer letter
□ Pay stubs (showing deductions, income tax)
□ T4 slip (employment income tax form)
□ Employee handbook
□ Schedule of hours/timesheets
□ Email from HR or manager confirming hire
□ Performance reviews

**Key distinction:**
Employee: T4 slip, payroll deductions, employer controlled
Contractor: Invoices issued, business number, no deductions`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Termination & Notice Documentation',
          content: `**Proof of termination:**
□ Termination letter from employer
□ Email stating termination date
□ Last pay stub showing final payment
□ Notice of Record of Employment (ROE) from employer
□ Email/text from manager confirming dismissal
□ Witness testimony (colleague present)

**Proof of notice given (or NOT given):**
□ Dates employed (hire date to termination date)
□ Calculation showing notice period owed
□ Communication showing no notice period provided
□ Screenshot of email/letter (with date stamp)
□ Testimony about verbal termination

**What to document immediately after dismissal:**
□ Date of termination
□ Who told you
□ How you were told (in-person, email, letter)
□ Reason given (if any)
□ What you were told about severance/notice
□ Screenshot/photo of termination letter
□ Witness names present at dismissal`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Wages & Severance Documentation',
          content: `**To prove wages owed:**
□ Pay stubs (6-12 months)
□ Employment contract specifying salary
□ Emails discussing pay rate
□ Direct deposit statements
□ Tax return (T1 General) showing employment income
□ CRA Notice of Assessment

**To prove severance/benefits owed:**
□ Employment contract (severance clause)
□ Employee handbook (severance policy)
□ Email from HR discussing severance terms
□ Industry standards (for wrongful dismissal comparison)
□ Benefits statement (health, dental, pension)
□ Proof of unused vacation pay
□ Bonus records (if claiming lost bonus)

**Calculation support:**
□ Gross salary: $______/year
□ Notice period owed: _____ months (ESA or common law)
□ Calculation: $_____ × _____ months = $______
□ Mitigation (new job wages): -$______
□ Final amount owed: $______`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'For Cause Defense — Employer Burden',
          content: `If employer claims just cause, they must prove:

**Documentation to counter their claim:**
□ Your employment record (no prior warnings)
□ Emails from manager praising performance
□ Performance reviews (not poor)
□ No disciplinary records
□ Other employees (treated inconsistently)
□ Proof of similar conduct (others not fired)
□ Company policy (not clearly violated)
□ Witness testimony (colleagues confirm version)
□ Your version of events (email to employer same day)

**Documents to request from employer (Discovery):**
□ Disciplinary records for you
□ Disciplinary records for others (to show inconsistency)
□ Company policy manual
□ Communications about termination decision
□ Any allegation against you in writing
□ Investigation report (if any)

**Important:** Once litigation starts, discover what EMPLOYER claimed,
then provide evidence showing it is false or inconsistent.`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createEmploymentLimitationGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Employment Dispute — Limitation Periods & Deadlines',
      sections: [
        {
          heading: 'Critical Limitation Periods',
          content: `**ESA Complaint (Ministry of Labour):**
• DEADLINE: 2 years from date money was owed
• If dismissed without notice: 2 years from dismissal date
• If denied severance: 2 years from when it was due
• NO exceptions (this is strict)

**Common Law Wrongful Dismissal Lawsuit:**
• DEADLINE: 2 years from date of dismissal
• Starts running from last day of employment
• STRICT deadline: Missing it = FOREVER barred
• Filing one day late = Claim LOST (applies to all jurisdictions in Ontario)

**Example Timeline:**
December 1, 2024: You are dismissed without notice
December 1, 2026: DEADLINE to file ESA complaint with MOL
December 1, 2026: DEADLINE to file wrongful dismissal claim in court
December 2, 2026: TOO LATE (claim is now statute-barred, FOREVER)`,
          evidenceRefs: refs,
          confirmed: true
        },
        {
          heading: 'Action Plan & Deadlines',
          content: `**WEEK 1-2 (immediately after dismissal):**
☐ Document everything (date, manner, what said, witnesses)
☐ Request written explanation from employer
☐ Calculate wages/severance owed
☐ Gather all employment documents
☐ Consider whether ESA or court claim better

**WEEK 2-4:**
☐ Consult employment lawyer (most free initial consultation)
☐ If ESA complaint: Contact Ministry of Labour
☐ If court claim: Serve Statement of Claim (or Small Claims)
☐ Keep records of job search efforts (for mitigation defense)

**WEEK 4-8:**
☐ Respond to employer communications with lawyer
☐ Document any further communications about severance
☐ Continue job search actively
☐ Track new income (will reduce damages via mitigation)

**ONGOING (track these):**
☐ Job applications submitted (dates, positions)
☐ Job offers received (amounts, dates)
☐ New job start date and salary
☐ All expenses related to job search
☐ Communications with employer (emails, letters)

**CRITICAL: File BEFORE 2-year deadline from dismissal**
• ESA complaint: Before 2-year mark
• Court claim: Before 2-year mark
• One day late = Claim barred forever`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createInterimReliefGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Quick Actions & Interim Relief for Employment Disputes',
      sections: [
        {
          heading: 'Immediate Actions (First 24-48 Hours)',
          content: `**Before contacting employer:**
□ Document the dismissal (date, time, manner, witnesses, what was said)
□ Take photos of office, severance letter (proof)
□ Screenshot emails/texts about dismissal
□ Record supervisor name and HR contact
□ Note any witnesses present
□ Write down exactly what was said (verbatim if possible)

**Understand your options:**
□ ESA complaint (free, 6-12 months, limited remedies)
□ Small Claims Court (if under $50K, 12-18 months)
□ Superior Court (if over $50K, 2-4 years)
□ Negotiate directly with employer

**Do NOT:**
✗ Sign anything employer sends (get lawyer review first)
✗ Agree to severance without review (may be insufficient)
✗ Waive claims without knowing your rights
✗ Accept settlement without understanding its terms

**DO:**
✓ Request everything in writing (emails, not phone)
✓ Keep copies of all communications
✓ Consult lawyer before signing anything
✓ Document immediately while facts fresh`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Negotiating Settlement',
          content: `**Strategy: Calculate what you are owed FIRST**
Before negotiating, know:
• ESA minimum: 2 weeks severance + any unpaid wages
• Common law estimate: 3-6 months notice (depends on circumstances)
• Your ideal settlement: Aim for 80-90% of estimated claim

**Negotiation approach:**
1. Request written explanation of termination
2. Calculate amount owed using severance calculator
3. Propose settlement (in writing, with calculation)
4. Propose timeline for payment
5. Offer full release in exchange (end all claims)

**Example settlement proposal:**
"I am owed 3 months notice ($22,500) under common law for 6-year service.
I will accept $20,000 as full and final settlement, payable within 30 days.
This constitutes full release of all claims."

**Settlement benefits:**
✓ Faster resolution (days/weeks vs months/years)
✓ Guaranteed payment (vs litigation risk)
✓ Lower legal costs
✓ Maintains reference (employer may cooperate more)

**Settlement risks:**
✗ May accept less than entitled
✗ Give up all claims (cannot sue later)
✗ May waive other claims (benefits, discrimination)`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'When to Involve a Lawyer Immediately',
          content: `**Contact employment lawyer RIGHT AWAY if:**
□ Amount owed is substantial ($10,000+)
□ Employer offered settlement (BEFORE accepting)
□ You want to pursue court claim (limited time)
□ You suspect discrimination or harassment (different claim)
□ Contract involved (complex terms)
□ Employer threatening to sue you (counter-claim)
□ You have health/mental health impact from dismissal
□ Employer asking you to sign non-compete or non-disparagement

**Lawyer will help with:**
✓ Calculating rightful notice period
✓ Evaluating settlement offer
✓ Preparing court claim if needed
✓ Defending against just cause allegations
✓ Negotiating on your behalf
✓ Managing deadline compliance

**Cost considerations:**
• Free initial consultation (most lawyers)
• Contingency fee (lawyer takes % of settlement): 20-30%
• Hourly rate: $200-$400/hour (employment lawyers)
• Fixed fee: Some may quote for full claim
• Small Claims: May not need lawyer for claims <$25K`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }
}
