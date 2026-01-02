import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { api } from '../services/api';
import { safeText, safeURL } from '../utils/sanitize';

interface CaseResult {
  id: string;
  caseName: string;
  year: number;
  court: string;
  summary: string;
  citation: string;
  citationWithURL: string;
  canliiLink: string;
  relevance: number;
}

interface Failure {
  timestamp: string;
  source: string;
  reason: string;
  suggestion: string;
}

interface Alternative {
  name: string;
  url: string;
  description: string;
  primary?: boolean;
  category?: string;
}

export function CaseLawPage() {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CaseResult[]>([]);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [alternatives, setAlternatives] = useState<Alternative[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if query parameter is present
  useEffect(() => {
    const queryParam = searchParams.get('query');
    if (queryParam && queryParam.trim()) {
      setSearchQuery(queryParam);
      // Trigger search automatically
      performSearch(queryParam);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      alert('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setFailure(null);
    setAlternatives([]);

    try {
      const data = await api.searchCaselaw(query);

      // Sanitize results before storing/displaying to prevent DOM-based XSS
      const sanitizedResults = (data.results || []).map((r: any) => ({
        ...r,
        caseName: DOMPurify.sanitize(String(r.caseName || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
        summary: DOMPurify.sanitize(String(r.summary || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
        court: DOMPurify.sanitize(String(r.court || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
        citation: DOMPurify.sanitize(String(r.citation || ''), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }),
        canliiLink: safeURL(r.canliiLink, ['canlii.org']) || '',
      }));

      setResults(sanitizedResults);
      if (data.failure) {
        setFailure(data.failure);
        const sanitizedAlts = (data.alternatives || []).map((a: any) => ({
          ...a,
          name: safeText(a.name),
          description: safeText(a.description),
          url: safeURL(a.url, undefined) || '',
        }));
        setAlternatives(sanitizedAlts);
      }
    } catch (err) {
      setFailure({
        timestamp: new Date().toISOString(),
        source: 'CanLII API',
        reason: err instanceof Error ? err.message : 'Unknown error',
        suggestion: 'Try searching directly on CanLII or consult the alternative resources below.',
      });
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Use shared API client instance

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchQuery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Case Law Search</h1>
        <p className="text-gray-600">
          Search Canadian case law and statutes to support your legal matter
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8 bg-white rounded-lg shadow p-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search case names, statutes, or legal topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Note:</strong> The CanLII API does not support free-text search. 
          Resources below are organized by <strong>Canada's court hierarchy</strong> from Supreme Court to provincial courts.
        </p>
      </form>

      {/* Retrieval Failure Message */}
      {failure && (
        <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Search Unavailable</h3>
          <p className="text-yellow-800 mb-3">
            {failure.reason}
          </p>
          <p className="text-yellow-800 text-sm">
            <strong>Suggestion:</strong> {failure.suggestion}
          </p>
          <p className="text-yellow-700 text-xs mt-2">
            Error logged at {new Date(failure.timestamp).toLocaleString()}
          </p>
        </div>
      )}

      {/* Results */}
      {hasSearched && results.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Results for "{safeText(searchQuery)}" ({results.length} found)
          </h2>
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-blue-600 hover:text-blue-700">
                    <a
                      href={safeURL(result.canliiLink, ['canlii.org']) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {safeText(result.caseName)}
                    </a>
                  </h3>
                  <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700">
                    {safeText(String(result.year))}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">
                  <strong>{safeText(result.court)}</strong>
                </p>

                <p className="text-gray-700 mb-4">
                  {safeText(result.summary)}
                </p>

                <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                  <p className="text-xs text-gray-500 mb-1">Citation:</p>
                  <code className="text-sm text-gray-800 font-mono break-all">
                    {safeText(result.citation)}
                  </code>
                  {result.citationWithURL && (
                    <p className="text-xs text-gray-500 mt-2">
                      <a
                        href={safeURL(result.canliiLink, ['canlii.org']) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View on CanLII ↗
                      </a>
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(safeText(result.citation));
                      alert('Citation copied to clipboard');
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors text-sm"
                  >
                    Copy Citation
                  </button>
                  <a
                    href={safeURL(result.canliiLink, ['canlii.org']) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded transition-colors text-sm"
                  >
                    Read Full Case →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {hasSearched && results.length === 0 && !failure && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">No Results Found</h3>
          <p className="text-blue-800 mb-4">
            Try refining your search with different keywords or check the alternative resources
            below.
          </p>
        </div>
      )}

      {/* Alternative Resources */}
      {hasSearched && alternatives.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Case Law Resources</h2>
          
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-2">
              <strong>📋 Canada's Court Hierarchy:</strong> Start with <strong>CanLII</strong> for nationwide search, 
              then check specific courts. Recent decisions appear on official court websites before CanLII.
            </p>
            <p className="text-sm text-blue-700">
              <strong>Search Strategy:</strong> Supreme Court of Canada → Courts of Appeal → Superior Courts → Provincial Courts. 
              For federal matters (immigration, tax), check Federal Courts.
            </p>
          </div>

          {/* Group alternatives by category */}
          {(() => {
            const categorized = alternatives.reduce((acc, alt) => {
              const cat = alt.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(alt);
              return acc;
            }, {} as Record<string, Alternative[]>);

            const categoryOrder = [
              'Primary Database',
              'Supreme Court',
              'Provincial Appeal Courts',
              'Superior Courts',
              'Provincial Courts',
              'Federal Courts',
              'Ontario Resources',
              'Other'
            ];

            return categoryOrder.map(category => {
              const items = categorized[category];
              if (!items || items.length === 0) return null;

              return (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    {category === 'Primary Database' && '🔍 '}
                    {category === 'Supreme Court' && '⚖️ '}
                    {category === 'Provincial Appeal Courts' && '📜 '}
                    {category === 'Superior Courts' && '🏛️ '}
                    {category === 'Provincial Courts' && '🏢 '}
                    {category === 'Federal Courts' && '🍁 '}
                    {category === 'Ontario Resources' && '📋 '}
                    {category}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((alt) => (
                      <a
                        key={safeText(alt.name)}
                        href={safeURL(alt.url, undefined) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block rounded-lg shadow p-4 hover:shadow-lg transition-shadow ${
                          alt.primary 
                            ? 'bg-blue-50 border-2 border-blue-300' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <h4 className={`font-semibold mb-1 ${
                          alt.primary ? 'text-blue-700' : 'text-blue-600'
                        }`}>
                          {safeText(alt.name)}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">{safeText(alt.description)}</p>
                        <span className="text-blue-600 text-sm font-medium">
                          {category === 'Primary Database' ? 'Search Now →' : 'Browse →'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Tips and Information */}
      {!hasSearched && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-semibold text-blue-900 mb-3">Search Strategy</h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• <strong>Start with CanLII</strong> - Free nationwide database for all Canadian courts</li>
              <li>• <strong>Recent cases?</strong> Check official court websites first (they publish before CanLII)</li>
              <li>• <strong>Know the court level:</strong> Provincial → Superior → Appeal → Supreme Court</li>
              <li>• <strong>Federal matters?</strong> Use Federal Court for immigration, IP, maritime, tax</li>
              <li>• Use Ctrl+F to search by case name or citation on court decision pages</li>
            </ul>
          </div>

          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <h3 className="font-semibold text-green-900 mb-3">Court Hierarchy Quick Reference</h3>
            <ul className="text-sm text-green-800 space-y-2">
              <li>⚖️ <strong>Supreme Court of Canada</strong> - Final appeal court for all of Canada</li>
              <li>📜 <strong>Courts of Appeal</strong> - Provincial/territorial highest courts</li>
              <li>🏛️ <strong>Superior Courts</strong> - Serious civil/criminal trials + appeals</li>
              <li>🏢 <strong>Provincial Courts</strong> - Most criminal, family, small claims</li>
              <li>🍁 <strong>Federal Courts</strong> - Immigration, tax, IP, maritime law</li>
            </ul>
          </div>
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-300 rounded-lg p-6">
        <p className="text-sm text-yellow-900">
          <strong>⚠️ Legal Information Disclaimer:</strong> This search provides legal
          information only, not legal advice. Consult with a qualified lawyer for advice
          specific to your situation. Case law results are sourced from CanLII and are provided
          for research purposes only.
        </p>
      </div>
    </div>
  );
}
