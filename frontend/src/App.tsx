import { Routes, Route, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import ConversationalGuidancePage from './pages/ConversationalGuidancePage';
import MatterDetailPage from './pages/MatterDetailPage';
import { CaseLawPage } from './pages/CaseLawPage';
import { SettingsPage } from './pages/SettingsPage';
import { LanguageToggle } from './components/LanguageToggle';

export default function App() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center text-xl font-bold text-gray-900">
                {t('app.title')}
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link to="/" className="text-gray-700 hover:text-gray-900">
                  {t('app.nav.matters')}
                </Link>
                <Link to="/matters/new" className="text-gray-700 hover:text-gray-900">
                  {t('app.nav.newMatter')}
                </Link>
                <Link to="/caselaw" className="text-gray-700 hover:text-gray-900">
                  {t('app.nav.caseLaw')}
                </Link>
                <Link to="/settings" className="text-gray-700 hover:text-gray-900">
                  {t('app.nav.settings')}
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Disclaimer Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ {t('app.disclaimer.title')}</strong> {t('app.disclaimer.body')}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matters/new" element={<ConversationalGuidancePage onBack={() => window.history.back()} />} />
          <Route path="/matters/:id/*" element={<MatterDetailPage />} />
          <Route path="/caselaw" element={<CaseLawPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}
