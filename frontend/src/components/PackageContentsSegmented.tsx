import React, { useState } from 'react';
import { ChevronDown, Download, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { safeText } from '../utils/sanitize';

interface FileItem {
  path?: string;
  filename?: string;
  category?: string;
  description?: string;
}

interface PackageContentsSegmentedProps {
  files: FileItem[];
  onDownloadEssentials: () => void;
  onDownloadEverything: () => void;
  isDownloading: boolean;
}

type ContentCategory = 'essential' | 'helpful' | 'reference';

interface CategorizedFile {
  category: ContentCategory;
  filename: string;
  description: string;
}

const CATEGORY_CONFIG: Record<ContentCategory, { icon: React.ReactNode; color: string; label: string; explanation: string }> = {
  essential: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    label: 'What You Need',
    explanation: 'Legal documents and forms you\'ll use immediately to resolve your matter.',
  },
  helpful: {
    icon: <HelpCircle className="w-5 h-5" />,
    color: 'text-blue-600',
    label: 'Helpful Context',
    explanation: 'Supporting information to guide your next steps and understand your situation better.',
  },
  reference: {
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'text-gray-600',
    label: 'Reference Materials',
    explanation: 'Template backups and additional resources for offline access (optional).',
  },
};

/**
 * Categorizes files into Essential, Helpful, and Reference sections
 * with clear explanations and selective download options
 */
export const PackageContentsSegmented: React.FC<PackageContentsSegmentedProps> = ({
  files,
  onDownloadEssentials,
  onDownloadEverything,
  isDownloading,
}) => {
  const [expandedCategory, setExpandedCategory] = useState<ContentCategory>('essential');

  // Categorize files based on path/name patterns
  const categorizeFile = (file: FileItem): CategorizedFile => {
    const filename = safeText(file.path || file.filename || 'Document');
    
    // Essential: drafts folder
    if (filename.includes('drafts/')) {
      return {
        category: 'essential',
        filename: filename.replace('drafts/', ''),
        description: 'Legal document for your matter',
      };
    }

    // Helpful: timeline, forum map, missing evidence, form summaries
    if (filename.includes('timeline.md')) {
      return {
        category: 'helpful',
        filename: 'timeline.md',
        description: 'Chronological timeline of your case events and deadlines',
      };
    }

    if (filename.includes('form_summaries/')) {
      return {
        category: 'helpful',
        filename: filename.replace('form_summaries/', ''),
        description: 'Visual mapping table and filing guide for official forms',
      };
    }

    if (filename.includes('forum_map.md')) {
      return {
        category: 'helpful',
        filename: 'forum_map.md',
        description: 'Where to file and which courts/tribunals handle your matter',
      };
    }

    if (filename.includes('missing_evidence.md')) {
      return {
        category: 'helpful',
        filename: 'missing_evidence.md',
        description: 'Evidence checklist and guidance on what you still need to gather',
      };
    }

    if (filename.includes('evidence_manifest')) {
      return {
        category: 'helpful',
        filename: 'evidence_manifest.json',
        description: 'Detailed index of your uploaded evidence and metadata',
      };
    }

    // Reference: templates and backups
    if (filename.includes('templates/')) {
      return {
        category: 'reference',
        filename: filename.replace('templates/', '').replace(/\.md$/, ''),
        description: 'Reference template for offline use',
      };
    }

    if (filename.includes('manifest.json')) {
      return {
        category: 'reference',
        filename: 'manifest.json',
        description: 'Package metadata and file listing',
      };
    }

    // Default to reference
    return {
      category: 'reference',
      filename,
      description: 'Supporting document',
    };
  };

  // Group files by category
  const categorizedFiles = files.map(categorizeFile);
  const groupedByCategory: Record<ContentCategory, CategorizedFile[]> = {
    essential: categorizedFiles.filter((f) => f.category === 'essential'),
    helpful: categorizedFiles.filter((f) => f.category === 'helpful'),
    reference: categorizedFiles.filter((f) => f.category === 'reference'),
  };

  const renderCategory = (category: ContentCategory) => {
    const config = CATEGORY_CONFIG[category];
    const categoryFiles = groupedByCategory[category];

    if (categoryFiles.length === 0) return null;

    const isExpanded = expandedCategory === category;

    return (
      <div key={category} className="border rounded-lg overflow-hidden mb-4">
        {/* Category Header */}
        <button
          onClick={() => setExpandedCategory(isExpanded ? (null as any) : category)}
          className="w-full bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={config.color}>{config.icon}</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{config.label}</p>
              <p className="text-xs text-gray-600">{categoryFiles.length} file(s)</p>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Category Explanation & Content */}
        {isExpanded && (
          <div className="px-4 py-4 border-t space-y-4">
            {/* Explanation */}
            <div className="text-sm text-gray-700 bg-gray-50 rounded p-3">
              <p>{config.explanation}</p>
            </div>

            {/* File List */}
            <div className="space-y-2">
              {categoryFiles.map((file, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-900">{file.filename}</p>
                  <p className="text-gray-600 text-xs mt-1">{file.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Download Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900 mb-4">
          <strong>How to download:</strong> Choose between essentials only (smaller file) or everything for offline reference.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onDownloadEssentials}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download Essentials Only</span>
          </button>
          <button
            onClick={onDownloadEverything}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Download Everything</span>
          </button>
        </div>
      </div>

      {/* Package Contents */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Package Contents</h3>
        {renderCategory('essential')}
        {renderCategory('helpful')}
        {renderCategory('reference')}
      </div>

      {/* Legend */}
      <div className="text-xs text-gray-600 space-y-2 p-4 bg-gray-50 rounded-lg">
        <p>
          <strong>💡 Tip:</strong> Start with "Download Essentials Only" for a smaller, focused file. You can always download the full package later if you need reference materials.
        </p>
      </div>
    </div>
  );
};
