import { BaseDomainModule } from './BaseDomainModule';
import { DocumentDraft, EvidenceIndex, DomainModuleInput } from '../models';

/**
 * TreeDamageClassifierModule
 * Classifies tree damage incidents and routes to appropriate forum
  /**
 * - Municipal claims tribunal (free/low cost)
 * - Small Claims Court (private/occupiers' liability)
 * - Superior Court (complex utility cases, large damages)
 * 
 * References:
 * - Occupiers' Liability Act, 1990 (Ontario)
 * - Negligence tree-cutting standards
 * - Municipal Property Assessment Corporation (MPAC) property registry
 * - Hydro One, Enbridge property records for utility assets
 */
export class TreeDamageClassifierModule extends BaseDomainModule {
  readonly domain: 'tree-damage' = 'tree-damage';

  /**
   * Build comprehensive guidance for tree damage classification and forum routing
   */
  protected buildDrafts(input: DomainModuleInput): DocumentDraft[] {
    const now = new Date().toISOString();
    const emptyIndex: EvidenceIndex = { items: [], generatedAt: now, sourceManifest: { entries: [], compiledAt: now } };
    
    return [
      this.drafting.createDraft({
        title: 'Identifying Tree Ownership — Municipal, Private, or Public Utility',
        sections: [
          {
            heading: 'Step 1: Municipal Tree Ownership — Check Property Maps',
            content: `**How to determine if the City/Town owns the tree:**

1. **Check Municipal Property Map (Free Online)**
   - Visit your municipality's GIS mapping system
   - Example: City of Toronto (toronto.ca/311/map)
   - Municipal trees usually labeled "city-owned" or "public boulevard"

2. **What is a Municipal Tree?**
   ✓ Tree on public right-of-way (sidewalk, street, boulevard)
   ✓ Tree in municipal park or green space
   ✓ Tree on city property
   ✗ Tree in residential backyard or private driveway

3. **Confirm with 311 Service Request**
   - Call 311 or municipality main line
   - Ask: "Who owns the tree at [address]?"
   - Request written confirmation
   - Document response date and confirmation

4. **Common Municipal Tree Locations:**
   ✓ Boulevard trees
   ✓ Street-side trees
   ✓ Trees in parks
   ✓ Trees on city hydro poles

**Cost:** Free — municipal records are public.`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Step 2: Private Property Tree Ownership — Check Deed and Survey',
            content: `**How to determine if neighbor owns the tree:**

1. **Review Property Survey**
   - Request homeowner property survey
   - Surveys show property boundaries
   - If tree is within boundary → private tree
   - If tree straddles line → complex case

2. **Check Property Deed**
   - Look for tree-related covenants
   - Example: "Trees to remain on boundary"
   - Restriction may indicate liability

3. **Confirm with Property Registrar**
   - Search Land Titles Database
   - Property owner name and boundaries
   - Note any easements or restrictions

4. **Ask Neighbor**
   - "Is that tree on your property?"
   - Get written response
   - Document admission if yes

**Cost:** Property survey $300-500; Land Title search $10-20.`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Step 3: Public Utility Tree Ownership — Check Utility Records',
            content: `**How to determine if utility company owns the tree:**

1. **Hydro Pole Trees**
   - Call Hydro One: 1-888-664-9376
   - Describe location
   - Ask: "Is this a utility tree?"
   - Request written confirmation

2. **Gas Pipeline Trees (Enbridge)**
   - Call Enbridge: 1-800-667-8899
   - Ask if tree on gas pipeline right-of-way
   - Request written confirmation

3. **Telecom Trees**
   - Contact Bell, Rogers, or Cogeco
   - Provide address and location
   - Utility will confirm ownership

4. **How to Spot Utility Trees:**
   ✓ Growing under power/gas/telecom lines
   ✓ Branches pruned for line clearance
   ✓ Cable attachments to trunk
   ✓ Located in utility right-of-way

**Cost:** Free — utilities required to investigate.`,
            evidenceRefs: [],
            confirmed: true
          },
        ],
        evidenceIndex: emptyIndex,
        includeDisclaimer: true
      }),

      this.drafting.createDraft({
        title: 'Municipal vs Private Tree Damage — Quick Decision Tree',
        sections: [
          {
            heading: 'Decision Tree and Timeline',
            content: `**WHO OWNS THE TREE?**

MUNICIPAL → Municipal Claims Process
  • Tree on sidewalk/boulevard
  • Tree in park
  • Confirmed via 311
  • Timeline: 3-6 months
  • Cost: FREE

PRIVATE → Occupiers' Liability / Small Claims
  • Tree on neighbor property
  • Must prove negligence
  • Timeline: 6-12 months
  • Cost: $315 filing fee

UTILITY → Utility Liability Claim
  • Tree under power/gas lines
  • File with utility
  • Timeline: 1-3 months
  • Cost: FREE

**EXPECTED DAMAGES:**

MUNICIPAL: $500-$5,000 (limited by cap)
PRIVATE: $5,000-$25,000 (full damages possible)
UTILITY: $1,000-$15,000 (utilities often pay)`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Municipal Tree Claims — What Matters',
            content: `**City Liability Standards:**
✓ City liable if tree negligently maintained
✓ City liable if tree diseased and city knew
✗ City NOT liable if healthy tree fell (act of nature)
✗ City NOT liable if you knew danger and did nothing

**You Must Show:**
1. Tree was diseased or structurally unsound
2. City knew or should have known (visible signs)
3. City failed to trim, remove, or maintain
4. City negligence caused your damage

**What You Can Recover:**
✓ Tree removal: $500-$2,000
✓ Repair of city property
✗ Usually NOT car damage
✗ Usually NOT house damage
✓ Replacement tree cost: $2,000-$5,000

**Deadline:** 2 years from damage date (strict limit)`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Private Tree Claims — Occupiers Liability',
            content: `**Owner Liability Standards:**
✓ Owner owes duty of care
✓ Owner liable if negligent maintenance
✗ Owner NOT liable if healthy tree fell (act of nature)

**You Must Show:**
1. Owner knew tree was dangerous
2. Tree was diseased, dead, or unstable
3. Owner failed to maintain or remove
4. Owner negligence caused damage

**What You Can Recover:**
✓ Tree removal: $500-$3,000
✓ Property repairs (roof, fence, car)
✓ Medical bills
✓ Cost of arborist reports
✓ Small Claims filing fee

**Forum:** Small Claims Court (< $50K), Superior Court (> $50K)

**Deadline:** 2 years from damage date`,
            evidenceRefs: [],
            confirmed: true
          },
        ],
        evidenceIndex: emptyIndex,
        includeDisclaimer: true
      }),

      this.drafting.createDraft({
        title: 'Occupiers Liability Act — Ontario Tree Negligence Standards',
        sections: [
          {
            heading: 'Occupiers Liability Act, 1990',
            content: `**What is Occupiers Liability?**

Property owners owe duty to neighbors:
1. Keep property reasonably safe
2. Warn of dangers
3. Protect from injury

**For Trees:**
- Owner must maintain trees properly
- Owner must trim overhanging branches
- Owner must remove dead trees
- Duty limited to KNOWN or OBVIOUS dangers

**Ontario Case Law:**

**Grubbs v. Barbaree (2005)**
- Owner liable: tree rotted and fell on garage
- Court: owner should notice black fungal rot
- Owner paid repair + tree removal

**Chubbs v. Hein (1982)**
- Owner NOT liable: healthy tree fell in windstorm
- Court: "Act of nature is complete defense"
- No liability if tree appeared healthy

**Whitfield v. Graystone (1982)**
- Owner liable: branches fell regularly
- Owner knew problem, failed to trim
- Owner had notice, didn't act`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Reasonable Tree Maintenance Standards',
            content: `**What Owners MUST Do:**

MONITORING:
✓ Inspect tree once per season
✓ Notice visible rot, hollow cavities, lean
✓ Ask neighbors if branches fall
✓ Monitor after storms

TRIMMING:
✓ Trim overhanging branches annually
✓ Remove dead branches (not just wait)
✓ Trim within 10-15 feet of property line
✓ Remove branches touching structures

REMOVAL:
✓ Remove dead trees
✓ Remove diseased trees
✓ Remove trees with major cavities
✓ Remove trees undermining foundation

**What Owners DON'T HAVE TO DO:**
✗ Trim to your preferred height
✗ Remove healthy tree you dislike
✗ Monitor 24/7
✗ Guarantee tree never falls

**Standard of Care Depends On:**
- Did owner know tree was dangerous?
- Was danger visible to reasonable person?
- Did branches fall before?
- How do neighbors maintain trees?`,
            evidenceRefs: [],
            confirmed: true
          },
        ],
        evidenceIndex: emptyIndex,
        includeDisclaimer: true
      }),

      this.drafting.createDraft({
        title: 'Evidence Checklist for Tree Damage Claims',
        sections: [
          {
            heading: 'Critical Evidence Required',
            content: `**TREE OWNERSHIP:**
☐ Photos of fallen tree at scene
☐ Written ownership confirmation
☐ Municipal GIS map printout
☐ Property survey or deed
☐ Property registry search

**DAMAGE DOCUMENTATION:**
☐ Photos of damage (car, roof, fence)
☐ Photos from multiple angles
☐ Video walkthrough
☐ Repair estimates from 3 contractors
☐ Photos of tree debris
☐ Timestamp metadata on photos

**TREE CONDITION:**
☐ Arborist inspection report ($200-400)
☐ Photos of rot or fungal infection
☐ Photos of structural lean/tilt
☐ Evidence of prior branch failures
☐ Weather records (normal wind, not freak storm)

**OWNER NEGLIGENCE (Private Claims):**
☐ Your written requests to trim/remove
☐ Neighbor statements about neglect
☐ Prior photos (6-12 months before failure)
☐ Utility company reports
☐ Prior incident reports`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Professional Evidence',
            content: `**Arborist Report (ISA-Certified):**
- Cost: $200-400
- Highly credible in court
- Opinion: "Tree showed disease signs pre-failure"
- Strengthens negligence claim

**Structural Engineer (if building damaged):**
- Cost: $400-800
- Documents damage extent
- Repair cost estimates
- Professional credibility

**Financial Evidence:**
☐ Insurance claim confirmation
☐ Contractor invoices (cleanup/repairs)
☐ Receipts for temporary repairs
☐ Medical bills if injured
☐ Weather data (Environment Canada)

**Witness Statements:**
☐ Neighbor: "Tree dropped branches regularly"
☐ Contractor: "Obviously diseased for years"
☐ Witness to weather: "Not a windstorm"
☐ Names, contact info, signature, date`,
            evidenceRefs: [],
            confirmed: true
          },
        ],
        evidenceIndex: emptyIndex,
        includeDisclaimer: true
      }),

      this.drafting.createDraft({
        title: 'Forum Selection and Process Overview',
        sections: [
          {
            heading: 'Three Forum Options',
            content: `**OPTION 1: MUNICIPAL CLAIMS**
When: Municipal tree, damages < $10K
Timeline: 3-6 months
Cost: FREE
Process: Send claim to city → Investigation → Settlement or denial
Damages: Usually $500-$5,000 (municipal cap)
Lawyer: Not necessary

**OPTION 2: SMALL CLAIMS COURT**
When: Private tree, damages $500-$50K
Timeline: 6-12 months
Cost: $150-315 filing fee
Process: Demand letter → File claim → Trial before judge
Damages: Up to $50,000
Lawyer: Helpful but optional

**OPTION 3: SUPERIOR COURT**
When: Damages > $50K or very complex
Timeline: 2-4 years
Cost: $2,000-$10,000+ (lawyer required)
Process: Hire lawyer → Statement of claim → Discovery → Trial
Damages: Unlimited
Lawyer: REQUIRED

**CHOOSE YOUR FORUM:**
Municipal tree + < $10K → Option 1 (Municipal Claims)
Private tree + < $50K → Option 2 (Small Claims)
Damages > $50K or complex → Option 3 (Superior Court)`,
            evidenceRefs: [],
            confirmed: true
          },
          {
            heading: 'Municipal Claims — Step by Step',
            content: `**WEEK 1: Confirm Municipal Ownership**
- Call 311
- Ask: "Is the tree municipal-owned?"
- Request written confirmation
- Save confirmation to file

**WEEKS 1-2: Gather Evidence**
- Take photos of damage and tree
- Get contractor repair estimates
- Collect cleanup/repair receipts
- Get arborist report if possible
- Document weather conditions

**WEEK 2: Send Written Claim**
Send to: City Engineering or Liability Claims
Include: Date, location, damage description, estimates, photos, arborist report
Message: "Municipal tree fell on [date] at [address]. Tree showed disease [describe]. Repairs cost $[amount]. City owns tree (confirmed 311 [date]). Request compensation."

**WEEKS 2-12: City Investigation**
- Loss adjuster inspects tree
- Reviews disease evidence
- Determines if negligence occurred
- Contacts you with decision

**WEEKS 12-24: Negotiation**
- If denied, explain why tree was negligently maintained
- Include arborist report
- Cite case law: Grubbs v. Barbaree
- Offer settlement meeting
- City usually settles $500-$5,000

**SETTLEMENT or LAWSUIT:**
- If settled: Cheque within 30 days
- If not: Sue city in Superior Court`,
            evidenceRefs: [],
            confirmed: true
          },
        ],
        evidenceIndex: emptyIndex,
        includeDisclaimer: true
      }),
    ];
  }
}
