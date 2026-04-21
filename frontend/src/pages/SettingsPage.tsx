import { useState, useEffect } from 'react';
import { api, ProviderSettingsResponse, ProviderSettingsUpdateRequest } from '../services/api';
import { safeText } from '../utils/sanitize';

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

type SettingsTab = 'export' | 'delete' | 'audit' | 'providers';

const liteLlmProviderOptions = [
  { value: 'auto', label: 'Auto-select from configured keys' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'ollama', label: 'Ollama' },
] as const;

interface ProviderFormState {
  canliiApiKey: string;
  liteLlmBaseUrl: string;
  liteLlmApiKey: string;
  liteLlmFastProvider: string;
  liteLlmSmartProvider: string;
  liteLlmFastModel: string;
  liteLlmSmartModel: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiFastModel: string;
  openaiSmartModel: string;
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  claudeFastModel: string;
  claudeSmartModel: string;
  geminiApiKey: string;
  geminiBaseUrl: string;
  geminiFastModel: string;
  geminiSmartModel: string;
  ollamaBaseUrl: string;
  ollamaFastModel: string;
  ollamaSmartModel: string;
}

function buildProviderForm(snapshot: ProviderSettingsResponse['values']): ProviderFormState {
  return {
    canliiApiKey: '',
    liteLlmBaseUrl: snapshot.liteLlmBaseUrl,
    liteLlmApiKey: '',
    liteLlmFastProvider: snapshot.liteLlmFastProvider,
    liteLlmSmartProvider: snapshot.liteLlmSmartProvider,
    liteLlmFastModel: snapshot.liteLlmFastModel,
    liteLlmSmartModel: snapshot.liteLlmSmartModel,
    openaiApiKey: '',
    openaiBaseUrl: snapshot.openaiBaseUrl,
    openaiFastModel: snapshot.openaiFastModel,
    openaiSmartModel: snapshot.openaiSmartModel,
    anthropicApiKey: '',
    anthropicBaseUrl: snapshot.anthropicBaseUrl,
    claudeFastModel: snapshot.claudeFastModel,
    claudeSmartModel: snapshot.claudeSmartModel,
    geminiApiKey: '',
    geminiBaseUrl: snapshot.geminiBaseUrl,
    geminiFastModel: snapshot.geminiFastModel,
    geminiSmartModel: snapshot.geminiSmartModel,
    ollamaBaseUrl: snapshot.ollamaBaseUrl,
    ollamaFastModel: snapshot.ollamaFastModel,
    ollamaSmartModel: snapshot.ollamaSmartModel,
  };
}

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('export');
  const [matters, setMatters] = useState<Matter[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [auditFilterMatterId, setAuditFilterMatterId] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [providerSettings, setProviderSettings] = useState<ProviderSettingsResponse | null>(null);
  const [providerForm, setProviderForm] = useState<ProviderFormState | null>(null);
  const [providerLoading, setProviderLoading] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState('');
  const [providerNotice, setProviderNotice] = useState('');

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

  useEffect(() => {
    const loadProviderSettings = async () => {
      setProviderLoading(true);
      setProviderError('');
      try {
        const data = await api.getProviderSettings();
        setProviderSettings(data);
        setProviderForm(buildProviderForm(data.values));
      } catch (err) {
        setProviderError(err instanceof Error ? err.message : 'Failed to load provider settings');
      } finally {
        setProviderLoading(false);
      }
    };

    loadProviderSettings();
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
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      alert('Failed to export data: ' + safeText(err instanceof Error ? err.message : 'Unknown error'));
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
      alert('Failed to delete matter: ' + safeText(err instanceof Error ? err.message : 'Unknown error'));
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
      alert('Failed to load audit log: ' + safeText(err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderFieldChange = (field: keyof ProviderFormState, value: string) => {
    setProviderNotice('');
    setProviderForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveProviderSettings = async () => {
    if (!providerForm) return;

    setProviderSaving(true);
    setProviderError('');
    setProviderNotice('');

    try {
      const payload: ProviderSettingsUpdateRequest = {
        canliiApiKey: providerForm.canliiApiKey,
        liteLlmBaseUrl: providerForm.liteLlmBaseUrl,
        liteLlmApiKey: providerForm.liteLlmApiKey,
        liteLlmFastProvider: providerForm.liteLlmFastProvider,
        liteLlmSmartProvider: providerForm.liteLlmSmartProvider,
        liteLlmFastModel: providerForm.liteLlmFastModel,
        liteLlmSmartModel: providerForm.liteLlmSmartModel,
        openaiApiKey: providerForm.openaiApiKey,
        openaiBaseUrl: providerForm.openaiBaseUrl,
        openaiFastModel: providerForm.openaiFastModel,
        openaiSmartModel: providerForm.openaiSmartModel,
        anthropicApiKey: providerForm.anthropicApiKey,
        anthropicBaseUrl: providerForm.anthropicBaseUrl,
        claudeFastModel: providerForm.claudeFastModel,
        claudeSmartModel: providerForm.claudeSmartModel,
        geminiApiKey: providerForm.geminiApiKey,
        geminiBaseUrl: providerForm.geminiBaseUrl,
        geminiFastModel: providerForm.geminiFastModel,
        geminiSmartModel: providerForm.geminiSmartModel,
        ollamaBaseUrl: providerForm.ollamaBaseUrl,
        ollamaFastModel: providerForm.ollamaFastModel,
        ollamaSmartModel: providerForm.ollamaSmartModel,
      };

      const updated = await api.updateProviderSettings(payload);
      setProviderSettings(updated);
      setProviderForm(buildProviderForm(updated.values));
      setProviderNotice('Provider settings saved. New AI requests will use the updated runtime configuration.');
    } catch (err) {
      setProviderError(err instanceof Error ? err.message : 'Failed to save provider settings');
    } finally {
      setProviderSaving(false);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Trust, Audit, And Data Controls</h1>
        <p className="text-gray-600">
          Manage record portability, deletion controls, and a verifiable audit trail.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-900">Governance snapshot</p>
        <p className="mt-1 text-sm text-emerald-900">
          This workspace keeps action-level audit events, supports full data export, and preserves legal-hold protection for restricted matters.
        </p>
        <p className="mt-2 text-sm text-emerald-900">
          Language parity status: French UI support is currently partial (navigation-first) while full page-level parity is still in progress.
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
          <button
            onClick={() => setTab('providers')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              tab === 'providers'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            🔐 Provider Keys
          </button>
        </div>
      </div>

      {tab === 'providers' && (
        <div className="bg-white rounded-lg shadow p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Provider Settings</h2>
            <p className="text-gray-600">
              Update LiteLLM, provider API keys, model aliases, and local model endpoints from one place. Secret fields are replace-only: leave them blank to keep the current value.
            </p>
          </div>

          {providerError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              {safeText(providerError)}
            </div>
          )}

          {providerNotice && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              {safeText(providerNotice)}
            </div>
          )}

          {providerLoading || !providerForm || !providerSettings ? (
            <div className="text-sm text-gray-600">Loading provider settings...</div>
          ) : !providerSettings.runtimeEditingEnabled ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
              Runtime provider editing is disabled. Set <strong>ALLOW_RUNTIME_ENV_EDITING=true</strong> in the backend env file to use this screen.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <p className="font-semibold mb-1">Current source of truth</p>
                <p>
                  Settings are read from and written to <strong>{providerSettings.sourceFile}</strong>. LiteLLM is the recommended primary proxy. Direct provider keys stay available as fallbacks and for future model additions.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">LiteLLM Proxy</h3>
                    <p className="text-sm text-gray-600">Primary gateway for routing, rotation, and alias management.</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Pin the FAST and SMART aliases to a specific upstream when one provider key is stale or you want predictable routing. Leave both on Auto to keep the existing priority order.
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LiteLLM Base URL</label>
                    <input value={providerForm.liteLlmBaseUrl} onChange={(e) => handleProviderFieldChange('liteLlmBaseUrl', e.target.value)} title="LiteLLM base URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LiteLLM API Key</label>
                    <input type="password" value={providerForm.liteLlmApiKey} onChange={(e) => handleProviderFieldChange('liteLlmApiKey', e.target.value)} placeholder={providerSettings.values.liteLlmApiKeySet ? 'Stored. Enter a new key to rotate.' : 'Optional proxy auth key'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">FAST Upstream</label>
                      <select value={providerForm.liteLlmFastProvider} onChange={(e) => handleProviderFieldChange('liteLlmFastProvider', e.target.value)} title="LiteLLM fast upstream provider" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {liteLlmProviderOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SMART Upstream</label>
                      <select value={providerForm.liteLlmSmartProvider} onChange={(e) => handleProviderFieldChange('liteLlmSmartProvider', e.target.value)} title="LiteLLM smart upstream provider" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {liteLlmProviderOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fast Alias</label>
                      <input value={providerForm.liteLlmFastModel} onChange={(e) => handleProviderFieldChange('liteLlmFastModel', e.target.value)} title="LiteLLM fast alias" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smart Alias</label>
                      <input value={providerForm.liteLlmSmartModel} onChange={(e) => handleProviderFieldChange('liteLlmSmartModel', e.target.value)} title="LiteLLM smart alias" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">OpenAI</h3>
                    <p className="text-sm text-gray-600">Optional direct fallback and model override settings.</p>
                  </div>
                  <p className="text-xs text-gray-500">Key status: {providerSettings.values.openaiApiKeySet ? 'configured' : 'not set'}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input type="password" value={providerForm.openaiApiKey} onChange={(e) => handleProviderFieldChange('openaiApiKey', e.target.value)} placeholder={providerSettings.values.openaiApiKeySet ? 'Stored. Enter a new key to rotate.' : 'Paste OpenAI API key'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input value={providerForm.openaiBaseUrl} onChange={(e) => handleProviderFieldChange('openaiBaseUrl', e.target.value)} title="OpenAI base URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fast Model</label>
                      <input value={providerForm.openaiFastModel} onChange={(e) => handleProviderFieldChange('openaiFastModel', e.target.value)} title="OpenAI fast model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smart Model</label>
                      <input value={providerForm.openaiSmartModel} onChange={(e) => handleProviderFieldChange('openaiSmartModel', e.target.value)} title="OpenAI smart model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Anthropic</h3>
                    <p className="text-sm text-gray-600">Direct Claude fallback plus model alias overrides.</p>
                  </div>
                  <p className="text-xs text-gray-500">Key status: {providerSettings.values.anthropicApiKeySet ? 'configured' : 'not set'}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input type="password" value={providerForm.anthropicApiKey} onChange={(e) => handleProviderFieldChange('anthropicApiKey', e.target.value)} placeholder={providerSettings.values.anthropicApiKeySet ? 'Stored. Enter a new key to rotate.' : 'Paste Anthropic API key'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input value={providerForm.anthropicBaseUrl} onChange={(e) => handleProviderFieldChange('anthropicBaseUrl', e.target.value)} title="Anthropic base URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fast Model</label>
                      <input value={providerForm.claudeFastModel} onChange={(e) => handleProviderFieldChange('claudeFastModel', e.target.value)} title="Claude fast model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smart Model</label>
                      <input value={providerForm.claudeSmartModel} onChange={(e) => handleProviderFieldChange('claudeSmartModel', e.target.value)} title="Claude smart model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Gemini</h3>
                    <p className="text-sm text-gray-600">Direct Gemini fallback plus model alias overrides.</p>
                  </div>
                  <p className="text-xs text-gray-500">Key status: {providerSettings.values.geminiApiKeySet ? 'configured' : 'not set'}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                    <input type="password" value={providerForm.geminiApiKey} onChange={(e) => handleProviderFieldChange('geminiApiKey', e.target.value)} placeholder={providerSettings.values.geminiApiKeySet ? 'Stored. Enter a new key to rotate.' : 'Paste Gemini API key'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input value={providerForm.geminiBaseUrl} onChange={(e) => handleProviderFieldChange('geminiBaseUrl', e.target.value)} title="Gemini base URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fast Model</label>
                      <input value={providerForm.geminiFastModel} onChange={(e) => handleProviderFieldChange('geminiFastModel', e.target.value)} title="Gemini fast model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smart Model</label>
                      <input value={providerForm.geminiSmartModel} onChange={(e) => handleProviderFieldChange('geminiSmartModel', e.target.value)} title="Gemini smart model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ollama</h3>
                    <p className="text-sm text-gray-600">Local fallback endpoint and model names.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                    <input value={providerForm.ollamaBaseUrl} onChange={(e) => handleProviderFieldChange('ollamaBaseUrl', e.target.value)} title="Ollama base URL" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fast Model</label>
                      <input value={providerForm.ollamaFastModel} onChange={(e) => handleProviderFieldChange('ollamaFastModel', e.target.value)} title="Ollama fast model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smart Model</label>
                      <input value={providerForm.ollamaSmartModel} onChange={(e) => handleProviderFieldChange('ollamaSmartModel', e.target.value)} title="Ollama smart model" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-gray-200 p-5 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">CanLII</h3>
                    <p className="text-sm text-gray-600">Optional legal research key for case law retrieval.</p>
                  </div>
                  <p className="text-xs text-gray-500">Key status: {providerSettings.values.canliiApiKeySet ? 'configured' : 'not set'}</p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CanLII API Key</label>
                    <input type="password" value={providerForm.canliiApiKey} onChange={(e) => handleProviderFieldChange('canliiApiKey', e.target.value)} placeholder={providerSettings.values.canliiApiKeySet ? 'Stored. Enter a new key to rotate.' : 'Paste CanLII API key'} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </section>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
                Key fields are replace-only. Leave a secret field blank to keep the current stored value. This updates the backend env file and refreshes runtime routing for new requests, but unrelated startup settings like CORS still require a restart.
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveProviderSettings}
                  disabled={providerSaving}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  {providerSaving ? 'Saving Provider Settings...' : 'Save Provider Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export Data Tab */}
      {tab === 'export' && (
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Export Your Data</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Full Export</h3>
              <p className="text-gray-600 mb-4">
                Download all your matters, evidence, documents, and audit logs in a ZIP package.
                This supports case transfer, review, and offline retention.
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
                <li>✓ Evidence files with metadata and integrity hashes</li>
                <li>✓ Generated documents and packages</li>
                <li>✓ Complete audit log with timestamps and actions</li>
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
                  aria-label="Select matter to delete"
                  title="Select matter to delete"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Select a matter --</option>
                  {matters.map((matter) => (
                    <option key={matter.id} value={matter.id}>
                      {safeText(matter.description)} ({safeText(matter.domain)}) - {new Date(matter.createdAt).toLocaleDateString()}
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
                        <dd>{safeText(selectedMatter.description)}</dd>
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
                    aria-label="Filter audit events by action"
                    title="Filter audit events by action"
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
                              {safeText(JSON.stringify(event.details, null, 2))}
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
