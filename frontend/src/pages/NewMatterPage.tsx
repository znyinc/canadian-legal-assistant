import { useState } from 'react';
import IntakeWizard from '../components/IntakeWizard';

export default function NewMatterPage() {
  const [province] = useState('ON'); // Default to Ontario

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell Us Your Story</h1>
        <p className="text-lg text-gray-600">
          We'll guide you through some questions to understand your situation better.
        </p>
      </div>

      <IntakeWizard province={province} />
    </div>
  );
}
