import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { api } from '../services/api';
import { safeText } from '../utils/sanitize';
import { SmartText } from '../components/SmartText';
import { PackageContentsSegmented } from '../components/PackageContentsSegmented';

interface DocumentsPageProps {
  matterId: string;
}

export default function DocumentsPage({ matterId }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [requestedTemplates, setRequestedTemplates] = useState<string[]>([]);
  const [userConfirmedFacts, setUserConfirmedFacts] = useState<string[]>([]);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [downloadingPackageId, setDownloadingPackageId] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [matterId]);

  const loadDocuments = async () => {
    try {
      const data = await api.listDocuments(matterId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleGenerate = async () => {
    // Open confirmation modal
    setRequestedTemplates([]);
    setUserConfirmedFacts([]);
    setConfirmChecked(false);
    setShowConfirm(true);
  };

  const confirmGenerate = async () => {
    if (!confirmChecked) {
      setError('Please confirm the facts before generating documents.');
      return;
    }
    setShowConfirm(false);
    setGenerating(true);
    setError('');

    try {
      await api.generateDocuments(matterId, userConfirmedFacts, requestedTemplates.length ? requestedTemplates : undefined);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate documents');
    } finally {
      setGenerating(false);
    }
  };

  const toggleTemplate = (tpl: string) => {
    setRequestedTemplates((curr) => (curr.includes(tpl) ? curr.filter((t) => t !== tpl) : [...curr, tpl]));
  };

  const handleDownload = async (packageId: string, createdAt: string) => {
    try {
      const response = await fetch(`/api/export/package/${packageId}`);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date(createdAt).toISOString().split('T')[0];
      link.download = `legal-documents-${date}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Plain Language Explanation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <SmartText text="Document packages include forms, evidence manifests, timelines, and forum maps tailored to your legal matter. All documents are information-only and do not constitute legal advice." />
        </p>
      </div>

      {/* Generate Button */}
      {documents.length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Generate Documents</h2>
          <p className="text-gray-600 mb-4">
            Ready to create document packages for your matter? Click below to generate
            standardized forms, drafts, and evidence manifests.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Documents'}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc) => {
            const packageData = JSON.parse(doc.packageData);
            const date = new Date(doc.createdAt).toLocaleDateString();
            const time = new Date(doc.createdAt).toLocaleTimeString();
            const packageName = DOMPurify.sanitize(String(packageData.package?.packageName || 'Legal Documents'), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
            
            return (
              <div key={doc.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{packageName} Package</h3>
                    <p className="text-sm text-gray-500">
                      Generated {date} at {time}
                    </p>
                  </div>
                  <button 
                    onClick={async () => {
                      setDownloadingPackageId(doc.packageId);
                      try {
                        await handleDownload(doc.packageId, doc.createdAt);
                      } finally {
                        setDownloadingPackageId(null);
                      }
                    }}
                    disabled={downloadingPackageId === doc.packageId}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {downloadingPackageId === doc.packageId ? 'Downloading...' : 'Download'}
                  </button>
                </div>

                {packageData.drafts && packageData.drafts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-700">
                      <span className="font-medium">{packageData.drafts.length}</span> document{packageData.drafts.length !== 1 ? 's' : ''} included
                    </p>
                  </div>
                )}

                {packageData.package?.files && (
                  <PackageContentsSegmented
                    files={packageData.package.files}
                    onDownloadEssentials={async () => {
                      setDownloadingPackageId(doc.packageId);
                      try {
                        await handleDownload(doc.packageId, doc.createdAt);
                      } finally {
                        setDownloadingPackageId(null);
                      }
                    }}
                    onDownloadEverything={async () => {
                      setDownloadingPackageId(doc.packageId);
                      try {
                        await handleDownload(doc.packageId, doc.createdAt);
                      } finally {
                        setDownloadingPackageId(null);
                      }
                    }}
                    isDownloading={downloadingPackageId === doc.packageId}
                  />
                )}

                {packageData.warnings && packageData.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Warnings</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {packageData.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {safeText(warning)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate New Package'}
          </button>
        </div>
      )}

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Confirm facts & select templates</h3>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700">User confirmed facts (optional)</label>
              <textarea
                name="userConfirmedFacts"
                rows={3}
                className="mt-1 block w-full rounded border-gray-300"
                onChange={(e) => setUserConfirmedFacts(e.target.value ? [e.target.value] : [])}
              />
            </div>
            <div className="mb-3">
              <p className="text-sm font-medium">Requested templates</p>
              <div className="flex gap-2 mt-2">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={requestedTemplates.includes('civil/small_claims_form7a')} onChange={() => toggleTemplate('civil/small_claims_form7a')} />
                  <span className="text-sm">Form 7A (Small Claims)</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={requestedTemplates.length === 0} onChange={() => setRequestedTemplates([])} />
                  <span className="text-sm">All templates</span>
                </label>
              </div>
            </div>
            <div className="mb-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
                <span className="text-sm">I confirm the facts and understand these are information-only documents</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={confirmGenerate} className="px-4 py-2 bg-blue-600 text-white rounded">Generate</button>
            </div>
          </div>
        </div>
      )}    </div>
  );
}
