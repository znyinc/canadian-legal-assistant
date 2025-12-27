import { BaseDomainModule } from './BaseDomainModule';
import { DomainModuleInput, DocumentDraft } from '../models';

/**
 * Ontario Consolidation Procedures (OCPP) Domain Module
 *
 * OCPP is a civil court procedure in Ontario Superior Court that allows:
 * - Consolidation of related proceedings (staying one action, continuing another)
 * - Amendments to claims within ongoing proceedings
 * - Joining of claims (adding parties/claims)
 * - Interlocutory motions (applications during the action before trial)
 *
 * Primarily used in Toronto Region (Central Ontario) Superior Court
 * Governed by Ontario Superior Court Civil Rules (R.626 onwards)
 * File format requirements: PDF/A for long-term preservation
 */
export class OCPPFilingModule extends BaseDomainModule {
  domain = 'ocppFiling' as const;

  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
    const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];

    const drafts: DocumentDraft[] = [
      // Core OCPP guidance document
      this.createOCPPGuidance(input, refs),

      // Consolidation/Amendment application scaffold
      this.createConsolidationApplication(input, refs),

      // Expert affidavit requirements (often needed in OCPP)
      this.createExpertAffidavitRequirements(input, refs),

      // Cross-examination and evidence preparation guide
      this.createCrossExaminationGuide(input, refs),

      // Interlocutory motion template (for motions during OCPP)
      this.createInterlocutoryMotionTemplate(input, refs)
    ];

    return drafts;
  }

  private createOCPPGuidance(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'Ontario Consolidation Procedures (OCPP) — Court Process Guide',
      sections: [
        {
          heading: 'What is OCPP?',
          content: `Ontario Consolidation Procedures (OCPP) is a Superior Court civil procedure that:
• Consolidates related lawsuits into one proceeding (efficiency, cost savings)
• Allows amendments to claims without starting new actions
• Permits joining of additional parties or adding new claims
• Manages interlocutory motions (applications before trial)

⚠️ OCPP applies in Ontario Superior Court (not Small Claims or tribunals).
📍 Primarily used in Toronto/Central Ontario regional courts.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'When to Use OCPP',
          content: `Consider OCPP if:
• You have multiple related lawsuits pending in Superior Court
• You need to amend a claim after a statement of claim is filed
• You want to join a new party (defendant, third party, cross-claimant)
• You need to add a new claim to an existing action
• Related proceedings could be resolved more efficiently together

Example: Negligence claim + breach of contract claim involving same parties → consolidate via OCPP`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Key OCPP Rules & Deadlines',
          content: `Ontario Superior Court Civil Rules (R.626+):
• Motion notice: 4 days before hearing (R.8.04)
• Affidavits in response: 2 days before hearing (R.39.03)
• Examinations for discovery: within 90 days of statement of defense (can be extended)
• Trial scheduling: typically 12-24 months from end of discoveries
• Limitation periods: Does NOT reset; original periods still apply

🚨 Critical: Limitation periods do NOT pause during OCPP—track original limitation dates.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'OCPP Application Process (Checklist)',
          content: `Step 1: File Motion in Superior Court
□ Prepare motion record (notice, affidavit, materials)
□ Serve court file number of related action(s)
□ Submit in PDF/A format (long-term preservation)
□ File 4 days before hearing

Step 2: Consolidation Decision
□ Judge may stay one action, continue the other
□ Or order claims consolidated into a single action
□ Or dismiss duplicate claims

Step 3: Post-Consolidation
□ All pleadings governed by consolidated action rules
□ Single discovery schedule
□ Unified trial management`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Cost & Timeline Estimate',
          content: `Motion costs (typical range):
• Lawyer fees: $2,500–$8,000 (depends on complexity)
• Court filing fees: $100–$300
• Service costs: $200–$500

Timeline:
• Preparation & filing: 2–4 weeks
• Hearing wait: 4–12 weeks (varies by court backlog)
• Motion decision: 1–6 weeks (judge's time)

⏱️ Total: 3–6 months to consolidation order

Post-consolidation: 12–24 months to trial`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Next Steps',
          content: `1. Gather all lawsuit files (statement of claim, statement of defense, court orders)
2. Identify related proceedings (same parties, overlapping facts/law)
3. Consult lawyer to assess consolidation benefit vs. cost
4. Prepare motion materials (affidavit, supporting evidence)
5. File with Superior Court (Central Ontario/Toronto Regional Court)
6. Attend motion hearing
7. Comply with consolidation order (unified pleadings, discovery, trial)

💡 Tip: Early consolidation saves discovery duplication and legal costs.

⚖️ Legal Information Only: This is not legal advice. Consult a Superior Court litigator for OCPP strategy.`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createConsolidationApplication(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'OCPP Consolidation/Amendment Motion Scaffold',
      sections: [
        {
          heading: 'Motion Notice & Affidavit Structure',
          content: `Required Motion Record Components:

**1. Notice of Motion**
   - Court file number(s)
   - Motion date & location
   - Relief sought (consolidate actions / amend claim / add party / etc.)
   - Affiant name & relationship to the action

**2. Affidavit in Support**
   - Affiant oath/solemn affirmation
   - Facts relevant to consolidation (jurisdiction, overlapping parties/issues)
   - Explanation of why consolidation serves interests of justice
   - Cost/efficiency arguments
   - Chronology of related proceedings

**3. Supporting Materials**
   - Copies of statements of claim (all related actions)
   - Copies of statements of defense
   - Court orders affecting related proceedings
   - Timeline showing filing/status of each action
   - Any consent from other parties (simplifies motion)`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Key Arguments for Consolidation',
          content: `Courts favor consolidation when:
✓ Actions involve same parties or overlapping issues
✓ Consolidation promotes judicial efficiency
✓ Risk of inconsistent judgments if separate trials
✓ Common evidence/witnesses in related claims
✓ Consolidation does NOT prejudice defendant rights

Tailor affidavit to your situation:
• Insurance claim + breach of contract between same parties
• Multiple accident/injury claims from same incident
• Property damage + negligence from same accident

Avoid: Fishing for information, duplicative claims, settling scores`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Court File Information Required',
          content: `To file motion, identify all related actions:
□ File number: ___________________________
□ Case name: ___________________________
□ Parties (plaintiff/defendant):  ___________________________
□ Court location: ___________________________
□ Statement of claim filed date: ___________________________
□ Current status (pre-trial, discovery, etc.): ___________________________

Repeat for EACH related action.`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'PDF/A Format Requirement',
          content: `Ontario Superior Court requires long-term preservation format:
**PDF/A Compliance Checklist:**
□ Save all motion materials as PDF/A-1b or PDF/A-2b
□ No embedded video, audio, or executables
□ All fonts embedded (no external font references)
□ Standard metadata: title, author, creation date
□ File size ≤ 25 MB per document
□ Test: Open in Adobe Reader → shows as PDF/A

Tools:
• LibreOffice: Save as PDF/A
• Microsoft Word: Export to PDF → Save as PDF/A
• Adobe Acrobat Pro: Tools > Standards > PDF/A

Non-compliance may result in filing rejection.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Next Steps After Motion Filed',
          content: `1. Court assigns motion date (typically 4–12 weeks)
2. Serve opposing party with motion record (per Civil Rules R.8.07)
3. Opposing party files responding affidavit (within prescribed time)
4. Prepare oral argument (2–5 minutes per side typical)
5. Attend motion hearing on assigned date
6. Judge issues decision (verbal or written)
7. If granted: comply with consolidation order (file amended pleading, unified discovery, etc.)
8. If dismissed: can proceed separately or appeal (consult lawyer)`,
          evidenceRefs: [],
          confirmed: true
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createExpertAffidavitRequirements(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'OCPP Expert Affidavit & Evidence Requirements',
      sections: [
        {
          heading: 'When Expert Evidence Is Required in OCPP',
          content: `Expert affidavits common in OCPP for:
• Medical causation (injury → negligence link)
• Engineering/construction defects
• Property valuation/damage assessment
• Professional negligence (breached standard of care)
• Accident reconstruction
• Business/financial losses

Courts require: Impartial opinion on issues requiring special knowledge.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Expert Qualification Requirements (R.53 Ontario Superior Court Civil Rules)',
          content: `Expert affidavits must:
□ Clearly identify expert's qualifications (degrees, experience, publications)
□ State expert is impartial and not biased (oath/affirmation)
□ Explicitly confirm understanding of duty to the court (not advocate)
□ List all instructions given to expert (terms of reference)
□ Attach curriculum vitae (education, 10+ years experience typical)
□ Identify previous court experience / reports

Qualification Check:
- At least 5–10 years relevant experience
- Professional certifications (P.Eng., M.D., CPA, etc.)
- No financial interest in outcome (appearance of bias fatal)
- Previous expert testimony accepted by courts`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Expert Report Structure',
          content: `Standard Expert Report Components:

**Executive Summary** (1 page)
- Concise opinion on key issue
- Bottom-line conclusion

**Background & Instructions**
- What expert was asked to opine on
- Documents/evidence reviewed
- Site visits, tests, or examinations performed
- Assumptions made

**Detailed Analysis**
- Methodology explained
- Step-by-step findings
- Alternative scenarios considered
- Literature/standards cited

**Opinion & Reasoning**
- Expert's conclusion
- Basis for opinion (peer-reviewed sources, professional standards)
- Confidence level (high/moderate/low certainty)
- Limitations of analysis

**Appendices**
- Curriculum vitae
- Referenced documents/photos
- Test results / measurements
- Cost estimates (if damages expert)

Typical length: 15–40 pages`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Discovery of Expert Evidence',
          content: `OCPP expert discovery timeline:
• Expert reports exchanged: within prescribed discovery period (typically 90 days from defense)
• Expert cross-examination: via affidavit (written questions) or exam for discovery (oral)
• Expert fees: typically party that retained expert pays costs
• Privilege: Communications between lawyer & expert (litigation privilege) do NOT need disclosure

Opposing party may:
- Request clarifications via affidavit
- Propose different expert
- Depose/examine expert for discovery
- Challenge expert qualification at trial

Prepare expert for tough cross-examination on assumptions & methodology.`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createCrossExaminationGuide(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'OCPP Cross-Examination & Evidence Preparation',
      sections: [
        {
          heading: 'Cross-Examination in OCPP Context',
          content: `Cross-examination occurs during:
• Examination for discovery (after statement of defense filed)
• Motion hearings (if affidavit cross-examination ordered)
• Trial (if case reaches trial)

Purpose:
- Test credibility of opponent's evidence
- Explore weaknesses in opponent's case
- Establish facts favorable to your position
- Lock in testimony for later inconsistency

In OCPP, cross-examination focuses on consolidation rationale & evidence of related claims.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Preparing Witnesses for Cross-Examination',
          content: `**Before Examination for Discovery:**

1. Review the Claim
   □ Know your own statement of claim inside out
   □ Understand what you claimed & what you proved

2. Gather Evidence Chronology
   □ Timeline of events (dates, witnesses, documents)
   □ What happened, when, to whom
   □ Correspondence / photos / receipts (all evidence)

3. Mock Cross-Examination (with your lawyer)
   □ Lawyer asks tough questions to identify weaknesses
   □ Practice staying calm under pressure
   □ Avoid argumentative tone; stick to facts

4. Review Key Documents
   □ Emails, texts, photos, receipts (opposing party may cite)
   □ Contracts, agreements, policies
   □ Prior statements / reports

5. Prepare Answers
   □ Answer only what is asked (do not volunteer information)
   □ Say "I don't know" if unsure (better than guessing)
   □ Clarify misunderstandings politely ("I think you meant...")`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'During Cross-Examination',
          content: `**Golden Rules:**

✓ Stay calm & polite (rudeness damages credibility)
✓ Answer only the question asked (do not volunteer extra info)
✓ Say "I don't know" or "I don't recall" if uncertain
✓ Ask opposing lawyer to clarify if question is confusing
✓ Correct the record if misrepresented ("That's not what I said...")
✓ Take time to think before answering (no rush)

❌ Avoid:
- Getting defensive or emotional
- Arguing with lawyer
- Making up answers
- Volunteering information lawyer didn't ask for
- Absolute statements if not certain ("always," "never")

Opposing lawyer may use:
- Document impeachment (prior inconsistent statements)
- Badgering (rapid-fire questions)
- Leading questions (yes/no format)
- Evasion tactics (confusing questions)

Stay focused on truth; let your lawyer object if questions improper.`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Document Management in OCPP',
          content: `OCPP requires disclosure of all relevant documents:

**Disclosure Checklist:**
□ Gather ALL documents related to the claim
□ Organize chronologically (earliest to latest)
□ Create index (Bates numbers or page numbers)
□ Identify privileged documents (do NOT disclose):
   - Lawyer-client communications (legal privilege)
   - Lawyer-party communications re: legal advice
   - Settlement negotiation documents (without consent)
□ Provide searchable copies (OCR if scanned)

**Document Handling:**
- Make copies for opposing party (do not mark originals)
- Keep master copies organized
- Use index for easy reference
- Be prepared to explain each document's relevance

Failure to disclose document = breach of rules, potential sanctions.`,
          evidenceRefs: [],
          confirmed: false
        }
      ],
      evidenceIndex: input.evidenceIndex,
      jurisdiction: input.classification.jurisdiction,
      requireConfirmations: true
    });
  }

  private createInterlocutoryMotionTemplate(input: DomainModuleInput, refs: any[]): DocumentDraft {
    return this.drafting.createDraft({
      title: 'OCPP Interlocutory Motions — Applications During Action',
      sections: [
        {
          heading: 'What Are Interlocutory Motions?',
          content: `Interlocutory motions are applications made DURING an action (before trial):

Common OCPP Interlocutory Motions:
• Summary judgment motion (decide case before trial if no genuine issue)
• Motion to extend/shorten discovery deadlines
• Motion for stay of proceedings (pause action pending another)
• Motion to add/remove parties
• Motion for production of documents (compel disclosure)
• Motion for interim relief (freeze assets, restrain conduct)
• Motion to strike pleading (remove parts not allowed)
• Motion for court approval of settlement

Procedure:
1. Serve motion notice (4 days before hearing)
2. File motion record with court
3. Opponent files responding affidavit (2 days before)
4. Motion heard by judge
5. Judge grants, denies, or grants with conditions`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Summary Judgment Motion (Deciding Case Early)',
          content: `Summary judgment allows case to be decided WITHOUT trial if:
• No genuine issue of material fact exists
• Law is clear
• Evidence supports one party conclusively

When to use:
- Claims based on contracts with clear language
- Calculation of damages (no disputed facts)
- Liability obvious (no credibility issues)

Risk if denied:
- Lost time/cost preparing motion
- Reveals your evidence to opponent
- May damage trial credibility if motion weak

Typical outcome:
- 30–40% of summary judgment motions succeed
- Often results in partial summary judgment (some issues decided, others remain)`,
          evidenceRefs: refs,
          confirmed: false
        },
        {
          heading: 'Motion Timeline & Deadlines',
          content: `OCPP Motion Procedure Timeline:

**Week 1:** Plaintiff/moving party files motion record
- Notice of motion (date & relief)
- Affidavits in support (facts & evidence)
- Legal argument materials
- All in PDF/A format

**Week 2:** Plaintiff serves motion record on opponent (Rule 8.07)
- At least 4 days before hearing
- Service method: email, courier, personal service

**Week 3:** Defendant/responding party files affidavit in response
- Due at least 2 days before hearing
- Can include counter-arguments, evidence

**Week 4:** Motion hearing
- Judge hears oral arguments (2–5 min each side)
- Judge may decide immediately or reserve judgment
- Decision issued (verbal or written order)

**Post-Decision:**
- If granted: comply with court order
- If denied: proceed to next stage (discovery, trial)
- No automatic appeal right (appeal if legal error only)`,
          evidenceRefs: [],
          confirmed: true
        },
        {
          heading: 'Drafting a Motion Affidavit',
          content: `Motion affidavits must follow strict rules:

**Structure:**
1. Heading (court file, affiant name & role)
2. Oath/solemn affirmation (sworn statement of truthfulness)
3. Numbered paragraphs (clear, concise facts)
4. Evidence (personal knowledge, not hearsay)
5. Exhibits (attach as tabs A, B, C, etc.)
6. Jurat (lawyer's certification)

**Writing Tips:**
- Use simple, clear language
- Stick to facts (avoid argument)
- Cite exhibits ("As shown in Exhibit A...")
- Use chronological order if telling story
- Mark exhibits clearly (tabs, page numbers)
- PDF/A compliant (all documents embedded)

**What Judges Accept:**
✓ Direct observation ("I saw the defect")
✓ Business records ("Document dated X shows...")
✓ Expert opinion (if qualified expert)

**What Judges Reject:**
❌ Hearsay ("Someone told me...")
❌ Speculation ("They probably intended...")
❌ Legal argument ("The law clearly says...")
❌ Vague statements ("It was really bad")

Work with lawyer to ensure affidavit admissible.`,
          evidenceRefs: [],
          confirmed: false
        },
        {
          heading: 'Interlocutory Costs & Timeline Summary',
          content: `**Cost Estimate for Typical Interlocutory Motion:**
- Lawyer fees: $1,500–$5,000 (depends on complexity)
- Court filing: $100–$300
- Service costs: $100–$200
- Total: $1,700–$5,500

**Timeline:**
- Preparation: 1–3 weeks
- Service & response period: 3–4 weeks
- Hearing wait: 2–8 weeks (court backlog)
- Decision: 1–6 weeks (judge time)
- **Total: 2–4 months**

**Success Rate:**
- Summary judgment: 30–40%
- Other motions: 50–70% (varies by type)

**Post-Motion:**
If motion succeeds: proceed to next stage (narrowed issues, faster trial)
If motion fails: continue OCPP process (discovery, trial prep)`,
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
