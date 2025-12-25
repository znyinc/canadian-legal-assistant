import { useState, useEffect } from 'react';
import { useParams, Routes, Route, Link, useLocation } from 'react-router-dom';
import { api, Matter } from '../services/api';
import EvidencePage from './EvidencePage';
import DocumentsPage from './DocumentsPage';

export default function MatterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [forumMap, setForumMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState(false);
  const [error, setError] = useState('');

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
        setClassification(JSON.parse(data.classification));
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
        <p className="text-gray-900 mb-2">{matter.description}</p>
        <p className="text-sm text-gray-500">
          Created {new Date(matter.createdAt).toLocaleDateString()}
        </p>
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
        <Route index element={<OverviewTab classification={classification} forumMap={forumMap} classifying={classifying} onClassify={handleClassify} />} />
        <Route path="evidence" element={<EvidencePage matterId={id!} />} />
        <Route path="documents" element={<DocumentsPage matterId={id!} />} />
      </Routes>
    </div>
  );
}

function OverviewTab({ classification, forumMap, classifying, onClassify }: { classification: any; forumMap: any; classifying: boolean; onClassify: () => void }) {
  if (classifying) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="text-blue-800 font-medium">🤖 AI is analyzing your matter...</p>
        </div>
        <p className="text-blue-700 text-sm mt-2">Classifying legal domain, identifying applicable forums, and assessing urgency.</p>
      </div>
    );
  }

  if (!classification || !forumMap) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 mb-4">Classification pending. This matter needs to be analyzed.</p>
        <button
          onClick={onClassify}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          🤖 Classify Now with AI
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Classification */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Classification</h2>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Domain</dt>
            <dd className="text-gray-900">{classification.domain}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Sub-category</dt>
            <dd className="text-gray-900">{classification.subCategory || 'N/A'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Urgency</dt>
            <dd className="text-gray-900">{classification.urgency || 'Standard'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Jurisdiction</dt>
            <dd className="text-gray-900">{classification.jurisdiction}</dd>
          </div>
        </dl>
      </div>

      {/* Forum Routing */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recommended Forums</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Primary Recommendation</h3>
            <p className="text-gray-700">{forumMap.recommended}</p>
          </div>

          {forumMap.pathways && forumMap.pathways.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Available Pathways</h3>
              <ol className="list-decimal list-inside space-y-2">
                {forumMap.pathways.map((pathway: string, index: number) => (
                  <li key={index} className="text-gray-700">{pathway}</li>
                ))}
              </ol>
            </div>
          )}

          {forumMap.rationale && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Rationale</h3>
              <p className="text-gray-700">{forumMap.rationale}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
