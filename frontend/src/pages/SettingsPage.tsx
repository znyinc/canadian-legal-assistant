import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Matter {
  id: string;
  createdAt: string;
  description: string;
  province: string;
  domain: string;
  legalHold?: boolean;
}

interface AuditEvent {
  id: string;
  timestamp: string;
  matterId: string;
  action: string;
  details: Record<string, any>;
}

export function SettingsPage() {
  const [tab, setTab] = useState<'export' | 'delete' | 'audit'>('export');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [auditFilterMatterId, setAuditFilterMatterId] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');

  // Use shared API client instance imported as `api`

  // Load matters on mount
  useEffect(() => {
    const loadMatters = async () => {
      try {
        const data = await api.listMatters();
        setMatters(data);
      } catch (err) {
        console.error('Failed to load matters:', err);
      }
    };
    loadMatters();
  }, []);

  // Export all data as ZIP
  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/export');
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canadian-legal-assistant-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete specific matter
  const handleDeleteMatter = async () => {
    if (!selectedMatterId || !deleteConfirm) return;

    setIsLoading(true);
    try {
      await api.deleteMatter(selectedMatterId);
      setMatters(matters.filter((m) => m.id !== selectedMatterId));
      setSelectedMatterId(null);
      setDeleteConfirm(false);
      alert('Matter deleted successfully');
    } catch (err) {
      alert('Failed to delete matter: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Load audit log
  const handleLoadAuditLog = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLog(auditFilterMatterId || undefined);
      setAuditLog(data);
    } catch (err) {
      alert('Failed to load audit log: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter audit log based on action
  const filteredAuditLog = auditFilterAction
    ? auditLog.filter((event) => event.action === auditFilterAction)
    : auditLog;

  // Get unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(auditLog.map((event) => event.action)));

  const selectedMatter = matters.find((m) => m.id === selectedMatterId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings & Data Management</h1>
        <p className="text-gray-600">
          Export your data, manage matters, and view audit logs
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setTab('export')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'export'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📥 Export Data
          </button>
          <button
            onClick={() => setTab('delete')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'delete'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🗑️ Delete Matters
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'audit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Audit Log
          </button>
        </div>
      </div>

      {/* Export Data Tab */}
      {tab === 'export' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Export Your Data</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Export</h3>
              <p className="text-gray-600 mb-4">
                Download all your matters, evidence, documents, and audit logs in a ZIP file.
                This includes all metadata and file references.
              </p>
              <button
                onClick={handleExportData}
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? '📦 Preparing Export...' : '📥 Export All Data as ZIP'}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✓ All matters and their classifications</li>
                <li>✓ Evidence files with metadata and hashes</li>
                <li>✓ Generated documents and packages</li>
                <li>✓ Complete audit log with timestamps</li>
                <li>✓ Forum maps and triage results</li>
                <li>✓ Evidence timelines and gap assessments</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>⚠️ Note:</strong> Your export contains sensitive legal information.
                Store it securely and do not share with unauthorized parties.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Matters Tab */}
      {tab === 'delete' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Delete Matters</h2>

          {matters.length === 0 ? (
            <p className="text-gray-600">No matters to delete</p>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Select Matter to Delete
                </label>
                <select
                  value={selectedMatterId || ''}
                  onChange={(e) => {
                    setSelectedMatterId(e.target.value || null);
                    setDeleteConfirm(false);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select a matter --</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {matter.description} ({matter.domain}) - {new Date(matter.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedMatter && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">Matter Details</h3>
                    <dl className="space-y-2 text-sm text-gray-700">
                      <div className="flex justify-between">
                        <dt className="font-medium">Description:</dt>
                        <dd>{selectedMatter.description}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Domain:</dt>
                        <dd>{selectedMatter.domain}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Province:</dt>
                        <dd>{selectedMatter.province}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Created:</dt>
                        <dd>{new Date(selectedMatter.createdAt).toLocaleString()}</dd>
                      </div>
                      {selectedMatter.legalHold && (
                        <div className="flex justify-between bg-yellow-100 p-2 rounded">
                          <dt className="font-medium text-yellow-900">⚠️ Legal Hold:</dt>
                          <dd className="text-yellow-900">Active</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {selectedMatter.legalHold ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                      <p className="text-red-900">
                        <strong>🔒 Legal Hold Active:</strong> This matter cannot be deleted
                        because it is subject to a legal hold. Contact your administrator to
                        remove the legal hold before deletion.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 mb-6">
                        <input
                          type="checkbox"
                          id="deleteConfirm"
                          checked={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.checked)}
                          className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <label
                          htmlFor="deleteConfirm"
                          className="text-sm text-gray-700"
                        >
                          I understand that deleting this matter will permanently remove all
                          associated evidence, documents, and audit records. This action
                          cannot be undone.
                        </label>
                      </div>

                      <button
                        onClick={handleDeleteMatter}
                        disabled={!deleteConfirm || isLoading}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                      >
                        {isLoading ? '🗑️ Deleting...' : '🗑️ Delete Matter Permanently'}
                      </button>
                    </>
                  )}
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  <strong>⚠️ Warning:</strong> Deletion is permanent and irreversible. Make sure
                  to export your data first if you need to preserve any information.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {tab === 'audit' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log</h2>

          <div className="space-y-6">
            {/* Filters */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matter ID (optional)
                  </label>
                  <input
                    type="text"
                    value={auditFilterMatterId}
                    onChange={(e) => setAuditFilterMatterId(e.target.value)}
                    placeholder="Filter by matter ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action (optional)
                  </label>
                  <select
                    value={auditFilterAction}
                    onChange={(e) => setAuditFilterAction(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">-- All Actions --</option>
                    {uniqueActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleLoadAuditLog}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
                  >
                    {isLoading ? 'Loading...' : '🔍 Load Audit Log'}
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            {auditLog.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Timestamp
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Matter ID
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Action
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAuditLog.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700 whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-700 font-mono">
                          {event.matterId}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-xs font-semibold">
                            {event.action}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                          <details className="cursor-pointer">
                            <summary className="font-medium text-blue-600 hover:text-blue-700">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : auditLog.length === 0 && (auditFilterMatterId || auditFilterAction) ? (
              <div className="text-center py-8 text-gray-600">
                <p>No audit events match your filters</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>Load audit log using the filters above</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>ℹ️ Audit Log Info:</strong> All actions performed on matters, evidence,
                and documents are logged with timestamps and details for compliance and
                accountability purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legal Disclaimer */}
      <div className="mt-8 bg-yellow-50 border border-yellow-300 rounded-lg p-6">
        <p className="text-sm text-yellow-900">
          <strong>⚠️ Data Management Disclaimer:</strong> All data management operations are
          subject to applicable data protection laws and legal hold requirements. Ensure you have
          proper authorization before exporting or deleting any matter. Data exports should be
          stored securely.
        </p>
      </div>
    </div>
  );
}
