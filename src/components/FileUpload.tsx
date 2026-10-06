import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Check,
  Copy,
  CopyPlus,
  FileText,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  DocumentMatchState,
  Language,
  RequiredDocument,
  UploadedPdfFile,
} from '../types';
import { UI_TEXT } from '../i18n/translations';

export const MAX_PDF_FILES = 30;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024; // 50 MB

interface FileUploadProps {
  uploadedFiles: UploadedPdfFile[];
  duplicateHashes: Set<string>;
  matches: Record<string, DocumentMatchState>;
  documents: RequiredDocument[];
  language: Language;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearAllFiles: () => void;
  onCreateDuplicateTestFile: () => void;
  onLoadSamplePdfs: () => void;
}

export function FileUpload({
  uploadedFiles,
  duplicateHashes,
  matches,
  documents,
  language,
  onAddFiles,
  onRemoveFile,
  onClearAllFiles,
  onCreateDuplicateTestFile,
  onLoadSamplePdfs,
}: FileUploadProps) {
  const t = UI_TEXT[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  const totalSizeBytes = uploadedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalSizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const fileCountRatio = Math.min(1, uploadedFiles.length / MAX_PDF_FILES);
  const sizeRatio = Math.min(1, totalSizeBytes / MAX_TOTAL_BYTES);

  // Reverse lookup: fileId -> matched document
  const fileIdToDoc = new Map<string, RequiredDocument>();
  Object.entries(matches).forEach(([docId, m]) => {
    if (m.fileId) {
      const doc = documents.find((d) => d.id === docId);
      if (doc) fileIdToDoc.set(m.fileId, doc);
    }
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files);
    }
  };

  const handleCopyHash = (fileId: string, sha256: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sha256).catch(() => {});
    }
    setCopiedHashId(fileId);
    setTimeout(() => {
      setCopiedHashId((prev) => (prev === fileId ? null : prev));
    }, 1800);
  };

  return (
    <section
      aria-label={t.uploadPdfSectionTitle}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      {/* Section Header & Quick Utilities */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-base font-bold text-slate-900">{t.uploadPdfSectionTitle}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{t.uploadPdfDropzoneHint}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onLoadSamplePdfs}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.loadSamplePdfs}</span>
          </button>

          {uploadedFiles.length > 0 && (
            <>
              <button
                type="button"
                onClick={onCreateDuplicateTestFile}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <CopyPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.addDuplicateDemoBtn}</span>
              </button>

              <button
                type="button"
                onClick={onClearAllFiles}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.clearAllFilesBtn}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Capacity Meters: Max 30 Files & Max 50 MB (Compositor scaleX animation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{t.filesCountLabel}</span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {uploadedFiles.length} / {MAX_PDF_FILES} PDFs
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={false}
              animate={{ scaleX: Math.max(0.01, fileCountRatio) }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className={`h-full w-full ${
                uploadedFiles.length >= MAX_PDF_FILES ? 'bg-red-600' : 'bg-blue-600'
              }`}
            />
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">{t.totalSizeLabel}</span>
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {totalSizeMb} MB / 50.00 MB
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={false}
              animate={{ scaleX: Math.max(0.01, sizeRatio) }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className={`h-full w-full ${
                totalSizeBytes >= MAX_TOTAL_BYTES ? 'bg-red-600' : 'bg-emerald-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Multi-PDF Dropzone with Subtle Scale Feedback */}
      <motion.div
        animate={{ scale: isDragging ? 1.01 : 1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50/50'
            : 'border-slate-300 bg-slate-50/50 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          id="pdf-multi-upload-input"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
          className="sr-only"
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <UploadCloud className="w-7 h-7 text-blue-600" aria-hidden="true" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm font-semibold text-blue-700 hover:underline focus:outline-none"
          >
            {t.uploadPdfDropzoneTitle}
          </button>
          <p className="text-xs text-slate-500">{t.uploadPdfDropzoneHint}</p>
        </div>
      </motion.div>

      {/* Duplicate SHA-256 Warning Alert */}
      <AnimatePresence initial={false}>
        {duplicateHashes.size > 0 && (
          <motion.div
            key="duplicate-alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="alert"
            className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950"
          >
            <AlertTriangle
              className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <div className="font-semibold">{t.duplicateDetectedBanner}</div>
              <div className="font-mono text-[11px] text-amber-800">
                Duplicate SHA-256:{' '}
                {Array.from(duplicateHashes)
                  .map((h) => `${h.slice(0, 16)}...`)
                  .join(', ')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Uploaded Files Table */}
      {uploadedFiles.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500 border border-slate-200 rounded-lg bg-slate-50/40">
          {t.noFilesUploadedYet}
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-600">
                <th className="py-2.5 px-4">PDF File Name</th>
                <th className="py-2.5 px-4 text-right">Pages</th>
                <th className="py-2.5 px-4 text-right">Size</th>
                <th className="py-2.5 px-4">SHA-256 Hash & Duplicate Check</th>
                <th className="py-2.5 px-4">Slot Assignment</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              <AnimatePresence initial={false}>
                {uploadedFiles.map((file) => {
                  const isDuplicate = duplicateHashes.has(file.sha256);
                  const matchedDoc = fileIdToDoc.get(file.id);
                  const sizeKb = (file.sizeBytes / 1024).toFixed(1);
                  const isCopied = copiedHashId === file.id;

                  return (
                    <motion.tr
                      key={file.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className={`transition-colors ${
                        isDuplicate
                          ? 'bg-amber-50/60 hover:bg-amber-50'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 shrink-0 ${
                              isDuplicate ? 'text-amber-600' : 'text-blue-600'
                            }`}
                            aria-hidden="true"
                          />
                          <span className="truncate max-w-[240px]">{file.name}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        {file.pageCount} {t.pagesUnit}
                      </td>

                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {sizeKb} KB
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isDuplicate ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-800">
                              <AlertTriangle
                                className="w-3.5 h-3.5 text-amber-600 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{t.duplicateFileTag}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <ShieldCheck
                                className="w-3.5 h-3.5 text-emerald-600 shrink-0"
                                aria-hidden="true"
                              />
                              <span>{t.uniqueFileTag}</span>
                            </span>
                          )}
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(file.id, file.sha256)}
                            title="Copy full SHA-256 hash"
                            className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-500 hover:text-slate-900 tabular-nums"
                          >
                            <span>
                              {isCopied
                                ? t.copyHashSuccess
                                : `${file.sha256.slice(0, 12)}…${file.sha256.slice(-6)}`}
                            </span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 whitespace-nowrap">
                        {matchedDoc ? (
                          <span className="font-medium text-blue-700">
                            {t.assignedToLabel} #{matchedDoc.order}{' '}
                            {language === 'bn'
                              ? matchedDoc.title_bn
                              : matchedDoc.title_en}
                          </span>
                        ) : (
                          <span className="text-slate-400">{t.unassignedLabel}</span>
                        )}
                      </td>

                      <td className="py-2.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onRemoveFile(file.id)}
                          aria-label={`${t.removeFileAria} ${file.name}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
