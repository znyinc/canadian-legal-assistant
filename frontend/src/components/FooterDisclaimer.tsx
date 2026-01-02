import { Info } from 'lucide-react';

export function FooterDisclaimer() {
  return (
    <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 py-3 px-4 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p>
            This is <strong>legal information</strong>, not legal advice. Consult a lawyer for your specific situation.
          </p>
        </div>
        <a
          href="/disclaimer"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
        >
          Learn more
        </a>
      </div>
    </div>
  );
}
