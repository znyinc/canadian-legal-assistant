import { Router, Request, Response } from 'express';
import { CitationFormatter } from '../../../src/core/caselaw/CitationFormatter.js';
import { RetrievalGuard } from '../../../src/core/caselaw/RetrievalGuard.js';
import { config } from '../config.js';
import { SemanticLegalSearchService, SemanticSearchHit } from '../services/semanticLegalSearch.js';

type SearchAlternative = {
  name: string;
  url: string;
  description: string;
  primary?: boolean;
  category?: string;
  semanticScore?: number;
  semanticSource?: 'litellm-embedding';
};

type CourtGuidance = {
  name: string;
  url: string;
  guidance: Array<{ title: string; url: string }>;
};

const router = Router();
const citationFormatter = new CitationFormatter();
const retrievalGuard = new RetrievalGuard();

const CANLII_SEARCH_HELP_URL = 'https://www.canlii.org/en/info/search.html';

function buildCanliiSearchUrl(query: string): string {
  return `https://www.canlii.org/en/#search/type=decision&text=${encodeURIComponent(query)}`;
}

function courtHint(name: string, url: string, description: string, category: string): SearchAlternative {
  return {
    name,
    url,
    description,
    primary: true,
    category,
  };
}

function dedupeAlternatives(alternatives: SearchAlternative[]): SearchAlternative[] {
  const seen = new Set<string>();
  return alternatives.filter((item) => {
    const key = `${item.name}|${item.url}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildCourtHints(query: string, caseType?: string): SearchAlternative[] {
  const normalizedQuery = query.toUpperCase();
  const normalizedCaseType = caseType?.toLowerCase() ?? 'all';
  const hints: SearchAlternative[] = [];

  const registerByKey = (key: string, hint: SearchAlternative) => {
    if (normalizedCaseType === key) {
      hints.push(hint);
    }
  };

  registerByKey(
    'scc',
    courtHint(
      'Supreme Court of Canada',
      'https://www.scc-csc.ca/judgments-jugements/',
      "Official judgments, leave applications, and Case in Brief summaries from Canada's top court",
      'Supreme Court'
    )
  );
  registerByKey(
    'onca',
    courtHint(
      'Ontario Court of Appeal',
      'https://www.ontariocourts.ca/coa/about-the-court/decision-database/',
      'Official Ontario Court of Appeal decision database with full Boolean search',
      'Provincial Appeal Courts'
    )
  );
  registerByKey(
    'onsc',
    courtHint(
      'Ontario Superior Court of Justice',
      'https://www.ontariocourts.ca/scj/about-the-court-2/decisions-of-the-court/',
      'Official Superior Court decisions page and Divisional Court decisions',
      'Superior Courts'
    )
  );
  registerByKey(
    'oncj',
    courtHint(
      'Ontario Court of Justice',
      'https://www.ontariocourts.ca/ocj/decisions/',
      'Official Ontario Court of Justice decisions page',
      'Provincial Courts'
    )
  );
  registerByKey(
    'fca',
    courtHint(
      'Federal Court of Appeal',
      'https://www.fca-caf.ca/en/pages/decisions',
      'Official Federal Court of Appeal decisions page and plain-language summaries',
      'Federal Courts'
    )
  );
  registerByKey(
    'fc',
    courtHint(
      'Federal Court',
      'https://www.fct-cf.ca/en/pages/court-files-and-decisions',
      'Official Federal Court court files, hearing lists, and decisions hub',
      'Federal Courts'
    )
  );
  registerByKey(
    'tcc',
    courtHint(
      'Tax Court of Canada',
      'https://apps.tcc-cci.gc.ca/appeals/jsp/appeal/disclaimer_e.html',
      'Official Tax Court of Canada online filing and appeal entry point',
      'Federal Courts'
    )
  );
  registerByKey(
    'ltb',
    courtHint(
      'Landlord and Tenant Board',
      'https://tribunalsontario.ca/ltb/law-rules-and-decisions/',
      'Official LTB law, rules, guidelines, and decisions page',
      'Ontario Resources'
    )
  );
  registerByKey(
    'hrto',
    courtHint(
      'Human Rights Tribunal of Ontario',
      'https://tribunalsontario.ca/hrto/legislation-and-regulation/',
      'Official HRTO laws, rules, practice directions, and decisions page',
      'Ontario Resources'
    )
  );

  if (/\bSCC\b/.test(normalizedQuery) || normalizedQuery.includes('SUPREME COURT')) {
    hints.push(
      courtHint(
        'Supreme Court of Canada',
        'https://www.scc-csc.ca/judgments-jugements/',
        "Official judgments, leave applications, and Case in Brief summaries from Canada's top court",
        'Supreme Court'
      )
    );
  }
  if (/\bONCA\b/.test(normalizedQuery) || normalizedQuery.includes('COURT OF APPEAL')) {
    hints.push(
      courtHint(
        'Ontario Court of Appeal',
        'https://www.ontariocourts.ca/coa/about-the-court/decision-database/',
        'Official Ontario Court of Appeal decision database with full Boolean search',
        'Provincial Appeal Courts'
      )
    );
  }
  if (/\bONSC\b/.test(normalizedQuery) || normalizedQuery.includes('SUPERIOR COURT')) {
    hints.push(
      courtHint(
        'Ontario Superior Court of Justice',
        'https://www.ontariocourts.ca/scj/about-the-court-2/decisions-of-the-court/',
        'Official Superior Court decisions page and Divisional Court decisions',
        'Superior Courts'
      )
    );
  }
  if (/\bONCJ\b/.test(normalizedQuery) || normalizedQuery.includes('COURT OF JUSTICE')) {
    hints.push(
      courtHint(
        'Ontario Court of Justice',
        'https://www.ontariocourts.ca/ocj/decisions/',
        'Official Ontario Court of Justice decisions page',
        'Provincial Courts'
      )
    );
  }
  if (/\bFCA\b/.test(normalizedQuery) || normalizedQuery.includes('FEDERAL COURT OF APPEAL')) {
    hints.push(
      courtHint(
        'Federal Court of Appeal',
        'https://www.fca-caf.ca/en/pages/decisions',
        'Official Federal Court of Appeal decisions page and plain-language summaries',
        'Federal Courts'
      )
    );
  }
  if (normalizedQuery.includes('FEDERAL COURT')) {
    hints.push(
      courtHint(
        'Federal Court',
        'https://www.fct-cf.ca/en/pages/court-files-and-decisions',
        'Official Federal Court court files, hearing lists, and decisions hub',
        'Federal Courts'
      )
    );
  }
  if (/\bTCC\b/.test(normalizedQuery) || normalizedQuery.includes('TAX COURT')) {
    hints.push(
      courtHint(
        'Tax Court of Canada',
        'https://apps.tcc-cci.gc.ca/appeals/jsp/appeal/disclaimer_e.html',
        'Official Tax Court of Canada online filing and appeal entry point',
        'Federal Courts'
      )
    );
  }
  if (normalizedQuery.includes('LANDLORD') || normalizedQuery.includes('TENANT') || normalizedQuery.includes('LTB')) {
    hints.push(
      courtHint(
        'Landlord and Tenant Board',
        'https://tribunalsontario.ca/ltb/law-rules-and-decisions/',
        'Official LTB law, rules, guidelines, and decisions page',
        'Ontario Resources'
      )
    );
  }
  if (normalizedQuery.includes('HUMAN RIGHTS') || normalizedQuery.includes('HRTO')) {
    hints.push(
      courtHint(
        'Human Rights Tribunal of Ontario',
        'https://tribunalsontario.ca/hrto/legislation-and-regulation/',
        'Official HRTO laws, rules, practice directions, and decisions page',
        'Ontario Resources'
      )
    );
  }

  return dedupeAlternatives(hints);
}

function buildSearchAlternatives(query: string, caseType?: string): SearchAlternative[] {
  const canliiSearchUrl = buildCanliiSearchUrl(query);
  const courtHints = buildCourtHints(query, caseType);

  const alternatives: SearchAlternative[] = [
    {
      name: 'CanLII search results',
      url: canliiSearchUrl,
      description: `Open the CanLII search page for "${query}"`,
      primary: true,
      category: 'Primary Database',
    },
    {
      name: 'CanLII search help',
      url: CANLII_SEARCH_HELP_URL,
      description: 'Review CanLII search syntax, filters, and query tips',
      category: 'Primary Database',
    },
    ...courtHints,
    {
      name: 'Supreme Court of Canada',
      url: 'https://www.scc-csc.ca/judgments-jugements/',
      description: 'Judgments, leave applications, and Case in Brief summaries',
      primary: true,
      category: 'Supreme Court',
    },
    {
      name: 'Ontario Court of Appeal',
      url: 'https://www.ontariocourts.ca/coa/about-the-court/decision-database/',
      description: 'Official Ontario Court of Appeal decision database',
      primary: true,
      category: 'Provincial Appeal Courts',
    },
    {
      name: 'Ontario Superior Court of Justice',
      url: 'https://www.ontariocourts.ca/scj/about-the-court-2/decisions-of-the-court/',
      description: 'Official Ontario Superior Court decisions page',
      primary: true,
      category: 'Superior Courts',
    },
    {
      name: 'Ontario Court of Justice',
      url: 'https://www.ontariocourts.ca/ocj/decisions/',
      description: 'Official Ontario Court of Justice decisions page',
      primary: true,
      category: 'Provincial Courts',
    },
    {
      name: 'Federal Court of Canada',
      url: 'https://www.fct-cf.ca/en/pages/court-files-and-decisions',
      description: 'Court files, hearing lists, and decisions hub',
      category: 'Federal Courts',
    },
    {
      name: 'Federal Court of Appeal',
      url: 'https://www.fca-caf.ca/en/pages/decisions',
      description: 'Official Federal Court of Appeal decisions and summaries',
      category: 'Federal Courts',
    },
    {
      name: 'Tax Court of Canada',
      url: 'https://apps.tcc-cci.gc.ca/appeals/jsp/appeal/disclaimer_e.html',
      description: 'Official Tax Court online filing and appeal entry point',
      category: 'Federal Courts',
    },
    {
      name: 'Landlord and Tenant Board',
      url: 'https://tribunalsontario.ca/ltb/law-rules-and-decisions/',
      description: 'LTB law, rules, guidelines, and decisions',
      category: 'Ontario Resources',
    },
    {
      name: 'Human Rights Tribunal of Ontario',
      url: 'https://tribunalsontario.ca/hrto/legislation-and-regulation/',
      description: 'HRTO laws, rules, practice directions, and decisions',
      category: 'Ontario Resources',
    },
    {
      name: 'Small Claims Court',
      url: 'https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/',
      description: 'Ontario Superior Court small claims guidance and process',
      category: 'Ontario Resources',
    },
    {
      name: 'e-Laws Ontario',
      url: 'https://www.ontario.ca/laws/',
      description: 'Ontario legislation and regulations',
      category: 'Ontario Resources',
    },
  ];

  return dedupeAlternatives(alternatives);
}

function buildSemanticSearchService(): SemanticLegalSearchService {
  return new SemanticLegalSearchService({
    enabled: config.semanticSearchEnabled,
    baseUrl: config.semanticSearchBaseUrl,
    apiKey: config.semanticSearchApiKey,
    embeddingModel: config.semanticSearchEmbeddingModel,
    minScore: Number.isFinite(config.semanticSearchMinScore) ? config.semanticSearchMinScore : 0.25,
  });
}

function applySemanticRanking(
  alternatives: SearchAlternative[],
  hits: SemanticSearchHit[],
): SearchAlternative[] {
  if (hits.length === 0) {
    return alternatives;
  }

  const hitByUrl = new Map(hits.map((hit) => [hit.url, hit]));

  return alternatives
    .map((alternative) => {
      const hit = hitByUrl.get(alternative.url);
      if (!hit) {
        return alternative;
      }

      return {
        ...alternative,
        semanticScore: hit.semanticScore,
        semanticSource: hit.semanticSource,
      };
    })
    .sort((left, right) => {
      if (left.name === 'CanLII search results') return -1;
      if (right.name === 'CanLII search results') return 1;

      const leftScore = left.semanticScore ?? -1;
      const rightScore = right.semanticScore ?? -1;
      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }

      if (left.primary !== right.primary) {
        return left.primary ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}

const courtGuidanceMap: Record<string, CourtGuidance> = {
  ltb: {
    name: 'Landlord and Tenant Board',
    url: 'https://tribunalsontario.ca/ltb/',
    guidance: [
      { title: 'Application and hearing process', url: 'https://tribunalsontario.ca/ltb/application-and-hearing-process/' },
      { title: 'Forms, filing and fees', url: 'https://tribunalsontario.ca/ltb/filing-and-fees/' },
      { title: 'Law, rules and decisions', url: 'https://tribunalsontario.ca/ltb/law-rules-and-decisions/' },
    ],
  },
  hrto: {
    name: 'Human Rights Tribunal of Ontario',
    url: 'https://tribunalsontario.ca/hrto/',
    guidance: [
      { title: 'Application and hearing process', url: 'https://tribunalsontario.ca/application/' },
      { title: 'Forms and filing', url: 'https://tribunalsontario.ca/hrto/form-instructions/?agree=1' },
      { title: 'Laws, rules and decisions', url: 'https://tribunalsontario.ca/hrto/legislation-and-regulation/' },
    ],
  },
  smallclaims: {
    name: 'Small Claims Court',
    url: 'https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/',
    guidance: [
      { title: 'Guide to the Small Claims Court Process', url: 'https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/guide-to-small-claims-court-process/' },
      { title: 'Filing for Small Claims Court', url: 'https://www.ontariocourts.ca/scj/filing-procedures/filing/filing-for-small-claims/' },
      { title: 'Rules of the Small Claims Court', url: 'https://www.ontariocourts.ca/scj/filing-procedures/rules/small-claims/' },
    ],
  },
  superior: {
    name: 'Superior Court of Justice',
    url: 'https://www.ontariocourts.ca/scj/',
    guidance: [
      { title: 'Decisions of the Court', url: 'https://www.ontariocourts.ca/scj/about-the-court-2/decisions-of-the-court/' },
      { title: 'Civil filing procedures', url: 'https://www.ontariocourts.ca/scj/filing-procedures/' },
      { title: 'Small Claims Court', url: 'https://www.ontariocourts.ca/scj/areas-of-law/small-claims-court/' },
    ],
  },
};

// GET /api/caselaw/search - Launch CanLII and official court resources for a query
router.get('/search', async (req: Request, res: Response) => {
  const { query, caseType = 'all' } = req.query;

  if (!query || typeof query !== 'string') {
    res.status(400).json({ error: 'Query parameter required' });
    return;
  }

  const searchUrl = buildCanliiSearchUrl(query);
  const baseAlternatives = buildSearchAlternatives(query, typeof caseType === 'string' ? caseType : undefined);
  const semanticSearch = await buildSemanticSearchService().rank(query, baseAlternatives);
  const alternatives = applySemanticRanking(baseAlternatives, semanticSearch.hits);

  res.json({
    query,
    searchUrl,
    resultsCount: 0,
    results: [],
    notice: 'Manual Search Required',
    message:
      'The public CanLII API does not provide free-text case-law search. This endpoint returns the CanLII website search link and the current official court/tribunal pages for manual research.',
    failure: {
      timestamp: new Date().toISOString(),
      source: 'CanLII API',
      reason: 'The public CanLII API does not support free-text search.',
      suggestion: 'Open the CanLII search link or use the official court and tribunal pages below.',
    },
    semanticSearch: {
      enabled: semanticSearch.enabled,
      status: semanticSearch.status,
      source: semanticSearch.source,
      model: semanticSearch.model,
      message: semanticSearch.message,
      resultsCount: semanticSearch.hits.length,
    },
    semanticMatches: semanticSearch.hits,
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

  const guidance = courtGuidanceMap[court.toLowerCase()];
  if (guidance) {
    res.json(guidance);
    return;
  }

  res.status(404).json({
    error: `No guidance available for court: ${court}`,
    availableCourts: Object.keys(courtGuidanceMap),
  });
});

export default router;
