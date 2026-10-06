import React from 'react';
import { FileCheck2, FileText, Globe } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/translations';

interface HeaderProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onLoadSamplePdfs: () => void;
  onAutoMatchDemo: () => void;
  hasUploadedFiles: boolean;
}

export function Header({
  language,
  onToggleLanguage,
  onLoadSamplePdfs,
  onAutoMatchDemo,
  hasUploadedFiles,
}: HeaderProps) {
  const t = UI_TEXT[language];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => e.preventDefault()}
        className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
      >
        {t.appTitle}
      </a>

      {/* Zone 2: Quick Demo / Workflow Actions */}
      <nav
        aria-label="Quick testing utilities"
        className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-600"
      >
        <button
          type="button"
          onClick={onLoadSamplePdfs}
          className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.loadSamplePdfs}</span>
        </button>

        {hasUploadedFiles && (
          <button
            type="button"
            onClick={onAutoMatchDemo}
            className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 transition-colors whitespace-nowrap"
          >
            <FileCheck2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.autoMatchBtn}</span>
          </button>
        )}
      </nav>

      {/* Zone 3: Bilingual Switcher Toggle (EN / BN) */}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Language switcher"
          className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={() => onToggleLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              language === 'en'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onToggleLanguage('bn')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              language === 'bn'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            বাংলা (BN)
          </button>
        </div>
      </div>
    </header>
  );
}
