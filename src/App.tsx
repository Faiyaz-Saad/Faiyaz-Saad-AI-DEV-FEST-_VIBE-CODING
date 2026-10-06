import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertOctagon,
  CheckCircle2,
  Download,
  X,
} from 'lucide-react';
import {
  ComputedDocumentStatus,
  DocumentMatchState,
  DocumentStatusType,
  Language,
  TenderRequirements,
  UploadedPdfFile,
} from './types';
import { SAMPLE_REQUIREMENTS_JSON, UI_TEXT } from './i18n/translations';
import {
  evaluateDocumentStatus,
  generateAndDownloadTenderPackage,
  generateSamplePdfFiles,
  processUploadedPdfFile,
} from './utils/pdfAndHashUtils';
import { Header } from './components/Header';
import { TenderInfo } from './components/TenderInfo';
import { DocumentTable } from './components/DocumentTable';
import {
  FileUpload,
  MAX_PDF_FILES,
  MAX_TOTAL_BYTES,
} from './components/FileUpload';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [requirements, setRequirements] = useState<TenderRequirements>(
    SAMPLE_REQUIREMENTS_JSON
  );
  const [uploadedFiles, setUploadedFiles] = useState<UploadedPdfFile[]>([]);
  const [matches, setMatches] = useState<Record<string, DocumentMatchState>>({});
  const [errorNotifications, setErrorNotifications] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const t = UI_TEXT[language];

  // Sort required documents ascending by `order`
  const sortedDocuments = useMemo(() => {
    return [...requirements.documents].sort((a, b) => a.order - b.order);
  }, [requirements.documents]);

  // Map uploaded files by ID for O(1) lookup
  const filesById = useMemo(() => {
    const map: Record<string, UploadedPdfFile> = {};
    uploadedFiles.forEach((f) => {
      map[f.id] = f;
    });
    return map;
  }, [uploadedFiles]);

  // SHA-256 Duplicate File Detection: find any hash shared by >= 2 uploaded files
  const duplicateHashes = useMemo(() => {
    const counts = new Map<string, number>();
    uploadedFiles.forEach((file) => {
      counts.set(file.sha256, (counts.get(file.sha256) || 0) + 1);
    });
    const dupes = new Set<string>();
    counts.forEach((count, hash) => {
      if (count >= 2) {
        dupes.add(hash);
      }
    });
    return dupes;
  }, [uploadedFiles]);

  // Real-time Document Status Engine (calculates EXACTLY ONE status per required document)
  const statuses = useMemo(() => {
    const result: Record<string, ComputedDocumentStatus> = {};
    sortedDocuments.forEach((doc) => {
      const match = matches[doc.id];
      const matchedFile = match?.fileId ? filesById[match.fileId] : undefined;
      result[doc.id] = evaluateDocumentStatus(
        doc,
        match,
        requirements.submission_deadline,
        matchedFile
      );
    });
    return result;
  }, [sortedDocuments, matches, filesById, requirements.submission_deadline]);

  // Collect all blocking reasons across required documents
  const blockingItems = useMemo(() => {
    const items: { docId: string; text: string }[] = [];
    sortedDocuments.forEach((doc) => {
      const st = statuses[doc.id];
      if (st?.isBlocking) {
        const msg = language === 'bn' ? st.reasonBn : st.reasonEn;
        if (msg) items.push({ docId: doc.id, text: msg });
      }
    });
    return items;
  }, [sortedDocuments, statuses, language]);

  // Dynamic Readiness Metrics
  const readinessMetrics = useMemo(() => {
    const mandatoryDocs = sortedDocuments.filter((d) => d.mandatory);
    const mandatoryOkCount = mandatoryDocs.filter(
      (d) => statuses[d.id]?.status === DocumentStatusType.OK
    ).length;
    const nonBlockingDocsCount = sortedDocuments.filter(
      (d) => !statuses[d.id]?.isBlocking
    ).length;

    const readinessPct =
      sortedDocuments.length > 0
        ? Math.round((nonBlockingDocsCount / sortedDocuments.length) * 100)
        : 100;

    let totalCompiledPages = 1; // Cover page
    sortedDocuments.forEach((doc) => {
      const fileId = matches[doc.id]?.fileId;
      const f = fileId ? filesById[fileId] : undefined;
      if (f) totalCompiledPages += f.pageCount;
    });

    return {
      readinessPct,
      mandatoryOkCount,
      mandatoryTotalCount: mandatoryDocs.length,
      totalCompiledPages,
    };
  }, [sortedDocuments, statuses, matches, filesById]);

  const pushError = (msg: string) => {
    setErrorNotifications((prev) => [msg, ...prev.slice(0, 4)]);
  };

  const handleUploadRequirementsJson = (newReqs: TenderRequirements) => {
    setRequirements(newReqs);
    setMatches({});
    setSuccessMessage(
      language === 'en'
        ? `Loaded requirements for Tender ${newReqs.tender_id} (${newReqs.documents.length} document slots).`
        : `টেন্ডার ${newReqs.tender_id}-এর রিকোয়ারমেন্টস সফলভাবে লোড হয়েছে (${newReqs.documents.length}টি দলিল)।`
    );
  };

  const handleUpdateRequirementsMeta = (updated: TenderRequirements) => {
    setRequirements(updated);
    setSuccessMessage(
      language === 'en'
        ? `Updated tender parameters (${updated.tender_id} · Deadline ${updated.submission_deadline}).`
        : `টেন্ডারের তথ্য হালনাগাদ করা হয়েছে (${updated.tender_id} · শেষ তারিখ ${updated.submission_deadline})।`
    );
  };

  const handleAddPdfFiles = async (incomingList: FileList | File[]) => {
    const filesArray = Array.from(incomingList);
    if (filesArray.length === 0) return;

    const newErrors: string[] = [];
    let currentCount = uploadedFiles.length;
    let currentTotalBytes = uploadedFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
    const newlyParsed: UploadedPdfFile[] = [];

    for (const file of filesArray) {
      const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
      const isPdfMime = file.type === 'application/pdf';

      if (!isPdfExtension && !isPdfMime) {
        newErrors.push(
          language === 'en'
            ? `Rejected "${file.name}": Only PDF files (.pdf) are allowed.`
            : `"${file.name}" বাতিল করা হয়েছে: শুধুমাত্র PDF ফাইল (.pdf) গ্রহণযোগ্য।`
        );
        continue;
      }

      if (currentCount + 1 > MAX_PDF_FILES) {
        newErrors.push(
          language === 'en'
            ? `Cannot add "${file.name}": Maximum limit of ${MAX_PDF_FILES} PDF files reached.`
            : `"${file.name}" যুক্ত করা যায়নি: সর্বোচ্চ ৩০টি PDF ফাইলের সীমা অতিক্রম করেছে।`
        );
        continue;
      }

      if (currentTotalBytes + file.size > MAX_TOTAL_BYTES) {
        newErrors.push(
          language === 'en'
            ? `Cannot add "${file.name}": Total package size would exceed the 50 MB limit.`
            : `"${file.name}" যুক্ত করা যায়নি: মোট ফাইলের আকার ৫০ মেগাবাইট সীমা অতিক্রম করবে।`
        );
        continue;
      }

      try {
        const parsedPdf = await processUploadedPdfFile(file);
        newlyParsed.push(parsedPdf);
        currentCount += 1;
        currentTotalBytes += file.size;
      } catch {
        newErrors.push(
          language === 'en'
            ? `Rejected "${file.name}": Corrupted or invalid PDF binary structure.`
            : `"${file.name}" বাতিল করা হয়েছে: ফাইলটি একটি বৈধ বা পাঠযোগ্য PDF নয়।`
        );
      }
    }

    if (newErrors.length > 0) {
      setErrorNotifications((prev) => [...newErrors, ...prev].slice(0, 6));
    }

    if (newlyParsed.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newlyParsed]);
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
    setMatches((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((docId) => {
        if (next[docId]?.fileId === fileId) {
          next[docId] = { ...next[docId], fileId: null };
        }
      });
      return next;
    });
  };

  const handleClearAllFiles = () => {
    setUploadedFiles([]);
    setMatches({});
  };

  const handleMatchFile = (docId: string, fileId: string | null) => {
    if (!fileId) {
      setMatches((prev) => ({
        ...prev,
        [docId]: {
          docId,
          fileId: null,
          expiryDate: prev[docId]?.expiryDate || '',
        },
      }));
      return;
    }

    const targetFile = filesById[fileId];
    if (!targetFile) return;

    const conflictingDocId = Object.keys(matches).find((otherDocId) => {
      if (otherDocId === docId) return false;
      const otherFileId = matches[otherDocId]?.fileId;
      if (!otherFileId) return false;
      if (otherFileId === fileId) return true;
      const otherFile = filesById[otherFileId];
      return Boolean(otherFile && otherFile.sha256 === targetFile.sha256);
    });

    if (conflictingDocId) {
      pushError(
        language === 'en'
          ? `Blocked: "${targetFile.name}" (or a duplicate with identical SHA-256 hash) is already matched to another document slot.`
          : `বাধাগ্রস্ত: "${targetFile.name}" (অথবা অভিন্ন SHA-256 হ্যাশযুক্ত ডুপ্লিকেট ফাইল) ইতিমধ্যে অন্য একটি দলিলে যুক্ত রয়েছে।`
      );
      return;
    }

    setMatches((prev) => ({
      ...prev,
      [docId]: {
        docId,
        fileId,
        expiryDate: prev[docId]?.expiryDate || '',
      },
    }));
  };

  const handleChangeExpiryDate = (docId: string, expiryDate: string) => {
    setMatches((prev) => ({
      ...prev,
      [docId]: {
        docId,
        fileId: prev[docId]?.fileId || null,
        expiryDate,
      },
    }));
  };

  const handleLoadSamplePdfs = async () => {
    try {
      const samplePdfs = await generateSamplePdfFiles();
      if (uploadedFiles.length + samplePdfs.length > MAX_PDF_FILES) {
        pushError('Maximum 30 PDF files limit reached.');
        return;
      }
      setUploadedFiles((prev) => [...prev, ...samplePdfs]);
      setSuccessMessage(
        language === 'en'
          ? `Generated and loaded ${samplePdfs.length} sample PDF files with real page counts and SHA-256 hashes.`
          : `${samplePdfs.length}টি নমুনা PDF ফাইল লোড করা হয়েছে।`
      );
    } catch {
      pushError('Failed to generate sample PDFs.');
    }
  };

  const handleCreateDuplicateTestFile = () => {
    if (uploadedFiles.length === 0) return;
    if (uploadedFiles.length + 1 > MAX_PDF_FILES) {
      pushError('Maximum 30 PDF files limit reached.');
      return;
    }
    const source = uploadedFiles[0];
    const clonedFile: UploadedPdfFile = {
      ...source,
      id: `dup-pdf-${Date.now()}`,
      name: `COPY_OF_${source.name}`,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setUploadedFiles((prev) => [clonedFile, ...prev]);
  };

  const handleAutoMatchAll = () => {
    const usedFileIds = new Set<string>();
    const usedHashes = new Set<string>();
    const nextMatches: Record<string, DocumentMatchState> = {};

    sortedDocuments.forEach((doc) => {
      const candidate = uploadedFiles.find(
        (f) => !usedFileIds.has(f.id) && !usedHashes.has(f.sha256)
      );
      if (candidate) {
        usedFileIds.add(candidate.id);
        usedHashes.add(candidate.sha256);
        nextMatches[doc.id] = {
          docId: doc.id,
          fileId: candidate.id,
          expiryDate: doc.has_expiry ? requirements.submission_deadline : '',
        };
      }
    });

    setMatches(nextMatches);
  };

  const handleGeneratePackage = async () => {
    if (blockingItems.length > 0 || isGenerating) return;
    setIsGenerating(true);
    try {
      await generateAndDownloadTenderPackage(
        requirements,
        sortedDocuments,
        matches,
        filesById
      );
      setSuccessMessage(
        language === 'en'
          ? `Successfully generated and downloaded ${requirements.tender_id}_Package.pdf`
          : `সফলভাবে ${requirements.tender_id}_Package.pdf তৈরি এবং ডাউনলোড সম্পন্ন হয়েছে।`
      );
    } catch {
      pushError(
        language === 'en'
          ? 'Failed to compile merged PDF package. Please verify all matched PDF files.'
          : 'PDF প্যাকেজ তৈরি করতে ত্রুটি ঘটেছে। অনুগ্রহ করে যুক্ত করা PDF ফাইলগুলো যাচাই করুন।'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const scrollToDocRow = (docId: string) => {
    const el = document.getElementById(`doc-row-${docId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col dynamic-app-canvas text-slate-50 relative overflow-x-hidden">
      {/* Ambient Animated Color Orbs (Compositor-only transform animations) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="orb-animate-a absolute -top-28 -left-24 w-96 h-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="orb-animate-b absolute top-1/3 -right-28 w-[28rem] h-[28rem] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="orb-animate-a absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* 1. Header with Bilingual Switcher (EN / BN) */}
      <Header
        language={language}
        onToggleLanguage={setLanguage}
        onLoadSamplePdfs={handleLoadSamplePdfs}
        onAutoMatchDemo={handleAutoMatchAll}
        hasUploadedFiles={uploadedFiles.length > 0}
      />

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6 pb-36">
        {/* Animated Error & Status Alerts */}
        <AnimatePresence initial={false}>
          {errorNotifications.length > 0 && (
            <motion.div
              key="error-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              role="alert"
              className="bg-rose-950/80 border border-rose-400/40 rounded-xl p-4 flex items-start justify-between gap-4 backdrop-blur-md"
            >
              <div className="space-y-1 text-xs text-rose-100">
                {errorNotifications.map((err, i) => (
                  <div key={i} className="font-medium">
                    • {err}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setErrorNotifications([])}
                aria-label="Dismiss error notifications"
                className="p-1 text-rose-300 hover:bg-rose-900/60 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              key="success-banner"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              role="status"
              className="bg-emerald-950/80 border border-emerald-400/40 rounded-xl px-4 py-3 flex items-center justify-between gap-4 text-xs text-emerald-100 backdrop-blur-md"
            >
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2
                  className="w-4 h-4 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                aria-label="Dismiss status message"
                className="p-1 text-emerald-300 hover:bg-emerald-900/60 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Top Panel: requirements.json Upload + Dynamic Tender Telemetry */}
        <TenderInfo
          requirements={requirements}
          language={language}
          onUploadJson={handleUploadRequirementsJson}
          onUpdateRequirementsMeta={handleUpdateRequirementsMeta}
          onValidationError={pushError}
          readinessPct={readinessMetrics.readinessPct}
          mandatoryOkCount={readinessMetrics.mandatoryOkCount}
          mandatoryTotalCount={readinessMetrics.mandatoryTotalCount}
          totalCompiledPages={readinessMetrics.totalCompiledPages}
        />

        {/* 3. Main Dashboard: Required Documents Table + Uploaded PDF Files & Duplicate Guard */}
        <DocumentTable
          documents={sortedDocuments}
          matches={matches}
          statuses={statuses}
          uploadedFiles={uploadedFiles}
          duplicateHashes={duplicateHashes}
          submissionDeadline={requirements.submission_deadline}
          language={language}
          onMatchFile={handleMatchFile}
          onChangeExpiryDate={handleChangeExpiryDate}
          onAutoMatchAll={handleAutoMatchAll}
        />

        <FileUpload
          uploadedFiles={uploadedFiles}
          duplicateHashes={duplicateHashes}
          matches={matches}
          documents={sortedDocuments}
          language={language}
          onAddFiles={handleAddPdfFiles}
          onRemoveFile={handleRemoveFile}
          onClearAllFiles={handleClearAllFiles}
          onCreateDuplicateTestFile={handleCreateDuplicateTestFile}
          onLoadSamplePdfs={handleLoadSamplePdfs}
        />
      </main>

      {/* 4. Bottom Action Bar: Animated Blocking Issues Banner + Generate Package Button */}
      <footer className="sticky bottom-0 z-20 dynamic-header-bar border-t border-indigo-400/25 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <AnimatePresence mode="wait" initial={false}>
            {blockingItems.length > 0 ? (
              <motion.div
                key="blocking-state"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3 text-xs text-rose-200"
              >
                <AlertOctagon
                  className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <div className="space-y-1">
                  <div className="font-bold text-rose-300">
                    {t.blockingIssuesHeader} ({blockingItems.length})
                  </div>
                  <ul className="space-y-0.5 text-rose-200/90 max-h-20 overflow-y-auto">
                    {blockingItems.map((item) => (
                      <li key={item.docId}>
                        <button
                          type="button"
                          onClick={() => scrollToDocRow(item.docId)}
                          className="text-left hover:text-cyan-300 hover:underline focus:outline-none"
                        >
                          • {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="ready-state"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3 text-xs text-emerald-200"
              >
                <CheckCircle2
                  className="w-5 h-5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <div className="font-bold text-emerald-300">
                    {t.allChecksPassedHeader}
                  </div>
                  <div className="text-slate-300">
                    {t.allChecksPassedSub} ({readinessMetrics.totalCompiledPages} total pages →{' '}
                    <span className="font-mono font-semibold text-cyan-200">
                      {requirements.tender_id}_Package.pdf
                    </span>
                    )
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
            <motion.button
              whileTap={
                blockingItems.length === 0 && !isGenerating ? { scale: 0.98 } : undefined
              }
              type="button"
              disabled={blockingItems.length > 0 || isGenerating}
              onClick={handleGeneratePackage}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                blockingItems.length > 0 || isGenerating
                  ? 'bg-slate-800/80 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300 shadow-xs'
              }`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              <span>
                {isGenerating ? t.generatingPackageBtn : t.generatePackageBtn}
              </span>
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}
