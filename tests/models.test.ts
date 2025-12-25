import { describe, it, expect } from 'vitest';
import { MatterClassification, EvidenceIndex, Authority, ForumMap } from '../src/core/models';

describe('Core model interfaces', () => {
  it('creates a MatterClassification object', () => {
    const mc: MatterClassification = {
      id: 'mc-1',
      domain: 'insurance',
      jurisdiction: 'Ontario',
      parties: {
        claimantType: 'individual',
        respondentType: 'business',
        names: ['Alice', 'Bob']
      },
      urgency: 'medium',
      disputeAmount: 5000,
      status: 'classified'
    };
    expect(mc.domain).toBe('insurance');
  });

  it('creates an EvidenceIndex with items and source manifest', () => {
    const idx: EvidenceIndex = {
      items: [
        {
          id: 'e1',
          filename: 'email.eml',
          type: 'EML',
          provenance: 'user-provided',
          hash: 'abc123',
          credibilityScore: 0.8
        }
      ],
      generatedAt: new Date().toISOString(),
      sourceManifest: {
        sources: [
          {
            service: 'e-Laws',
            url: 'https://www.ontario.ca/laws',
            retrievalDate: new Date().toISOString(),
            version: 'current'
          }
        ]
      }
    };
    expect(idx.items.length).toBe(1);
  });

  it('creates Authority and ForumMap references', () => {
    const ltb: Authority = {
      id: 'ON-LTB',
      name: 'Landlord and Tenant Board',
      type: 'tribunal',
      jurisdiction: 'Ontario',
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      updateCadenceDays: 30,
      escalationRoutes: []
    };

    const fm: ForumMap = {
      domain: 'landlordTenant',
      primaryForum: { id: ltb.id, name: ltb.name, type: ltb.type, jurisdiction: ltb.jurisdiction },
      alternatives: [],
      escalation: []
    };

    expect(fm.primaryForum.id).toBe('ON-LTB');
  });
});
