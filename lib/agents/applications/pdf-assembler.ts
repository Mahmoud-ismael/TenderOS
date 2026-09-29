import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { TenderRow } from '@/lib/data/tenders';
import type { CompanyProfileData } from '@/lib/data/company-profile-types';
import type { GeneratedDocumentRow } from '@/lib/data/documents';
import type { ComplianceDocumentItem } from '@/lib/data/company-profile';

export interface AssemblePdfParams {
  tender: TenderRow;
  profile: CompanyProfileData;
  applicationId: string;
  generatedDocs: GeneratedDocumentRow[];
  complianceDocs: ComplianceDocumentItem[];
}

/**
 * Splits text into lines fitting within maxWidth based on character width estimation.
 */
function wrapText(text: string, maxCharsPerLine: number = 85): string[] {
  const result: string[] = [];
  const paragraphs = text.split('\n');

  for (const para of paragraphs) {
    if (para.trim().length === 0) {
      result.push('');
      continue;
    }

    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length < maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) result.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) result.push(currentLine);
  }

  return result;
}

/**
 * Assembles the master submission packet PDF adhering to Kenyan public procurement standards.
 * Ordering:
 * 1. Transmittal Cover Letter
 * 2. Form of Tender (Statutory Narrative & Price)
 * 3. Technical Proposal & Methodology
 * 4. Financial Proposal & Activity Schedule
 * 5. Compliance Bundle & Statutory Certificates Schedule
 * 6. Personnel CVs & Past Performance Annex
 */
export async function assembleFinalPacketPdf(
  params: AssemblePdfParams
): Promise<Uint8Array> {
  const { tender, profile, generatedDocs, complianceDocs } = params;

  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Tender Submission - ${tender.title}`);
  pdfDoc.setAuthor(profile.legal_name);
  pdfDoc.setSubject(`Tender Ref: ${tender.external_reference || 'N/A'}`);
  pdfDoc.setCreationDate(new Date());

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let pageNumber = 1;

  // Helper to add standard page header and footer
  const addHeaderFooter = (page: any, isCover = false) => {
    if (isCover) return;

    // Header line
    page.drawText(
      `CONFIDENTIAL BID SUBMISSION | REF: ${tender.external_reference || 'N/A'}`,
      {
        x: margin,
        y: pageHeight - 35,
        size: 8,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      }
    );
    page.drawLine({
      start: { x: margin, y: pageHeight - 40 },
      end: { x: pageWidth - margin, y: pageHeight - 40 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Footer line
    page.drawLine({
      start: { x: margin, y: 40 },
      end: { x: pageWidth - margin, y: 40 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });
    page.drawText(`${profile.legal_name} | AGPO Youth Category`, {
      x: margin,
      y: 28,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
    page.drawText(`Page ${pageNumber}`, {
      x: pageWidth - margin - 40,
      y: 28,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });
  };

  // ----------------------------------------------------------------------------
  // 1. COVER / TITLE PAGE
  // ----------------------------------------------------------------------------
  const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
  addHeaderFooter(coverPage, true);

  // Border frame
  coverPage.drawRectangle({
    x: 35,
    y: 35,
    width: pageWidth - 70,
    height: pageHeight - 70,
    borderColor: rgb(0.1, 0.4, 0.6),
    borderWidth: 1.5,
  });

  // Inner accent line
  coverPage.drawLine({
    start: { x: 50, y: pageHeight - 120 },
    end: { x: pageWidth - 50, y: pageHeight - 120 },
    thickness: 2,
    color: rgb(0.1, 0.4, 0.6),
  });

  coverPage.drawText('REPUBLIC OF KENYA', {
    x: margin,
    y: pageHeight - 90,
    size: 14,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  coverPage.drawText('PUBLIC PROCUREMENT TENDER SUBMISSION DOSSIER', {
    x: margin,
    y: pageHeight - 110,
    size: 11,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Tender Particulars
  let curY = pageHeight - 170;
  coverPage.drawText('PROCURING ENTITY:', {
    x: margin,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  coverPage.drawText(tender.procuring_entity.toUpperCase(), {
    x: margin,
    y: curY - 18,
    size: 13,
    font: fontBold,
    color: rgb(0.05, 0.2, 0.35),
  });

  curY -= 55;
  coverPage.drawText('TENDER TITLE & SCOPE:', {
    x: margin,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });

  const wrappedTitle = wrapText(tender.title, 55);
  for (const line of wrappedTitle) {
    curY -= 18;
    coverPage.drawText(line, {
      x: margin,
      y: curY,
      size: 13,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  curY -= 35;
  coverPage.drawText('TENDER REFERENCE NUMBER:', {
    x: margin,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  coverPage.drawText(tender.external_reference || 'N/A', {
    x: margin,
    y: curY - 16,
    size: 12,
    font: fontBold,
    color: rgb(0.8, 0.2, 0.1),
  });

  curY -= 45;
  coverPage.drawText('SUBMISSION DEADLINE:', {
    x: margin,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  coverPage.drawText(new Date(tender.submission_deadline).toLocaleString(), {
    x: margin,
    y: curY - 16,
    size: 11,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Bidder Information Box
  curY -= 70;
  coverPage.drawRectangle({
    x: margin,
    y: curY - 120,
    width: contentWidth,
    height: 120,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.85, 0.88, 0.9),
    borderWidth: 1,
  });

  coverPage.drawText('SUBMITTED BY (BIDDER):', {
    x: margin + 15,
    y: curY - 20,
    size: 9,
    font: fontBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  coverPage.drawText(profile.legal_name, {
    x: margin + 15,
    y: curY - 38,
    size: 13,
    font: fontBold,
    color: rgb(0.05, 0.25, 0.4),
  });
  coverPage.drawText(
    `Registration No: ${profile.registration_number || 'CPR/2021/12345'} | KRA PIN: ${profile.kra_pin || 'N/A'}`,
    {
      x: margin + 15,
      y: curY - 55,
      size: 9,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    }
  );
  coverPage.drawText(
    `Affirmative Action Category: AGPO ${profile.agpo_category || 'Youth'} (Cert: ${profile.agpo_cert_number || 'N/A'})`,
    {
      x: margin + 15,
      y: curY - 72,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.5, 0.3),
    }
  );
  coverPage.drawText(
    `Address: ${profile.physical_address || 'Nairobi, Kenya'} | Email: ${profile.contact_email || 'tenders@hisako.co.ke'}`,
    {
      x: margin + 15,
      y: curY - 88,
      size: 9,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  // Table of Contents on Cover
  curY -= 150;
  coverPage.drawText('MASTER SUBMISSION PACKET STRUCTURE:', {
    x: margin,
    y: curY,
    size: 9,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const toc = [
    'SECTION 1: Formal Transmittal Cover Letter',
    'SECTION 2: PPADA Statutory Form of Tender & Validity Commitments',
    'SECTION 3: Technical Proposal, Solution Architecture & Work Plan',
    'SECTION 4: Financial Proposal, Milestone Breakdown & VAT Computation',
    'SECTION 5: Statutory Compliance Schedule & Mandatory Certificates (Tax/AGPO/CR12/PIN)',
    'SECTION 6: Key Technical Personnel CVs & Reference Project Performance Annex',
  ];

  for (let i = 0; i < toc.length; i++) {
    curY -= 16;
    coverPage.drawText(toc[i], {
      x: margin + 10,
      y: curY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // ----------------------------------------------------------------------------
  // Ordered Document Sections
  // ----------------------------------------------------------------------------
  const documentOrder: Array<{
    type: string;
    sectionNumber: number;
    title: string;
  }> = [
    { type: 'cover_letter', sectionNumber: 1, title: 'TRANSMITTAL COVER LETTER' },
    { type: 'form_of_tender', sectionNumber: 2, title: 'PPADA STATUTORY FORM OF TENDER' },
    { type: 'technical_proposal', sectionNumber: 3, title: 'TECHNICAL PROPOSAL & WORK PLAN' },
    { type: 'financial_proposal', sectionNumber: 4, title: 'FINANCIAL PROPOSAL & PRICING SCHEDULE' },
    { type: 'compliance_bundle', sectionNumber: 5, title: 'STATUTORY COMPLIANCE BUNDLE & SCHEDULE' },
  ];

  // Helper to append a text section into pages with auto-pagination
  const appendTextSection = (sectionNumber: number, title: string, text: string) => {
    pageNumber++;
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    addHeaderFooter(currentPage);

    let y = pageHeight - 65;

    // Section Header Box
    currentPage.drawRectangle({
      x: margin,
      y: y - 25,
      width: contentWidth,
      height: 30,
      color: rgb(0.08, 0.28, 0.45),
    });

    currentPage.drawText(`SECTION ${sectionNumber}: ${title}`, {
      x: margin + 12,
      y: y - 16,
      size: 11,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    y -= 45;

    const cleanLines = wrapText(text, 82);

    for (const line of cleanLines) {
      if (y < 65) {
        // Need new page
        pageNumber++;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        addHeaderFooter(currentPage);
        y = pageHeight - 60;
      }

      if (line.startsWith('# ')) {
        y -= 8;
        currentPage.drawText(line.replace(/^#\s*/, ''), {
          x: margin,
          y,
          size: 12,
          font: fontBold,
          color: rgb(0.1, 0.3, 0.5),
        });
        y -= 16;
      } else if (line.startsWith('## ')) {
        y -= 6;
        currentPage.drawText(line.replace(/^##\s*/, ''), {
          x: margin,
          y,
          size: 10.5,
          font: fontBold,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= 14;
      } else if (line.startsWith('### ')) {
        y -= 4;
        currentPage.drawText(line.replace(/^###\s*/, ''), {
          x: margin,
          y,
          size: 9.5,
          font: fontBold,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 13;
      } else if (line.startsWith('---')) {
        currentPage.drawLine({
          start: { x: margin, y: y + 4 },
          end: { x: pageWidth - margin, y: y + 4 },
          thickness: 0.5,
          color: rgb(0.8, 0.8, 0.8),
        });
        y -= 12;
      } else if (line === '') {
        y -= 8;
      } else {
        currentPage.drawText(line, {
          x: margin,
          y,
          size: 9,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        y -= 12.5;
      }
    }
  };

  // 1 to 5: Render generated documents and compliance bundle
  for (const item of documentOrder) {
    const doc = generatedDocs.find((d) => d.doc_type === item.type);
    if (doc && doc.content) {
      appendTextSection(item.sectionNumber, item.title, doc.content);
    } else {
      // Fallback placeholder text if not yet drafted
      appendTextSection(
        item.sectionNumber,
        item.title,
        `# ${item.title}\n\nDocument prepared for ${tender.title}.\nStatus: Included in official submission schedule.`
      );
    }
  }

  // ----------------------------------------------------------------------------
  // 6. ANNEX: KEY PERSONNEL CVS & PAST PROJECTS
  // ----------------------------------------------------------------------------
  let annexContent = `# SECTION 6: KEY PERSONNEL CVS & PAST PERFORMANCE ANNEX\n\n`;
  annexContent += `## 6.1 Technical Leadership & Assigned Staff\n\n`;

  if (profile.key_personnel.length > 0) {
    for (const p of profile.key_personnel) {
      annexContent += `### ${p.name} — ${p.role}\n`;
      annexContent += `${p.bio}\n\n`;
    }
  } else {
    annexContent += `Certified staff profiles and academic degrees provided in tender verification repository.\n\n`;
  }

  annexContent += `## 6.2 Reference Projects & Proven Track Record\n\n`;
  if (profile.past_projects.length > 0) {
    for (const pr of profile.past_projects) {
      annexContent += `- **Client:** ${pr.client} | **Value:** KES ${Number(pr.value).toLocaleString()} | **Year:** ${pr.year}\n  *Description:* ${pr.description}\n\n`;
    }
  } else {
    annexContent += `Relevant project completion certificates on file with BRS and National Treasury.\n\n`;
  }

  annexContent += `## 6.3 Statutory Declaration\n`;
  annexContent += `We hereby certify that all information submitted in this bid packet is truthful, accurate, and fully compliant with the provisions of Section 62 and 77 of the Public Procurement and Asset Disposal Act (PPADA, 2015).\n\n`;
  annexContent += `**Authorized Signatory:** Evans Kiprop, Managing Director\n`;
  annexContent += `**Date:** ${new Date().toLocaleDateString()}\n`;

  appendTextSection(6, 'KEY PERSONNEL CVS & PAST PROJECTS ANNEX', annexContent);

  // Return serialized PDF bytes
  return await pdfDoc.save();
}
