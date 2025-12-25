import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function NewMatterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    description: '',
    province: 'ON',
    domain: 'other',
    disputeAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const matter = await api.createMatter({
        description: formData.description,
        province: formData.province,
        domain: formData.domain,
        disputeAmount: formData.disputeAmount ? parseFloat(formData.disputeAmount) : undefined,
      });

      // Automatically classify the matter
      await api.classifyMatter(matter.id);

      navigate(`/matters/${matter.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create matter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Describe Your Legal Issue</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6" aria-label="Create new legal matter" noValidate>
        {error && (
          <div
            className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
            role="alert"
            aria-live="assertive"
          >
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-600" aria-label="required">*</span>
          </label>
          <textarea
            id="description"
            required
            aria-required="true"
            minLength={10}
            rows={6}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Describe your legal situation in detail..."
            aria-describedby="description-hint"
          />
          <p id="description-hint" className="mt-1 text-sm text-gray-500">
            Be as specific as possible. Include dates, parties involved, and key events. Minimum 10 characters.
          </p>
        </div>

        {/* Domain */}
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
            Legal Area <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="domain"
            required
            aria-required="true"
            value={formData.domain}
            onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="other">Other / Not Sure</option>
            <option value="insurance">Insurance</option>
            <option value="landlordTenant">Landlord & Tenant</option>
            <option value="employment">Employment</option>
          </select>
        </div>

        {/* Province */}
        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
            Province <span className="text-red-600" aria-label="required">*</span>
          </label>
          <select
            id="province"
            required
            aria-required="true"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="ON">Ontario</option>
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
            <option value="SK">Saskatchewan</option>
            <option value="MB">Manitoba</option>
            <option value="QC">Quebec</option>
            <option value="NB">New Brunswick</option>
            <option value="NS">Nova Scotia</option>
            <option value="PE">Prince Edward Island</option>
            <option value="NL">Newfoundland and Labrador</option>
          </select>
        </div>

        {/* Dispute Amount */}
        <div>
          <label htmlFor="disputeAmount" className="block text-sm font-medium text-gray-700 mb-2">
            Dispute Amount (optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              id="disputeAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.disputeAmount}
              onChange={(e) => setFormData({ ...formData, disputeAmount: e.target.value })}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            If applicable, enter the amount in dispute (e.g., insurance claim, unpaid wages, damage claim).
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            aria-label="Cancel and return to matters list"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Create and automatically classify this legal matter"
            aria-busy={loading}
          >
            {loading ? 'Creating...' : 'Create & Classify Matter'}
          </button>
        </div>
      </form>
    </div>
  );
}
