import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface DocumentsPageProps {
  matterId: string;
}

export default function DocumentsPage({ matterId }: DocumentsPageProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

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
    setGenerating(true);
    setError('');

    try {
      await api.generateDocuments(matterId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate documents');
    } finally {
      setGenerating(false);
    }
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
            const packageName = packageData.package?.packageName || 'Legal Documents';
            
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
                    onClick={() => handleDownload(doc.packageId, doc.createdAt)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Download
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
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Package Contents</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {packageData.package.files.map((file: any, index: number) => (
                        <li key={index}>{file.path || file.filename || `Document ${index + 1}`}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {packageData.warnings && packageData.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm font-medium text-yellow-900 mb-1">⚠️ Warnings</p>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {packageData.warnings.map((warning: string, index: number) => (
                        <li key={index}>• {warning}</li>
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
    </div>
  );
}
