import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { api, Evidence } from '../services/api';

interface EvidencePageProps {
  matterId: string;
}

export default function EvidencePage({ matterId }: EvidencePageProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [timeline, setTimeline] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvidence();
    loadTimeline();
  }, [matterId]);

  const loadEvidence = async () => {
    try {
      const data = await api.listEvidence(matterId);
      setEvidence(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    }
  };

  const loadTimeline = async () => {
    try {
      const data = await api.getTimeline(matterId);
      setTimeline(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError('');

    try {
      for (const file of acceptedFiles) {
        await api.uploadEvidence(matterId, file);
      }
      await loadEvidence();
      await loadTimeline();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [matterId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'message/rfc822': ['.eml'],
      'application/vnd.ms-outlook': ['.msg'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-600">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supported: PDF, PNG, JPG, EML, MSG, TXT (max 10MB)
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Evidence List */}
      {evidence.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Uploaded Evidence</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {evidence.map((item) => {
              const index = item.evidenceIndex ? JSON.parse(item.evidenceIndex) : null;
              return (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.filename}</p>
                      {index?.summary && (
                        <p className="text-sm text-gray-600 mt-1">{index.summary}</p>
                      )}
                      <div className="flex gap-4 mt-2 text-sm text-gray-500">
                        <span>Uploaded {new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                        {index?.credibilityScore && (
                          <span>Credibility: {index.credibilityScore}/100</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline && timeline.events && timeline.events.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Timeline</h2>
          <div className="space-y-4">
            {timeline.events.map((event: any, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                  {new Date(event.date).toLocaleDateString()}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{event.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
