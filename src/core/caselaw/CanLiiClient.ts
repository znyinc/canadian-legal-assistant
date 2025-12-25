import { SourceAccessController } from '../access/SourceAccessController';
import { SourceAccessPolicy } from '../models';

export interface CaseMetadata {
  caseId: string;
  title: string;
  court: string;
  decisionDate: string; // ISO
  citation?: string;
  url: string;
}

export interface CaseSearchResult {
  caseId: string;
  caseName: string;
  year: number;
  court: string;
  canliiId: string;
  url: string;
  summary?: string;
  relevance?: number;
}

export interface CanLiiConfig {
  apiKey?: string;
}

export class CanLiiClient {
  constructor(private access: SourceAccessController, private cfg: CanLiiConfig = {}) {}

  setPolicy(policy: SourceAccessPolicy) {
    this.access.setPolicy(policy);
  }

  async searchCases(query: string): Promise<CaseSearchResult[]> {
    // Enforce allowed method: official-api
    const allowed = this.access.validateAccess('CanLII', 'official-api');
    if (!allowed) throw new Error('Access method not allowed for CanLII.');

    if (!query || query.trim().length < 3) {
      throw new Error('Query too short (minimum 3 characters)');
    }

    // IMPORTANT: The CanLII REST API does NOT support free-text search.
    // It only supports:
    //   - /caseBrowse/{lang}/ - list databases
    //   - /caseBrowse/{lang}/{databaseId}/ - list decisions
    //   - /caseBrowse/{lang}/{databaseId}/{caseId}/ - fetch specific case
    //   - /caseCitator/... - citation information
    //
    // For free-text search, users must use the CanLII website directly.
    
    throw new Error('CanLII_API_NO_SEARCH: The CanLII REST API does not support free-text search. Please use https://www.canlii.org/en/ to search manually.');
  }

  async fetchCaseMetadata(query: string): Promise<{ ok: boolean; metadata?: CaseMetadata; error?: string }> {
    // Enforce allowed method: official-api
    const allowed = this.access.validateAccess('CanLII', 'official-api');
    if (!allowed) return { ok: false, error: 'Access method not allowed for CanLII.' };

    // Stubbed response; in real use, call CanLII API with apiKey
    if (!query || query.trim().length < 3) return { ok: false, error: 'Query too short.' };

    const meta: CaseMetadata = {
      caseId: 'ONCA-2025-001',
      title: 'Example v. Sample',
      court: 'ONCA',
      decisionDate: '2025-01-15',
      citation: '2025 ONCA 1',
      url: 'https://www.canlii.org/en/on/onca/doc/2025/2025onca1/2025onca1.html'
    };
    return { ok: true, metadata: meta };
  }

  private extractYear(text: string): number | null {
    const match = text.match(/\b(19\d{2}|20\d{2})\b/);
    return match ? parseInt(match[0], 10) : null;
  }
}
