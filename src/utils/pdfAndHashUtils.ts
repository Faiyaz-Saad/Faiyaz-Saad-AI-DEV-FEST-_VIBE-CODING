import CryptoJS from 'crypto-js';
import { PDFDocument, PageSizes, StandardFonts, rgb } from 'pdf-lib';
import {
  ComputedDocumentStatus,
  DocumentMatchState,
  DocumentStatusType,
  RequiredDocument,
  TenderRequirements,
  UploadedPdfFile,
} from '../types';

/**
 * Computes a deterministic SHA-256 hex digest from an ArrayBuffer using crypto-js.
 */
export function computeSha256FromArrayBuffer(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  const words: number[] = [];
  for (let i = 0; i < uint8.length; i += 4) {
    words.push(
      ((uint8[i] || 0) << 24) |
        ((uint8[i + 1] || 0) << 16) |
        ((uint8[i + 2] || 0) << 8) |
        (uint8[i + 3] || 0)
    );
  }
  const wordArray = CryptoJS.lib.WordArray.create(words, uint8.length);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}

/**
 * Parses a File object, verifies it is a valid PDF via pdf-lib, extracts page count,
 * and computes its SHA-256 hash.
 */
export async function processUploadedPdfFile(file: File): Promise<UploadedPdfFile> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: false });
  const pageCount = pdfDoc.getPageCount();
  const sha256 = computeSha256FromArrayBuffer(arrayBuffer);

  return {
    id: `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: file.name,
    sizeBytes: file.size,
    pageCount,
    sha256,
    arrayBuffer,
    uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

/**
 * Real-time Document Status Engine:
 * Calculates EXACTLY ONE status per required document dynamically:
 * 1. Missing: mandatory === true, no file matched -> [BLOCKING]
 * 2. Expiry date needed: has_expiry === true and file matched, but expiry date is empty -> [BLOCKING]
 * 3. Expired: expiry date < submission_deadline -> [BLOCKING] (equal is valid/OK)
 * 4. Not provided: mandatory === false, no file matched -> [NON-BLOCKING]
 * 5. OK: File matched, and valid expiry date provided if required -> [NON-BLOCKING]
 */
export function evaluateDocumentStatus(
  doc: RequiredDocument,
  match: DocumentMatchState | undefined,
  submissionDeadline: string,
  matchedFile: UploadedPdfFile | undefined
): ComputedDocumentStatus {
  const hasFile = Boolean(match?.fileId && matchedFile);

  if (!hasFile) {
    if (doc.mandatory) {
      return {
        status: DocumentStatusType.Missing,
        isBlocking: true,
        reasonEn: `#${doc.order} ${doc.title_en}: Mandatory document is missing a matched PDF file.`,
        reasonBn: `#${doc.order} ${doc.title_bn}: আবশ্যক দলিলের কোনো PDF ফাইল যুক্ত করা হয়নি (Missing)।`,
      };
    }
    return {
      status: DocumentStatusType.NotProvided,
      isBlocking: false,
    };
  }

  // A file is matched; check expiry rules if has_expiry is true
  if (doc.has_expiry) {
    const expiry = (match?.expiryDate || '').trim();
    if (!expiry) {
      return {
        status: DocumentStatusType.ExpiryDateNeeded,
        isBlocking: true,
        reasonEn: `#${doc.order} ${doc.title_en}: Expiry date is required for the matched file (${matchedFile?.name}).`,
        reasonBn: `#${doc.order} ${doc.title_bn}: যুক্ত করা ফাইলের (${matchedFile?.name}) মেয়াদ উত্তীর্ণের তারিখ প্রদান করা আবশ্যক।`,
      };
    }

    // Compare YYYY-MM-DD lexicographically (ISO-8601 date strings compare accurately)
    if (expiry < submissionDeadline) {
      return {
        status: DocumentStatusType.Expired,
        isBlocking: true,
        reasonEn: `#${doc.order} ${doc.title_en}: Document expired on ${expiry} (must be on or after submission deadline ${submissionDeadline}).`,
        reasonBn: `#${doc.order} ${doc.title_bn}: দলিলের মেয়াদ (${expiry}) জমা দেওয়ার শেষ তারিখের (${submissionDeadline}) পূর্বেই উত্তীর্ণ হয়েছে।`,
      };
    }
  }

  return {
    status: DocumentStatusType.OK,
    isBlocking: false,
  };
}

/**
 * Sanitizes strings for WinAnsi encoding used by pdf-lib StandardFonts.
 */
function toSafeAscii(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '');
}

/**
 * Generates the complete merged Tender Package PDF with:
 * - Page 1: Cover Page in English (Tender ID, Title, Procuring Entity, Bidder, Deadline, Generation Date, Ordered Checklist)
 * - Subsequent Pages: Matched PDF pages appended in strict ascending `order` sequence
 * - Dynamic Footer on EVERY page (including Cover): `<tender_id> | Page X of Y`
 */
export async function generateAndDownloadTenderPackage(
  requirements: TenderRequirements,
  sortedDocuments: RequiredDocument[],
  matches: Record<string, DocumentMatchState>,
  filesById: Record<string, UploadedPdfFile>
): Promise<void> {
  const mergedPdf = await PDFDocument.create();
  const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

  // 1. Create Page 1 (Cover Page) in A4 portrait
  const coverPage = mergedPdf.addPage(PageSizes.A4);
  const { width, height } = coverPage.getSize();
  const margin = 48;

  // Top Header Band
  coverPage.drawRectangle({
    x: 0,
    y: height - 96,
    width,
    height: 96,
    color: rgb(0.06, 0.09, 0.16),
  });

  coverPage.drawText('OFFICIAL TENDER SUBMISSION PACKAGE', {
    x: margin,
    y: height - 44,
    size: 10,
    font: fontBold,
    color: rgb(0.58, 0.64, 0.72),
  });

  coverPage.drawText(
    toSafeAscii(`TENDER ID: ${requirements.tender_id}`),
    {
      x: margin,
      y: height - 68,
      size: 18,
      font: fontBold,
      color: rgb(1, 1, 1),
    }
  );

  // Tender Metadata Section
  let cursorY = height - 132;
  const drawMetaRow = (label: string, value: string) => {
    coverPage.drawText(label, {
      x: margin,
      y: cursorY,
      size: 9,
      font: fontBold,
      color: rgb(0.39, 0.45, 0.55),
    });

    const safeVal = toSafeAscii(value || 'N/A').slice(0, 82);
    coverPage.drawText(safeVal, {
      x: margin + 135,
      y: cursorY,
      size: 10,
      font: fontRegular,
      color: rgb(0.06, 0.09, 0.16),
    });

    cursorY -= 22;
  };

  const englishTitle = requirements.title_en || requirements.title;
  drawMetaRow('TENDER TITLE:', englishTitle);
  drawMetaRow('PROCURING ENTITY:', requirements.procuring_entity);
  drawMetaRow('BIDDER NAME:', requirements.bidder);
  drawMetaRow('SUBMISSION DEADLINE:', requirements.submission_deadline);
  drawMetaRow(
    'PACKAGE GENERATED:',
    new Date().toISOString().slice(0, 10) +
      ' ' +
      new Date().toTimeString().slice(0, 8)
  );

  // Divider line
  cursorY -= 8;
  coverPage.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.82, 0.85, 0.9),
  });

  // Checklist Header
  cursorY -= 26;
  coverPage.drawText('ORDERED CHECKLIST OF INCLUDED & REQUIRED DOCUMENTS', {
    x: margin,
    y: cursorY,
    size: 11,
    font: fontBold,
    color: rgb(0.06, 0.09, 0.16),
  });

  cursorY -= 22;
  // Table Column Headers
  coverPage.drawRectangle({
    x: margin,
    y: cursorY - 6,
    width: width - margin * 2,
    height: 20,
    color: rgb(0.94, 0.96, 0.98),
  });

  coverPage.drawText('ORD', {
    x: margin + 6,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });
  coverPage.drawText('DOCUMENT TITLE (EN)', {
    x: margin + 38,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });
  coverPage.drawText('TYPE', {
    x: margin + 245,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });
  coverPage.drawText('FILE & PAGES', {
    x: margin + 305,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });
  coverPage.drawText('EXPIRY / STATUS', {
    x: margin + 415,
    y: cursorY,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });

  cursorY -= 22;

  for (const doc of sortedDocuments) {
    if (cursorY < 75) break; // Keep safe bottom margin above footer

    const match = matches[doc.id];
    const matchedFile = match?.fileId ? filesById[match.fileId] : undefined;
    const isIncluded = Boolean(matchedFile);

    coverPage.drawText(`#${doc.order}`, {
      x: margin + 6,
      y: cursorY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.23),
    });

    coverPage.drawText(toSafeAscii(doc.title_en).slice(0, 38), {
      x: margin + 38,
      y: cursorY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.12, 0.16, 0.23),
    });

    coverPage.drawText(doc.mandatory ? 'Mandatory' : 'Optional', {
      x: margin + 245,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: doc.mandatory ? rgb(0.12, 0.25, 0.68) : rgb(0.45, 0.5, 0.58),
    });

    const fileDesc = matchedFile
      ? `${toSafeAscii(matchedFile.name).slice(0, 14)} (${matchedFile.pageCount}p)`
      : 'Skipped';
    coverPage.drawText(fileDesc, {
      x: margin + 305,
      y: cursorY,
      size: 8,
      font: fontRegular,
      color: isIncluded ? rgb(0.12, 0.16, 0.23) : rgb(0.55, 0.58, 0.64),
    });

    const statusDesc = isIncluded
      ? doc.has_expiry
        ? `OK (Exp: ${match?.expiryDate})`
        : 'OK (Included)'
      : 'Not provided';

    coverPage.drawText(statusDesc, {
      x: margin + 415,
      y: cursorY,
      size: 8,
      font: fontBold,
      color: isIncluded ? rgb(0.08, 0.5, 0.24) : rgb(0.45, 0.5, 0.58),
    });

    coverPage.drawLine({
      start: { x: margin, y: cursorY - 6 },
      end: { x: width - margin, y: cursorY - 6 },
      thickness: 0.5,
      color: rgb(0.91, 0.93, 0.96),
    });

    cursorY -= 20;
  }

  // 2. Append all pages of matched files in strict ascending `order` sequence
  for (const doc of sortedDocuments) {
    const match = matches[doc.id];
    const matchedFile = match?.fileId ? filesById[match.fileId] : undefined;
    if (!matchedFile) {
      // Skip optional unmatched documents
      continue;
    }

    const sourcePdf = await PDFDocument.load(matchedFile.arrayBuffer);
    const pageIndices = sourcePdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }

  // 3. Draw Dynamic Footer on EVERY page (including Cover Page): `<tender_id> | Page X of Y`
  const allPages = mergedPdf.getPages();
  const totalPages = allPages.length;

  allPages.forEach((page, idx) => {
    const pageWidth = page.getWidth();
    const pageNumber = idx + 1;
    const footerText = toSafeAscii(
      `${requirements.tender_id} | Page ${pageNumber} of ${totalPages}`
    );

    // Subtle footer background strip at bottom so footer is always legible and never overlaps content
    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: 28,
      color: rgb(0.97, 0.98, 0.99),
    });

    page.drawLine({
      start: { x: 36, y: 28 },
      end: { x: pageWidth - 36, y: 28 },
      thickness: 0.6,
      color: rgb(0.82, 0.85, 0.9),
    });

    const textWidth = fontBold.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: Math.max(36, (pageWidth - textWidth) / 2),
      y: 10,
      size: 9,
      font: fontBold,
      color: rgb(0.15, 0.2, 0.3),
    });
  });

  // 4. Serialize and trigger browser download as `<tender_id>_Package.pdf`
  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${requirements.tender_id}_Package.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates realistic sample PDF documents in-memory via pdf-lib so users can immediately
 * test file uploads, page counting, SHA-256 hashing, and full package merging.
 */
export async function generateSamplePdfFiles(): Promise<UploadedPdfFile[]> {
  const specs = [
    {
      fileName: '01_Updated_Trade_License_2026.pdf',
      docTitle: 'Updated Trade License (2026-2027)',
      issuer: 'Dhaka North City Corporation (DNCC)',
      pages: 2,
    },
    {
      fileName: '02_Tax_Clearance_Certificate_TIN.pdf',
      docTitle: 'Income Tax Clearance Certificate (TIN)',
      issuer: 'National Board of Revenue (NBR)',
      pages: 1,
    },
    {
      fileName: '03_VAT_Registration_BIN.pdf',
      docTitle: 'Value Added Tax (VAT) Registration Certificate',
      issuer: 'Customs, Excise & VAT Commissionerate',
      pages: 1,
    },
    {
      fileName: '04_Bank_Solvency_Credit_Line.pdf',
      docTitle: 'Bank Solvency & Liquid Credit Line Certificate',
      issuer: 'Eastern Corporate Banking Division',
      pages: 2,
    },
    {
      fileName: '05_Litigation_History_Affidavit.pdf',
      docTitle: 'Non-Debarment & Litigation History Affidavit',
      issuer: 'Notary Public, Dhaka',
      pages: 1,
    },
  ];

  const results: UploadedPdfFile[] = [];

  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const pdf = await PDFDocument.create();
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);

    for (let p = 1; p <= spec.pages; p++) {
      const page = pdf.addPage(PageSizes.A4);
      const { width, height } = page.getSize();

      page.drawRectangle({
        x: 48,
        y: 60,
        width: width - 96,
        height: height - 120,
        borderColor: rgb(0.75, 0.8, 0.86),
        borderWidth: 1,
      });

      page.drawText('SAMPLE TENDER SUPPORTING DOCUMENT', {
        x: 72,
        y: height - 110,
        size: 10,
        font: fontBold,
        color: rgb(0.15, 0.39, 0.92),
      });

      page.drawText(spec.docTitle, {
        x: 72,
        y: height - 140,
        size: 16,
        font: fontBold,
        color: rgb(0.06, 0.09, 0.16),
      });

      page.drawText(`Issuing Authority: ${spec.issuer}`, {
        x: 72,
        y: height - 170,
        size: 11,
        font: fontRegular,
        color: rgb(0.28, 0.33, 0.41),
      });

      page.drawText(
        `Document Page ${p} of ${spec.pages} | Verified for Tender TND-2026-PWD-104`,
        {
          x: 72,
          y: height - 205,
          size: 10,
          font: fontRegular,
          color: rgb(0.39, 0.45, 0.55),
        }
      );
    }

    const bytes = await pdf.save();
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const sha256 = computeSha256FromArrayBuffer(arrayBuffer);

    results.push({
      id: `sample-pdf-${i + 1}-${Date.now()}`,
      name: spec.fileName,
      sizeBytes: bytes.byteLength,
      pageCount: spec.pages,
      sha256,
      arrayBuffer,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  }

  return results;
}
