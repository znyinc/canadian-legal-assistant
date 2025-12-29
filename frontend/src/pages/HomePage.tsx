import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Matter } from '../services/api';
import { safeText } from '../utils/sanitize';

export default function HomePage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMatters();
  }, []);

  const loadMatters = async () => {
    try {
      const data = await api.listMatters();
      setMatters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matters');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(matters.map(m => m.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} matter${selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    setDeleting(true);
    const errors: string[] = [];

    for (const id of selectedIds) {
      try {
        await api.deleteMatter(id);
      } catch (err) {
        errors.push(`Failed to delete matter: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setSelectedIds(new Set());
    setSelectionMode(false);
    setDeleting(false);
    await loadMatters();
  };

  const handleDeleteSingle = async (id: string, description: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const snippet = safeText(description).substring(0, 100) + (description.length > 100 ? '...' : '');
    const confirmed = window.confirm(
      `Are you sure you want to delete this matter?\n\n"${snippet}"\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteMatter(id);
      await loadMatters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete matter');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading matters...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Legal Matters</h1>
        <div className="flex gap-3">
          {matters.length > 0 && (
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedIds(new Set());
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {selectionMode ? 'Cancel' : '🗑️ Delete Matters'}
            </button>
          )}
          <Link
            to="/matters/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Matter
          </Link>
        </div>
      </div>

      {selectionMode && matters.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Deselect All
              </button>
            </div>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0 || deleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {deleting ? 'Deleting...' : `Delete ${selectedIds.size} Matter${selectedIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 whitespace-pre-line">{error}</p>
        </div>
      )}

      {matters.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 mb-4">No matters yet. Get started by creating your first matter.</p>
          <Link
            to="/matters/new"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Create First Matter
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {matters.map((matter) => (
            <div
              key={matter.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition relative"
            >
              {selectionMode ? (
                <div className="p-6 cursor-pointer" onClick={() => toggleSelection(matter.id)}>
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(matter.id)}
                      onChange={() => toggleSelection(matter.id)}
                      className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                          {matter.domain}
                        </span>
                        <span className="text-sm text-gray-500">{matter.province}</span>
                      </div>
                      <p className="text-gray-900 mb-2">{safeText(matter.description)}</p>
                      <p className="text-sm text-gray-500">
                        Created {new Date(matter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {matter.classification && (
                      <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                        Classified
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <Link to={`/matters/${matter.id}`} className="block p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                          {matter.domain}
                        </span>
                        <span className="text-sm text-gray-500">{matter.province}</span>
                      </div>
                      <p className="text-gray-900 mb-2">{safeText(matter.description)}</p>
                      <p className="text-sm text-gray-500">
                        Created {new Date(matter.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      {matter.classification && (
                        <span className="inline-block px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                          Classified
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteSingle(matter.id, matter.description, e)}
                        disabled={deleting}
                        className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete this matter"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
