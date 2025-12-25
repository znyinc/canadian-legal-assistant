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
}
