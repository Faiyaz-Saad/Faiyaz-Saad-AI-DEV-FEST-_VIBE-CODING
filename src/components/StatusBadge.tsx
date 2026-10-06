import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MinusCircle,
} from 'lucide-react';
import { DocumentStatusType, Language } from '../types';
import { UI_TEXT } from '../i18n/translations';

interface StatusBadgeProps {
  status: DocumentStatusType;
  language: Language;
}

const transitionSpec = {
  duration: 0.16,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export function StatusBadge({ status, language }: StatusBadgeProps) {
  const t = UI_TEXT[language];

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={`${status}-${language}`}
        initial={{ opacity: 0, scale: 0.96, y: 2 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -2 }}
        transition={transitionSpec}
        className="inline-flex items-center"
      >
        {status === DocumentStatusType.Missing && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 whitespace-nowrap">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{t.statusMissing}</span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span className="text-[11px] font-normal text-rose-400">{t.blockingTag}</span>
          </span>
        )}

        {status === DocumentStatusType.ExpiryDateNeeded && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>{t.statusExpiryNeeded}</span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span className="text-[11px] font-normal text-amber-400">{t.blockingTag}</span>
          </span>
        )}

        {status === DocumentStatusType.Expired && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
            <span>{t.statusExpired}</span>
            <span aria-hidden="true" className="text-slate-500">
              ·
            </span>
            <span className="text-[11px] font-normal text-rose-400">{t.blockingTag}</span>
          </span>
        )}

        {status === DocumentStatusType.NotProvided && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 whitespace-nowrap">
            <MinusCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
            <span>{t.statusNotProvided}</span>
          </span>
        )}

        {status === DocumentStatusType.OK && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t.statusOk}</span>
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
