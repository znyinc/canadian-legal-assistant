import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { api, Matter } from '../services/api';
import { safeText } from '../utils/sanitize';
import EvidencePage from './EvidencePage';
import DocumentsPage from './DocumentsPage';
import OverviewTab from '../components/OverviewTab';

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [forumMap, setForumMap] = useState<any>(null);
  const [pillarExplanation, setPillarExplanation] = useState<any>(null);
  const [pillarMatches, setPillarMatches] = useState<string[] | null>(null);
  const [pillarAmbiguous, setPillarAmbiguous] = useState<boolean>(false);
  const [journey, setJourney] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState('');
  const [generatingForm7A, setGeneratingForm7A] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadMatter();
    }
  }, [id]);

  const loadMatter = async () => {
    if (!id) return;

    try {
      const data = await api.getMatter(id);
      setMatter(data);

      if (data.classification) {
        const c = JSON.parse(data.classification);
        setClassification(c);
        if (c.pillarExplanation) setPillarExplanation(c.pillarExplanation);
        if (Array.isArray(c.pillarMatches)) setPillarMatches(c.pillarMatches);
        if (c.pillarAmbiguous) setPillarAmbiguous(!!c.pillarAmbiguous);
        if (c.journey) setJourney(c.journey);
      }
      if (data.forumMap) {
        setForumMap(JSON.parse(data.forumMap));
      }

      // Auto-classify if not already classified
      if (!data.classification || !data.forumMap) {
        await handleClassify();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matter');
    } finally {
      setLoading(false);
    }
  };

  const handleClassify = async () => {
    if (!id) return;
    
    setClassifying(true);
    try {
      const result = await api.classifyMatter(id);
      setClassification(result.classification);
      setForumMap(result.forumMap);
      // Populate pillar-related UI state from classification result
      if (result.pillarExplanation) setPillarExplanation(result.pillarExplanation);
      if (Array.isArray(result.pillarMatches)) setPillarMatches(result.pillarMatches);
      if (typeof result.pillarAmbiguous !== 'undefined') setPillarAmbiguous(!!result.pillarAmbiguous);
      if (result.journey) setJourney(result.journey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setClassifying(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading matter...</div>;
  }

  if (error || !matter) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error || 'Matter not found'}</p>
      </div>
    );
  }

  const isOverviewPage = location.pathname === `/matters/${id}` || location.pathname === `/matters/${id}/`;

  const handleGenerateForm7A = async () => {
    if (!id) return;
    setGeneratingForm7A(true);
    try {
      await api.generateDocuments(id, undefined, ['civil/small_claims_form7a']);
      // navigate to documents tab to let user download
      navigate(`/matters/${id}/documents`);
    } catch (err) {
      console.error('Generate Form 7A failed', err);
      alert('Failed to generate Form 7A');
    } finally {
      setGeneratingForm7A(false);
    }
  };

  return (
    <div>
      {/* Matter Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
            {matter.domain}
          </span>
          <span className="text-sm text-gray-500">{matter.province}</span>
          {classification && (
            <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
              Classified
            </span>
          )}
        </div>
        <p className="text-gray-900 mb-2">{safeText(matter.description)}</p>
        <p className="text-sm text-gray-500">
          Created {new Date(matter.createdAt).toLocaleDateString()}
        </p>

        {/* Quick action for civil matters: Generate Form 7A */}
        {classification?.domain === 'civil-negligence' && (
          <div className="mt-4">
            <button
              onClick={handleGenerateForm7A}
              disabled={generatingForm7A}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              {generatingForm7A ? 'Generating Form 7A...' : 'Generate Form 7A'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6" role="tablist" aria-label="Matter details">
        <nav className="flex gap-4">
          <Link
            to={`/matters/${id}`}
            role="tab"
            aria-selected={isOverviewPage}
            aria-controls="overview-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              isOverviewPage
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </Link>
          <Link
            to={`/matters/${id}/evidence`}
            role="tab"
            aria-selected={location.pathname.includes('/evidence')}
            aria-controls="evidence-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/evidence')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Evidence
          </Link>
          <Link
            to={`/matters/${id}/documents`}
            role="tab"
            aria-selected={location.pathname.includes('/documents')}
            aria-controls="documents-panel"
            className={`pb-2 px-1 border-b-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
              location.pathname.includes('/documents')
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Documents
          </Link>
        </nav>
      </div>

      {/* Tab Content */}
      <Routes>
        <Route index element={<OverviewTab classification={classification} forumMap={forumMap} classifying={classifying} onClassify={handleClassify} pillarExplanation={pillarExplanation} pillarMatches={pillarMatches || undefined} pillarAmbiguous={pillarAmbiguous} journey={journey} />} />
        <Route path="evidence" element={<EvidencePage matterId={id!} />} />
        <Route path="documents" element={<DocumentsPage matterId={id!} />} />
      </Routes>
    </div>
  );
}
