import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, AlertCircle, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { 
  ROLE_OPTIONS, 
  LEGAL_TAXONOMY, 
  URGENCY_OPTIONS,
  UserRole, 
  LegalCategory 
} from '../data/legalTaxonomy';

interface WizardState {
  currentStep: number;
  role: UserRole | '';
  category: LegalCategory | '';
  scenario: string;
  urgencyType: string;
  urgencyDate: string;
  courtDate: string;
  amount: string;
  backstory: string;
}

export default function IntakeWizard({ province }: { province: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    role: '',
    category: '',
    scenario: '',
    urgencyType: '',
    urgencyDate: '',
    courtDate: '',
    amount: '',
    backstory: '',
  });

  const totalSteps = 5;

  // Calculate days until deadline for urgency alerts
  const daysUntilDeadline = useMemo(() => {
    if (!state.urgencyDate) return null;
    const deadline = new Date(state.urgencyDate);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [state.urgencyDate]);

  // Get contextual prompt based on role and category
  const contextPrompt = useMemo(() => {
    if (!state.category || !state.role) return 'Tell us your story in as much detail as possible...';
    const categoryData = LEGAL_TAXONOMY[state.category as LegalCategory];
    if (!categoryData) return 'Tell us your story in as much detail as possible...';
    
    if (state.role === 'plaintiff') return categoryData.contextPrompt.plaintiff;
    if (state.role === 'defendant') return categoryData.contextPrompt.defendant;
    if (state.role === 'administrative' && categoryData.contextPrompt.administrative) {
      return categoryData.contextPrompt.administrative;
    }
    return 'Tell us your story in as much detail as possible...';
  }, [state.category, state.role]);

  // Get scenario options based on role and category
  const scenarioOptions = useMemo(() => {
    if (!state.category) return [];
    const categoryData = LEGAL_TAXONOMY[state.category as LegalCategory];
    if (!categoryData) return [];
    
    if (state.role === 'plaintiff') return categoryData.plaintiffScenarios;
    if (state.role === 'defendant') return categoryData.defendantScenarios;
    if (state.role === 'administrative' && categoryData.administrativeScenarios) {
      return categoryData.administrativeScenarios;
    }
    return categoryData.plaintiffScenarios; // Fallback
  }, [state.category, state.role]);

  const handleNext = () => {
    if (state.currentStep === 1 && !state.role) {
      setError('Please select your role in this legal matter');
      return;
    }
    if (state.currentStep === 2 && !state.category) {
      setError('Please select the area of law that best fits your situation');
      return;
    }
    if (state.currentStep === 3 && !state.scenario) {
      setError('Please select the specific situation or describe it in your own words');
      return;
    }
    if (state.currentStep === 4 && !state.urgencyType) {
      setError('Please indicate if you have any active deadlines');
      return;
    }
    if (state.currentStep === 4 && state.urgencyType !== 'none' && !state.urgencyDate) {
      setError('Please enter the date');
      return;
    }

    setError('');
    if (state.currentStep < totalSteps) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  };

  const handlePrev = () => {
    setError('');
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleSubmit = async () => {
    if (!state.backstory.trim()) {
      setError('Please provide background information about your situation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedScenario = scenarioOptions.find(s => s.value === state.scenario);
      const urgencyInfo = URGENCY_OPTIONS.find(u => u.value === state.urgencyType);
      
      const description = `Role: ${state.role}
Category: ${state.category}
Situation: ${selectedScenario?.label || state.scenario}

${urgencyInfo ? `Urgency: ${urgencyInfo.label}${state.urgencyType === 'court-date' ? ` - Court date: ${state.courtDate}` : state.urgencyDate ? ` - ${urgencyInfo.dateLabel}: ${state.urgencyDate}` : ''}` : ''}
${state.amount ? `Amount at stake: $${state.amount}` : ''}

Background:
${state.backstory}`;

      const result = await api.createMatter({
        description,
        province,
        domain: selectedScenario?.domain || 'other',
        disputeAmount: state.amount ? parseFloat(state.amount) : undefined,
      });

      navigate(`/matters/${result.id}`);
    } catch (err: any) {
      let errorMessage = err.message || 'Failed to create matter';
      let suggestions: string[] = [];

      if (err.details && Array.isArray(err.details)) {
        // Zod validation errors
        const fieldErrors = err.details.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        errorMessage = `Validation error: ${fieldErrors}`;

        // Provide contextual suggestions based on filled fields
        const selectedScenario = scenarioOptions.find(s => s.value === state.scenario);
        
        if (err.details[0]?.path?.includes('domain')) {
          suggestions = [
            `✓ You selected: ${state.role} → ${LEGAL_TAXONOMY[state.category as LegalCategory]?.label} → ${selectedScenario?.label}`,
            `→ This maps to domain: "${selectedScenario?.domain || 'other'}"`,
            '',
            'Action items:',
            '1. Verify your selections match your situation',
            '2. If the situation doesn\'t fit, try:',
            `   • Go back and choose a different category (Step 2)`,
            `   • Or select a different specific scenario (Step 3)`,
            `   • Or describe your situation in the custom text field`,
            '',
            'Hint: The system couldn\'t recognize the category you selected. Try picking a different legal area or describing your situation in your own words.',
          ];
        } else if (err.details[0]?.path?.includes('description')) {
          suggestions = [
            'Your background information is too short.',
            '',
            'Action items:',
            '1. Go back to Step 5 (Tell Us Your Story)',
            '2. Add more details about your situation:',
            '   • Include dates when important events happened',
            '   • Mention amounts of money involved',
            '   • Explain any agreements or contracts',
            '   • Describe what you\'ve already tried',
            '3. Try to write at least 50-75 characters',
            '',
            'Example: "I hired a lawyer for my slip-and-fall case. They missed the filing deadline, and I can no longer sue. I paid $5,000 retainer."',
          ];
        }
      }

      const displayError = suggestions.length > 0 
        ? `${errorMessage}\n\n${suggestions.join('\n')}`
        : errorMessage;

      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  const progress = (state.currentStep / totalSteps) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Step {state.currentStep} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-red-800 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
            {error}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Step 1: Role Selection */}
        {state.currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What is your role in this legal matter?</h2>
              <p className="text-gray-600">This helps us understand your position and what guidance you need.</p>
            </div>
            <div className="space-y-3">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setState(prev => ({ ...prev, role: option.value }))}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    state.role === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-600">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {state.currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What area of law does this involve?</h2>
              <p className="text-gray-600">Choose the category that best fits your situation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(LEGAL_TAXONOMY).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setState(prev => ({ ...prev, category: key as LegalCategory }))}
                  className={`text-left p-4 border-2 rounded-lg transition-colors ${
                    state.category === key ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-semibold text-gray-900">{category.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Specific Scenario */}
        {state.currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">What specifically happened?</h2>
              <p className="text-gray-600">Select the situation that best matches yours.</p>
            </div>
            <div className="space-y-3">
              {scenarioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setState(prev => ({ ...prev, scenario: option.value }))}
                  className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                    state.scenario === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{option.label}</div>
                  {option.description && <div className="text-sm text-gray-600">{option.description}</div>}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Or describe your specific situation:</label>
              <textarea
                value={state.scenario.startsWith('custom:') ? state.scenario.slice(7) : ''}
                onChange={(e) => setState(prev => ({ ...prev, scenario: `custom:${e.target.value}` }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[100px]"
                placeholder="If none of the above fit, describe your specific legal issue here..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Urgency & Deadlines */}
        {state.currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Are there any active deadlines?</h2>
              <p className="text-gray-600">Legal deadlines are critical. Missing them can end your case.</p>
            </div>

            {/* Urgency Alert if applicable */}
            {daysUntilDeadline !== null && daysUntilDeadline < 21 && (
              <div className={`${
                daysUntilDeadline < 0 ? 'bg-red-100 border-red-300' :
                daysUntilDeadline <= 7 ? 'bg-red-50 border-red-200' :
                daysUntilDeadline <= 14 ? 'bg-orange-50 border-orange-200' :
                'bg-yellow-50 border-yellow-200'
              } border-2 rounded-lg p-4`}>
                <div className="flex items-start gap-3">
                  <Calendar className={`w-6 h-6 flex-shrink-0 ${
                    daysUntilDeadline < 0 ? 'text-red-700' :
                    daysUntilDeadline <= 7 ? 'text-red-600' :
                    daysUntilDeadline <= 14 ? 'text-orange-600' :
                    'text-yellow-700'
                  }`} />
                  <div>
                    <p className={`font-semibold ${
                      daysUntilDeadline < 0 ? 'text-red-900' :
                      daysUntilDeadline <= 7 ? 'text-red-800' :
                      daysUntilDeadline <= 14 ? 'text-orange-800' :
                      'text-yellow-900'
                    }`}>
                      {daysUntilDeadline < 0
                        ? 'DEADLINE PASSED: Seek immediate legal assistance'
                        : daysUntilDeadline === 0
                        ? 'URGENT: Deadline is TODAY'
                        : daysUntilDeadline <= 7
                        ? `URGENT: Only ${daysUntilDeadline} days until deadline`
                        : daysUntilDeadline <= 14
                        ? `Warning: ${daysUntilDeadline} days until deadline`
                        : `Caution: ${daysUntilDeadline} days until deadline`
                      }
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {state.urgencyType === 'served-papers' && daysUntilDeadline < 20 && (
                        'You may need to file a response within 20 days of being served. Do not delay.'
                      )}
                      {state.urgencyType === 'court-date' && (
                        'Make sure you attend or seek legal representation before this date.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {URGENCY_OPTIONS.map((option) => (
                <div key={option.value}>
                  <button
                    onClick={() => setState(prev => ({ ...prev, urgencyType: option.value }))}
                    className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                      state.urgencyType === option.value ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{option.label}</div>
                  </button>
                  {state.urgencyType === option.value && option.requiresDate && (
                    <div className="mt-3 ml-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        {option.dateLabel} <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={option.value === 'court-date' ? state.courtDate : state.urgencyDate}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          [option.value === 'court-date' ? 'courtDate' : 'urgencyDate']: e.target.value
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setState(prev => ({ ...prev, urgencyType: 'none', urgencyDate: '', courtDate: '' }))}
                className={`w-full text-left p-4 border-2 rounded-lg transition-colors ${
                  state.urgencyType === 'none' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-900">No deadlines yet</div>
                <div className="text-sm text-gray-600">I haven't received any legal documents or court dates</div>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Amount at stake (Optional)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  value={state.amount}
                  onChange={(e) => setState(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">This helps determine which court has jurisdiction over your matter</p>
            </div>
          </div>
        )}

        {/* Step 5: Tell Your Story */}
        {state.currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us your story</h2>
              <p className="text-gray-600">Provide the details of your situation so we can give you the best guidance.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Background <span className="text-red-600">*</span>
              </label>
              <textarea
                value={state.backstory}
                onChange={(e) => setState(prev => ({ ...prev, backstory: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[200px]"
                placeholder={contextPrompt}
              />
              <p className="text-xs text-gray-500 mt-2">Include dates, amounts, agreements, and what you've tried so far.</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button onClick={handlePrev} disabled={state.currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {state.currentStep < totalSteps ? (
            <button onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span>Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <span>Get Guidance</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
