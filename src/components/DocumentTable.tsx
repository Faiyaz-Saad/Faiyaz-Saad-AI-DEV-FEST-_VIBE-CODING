import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, CheckCheck, Layers, Unlink } from 'lucide-react';
import {
  ComputedDocumentStatus,
  DocumentMatchState,
  DocumentStatusType,
  Language,
  RequiredDocument,
  UploadedPdfFile,
} from '../types';
import { UI_TEXT } from '../i18n/translations';
import { StatusBadge } from './StatusBadge';

interface DocumentTableProps {
  documents: RequiredDocument[];
  matches: Record<string, DocumentMatchState>;
  statuses: Record<string, ComputedDocumentStatus>;
  uploadedFiles: UploadedPdfFile[];
  duplicateHashes: Set<string>;
  submissionDeadline: string;
  language: Language;
  onMatchFile: (docId: string, fileId: string | null) => void;
  onChangeExpiryDate: (docId: string, expiryDate: string) => void;
  onAutoMatchAll: () => void;
}

type SlotFilterMode = 'all' | 'blocking' | 'ok' | 'mandatory';

function addYearsToIsoDate(isoDate: string, yearsDelta: number): string {
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return isoDate;
  const year = parts[0] + yearsDelta;
  const month = String(parts[1]).padStart(2, '0');
  const day = String(parts[2]).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DocumentTable({
  documents,
  matches,
  statuses,
  uploadedFiles,
  duplicateHashes,
  submissionDeadline,
  language,
  onMatchFile,
  onChangeExpiryDate,
  onAutoMatchAll,
}: DocumentTableProps) {
  const t = UI_TEXT[language];
  const [filterMode, setFilterMode] = useState<SlotFilterMode>('all');

  // Track which fileIds and which SHA-256 hashes are already matched to a slot
  const assignedFileIdToDocId = new Map<string, string>();
  const assignedHashToDocId = new Map<string, string>();

  Object.entries(matches).forEach(([dId, m]) => {
    if (m.fileId) {
      assignedFileIdToDocId.set(m.fileId, dId);
      const f = uploadedFiles.find((uf) => uf.id === m.fileId);
      if (f) {
        assignedHashToDocId.set(f.sha256, dId);
      }
    }
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const st = statuses[doc.id];
      if (filterMode === 'blocking') return Boolean(st?.isBlocking);
      if (filterMode === 'ok') return st?.status === DocumentStatusType.OK;
      if (filterMode === 'mandatory') return doc.mandatory;
      return true;
    });
  }, [documents, statuses, filterMode]);

  // Calculate live page map sequence (Page 1 Cover + ordered matched files)
  const pageSequenceSegments = useMemo(() => {
    const segments: {
      id: string;
      label: string;
      pageRange: string;
      pages: number;
      isCover?: boolean;
    }[] = [
      {
        id: 'cover-page',
        label: t.coverPageLabel,
        pageRange: 'P. 1',
        pages: 1,
        isCover: true,
      },
    ];

    let currentPageCursor = 2;
    documents.forEach((doc) => {
      const fileId = matches[doc.id]?.fileId;
      if (!fileId) return;
      const file = uploadedFiles.find((f) => f.id === fileId);
      if (!file) return;

      const startPage = currentPageCursor;
      const endPage = currentPageCursor + file.pageCount - 1;
      currentPageCursor = endPage + 1;

      segments.push({
        id: doc.id,
        label: `#${doc.order} ${language === 'bn' ? doc.title_bn : doc.title_en}`,
        pageRange: startPage === endPage ? `P. ${startPage}` : `P. ${startPage}–${endPage}`,
        pages: file.pageCount,
      });
    });

    return {
      segments,
      totalPages: currentPageCursor - 1,
    };
  }, [documents, matches, uploadedFiles, language, t.coverPageLabel]);

  const blockingCount = documents.filter((d) => statuses[d.id]?.isBlocking).length;
  const okCount = documents.filter(
    (d) => statuses[d.id]?.status === DocumentStatusType.OK
  ).length;
  const mandatoryCount = documents.filter((d) => d.mandatory).length;

  return (
    <section
      aria-label={t.requiredDocsTitle}
      className="dynamic-surface border border-indigo-400/25 rounded-xl overflow-hidden"
    >
      {/* Table Header & Dynamic Filter Bar */}
      <div className="px-6 py-4 border-b border-indigo-400/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-50">{t.requiredDocsTitle}</h2>
          <p className="text-xs text-slate-300 mt-0.5">{t.requiredDocsSubtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Interactive Segmented Filter Control */}
          <div
            role="group"
            aria-label="Filter required document slots"
            className="flex items-center gap-1 p-1 dynamic-subsurface border border-indigo-400/25 rounded-lg"
          >
            {(
              [
                { id: 'all', label: `${t.filterAll} (${documents.length})` },
                { id: 'blocking', label: `${t.filterBlocking} (${blockingCount})` },
                { id: 'ok', label: `${t.filterReady} (${okCount})` },
                { id: 'mandatory', label: `${t.filterMandatory} (${mandatoryCount})` },
              ] as { id: SlotFilterMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterMode(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterMode === tab.id
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={onAutoMatchAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-400/30 rounded-lg transition-colors whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>{t.autoMatchBtn}</span>
            </button>
          )}
        </div>
      </div>

      {/* Required Documents Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-indigo-400/20 dynamic-subsurface text-[11px] font-semibold text-cyan-200">
              <th className="py-3 px-4 w-16">{t.colOrder}</th>
              <th className="py-3 px-4 min-w-[220px]">{t.colDocName}</th>
              <th className="py-3 px-4 w-32">{t.colRequirement}</th>
              <th className="py-3 px-4 min-w-[260px]">{t.colMatchPdf}</th>
              <th className="py-3 px-4 min-w-[240px]">{t.colExpiryDate}</th>
              <th className="py-3 px-4 w-48">{t.colStatus}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-indigo-400/15 text-sm">
            <AnimatePresence initial={false}>
              {filteredDocuments.map((doc) => {
                const match = matches[doc.id];
                const matchedFileId = match?.fileId || '';
                const matchedFile = uploadedFiles.find((f) => f.id === matchedFileId);
                const computed = statuses[doc.id];

                const primaryTitle = language === 'bn' ? doc.title_bn : doc.title_en;
                const secondaryTitle = language === 'bn' ? doc.title_en : doc.title_bn;

                return (
                  <motion.tr
                    key={doc.id}
                    id={`doc-row-${doc.id}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className={`transition-colors align-middle ${
                      computed?.status === DocumentStatusType.OK
                        ? 'bg-emerald-950/25 hover:bg-emerald-900/30'
                        : computed?.isBlocking
                        ? 'hover:bg-indigo-950/40'
                        : 'hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Order */}
                    <td className="py-3.5 px-4 font-mono text-xs font-semibold text-cyan-300 tabular-nums whitespace-nowrap">
                      #{doc.order}
                    </td>

                    {/* Document Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-50 leading-snug">
                        {primaryTitle}
                      </div>
                      {secondaryTitle && secondaryTitle !== primaryTitle && (
                        <div className="text-xs text-slate-400 mt-0.5">{secondaryTitle}</div>
                      )}
                    </td>

                    {/* Mandatory vs Optional (Zero-Pill Unboxed Text) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {doc.mandatory ? (
                        <span className="font-semibold text-cyan-200">
                          {t.mandatoryLabel}
                        </span>
                      ) : (
                        <span className="text-slate-400">{t.optionalLabel}</span>
                      )}
                    </td>

                    {/* File Match Dropdown + Unmatch Button */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`match-select-${doc.id}`} className="sr-only">
                          {t.colMatchPdf} — {primaryTitle}
                        </label>
                        <select
                          id={`match-select-${doc.id}`}
                          value={matchedFileId}
                          onChange={(e) =>
                            onMatchFile(doc.id, e.target.value ? e.target.value : null)
                          }
                          className="flex-1 min-w-[180px] px-2.5 py-1.5 text-xs font-medium text-slate-100 dynamic-control border border-indigo-400/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                        >
                          <option value="" className="bg-slate-900 text-slate-200">
                            {t.selectPdfPlaceholder}
                          </option>
                          {uploadedFiles.map((file) => {
                            const assignedDocId = assignedFileIdToDocId.get(file.id);
                            const hashOwnerDocId = assignedHashToDocId.get(file.sha256);
                            const isDuplicate = duplicateHashes.has(file.sha256);

                            const isAssignedElsewhere =
                              (assignedDocId !== undefined && assignedDocId !== doc.id) ||
                              (hashOwnerDocId !== undefined && hashOwnerDocId !== doc.id);

                            return (
                              <option
                                key={file.id}
                                value={file.id}
                                disabled={isAssignedElsewhere}
                                className="bg-slate-900 text-slate-100"
                              >
                                {file.name} ({file.pageCount}p)
                                {isDuplicate ? ' [DUPLICATE SHA-256]' : ''}
                                {isAssignedElsewhere ? ' — Already Matched' : ''}
                              </option>
                            );
                          })}
                        </select>

                        {matchedFile && (
                          <button
                            type="button"
                            onClick={() => onMatchFile(doc.id, null)}
                            title={t.unmatchAction}
                            aria-label={`${t.unmatchAction} ${matchedFile.name}`}
                            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-950/60 rounded-lg transition-colors shrink-0"
                          >
                            <Unlink className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Expiry Date Picker + Interactive Date Presets */}
                    <td className="py-3.5 px-4">
                      {doc.has_expiry ? (
                        matchedFile ? (
                          <div className="space-y-1.5">
                            <div className="relative flex items-center">
                              <Calendar
                                className="w-3.5 h-3.5 text-cyan-400 absolute left-2.5 pointer-events-none"
                                aria-hidden="true"
                              />
                              <label htmlFor={`expiry-date-${doc.id}`} className="sr-only">
                                {t.colExpiryDate} — {primaryTitle}
                              </label>
                              <input
                                id={`expiry-date-${doc.id}`}
                                type="date"
                                value={match?.expiryDate || ''}
                                onChange={(e) => onChangeExpiryDate(doc.id, e.target.value)}
                                className={`w-full pl-8 pr-2.5 py-1.5 text-xs font-mono tabular-nums rounded-lg border focus:outline-none focus:ring-2 ${
                                  !match?.expiryDate
                                    ? 'border-amber-400/70 bg-amber-950/50 text-amber-100 focus:ring-amber-400'
                                    : match.expiryDate < submissionDeadline
                                    ? 'border-rose-400/80 bg-rose-950/50 text-rose-100 focus:ring-rose-400'
                                    : 'border-indigo-400/35 dynamic-control text-slate-100 focus:ring-cyan-400'
                                }`}
                              />
                            </div>

                            {/* Quick One-Click Date Presets for Dynamic Testing */}
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeExpiryDate(doc.id, submissionDeadline)
                                }
                                className="text-cyan-300 hover:underline font-medium whitespace-nowrap"
                              >
                                {t.presetDeadline}
                              </button>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeExpiryDate(
                                    doc.id,
                                    addYearsToIsoDate(submissionDeadline, 1)
                                  )
                                }
                                className="text-emerald-300 hover:underline font-medium whitespace-nowrap"
                              >
                                {t.presetNextYear}
                              </button>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onChangeExpiryDate(
                                    doc.id,
                                    addYearsToIsoDate(submissionDeadline, -1)
                                  )
                                }
                                className="text-rose-300 hover:underline font-medium whitespace-nowrap"
                              >
                                {t.presetExpiredTest}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            {language === 'en'
                              ? 'Match PDF to enter expiry'
                              : 'মেয়াদ দিতে আগে PDF যুক্ত করুন'}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">{t.noExpiryRequired}</span>
                      )}
                    </td>

                    {/* Real-time Validation Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {computed && (
                        <StatusBadge status={computed.status} language={language} />
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Live Merged PDF Page Sequence Preview Strip */}
      <div className="px-6 py-4 dynamic-subsurface border-t border-indigo-400/20 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-cyan-200">
            <Layers className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>{t.livePageMapTitle}</span>
          </div>
          <span className="font-mono text-slate-300 tabular-nums">
            Total Output: {pageSequenceSegments.totalPages}{' '}
            {pageSequenceSegments.totalPages === 1 ? 'page' : t.pagesUnit}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence initial={false}>
            {pageSequenceSegments.segments.map((seg) => (
              <motion.div
                key={seg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                  seg.isCover
                    ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-100 border-cyan-400/40'
                    : 'dynamic-control text-slate-100 border-indigo-400/30'
                }`}
              >
                <span className="font-mono font-semibold text-cyan-300 tabular-nums">
                  {seg.pageRange}
                </span>
                <span aria-hidden="true" className="opacity-40">
                  |
                </span>
                <span className="truncate max-w-[180px]">{seg.label}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
