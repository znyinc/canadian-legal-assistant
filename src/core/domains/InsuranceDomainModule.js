import { BaseDomainModule } from './BaseDomainModule';
export class InsuranceDomainModule extends BaseDomainModule {
    domain = 'insurance';
    buildDrafts(input) {
        const primaryEvidenceId = input.evidenceIndex.items[0]?.id;
        const refs = primaryEvidenceId ? [{ evidenceId: primaryEvidenceId }] : [];
        // Detect if this is a motor vehicle accident case
        const isMotorVehicleAccident = this.detectMotorVehicleAccident(input);
        const mkDraft = (title, summary, customSections) => {
            const sections = customSections || [
                {
                    heading: 'Facts',
                    content: `${summary} Refer to the attached timeline for key dates and to the evidence list for supporting documents.`,
                    evidenceRefs: refs,
                    confirmed: false
                },
                {
                    heading: 'Requests',
                    content: 'Request a written response addressing each issue and providing reasons with references to policy wording.',
                    evidenceRefs: [],
                    confirmed: false
                },
                {
                    heading: 'Next Steps',
                    content: 'This draft is informational and should be confirmed before sending. Escalation paths depend on the insurer and policy terms.',
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
        // Generate motor vehicle accident documents if detected
        if (isMotorVehicleAccident) {
            return this.buildMotorVehicleDocuments(input, mkDraft, refs);
        }
        // Default insurance documents
        return [
            mkDraft('Internal Complaint Letter', 'Summarizes the claim events and requests internal review.'),
            mkDraft('Ombudsman Escalation', 'Escalates unresolved issues to the insurer ombuds service.'),
            mkDraft('General Insurance OmbudService Submission', 'Prepares a GIO submission after internal remedies are exhausted.'),
            mkDraft('FSRA Conduct Complaint', 'Raises a conduct concern to FSRA regarding claim handling or delays.')
        ];
    }
    detectMotorVehicleAccident(input) {
        const desc = input.classification.description?.toLowerCase() || '';
        const summary = input.evidenceIndex.summary?.toLowerCase() || '';
        const combined = `${desc} ${summary}`;
        const mvKeywords = ['accident', 'collision', 'vehicle', 'car', 'truck', 'motor', 'parked', 'damage', 'crashed', 'hit', 'rear-end', 'side-swipe'];
        return mvKeywords.some(keyword => combined.includes(keyword));
    }
    buildMotorVehicleDocuments(input, mkDraft, refs) {
        const isOntario = input.classification.jurisdiction === 'ON';
        const docs = [];
        // 1. Accident Report / Statement of Facts
        docs.push(mkDraft('Accident Report / Statement of Facts', 'Detailed statement of the motor vehicle accident for insurance, police, or Collision Reporting Centre.', [
            {
                heading: 'Incident Details',
                content: `Date, time, and location of accident. Weather and road conditions. Vehicle descriptions and positions.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Parties Involved',
                content: `Driver and vehicle owner information. License and insurance details. Witness contact information if available.`,
                evidenceRefs: [],
                confirmed: false
            },
            {
                heading: 'Description of Accident',
                content: `Detailed narrative of how the accident occurred. Include direction of travel, actions taken, and point of impact.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Damage and Injuries',
                content: `Description of vehicle damage. Any injuries sustained. Photos and repair estimates if available.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Fault Determination',
                content: isOntario
                    ? 'In Ontario, fault is determined under Insurance Act, R.R.O. 1990, Reg. 668. A legally parked vehicle is typically 0% at fault.'
                    : 'Fault determination depends on jurisdiction and circumstances.',
                evidenceRefs: [],
                confirmed: true
            }
        ]));
        // 2. Insurance Claim Letter (DC-PD for Ontario)
        if (isOntario) {
            docs.push(mkDraft('Direct Compensation Property Damage (DC-PD) Claim Letter', 'Claim letter to your own insurer for property damage under Ontario\'s no-fault system.', [
                {
                    heading: 'Policy Information',
                    content: `Your policy number, vehicle details, and coverage information.`,
                    evidenceRefs: [],
                    confirmed: false
                },
                {
                    heading: 'Accident Details',
                    content: `Date, time, location, and description of accident. Other party\'s information and insurance details.`,
                    evidenceRefs: refs,
                    confirmed: false
                },
                {
                    heading: 'Damage Claim',
                    content: `Description of damage to your vehicle. Repair estimates or quotes. Photos of damage. Under DC-PD coverage, you claim from your own insurer when another driver is at fault.`,
                    evidenceRefs: refs,
                    confirmed: false
                },
                {
                    heading: 'No-Fault System',
                    content: `Ontario operates under a "no-fault" insurance system. You claim property damage from your own insurer under Direct Compensation-Property Damage (DC-PD) coverage. Since the other party is identified and insured, your deductible is typically $0.`,
                    evidenceRefs: [],
                    confirmed: true
                },
                {
                    heading: 'Request',
                    content: `Request prompt processing of DC-PD claim. Request authorization for repairs or total loss settlement if applicable.`,
                    evidenceRefs: [],
                    confirmed: false
                }
            ]));
        }
        else {
            docs.push(mkDraft('Insurance Claim Letter', 'Letter to insurance company reporting accident and claiming property damage.', [
                {
                    heading: 'Claim Details',
                    content: `Policy number, accident date/time/location, description of damage, other party information.`,
                    evidenceRefs: refs,
                    confirmed: false
                },
                {
                    heading: 'Supporting Documentation',
                    content: `Photos, repair estimates, police report number, witness statements.`,
                    evidenceRefs: refs,
                    confirmed: false
                },
                {
                    heading: 'Request',
                    content: `Request claim processing, adjuster assignment, and repair authorization.`,
                    evidenceRefs: [],
                    confirmed: false
                }
            ]));
        }
        // 3. Demand Letter (for out-of-pocket expenses)
        docs.push(mkDraft('Demand Letter for Out-of-Pocket Expenses', 'Letter to at-fault party demanding reimbursement for expenses not covered by insurance.', [
            {
                heading: 'Accident Summary',
                content: `Brief summary of accident, establishing other party\'s fault.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Out-of-Pocket Expenses',
                content: `List of expenses not covered by insurance: rental car costs, deductible paid, diminished vehicle value, loss of use, towing fees, etc. Include receipts and documentation.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Legal Basis',
                content: `Under common law negligence principles, the at-fault party is liable for damages caused. Insurance coverage does not eliminate personal liability for uncovered losses.`,
                evidenceRefs: [],
                confirmed: true
            },
            {
                heading: 'Demand',
                content: `Demand payment of specific amount within 14 days. State that failure to respond may result in legal action.`,
                evidenceRefs: [],
                confirmed: false
            }
        ]));
        // 4. Small Claims Court Statement of Claim (if under $35,000 in ON)
        docs.push(mkDraft('Small Claims Court - Statement of Claim', 'Formal claim for damages in Small Claims Court (for amounts under jurisdiction limit).', [
            {
                heading: 'Court Information',
                content: isOntario
                    ? `Small Claims Court - [Your Local Court]. Claim limit: $35,000 in Ontario.`
                    : `Small Claims Court - [Your Local Court]. Check jurisdiction limit for your province.`,
                evidenceRefs: [],
                confirmed: false
            },
            {
                heading: 'Parties',
                content: `Plaintiff (You): Name, address, contact. Defendant (At-fault driver): Name, address, insurance information.`,
                evidenceRefs: [],
                confirmed: false
            },
            {
                heading: 'Claim Details',
                content: `Date and location of accident. Description of negligent act (e.g., backing without due care). Resulting damages to your property.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Damages Claimed',
                content: `Vehicle repair costs (or diminished value). Out-of-pocket expenses (rental, towing, etc.). Loss of use. Court filing fees. Total claim amount.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Legal Basis',
                content: `Negligence: duty of care owed, breach of duty, causation, damages. Cite relevant traffic laws if applicable.`,
                evidenceRefs: [],
                confirmed: true
            }
        ]));
        // 5. Incident Timeline
        docs.push(mkDraft('Incident Timeline for Insurance Adjuster', 'Chronological timeline of events for insurance claim processing.', [
            {
                heading: 'Pre-Accident',
                content: `Where vehicle was parked/positioned. Any relevant circumstances leading up to accident.`,
                evidenceRefs: [],
                confirmed: false
            },
            {
                heading: 'Time of Accident',
                content: `Precise time and sequence of events. Positions of vehicles. How collision occurred.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Immediate Aftermath',
                content: `Exchange of information. Photos taken. Damage assessed. Police/CRC report filed.`,
                evidenceRefs: refs,
                confirmed: false
            },
            {
                heading: 'Post-Accident Actions',
                content: `Insurance notifications. Repair estimates obtained. Medical attention if needed. Follow-up communications.`,
                evidenceRefs: refs,
                confirmed: false
            }
        ]));
        return docs;
    }
}
//# sourceMappingURL=InsuranceDomainModule.js.map