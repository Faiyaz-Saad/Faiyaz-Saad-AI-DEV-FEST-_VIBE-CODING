import React from 'react';
import { FileCheck2, FileText, Globe, Palette } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/translations';
import { BgThemeId } from './AnimatedBackground';

interface HeaderProps {
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  onLoadSamplePdfs: () => void;
  onAutoMatchDemo: () => void;
  hasUploadedFiles: boolean;
  bgTheme: BgThemeId;
  onCycleBgTheme: () => void;
}

const THEME_LABELS: Record<BgThemeId, string> = {
  aurora: 'Aurora Wave',
  nebula: 'Cosmic Nebula',
  emerald: 'Emerald Matrix',
  sunset: 'Sunset Pulse',
};

export function Header({
  language,
  onToggleLanguage,
  onLoadSamplePdfs,
  onAutoMatchDemo,
  hasUploadedFiles,
  bgTheme,
  onCycleBgTheme,
}: HeaderProps) {
  const t = UI_TEXT[language];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 dynamic-header-bar border-b border-indigo-400/25">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => e.preventDefault()}
        className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-200 via-indigo-200 to-emerald-200 bg-clip-text text-transparent whitespace-nowrap"
      >
        {t.appTitle}
      </a>

      {/* Zone 2: Quick Demo & Background Theme Switcher Links */}
      <nav
        aria-label="Quick testing utilities"
        className="hidden md:flex items-center gap-5 text-xs font-medium text-slate-200"
      >
        <button
          type="button"
          onClick={onLoadSamplePdfs}
          className="inline-flex items-center gap-1.5 hover:text-cyan-300 transition-colors whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>{t.loadSamplePdfs}</span>
        </button>

        {hasUploadedFiles && (
          <button
            type="button"
            onClick={onAutoMatchDemo}
            className="inline-flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 transition-colors whitespace-nowrap"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>{t.autoMatchBtn}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCycleBgTheme}
          className="inline-flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors whitespace-nowrap"
        >
          <Palette className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
          <span>Theme: {THEME_LABELS[bgTheme]}</span>
        </button>
      </nav>

      {/* Zone 3: Bilingual Switcher Toggle (EN / BN) */}
      <div className="flex items-center gap-2">
        <div
          role="group"
          aria-label="Language switcher"
          className="flex items-center gap-1 p-1 dynamic-subsurface border border-indigo-400/25 rounded-lg"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-300 ml-1.5 mr-0.5" aria-hidden="true" />
          <button
            type="button"
            onClick={() => onToggleLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              language === 'en'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => onToggleLanguage('bn')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              language === 'bn'
                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            বাংলা (BN)
          </button>
        </div>
      </div>
    </header>
  );
}
