import { Router, Request, Response } from 'express';
import { CanLiiClient } from '../../../src/core/caselaw/CanLiiClient.js';
import { CitationFormatter } from '../../../src/core/caselaw/CitationFormatter.js';
import { RetrievalGuard } from '../../../src/core/caselaw/RetrievalGuard.js';
import { SourceAccessController } from '../../../src/core/access/SourceAccessController.js';
import { config } from '../config.js';

const router = Router();

// Initialize CanLII client with proper access control
const accessController = new SourceAccessController();
accessController.setPolicy({
  service: 'CanLII',
  allowedMethods: ['official-api'],
});

const canliiClient = new CanLiiClient(accessController, {
  apiKey: config.canliiApiKey,
});

const citationFormatter = new CitationFormatter();
const retrievalGuard = new RetrievalGuard();

// GET /api/caselaw/search - Search CanLII
router.get('/search', async (req: Request, res: Response) => {
  const { query, caseType = 'all' } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter required' });
    return;
  }

  // The CanLII REST API does NOT support free-text search
  // Provide comprehensive links following Canada's court hierarchy
  
  const canliiSearchUrl = `https://www.canlii.org/en/#search/text=${encodeURIComponent(query)}`;
  const normalizedQuery = query.toUpperCase();

  // Court-specific shortcuts for common neutral citations (e.g., "2025 ONCJ 646")
  const courtHints = [];
  if (normalizedQuery.includes('ONCJ')) {
    courtHints.push({
      name: 'Ontario Court of Justice',
      url: 'https://www.ontariocourts.ca/ocj/decisions/',
      description: 'Official OCJ decisions — sort by date or use Ctrl+F for the citation',
      primary: true,
      category: 'Provincial Courts',
    });
  }
  if (normalizedQuery.includes('ONSC')) {
    courtHints.push({
      name: 'Ontario Superior Court of Justice',
      url: 'https://www.ontariocourts.ca/scj/decisions/',
      description: 'Official ONSC decisions — sort by date or search by case name/citation',
      primary: true,
      category: 'Superior Courts',
    });
  }
  if (normalizedQuery.includes('ONCA')) {
    courtHints.push({
      name: 'Ontario Court of Appeal',
      url: 'https://www.ontariocourts.ca/decisions-all/?court=on-ca',
      description: 'Official ONCA decisions — search by citation or case name',
      primary: true,
      category: 'Provincial Appeal Courts',
    });
  }

  const alternatives = [
    // PRIMARY: CanLII - Free nationwide database
    {
      name: 'CanLII (Canadian Legal Information Institute)',
      url: canliiSearchUrl,
      description: `Free primary database for all Canadian case law - search for: "${query}"`,
      primary: true,
      category: 'Primary Database',
    },
    // SUPREME COURT OF CANADA - Apex court
    {
      name: 'Supreme Court of Canada',
      url: 'https://www.scc-csc.ca/case-dossier/index-eng.aspx',
      description: 'Canada\'s highest court - final court of appeal',
      primary: true,
      category: 'Supreme Court',
    },
    // ONTARIO COURTS OF APPEAL - Intermediate appellate level
    {
      name: 'Ontario Court of Appeal',
      url: 'https://www.ontariocourts.ca/decisions-all/?court=on-ca',
      description: 'Ontario\'s highest provincial court - appeals from Superior Court',
      primary: true,
      category: 'Provincial Appeal Courts',
    },
    // ONTARIO SUPERIOR COURTS - Trial level for serious matters
    {
      name: 'Ontario Superior Court of Justice',
      url: 'https://www.ontariocourts.ca/scj/decisions/',
      description: 'Serious civil/criminal cases and appeals from lower courts',
      primary: true,
      category: 'Superior Courts',
    },
    // ONTARIO PROVINCIAL COURTS - Base level
    {
      name: 'Ontario Court of Justice',
      url: 'https://www.ontariocourts.ca/ocj/decisions/',
      description: 'Most criminal, family, youth, and provincial offences cases',
      primary: true,
      category: 'Provincial Courts',
    },
    // FEDERAL COURTS - Specialized federal jurisdiction
    {
      name: 'Federal Court of Canada',
      url: 'https://www.fct-cf.ca/en/court-files-and-decisions/court-files',
      description: 'Immigration, intellectual property, maritime law, federal tribunals',
      category: 'Federal Courts',
    },
    {
      name: 'Federal Court of Appeal',
      url: 'https://www.fca-caf.ca/fca-caf/index-eng.html',
      description: 'Appeals from Federal Court and some federal tribunals',
      category: 'Federal Courts',
    },
    {
      name: 'Tax Court of Canada',
      url: 'https://www.tcc-cci.gc.ca/en/pages/default.aspx',
      description: 'Tax disputes with federal government',
      category: 'Federal Courts',
    },
    // ONTARIO RESOURCES
    {
      name: 'Ontario Courts Public Portal',
      url: 'https://www.ontariocourts.ca/ocj/find-my-case/',
      description: 'Search Toronto-area cases and court proceedings',
      category: 'Ontario Resources',
    },
    {
      name: 'e-Laws Ontario',
      url: 'https://www.ontario.ca/laws/',
      description: 'Ontario legislation and regulations',
      category: 'Ontario Resources',
    },
    ...courtHints,
  ];

  res.json({
    query,
    resultsCount: 0,
    results: [],
    notice: 'Manual Search Required',
    message: 'The CanLII REST API does not support free-text search or neutral citation lookups. Use the resources below, organized by court hierarchy, to search for Canadian case law.',
    failure: {
      timestamp: new Date(),
      source: 'CanLII API',
      reason: 'Free-text search is not supported by the CanLII REST API.',
      suggestion: 'Use the official court site or CanLII links below to search by case name or citation.',
    },
    alternatives,
  });
});

// GET /api/caselaw/statute - Format statute citation
router.get('/statute', async (req: Request, res: Response) => {
  const { title, year, section } = req.query;

  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Statute title required' });
    return;
  }

  try {
    // Use the actual CitationFormatter.formatStatute method
    const citation = citationFormatter.formatStatute({
      jurisdiction: 'Ontario',
      title: title as string,
      provision: section as string | undefined,
      url: `https://www.ontario.ca/laws/statute/${year || 'current'}`,
      retrievalDate: new Date().toISOString().split('T')[0],
    });

    res.json({
      statute: {
        title,
        citation,
        url: `https://www.ontario.ca/laws/statute/${year || 'current'}`,
        retrievedAt: new Date(),
      },
    });
  } catch (error) {
    const message = retrievalGuard.failureMessage('e-Laws', title as string);

    res.status(400).json({
      error: 'Failed to format statute citation',
      message,
      suggestion: `Search manually for "${title}" on e-Laws Ontario`,
    });
  }
});
// GET /api/caselaw/court-guidance - Get court/tribunal guidance
router.get('/court-guidance', async (req: Request, res: Response) => {
  const { court } = req.query;

  if (!court || typeof court !== 'string') {
    res.status(400).json({ error: 'Court parameter required' });
    return;
  }

  // Return guidance links for common Ontario courts/tribunals
  const guidance: Record<string, any> = {
    ltb: {
      name: 'Landlord and Tenant Board',
      url: 'https://www.ltb.gov.on.ca/',
      guidance: [
        { title: 'How to File an Application', url: 'https://www.ltb.gov.on.ca/pages/drc.html' },
        { title: 'Hearing Process', url: 'https://www.ltb.gov.on.ca/pages/about_hearings.html' },
        { title: 'Forms and Documents', url: 'https://www.ltb.gov.on.ca/pages/forms.html' },
      ],
    },
    hrto: {
      name: 'Human Rights Tribunal of Ontario',
      url: 'https://www.hrto.ca/',
      guidance: [
        { title: 'How to File an Application', url: 'https://www.hrto.ca/apply' },
        { title: 'Application Forms', url: 'https://www.hrto.ca/forms-and-processes' },
        { title: 'Practice Directions', url: 'https://www.hrto.ca/practice-directions' },
      ],
    },
    smallclaims: {
      name: 'Small Claims Court',
      url: 'https://www.ontario.ca/laws/statute/90c43',
      guidance: [
        { title: 'How to Sue', url: 'https://www.ontario.ca/page/how-sue-small-claims-court' },
        { title: 'Court Locations', url: 'https://www.ontario.ca/page/find-small-claims-court' },
        { title: 'Rules of the Court', url: 'https://www.ontario.ca/page/small-claims-court' },
      ],
    },
    superior: {
      name: 'Superior Court of Justice',
      url: 'https://www.ontario.ca/laws/statute/90c43',
      guidance: [
        { title: 'Civil Procedure Rules', url: 'https://www.ontario.ca/laws/regulation/070200' },
        { title: 'Court Locations', url: 'https://www.ontario.ca/page/locate-ontario-court' },
        { title: 'Filing Requirements', url: 'https://www.ontario.ca/page/civil-courts' },
      ],
    },
  };

  const courtLower = court.toLowerCase();
  if (guidance[courtLower]) {
    res.json(guidance[courtLower]);
  } else {
    res.status(404).json({
      error: `No guidance available for court: ${court}`,
      availableCourts: Object.keys(guidance),
    });
  }
});

export default router;
