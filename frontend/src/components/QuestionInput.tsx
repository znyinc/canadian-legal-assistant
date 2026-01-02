import React, { useState } from 'react';
// TODO: Remove this component - no longer needed after IntakeWizard simplification
// import { Question } from '../../core/intake/QuestionnaireLibrary';
import { safeText } from '../utils/sanitize';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'yes-no' | 'currency' | 'multi-select';
  label: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: Array<{ value: any; label: string; }>;
}

interface QuestionInputProps {
  question: Question;
  value: any;
  onChange: (value: any, label?: string) => void;
  error?: string;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({ question, value, onChange, error }) => {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => setTouched(true);

  const commonClasses = 'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none';
  const errorClasses = error && touched ? 'border-red-500' : 'border-gray-300';

  switch (question.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            className={`${commonClasses} ${errorClasses}`}
            aria-required={question.required}
            aria-invalid={!!error && touched}
          />
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={question.placeholder}
            rows={4}
            className={`${commonClasses} ${errorClasses}`}
            aria-required={question.required}
            aria-invalid={!!error && touched}
          />
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'date':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            className={`${commonClasses} ${errorClasses}`}
            aria-required={question.required}
            aria-invalid={!!error && touched}
          />
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'currency':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-600">$</span>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              onBlur={handleBlur}
              placeholder={question.placeholder}
              className={`${commonClasses} ${errorClasses} pl-8`}
              min="0"
              step="0.01"
              aria-required={question.required}
              aria-invalid={!!error && touched}
            />
          </div>
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <select
            value={value || ''}
            onChange={(e) => {
              const selectedOption = question.options?.find((opt: { value: any; label: string }) => opt.value === e.target.value);
              onChange(e.target.value, selectedOption?.label);
            }}
            onBlur={handleBlur}
            className={`${commonClasses} ${errorClasses}`}
            aria-required={question.required}
            aria-invalid={!!error && touched}
          >
            <option value="">-- Select an option --</option>
            {question.options?.map((opt: { value: any; label: string }) => (
              <option key={opt.value} value={opt.value}>
                {safeText(opt.label)}
              </option>
            ))}
          </select>
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'multi-select':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <div className="space-y-2 border border-gray-300 rounded-lg p-3">
            {question.options?.map((opt: { value: any; label: string }) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">\n                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter((v) => v !== opt.value);
                    onChange(newValues);
                  }}
                  onBlur={handleBlur}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-800">{safeText(opt.label)}</span>
              </label>
            ))}
          </div>
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    case 'yes-no':
      return (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            {safeText(question.label)}
            {question.required && <span className="text-red-600 ml-1">*</span>}
          </label>
          {question.helpText && (
            <p className="text-xs text-gray-600">{safeText(question.helpText)}</p>
          )}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="yes"
                checked={value === 'yes'}
                onChange={(e) => onChange(e.target.value)}
                onBlur={handleBlur}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-required={question.required}
              />
              <span className="text-sm text-gray-800">Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value="no"
                checked={value === 'no'}
                onChange={(e) => onChange(e.target.value)}
                onBlur={handleBlur}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                aria-required={question.required}
              />
              <span className="text-sm text-gray-800">No</span>
            </label>
          </div>
          {error && touched && (
            <p className="text-sm text-red-600">{safeText(error)}</p>
          )}
        </div>
      );

    default:
      return null;
  }
};
