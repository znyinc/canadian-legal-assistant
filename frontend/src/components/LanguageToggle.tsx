import { useTranslation } from 'react-i18next';

export function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const setLanguage = (lang: 'en' | 'fr') => {
    void i18n.changeLanguage(lang);
  };

  const active = i18n.language === 'fr' ? 'fr' : 'en';

  return (
    <div className="flex items-center gap-2" aria-label={t('language.label')}>
      <span className="text-sm text-gray-600">{t('language.label')}:</span>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded text-sm border ${active === 'en' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
      >
        {t('language.en')}
      </button>
      <button
        type="button"
        onClick={() => setLanguage('fr')}
        className={`px-2 py-1 rounded text-sm border ${active === 'fr' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
      >
        {t('language.fr')}
      </button>
    </div>
  );
}
