import React, { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, FileCheck, Plus, Trash2 } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  evidence?: string[];
  notes?: string;
  validationRules?: {
    minItemsRequired?: number;
    fileTypesAllowed?: string[];
    maxFileSize?: number;
  };
}

export interface InteractiveChecklistProps {
  items: ChecklistItem[];
  onItemToggle?: (itemId: string) => void;
  onItemUpdate?: (itemId: string, updates: Partial<ChecklistItem>) => void;
  onAddItem?: (item: ChecklistItem) => void;
  onRemoveItem?: (itemId: string) => void;
  title?: string;
  showProgress?: boolean;
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Evidence': 'bg-blue-50 border-blue-200',
    'Documentation': 'bg-green-50 border-green-200',
    'Financial': 'bg-purple-50 border-purple-200',
    'Timeline': 'bg-orange-50 border-orange-200',
    'Witnesses': 'bg-pink-50 border-pink-200',
    'Legal': 'bg-red-50 border-red-200',
  };
  return colors[category] || 'bg-gray-50 border-gray-200';
};

/**
 * InteractiveChecklist Component
 * Dynamic task tracking with evidence validation and completion progress
 * Features: Category grouping, evidence collection, validation rules, notes, progress visualization
 */
export const InteractiveChecklist: React.FC<InteractiveChecklistProps> = ({
  items,
  onItemToggle,
  onItemUpdate,
  onAddItem,
  onRemoveItem,
  title = 'Action Items',
  showProgress = true,
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // Calculate progress
  const totalItems = items.length;
  const completedItems = items.filter((item) => item.completed).length;
  const requiredItems = items.filter((item) => item.required);
  const completedRequired = requiredItems.filter((item) => item.completed);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const handleAddItem = () => {
    if (newItemText.trim() && onAddItem) {
      const newItem: ChecklistItem = {
        id: `item-${Date.now()}`,
        category: 'Custom',
        title: newItemText,
        description: '',
        required: false,
        completed: false,
      };
      onAddItem(newItem);
      setNewItemText('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <span className="text-sm font-medium text-gray-600">
            {completedRequired.length} of {requiredItems.length} required ✓
          </span>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Overall Progress</span>
              <span className="text-xs font-bold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist Items */}
      <div className="divide-y divide-gray-200">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            {/* Category Header */}
            <div className={`px-6 py-3 border-l-4 border-blue-400 ${getCategoryColor(category)}`}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{category}</h4>
                <span className="text-xs text-gray-600">
                  {categoryItems.filter((i) => i.completed).length}/{categoryItems.length}
                </span>
              </div>
            </div>

            {/* Category Items */}
            {categoryItems.map((item) => (
              <div key={item.id} className="border-b border-gray-100 last:border-b-0">
                {/* Item Row */}
                <div
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    item.completed ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => onItemToggle?.(item.id)}
                      className="mt-1 flex-shrink-0 focus:outline-none"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-400" />
                      )}
                    </button>

                    {/* Item Content */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() =>
                          setExpandedItem(expandedItem === item.id ? null : item.id)
                        }
                        className="text-left w-full hover:bg-gray-100 -mx-2 px-2 py-1 rounded"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h5
                            className={`font-semibold ${
                              item.completed
                                ? 'line-through text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {item.title}
                          </h5>
                          {item.required && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600">{item.description}</p>
                        )}
                      </button>

                      {/* Expanded Content */}
                      {expandedItem === item.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          {/* Evidence Section */}
                          {item.evidence && item.evidence.length > 0 && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <FileCheck className="w-4 h-4" />
                                Evidence Collected
                              </h6>
                              <ul className="space-y-1">
                                {item.evidence.map((file, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    {file}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Validation Rules */}
                          {item.validationRules && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                Requirements
                              </h6>
                              <ul className="space-y-1 text-sm text-gray-600">
                                {item.validationRules.minItemsRequired && (
                                  <li>• Minimum items required: {item.validationRules.minItemsRequired}</li>
                                )}
                                {item.validationRules.fileTypesAllowed && (
                                  <li>• Allowed files: {item.validationRules.fileTypesAllowed.join(', ')}</li>
                                )}
                                {item.validationRules.maxFileSize && (
                                  <li>• Max file size: {(item.validationRules.maxFileSize / 1024 / 1024).toFixed(0)} MB</li>
                                )}
                              </ul>
                            </div>
                          )}

                          {/* Notes */}
                          {item.notes && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-900 mb-2">Notes</h6>
                              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{item.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {expandedItem === item.id && onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Custom Item
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                } else if (e.key === 'Escape') {
                  setShowAddForm(false);
                  setNewItemText('');
                }
              }}
              placeholder="Add a new item..."
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewItemText('');
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Completion Message */}
      {completedItems === totalItems && totalItems > 0 && (
        <div className="px-6 py-4 bg-green-50 border-t border-green-200">
          <p className="text-sm font-medium text-green-800">
            ✓ All items completed! You're ready to proceed.
          </p>
        </div>
      )}
    </div>
  );
};
