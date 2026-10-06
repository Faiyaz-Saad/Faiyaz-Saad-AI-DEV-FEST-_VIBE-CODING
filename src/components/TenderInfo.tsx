import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  Code2,
  Download,
  Edit3,
  FileJson,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Language, TenderRequirements } from '../types';
import { SAMPLE_REQUIREMENTS_JSON, UI_TEXT } from '../i18n/translations';

interface TenderInfoProps {
  requirements: TenderRequirements;
  language: Language;
  onUploadJson: (parsed: TenderRequirements) => void;
  onUpdateRequirementsMeta: (updated: TenderRequirements) => void;
  onValidationError: (msg: string) => void;
  readinessPct: number;
  mandatoryOkCount: number;
  mandatoryTotalCount: number;
  totalCompiledPages: number;
}

export function TenderInfo({
  requirements,
  language,
  onUploadJson,
  onUpdateRequirementsMeta,
  onValidationError,
  readinessPct,
  mandatoryOkCount,
  mandatoryTotalCount,
  totalCompiledPages,
}: TenderInfoProps) {
  const t = UI_TEXT[language];
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [showJsonDrawer, setShowJsonDrawer] = useState(false);

  const [draftId, setDraftId] = useState(requirements.tender_id);
  const [draftEntity, setDraftEntity] = useState(requirements.procuring_entity);
  const [draftBidder, setDraftBidder] = useState(requirements.bidder);
  const [draftDeadline, setDraftDeadline] = useState(requirements.submission_deadline);

  const startEditing = () => {
    setDraftId(requirements.tender_id);
    setDraftEntity(requirements.procuring_entity);
    setDraftBidder(requirements.bidder);
    setDraftDeadline(requirements.submission_deadline);
    setIsEditingMeta(true);
  };

  const saveEdits = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRequirementsMeta({
      ...requirements,
      tender_id: draftId.trim() || requirements.tender_id,
      procuring_entity: draftEntity.trim() || requirements.procuring_entity,
      bidder: draftBidder.trim() || requirements.bidder,
      submission_deadline: draftDeadline || requirements.submission_deadline,
    });
    setIsEditingMeta(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      onValidationError(
        language === 'en'
          ? `Rejected "${file.name}": Please upload a valid .json requirements file.`
          : `"${file.name}" বাতিল করা হয়েছে: অনুগ্রহ করে একটি বৈধ .json ফাইল আপলোড করুন।`
      );
      e.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (
        !parsed ||
        typeof parsed.tender_id !== 'string' ||
        typeof parsed.submission_deadline !== 'string' ||
        !Array.isArray(parsed.documents)
      ) {
        throw new Error('Missing required fields in JSON schema.');
      }

      const normalizedDocs = parsed.documents.map((d: any, index: number) => ({
        id: String(d.id || `doc-${index + 1}`),
        order: Number(d.order ?? index + 1),
        title_en: String(d.title_en || d.title || `Document #${index + 1}`),
        title_bn: String(d.title_bn || d.title_en || d.title || `দলিল #${index + 1}`),
        mandatory: Boolean(d.mandatory),
        has_expiry: Boolean(d.has_expiry),
      }));

      onUploadJson({
        tender_id: parsed.tender_id,
        title: parsed.title || parsed.title_en || 'Tender Submission Package',
        title_en: parsed.title_en || parsed.title,
        title_bn: parsed.title_bn || parsed.title,
        procuring_entity: String(parsed.procuring_entity || 'N/A'),
        bidder: String(parsed.bidder || 'N/A'),
        submission_deadline: String(parsed.submission_deadline),
        documents: normalizedDocs,
      });
    } catch {
      onValidationError(
        language === 'en'
          ? 'Invalid requirements.json structure. Ensure tender_id, submission_deadline, and documents[] are present.'
          : 'অবৈধ requirements.json ফরম্যাট। অনুগ্রহ করে tender_id, submission_deadline এবং documents[] যাচাই করুন।'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadSampleJson = () => {
    const jsonString = JSON.stringify(requirements, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'requirements.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayTitle =
    language === 'bn'
      ? requirements.title_bn || requirements.title
      : requirements.title_en || requirements.title;

  return (
    <section
      aria-label={t.tenderInfoTitle}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      {/* Top Row: JSON Upload Controls & Tender Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileJson className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-800">{t.uploadRequirementsTitle}</span>
            <span aria-hidden="true">·</span>
            <span>{t.uploadRequirementsDesc}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {displayTitle}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <input
            ref={fileInputRef}
            id="requirements-json-upload"
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.chooseJsonBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => onUploadJson(SAMPLE_REQUIREMENTS_JSON)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.loadSampleJson}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSampleJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.downloadSampleJson}</span>
          </button>

          <button
            type="button"
            onClick={() => (isEditingMeta ? setIsEditingMeta(false) : startEditing())}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              isEditingMeta
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.editTenderMetaBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowJsonDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              showJsonDrawer
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.inspectJsonBtn}</span>
          </button>
        </div>
      </div>

      {/* Inline Dynamic Parameter Editor */}
      <AnimatePresence initial={false}>
        {isEditingMeta && (
          <motion.form
            key="edit-meta-form"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={saveEdits}
            className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label htmlFor="edit-tender-id" className="block text-xs font-medium text-slate-600 mb-1">
                {t.tenderIdLabel}
              </label>
              <input
                id="edit-tender-id"
                type="text"
                value={draftId}
                onChange={(e) => setDraftId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="edit-procuring-entity" className="block text-xs font-medium text-slate-600 mb-1">
                {t.procuringEntityLabel}
              </label>
              <input
                id="edit-procuring-entity"
                type="text"
                value={draftEntity}
                onChange={(e) => setDraftEntity(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="edit-bidder" className="block text-xs font-medium text-slate-600 mb-1">
                {t.bidderLabel}
              </label>
              <input
                id="edit-bidder"
                type="text"
                value={draftBidder}
                onChange={(e) => setDraftBidder(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="edit-deadline" className="block text-xs font-medium text-slate-600 mb-1">
                {t.submissionDeadlineLabel}
              </label>
              <input
                id="edit-deadline"
                type="date"
                value={draftDeadline}
                onChange={(e) => setDraftDeadline(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.saveTenderMetaBtn}</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tender Metadata Summary & Live Readiness Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <dl className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1">
            <dt className="text-xs text-slate-500">{t.tenderIdLabel}</dt>
            <dd className="text-sm font-semibold font-mono tabular-nums text-slate-900">
              {requirements.tender_id}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs text-slate-500">{t.procuringEntityLabel}</dt>
            <dd className="text-sm font-medium text-slate-900">
              {requirements.procuring_entity}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs text-slate-500">{t.bidderLabel}</dt>
            <dd className="text-sm font-medium text-slate-900">
              {requirements.bidder}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-xs text-slate-500">{t.submissionDeadlineLabel}</dt>
            <dd className="text-sm font-semibold font-mono tabular-nums text-blue-700">
              {requirements.submission_deadline}
            </dd>
          </div>
        </dl>

        {/* Live Animated Readiness Bar */}
        <div className="lg:col-span-4 lg:border-l lg:border-slate-200 lg:pl-6 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">{t.packageReadinessLabel}</span>
            <span className="font-mono font-bold tabular-nums text-slate-900">
              {readinessPct}% · {mandatoryOkCount}/{mandatoryTotalCount} {t.mandatoryMatchedLabel} · {totalCompiledPages}p
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={false}
              animate={{ scaleX: Math.max(0.02, readinessPct / 100) }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ transformOrigin: 'left' }}
              className={`h-full w-full ${
                readinessPct === 100
                  ? 'bg-emerald-600'
                  : readinessPct >= 50
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable JSON Schema Inspector */}
      <AnimatePresence initial={false}>
        {showJsonDrawer && (
          <motion.div
            key="json-schema-drawer"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="pt-4 border-t border-slate-200"
          >
            <div className="flex items-center justify-between mb-2 text-xs text-slate-500">
              <span className="font-mono font-semibold text-slate-700">
                requirements.json ({requirements.documents.length} required slots)
              </span>
              <span>Sorted ascending by order</span>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto max-h-60 leading-relaxed">
              {JSON.stringify(requirements, null, 2)}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
