import { Language, TenderRequirements } from '../types';

export const SAMPLE_REQUIREMENTS_JSON: TenderRequirements = {
  tender_id: 'TND-2026-PWD-104',
  title: 'Construction of Regional Digital Archive & Data Center Complex',
  title_en: 'Construction of Regional Digital Archive & Data Center Complex',
  title_bn: 'আঞ্চলিক ডিজিটাল আর্কাইভ ও ডেটা সেন্টার কমপ্লেক্স নির্মাণ প্রকল্প',
  procuring_entity: 'Public Works Department (PWD), Dhaka Circle-2',
  bidder: 'Delta Horizon Engineering & Infrastructure Ltd.',
  submission_deadline: '2026-11-15',
  documents: [
    {
      id: 'doc-1',
      order: 1,
      title_en: 'Updated Trade License',
      title_bn: 'হালনাগাদ ট্রেড লাইসেন্স',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'doc-2',
      order: 2,
      title_en: 'Income Tax Clearance Certificate (TIN)',
      title_bn: 'আয়কর পরিশোধের সনদপত্র (টিআইএন)',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'doc-3',
      order: 3,
      title_en: 'VAT Registration Certificate (BIN)',
      title_bn: 'ভ্যাট নিবন্ধন সনদপত্র (বিআইএন)',
      mandatory: true,
      has_expiry: false,
    },
    {
      id: 'doc-4',
      order: 4,
      title_en: 'Bank Solvency & Credit Line Certificate',
      title_bn: 'ব্যাংক সলভেন্সি ও ক্রেডিট লাইন সনদ',
      mandatory: true,
      has_expiry: true,
    },
    {
      id: 'doc-5',
      order: 5,
      title_en: 'Litigation History & Non-Debarment Affidavit',
      title_bn: 'মামলা সংক্রান্ত তথ্য ও হলফনামা',
      mandatory: false,
      has_expiry: false,
    },
    {
      id: 'doc-6',
      order: 6,
      title_en: 'ISO 9001:2015 Quality Management Certificate',
      title_bn: 'আইএসও ৯০০১:২০১৫ মান ব্যবস্থাপনা সনদ',
      mandatory: false,
      has_expiry: true,
    },
  ],
};

export const UI_TEXT: Record<
  Language,
  {
    appTitle: string;
    loadSampleJson: string;
    downloadSampleJson: string;
    loadSamplePdfs: string;
    uploadRequirementsTitle: string;
    uploadRequirementsDesc: string;
    chooseJsonBtn: string;
    tenderInfoTitle: string;
    tenderIdLabel: string;
    projectTitleLabel: string;
    procuringEntityLabel: string;
    bidderLabel: string;
    submissionDeadlineLabel: string;
    packageReadinessLabel: string;
    mandatoryMatchedLabel: string;
    compiledPagesLabel: string;
    editTenderMetaBtn: string;
    saveTenderMetaBtn: string;
    inspectJsonBtn: string;
    requiredDocsTitle: string;
    requiredDocsSubtitle: string;
    filterAll: string;
    filterBlocking: string;
    filterReady: string;
    filterMandatory: string;
    colOrder: string;
    colDocName: string;
    colRequirement: string;
    colMatchPdf: string;
    colExpiryDate: string;
    colStatus: string;
    mandatoryLabel: string;
    optionalLabel: string;
    selectPdfPlaceholder: string;
    unmatchAction: string;
    noExpiryRequired: string;
    validOnOrAfter: string;
    presetDeadline: string;
    presetNextYear: string;
    presetExpiredTest: string;
    livePageMapTitle: string;
    coverPageLabel: string;
    uploadPdfSectionTitle: string;
    uploadPdfDropzoneTitle: string;
    uploadPdfDropzoneHint: string;
    addDuplicateDemoBtn: string;
    filesCountLabel: string;
    totalSizeLabel: string;
    duplicateDetectedBanner: string;
    duplicateFileTag: string;
    uniqueFileTag: string;
    assignedToLabel: string;
    unassignedLabel: string;
    pagesUnit: string;
    removeFileAria: string;
    clearAllFilesBtn: string;
    noFilesUploadedYet: string;
    blockingIssuesHeader: string;
    allChecksPassedHeader: string;
    allChecksPassedSub: string;
    generatePackageBtn: string;
    generatingPackageBtn: string;
    statusMissing: string;
    statusExpiryNeeded: string;
    statusExpired: string;
    statusNotProvided: string;
    statusOk: string;
    blockingTag: string;
    nonBlockingTag: string;
    autoMatchBtn: string;
    copyHashSuccess: string;
  }
> = {
  en: {
    appTitle: 'Tender Document Package Builder',
    loadSampleJson: 'Load Sample JSON',
    downloadSampleJson: 'Sample JSON',
    loadSamplePdfs: 'Load Sample PDFs',
    uploadRequirementsTitle: '1. Tender Requirements & Live Telemetry',
    uploadRequirementsDesc:
      'Upload requirements.json or edit tender parameters inline to validate document compliance in real time.',
    chooseJsonBtn: 'Upload requirements.json',
    tenderInfoTitle: 'Tender Information Summary',
    tenderIdLabel: 'Tender ID',
    projectTitleLabel: 'Tender Title',
    procuringEntityLabel: 'Procuring Entity',
    bidderLabel: 'Bidder Name',
    submissionDeadlineLabel: 'Submission Deadline',
    packageReadinessLabel: 'Compliance Readiness',
    mandatoryMatchedLabel: 'Mandatory Verified',
    compiledPagesLabel: 'Compiled Package Map',
    editTenderMetaBtn: 'Edit Parameters',
    saveTenderMetaBtn: 'Save Parameters',
    inspectJsonBtn: 'View JSON Schema',
    requiredDocsTitle: 'Required Documents Checklist & Real-Time Matching',
    requiredDocsSubtitle:
      'Sorted ascending by official package order. Match one unique PDF per required slot.',
    filterAll: 'All Slots',
    filterBlocking: 'Blocking Issues',
    filterReady: 'Verified OK',
    filterMandatory: 'Mandatory Only',
    colOrder: 'Order',
    colDocName: 'Document Name',
    colRequirement: 'Requirement',
    colMatchPdf: 'Matched PDF File',
    colExpiryDate: 'Expiry Date (YYYY-MM-DD)',
    colStatus: 'Validation Status',
    mandatoryLabel: 'Mandatory',
    optionalLabel: 'Optional',
    selectPdfPlaceholder: '— Select a PDF file —',
    unmatchAction: 'Unmatch',
    noExpiryRequired: 'No expiry required',
    validOnOrAfter: 'Must be ≥',
    presetDeadline: '= Deadline',
    presetNextYear: '+1 Yr Valid',
    presetExpiredTest: 'Test Expired',
    livePageMapTitle: 'Live Merged PDF Page Sequence Preview',
    coverPageLabel: 'Cover Page & Checklist',
    uploadPdfSectionTitle: '2. Uploaded PDF Files & SHA-256 Duplicate Guard',
    uploadPdfDropzoneTitle: 'Click or drag & drop PDF files here',
    uploadPdfDropzoneHint:
      '100% browser-processed · Max 30 PDF files · Max 50 MB total size',
    addDuplicateDemoBtn: '+ Test Duplicate File',
    filesCountLabel: 'File Count Limit',
    totalSizeLabel: 'Total Package Size Limit',
    duplicateDetectedBanner:
      'SHA-256 Duplicate Alert: Identical PDF files detected. Duplicate files are locked from being assigned to multiple document slots.',
    duplicateFileTag: 'Duplicate SHA-256',
    uniqueFileTag: 'Verified Unique',
    assignedToLabel: 'Matched to',
    unassignedLabel: 'Unassigned',
    pagesUnit: 'pages',
    removeFileAria: 'Remove file',
    clearAllFilesBtn: 'Remove All PDFs',
    noFilesUploadedYet:
      'No PDF files uploaded yet. Upload your tender PDFs above or click "Load Sample PDFs" to test.',
    blockingIssuesHeader: 'Package Generation Blocked — Resolve the following issues:',
    allChecksPassedHeader: 'All Mandatory Checks Passed',
    allChecksPassedSub:
      'Cover page, ordered document pages, and dynamic footers are ready to compile.',
    generatePackageBtn: 'Generate Package',
    generatingPackageBtn: 'Compiling PDF Package...',
    statusMissing: 'Missing',
    statusExpiryNeeded: 'Expiry date needed',
    statusExpired: 'Expired',
    statusNotProvided: 'Not provided',
    statusOk: 'OK',
    blockingTag: 'Blocking',
    nonBlockingTag: 'Ready',
    autoMatchBtn: 'Auto-Match & Fill Valid Dates',
    copyHashSuccess: 'Copied SHA-256',
  },
  bn: {
    appTitle: 'টেন্ডার ডকুমেন্ট প্যাকেজ বিল্ডার',
    loadSampleJson: 'নমুনা JSON লোড করুন',
    downloadSampleJson: 'নমুনা JSON ডাউনলোড',
    loadSamplePdfs: 'নমুনা PDF লোড করুন',
    uploadRequirementsTitle: '১. টেন্ডার রিকোয়ারমেন্টস ও লাইভ স্ট্যাটাস',
    uploadRequirementsDesc:
      'টেন্ডারের তথ্য এবং প্রয়োজনীয় দলিলের তালিকা লোড করতে requirements.json আপলোড করুন অথবা সরাসরি সম্পাদনা করুন।',
    chooseJsonBtn: 'requirements.json আপলোড করুন',
    tenderInfoTitle: 'টেন্ডার তথ্যের সারসংক্ষেপ',
    tenderIdLabel: 'টেন্ডার আইডি',
    projectTitleLabel: 'টেন্ডারের শিরোনাম',
    procuringEntityLabel: 'ক্রয়কারী সংস্থা',
    bidderLabel: 'দরপত্রদাতার নাম',
    submissionDeadlineLabel: 'জমা দেওয়ার শেষ তারিখ',
    packageReadinessLabel: 'প্যাকেজ প্রস্তুতির হার',
    mandatoryMatchedLabel: 'আবশ্যক দলিল যাচাইকৃত',
    compiledPagesLabel: 'মোট পৃষ্ঠা বিন্যাস',
    editTenderMetaBtn: 'তথ্য সম্পাদনা',
    saveTenderMetaBtn: 'সংরক্ষণ করুন',
    inspectJsonBtn: 'JSON কাঠামো দেখুন',
    requiredDocsTitle: 'প্রয়োজনীয় দলিলের তালিকা ও ফাইল মিলকরণ',
    requiredDocsSubtitle:
      'ক্রম (Order) অনুযায়ী সাজানো। প্রতিটি আবশ্যক স্লটে একটি করে অনন্য PDF ফাইল যুক্ত করুন।',
    filterAll: 'সকল দলিল',
    filterBlocking: 'বাধাদানকারী ত্রুটি',
    filterReady: 'সঠিক (OK)',
    filterMandatory: 'শুধুমাত্র আবশ্যক',
    colOrder: 'ক্রম',
    colDocName: 'দলিলের নাম',
    colRequirement: 'ধরন',
    colMatchPdf: 'যুক্ত করা PDF ফাইল',
    colExpiryDate: 'মেয়াদ উত্তীর্ণের তারিখ',
    colStatus: 'যাচাইকরণ স্ট্যাটাস',
    mandatoryLabel: 'আবশ্যক (Mandatory)',
    optionalLabel: 'ঐচ্ছিক (Optional)',
    selectPdfPlaceholder: '— একটি PDF ফাইল নির্বাচন করুন —',
    unmatchAction: 'বিযুক্ত করুন',
    noExpiryRequired: 'মেয়াদের তারিখ প্রয়োজন নেই',
    validOnOrAfter: 'সর্বনিম্ন বৈধ তারিখ:',
    presetDeadline: '= শেষ তারিখ',
    presetNextYear: '+১ বছর বৈধ',
    presetExpiredTest: 'মেয়াদোত্তীর্ণ পরীক্ষা',
    livePageMapTitle: 'চূড়ান্ত PDF প্যাকেজের লাইভ পৃষ্ঠা বিন্যাস',
    coverPageLabel: 'কভার পেজ ও চেকলিস্ট',
    uploadPdfSectionTitle: '২. আপলোডকৃত PDF ফাইল ও SHA-256 ডুপ্লিকেট যাচাইকরণ',
    uploadPdfDropzoneTitle: 'এখানে ক্লিক করুন অথবা PDF ফাইল টেনে এনে ছাড়ুন',
    uploadPdfDropzoneHint:
      '১০০% ব্রাউজারে প্রক্রিয়াজাত · সর্বোচ্চ ৩০টি PDF ফাইল · সর্বোচ্চ মোট আকার ৫০ মেগাবাইট',
    addDuplicateDemoBtn: '+ ডুপ্লিকেট ফাইল পরীক্ষা করুন',
    filesCountLabel: 'ফাইল সংখ্যার সীমা',
    totalSizeLabel: 'মোট ফাইল আকারের সীমা',
    duplicateDetectedBanner:
      'SHA-256 ডুপ্লিকেট সতর্কতা: অভিন্ন হ্যাশযুক্ত ডুপ্লিকেট PDF ফাইল শনাক্ত হয়েছে। ডুপ্লিকেট ফাইল একাধিক দলিলে যুক্ত করা যাবে না।',
    duplicateFileTag: 'ডুপ্লিকেট SHA-256',
    uniqueFileTag: 'যাচাইকৃত অনন্য',
    assignedToLabel: 'যুক্ত করা হয়েছে:',
    unassignedLabel: 'অযুক্ত',
    pagesUnit: 'পৃষ্ঠা',
    removeFileAria: 'ফাইল মুছে ফেলুন',
    clearAllFilesBtn: 'সব PDF মুছে ফেলুন',
    noFilesUploadedYet:
      'এখনও কোনো PDF ফাইল আপলোড করা হয়নি। উপরে PDF আপলোড করুন অথবা "নমুনা PDF লোড করুন" বাটনে ক্লিক করুন।',
    blockingIssuesHeader:
      'প্যাকেজ তৈরি স্থগিত রয়েছে — অনুগ্রহ করে নিচের ত্রুটিগুলো সমাধান করুন:',
    allChecksPassedHeader: 'সকল আবশ্যক যাচাইকরণ সম্পন্ন হয়েছে',
    allChecksPassedSub:
      'কভার পেজ, ক্রমানুসারে দলিলের পৃষ্ঠা এবং ডায়নামিক ফুটারসহ প্যাকেজ তৈরির জন্য প্রস্তুত।',
    generatePackageBtn: 'প্যাকেজ তৈরি ও ডাউনলোড করুন',
    generatingPackageBtn: 'PDF প্যাকেজ তৈরি হচ্ছে...',
    statusMissing: 'অনুপস্থিত (Missing)',
    statusExpiryNeeded: 'মেয়াদের তারিখ প্রয়োজন',
    statusExpired: 'মেয়াদোত্তীর্ণ (Expired)',
    statusNotProvided: 'প্রদান করা হয়নি',
    statusOk: 'সঠিক (OK)',
    blockingTag: 'বাধাদানকারী',
    nonBlockingTag: 'প্রস্তুত',
    autoMatchBtn: 'স্বয়ংক্রিয় মিলকরণ ও বৈধ তারিখ পূরণ',
    copyHashSuccess: 'হ্যাশ কপি হয়েছে',
  },
};
