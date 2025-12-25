import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import NewMatterPage from './pages/NewMatterPage';
import MatterDetailPage from './pages/MatterDetailPage';
import { CaseLawPage } from './pages/CaseLawPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-gray-900">
                Canadian Legal Assistant
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link to="/" className="text-gray-700 hover:text-gray-900">
                  Matters
                </Link>
                <Link to="/matters/new" className="text-gray-700 hover:text-gray-900">
                  New Matter
                </Link>
                <Link to="/caselaw" className="text-gray-700 hover:text-gray-900">
                  Case Law
                </Link>
                <Link to="/settings" className="text-gray-700 hover:text-gray-900">
                  Settings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Legal Information Only:</strong> This system provides legal information, not legal advice. 
            Consider consulting a licensed lawyer for complex matters.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matters/new" element={<NewMatterPage />} />
          <Route path="/matters/:id/*" element={<MatterDetailPage />} />
          <Route path="/caselaw" element={<CaseLawPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
