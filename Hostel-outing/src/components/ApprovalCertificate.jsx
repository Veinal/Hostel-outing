import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, formatTime, generateQRData } from '../utils/approvalUtils';
import { QRCode } from './QRCode';
import QRCodeLib from 'qrcode';
import { 
  Print as PrintIcon, 
  Download as DownloadIcon, 
  ArrowLeft as ArrowLeftIcon,
  CheckCircle as CheckCircleIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

export const ApprovalCertificate = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const certRef = useRef(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const certificateDoc = await getDoc(doc(db, 'approvalCertificates', certificateId));
        if (certificateDoc.exists()) {
          const certData = certificateDoc.data();
          setCertificate(certData);
          
                  // Generate QR code data
        const qrData = generateQRData(certData.approvalNumber, certData.requestId);
        setQrCodeUrl(qrData);
        } else {
          setError('Certificate not found');
        }
      } catch (err) {
        console.error('Error fetching certificate:', err);
        setError('Failed to load certificate');
      } finally {
        setIsLoading(false);
      }
    };

    if (certificateId) {
      fetchCertificate();
    }
  }, [certificateId]);

  const handlePrint = async () => {
    // Generate a real QR code image (data URL) for embedding in the print view
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCodeLib.toDataURL(qrCodeUrl, {
        width: 150,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      });
    } catch (e) {
      console.error('Failed to generate QR for print view', e);
    }

    // Open printable window with the same format as download
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Approval Certificate - ${certificate?.approvalNumber}</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; margin: 0; background: #f9fafb; }
            .page { padding: 16px 0; }
            .container { max-width: 896px; margin: 0 auto; padding: 0 16px; }
            .card { background: #ffffff; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); padding: 24px; border: 4px solid #1f2937; }
            .section { margin-bottom: 24px; }
            .title { text-align: center; font-weight: 700; color: #1f2937; font-size: 20px; margin: 0 0 8px; }
            .badge { display: inline-flex; align-items: center; gap: 6px; color: #059669; font-weight: 600; font-size: 12px; }
            .approvalBox { background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 12px; text-align: center; }
            .approvalLabel { color: #4b5563; font-size: 14px; margin: 0 0 4px; }
            .approvalNumber { color: #059669; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 24px; word-break: break-all; margin: 0; }
            .flexRow { display: flex; align-items: center; justify-content: center; gap: 16px; }
            .avatar { width: 128px; height: 128px; border-radius: 8px; object-fit: cover; border: 2px solid #e5e7eb; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
            .placeholder { width: 128px; height: 128px; border-radius: 8px; border: 2px dashed #d1d5db; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }
            .name { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
            .meta { color: #374151; font-size: 14px; margin-top: 4px; }
            .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
            .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .label { color: #6b7280; font-weight: 600; font-size: 14px; min-width: 80px; }
            .value { color: #111827; font-size: 14px; }
            .qrWrap { text-align: center; margin-top: 8px; }
            .qrBox { display: inline-block; background: #f3f4f6; padding: 12px; border-radius: 8px; }
            .qrImg { width: 120px; height: 120px; display: block; }
            .sig { text-align: right; border-top: 1px solid #e5e7eb; padding-top: 16px; }
            .sigLine { border-top: 2px solid #1f2937; width: 96px; margin: 4px auto 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 16px; }
            @media print { body { background: #ffffff; } .card { border-width: 2px; box-shadow: none; } .page { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="container">
              <div class="card">
                <!-- Header and approval status -->
                <div class="section" style="text-align:center;">
                  <div class="approvalBox">
                    <p class="approvalLabel">Approval Number</p>
                    <p class="approvalNumber">${certificate.approvalNumber}</p>
                  </div>
                  <div class="badge">APPROVED</div>
                </div>

                <!-- Identity block -->
                <div class="section">
                  <div class="flexRow">
                    ${certificate.studentPhotoUrl ? `<img src="${certificate.studentPhotoUrl}" alt="Student" class="avatar" />` : `<div class="placeholder">No Photo</div>`}
                    <div style="text-align:center;">
                      <p class="name">${certificate.studentName}</p>
                      <p class="meta"><strong>USN:</strong> ${certificate.studentUSN || certificate.studentDetails?.usn || 'N/A'}</p>
                      <p class="meta">${certificate.studentBranch || certificate.studentDetails?.branch || 'N/A'} • Year ${certificate.studentYear || certificate.studentDetails?.year || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <!-- Details grid -->
                <div class="section grid2">
                  <div class="grid">
                    <div><span class="label">Full Name:</span> <span class="value">${certificate.studentName}</span></div>
                    <div><span class="label">USN:</span> <span class="value">${certificate.studentUSN || certificate.studentDetails?.usn || 'N/A'}</span></div>
                    <div><span class="label">Branch:</span> <span class="value">${certificate.studentBranch || certificate.studentDetails?.branch || 'N/A'}</span></div>
                    <div><span class="label">Year:</span> <span class="value">${certificate.studentYear || certificate.studentDetails?.year || 'N/A'}</span></div>
                    <div><span class="label">Block:</span> <span class="value">${certificate.studentBlock || certificate.studentDetails?.block || 'N/A'}</span></div>
                    <div><span class="label">Room:</span> <span class="value">${certificate.studentRoom || certificate.studentDetails?.room || 'N/A'}</span></div>
                  </div>
                  <div class="grid">
                    <div><span class="label">Request Type:</span> <span class="value">${certificate.requestType}</span></div>
                    <div><span class="label">Reason:</span> <span class="value">${certificate.reason}</span></div>
                    <div><span class="label">Out Date:</span> <span class="value">${formatDate(certificate.outDate)}</span></div>
                    <div><span class="label">Out Time:</span> <span class="value">${formatTime(certificate.outTime)}</span></div>
                    <div><span class="label">Return Date:</span> <span class="value">${formatDate(certificate.returnDate)}</span></div>
                    <div><span class="label">Return Time:</span> <span class="value">${formatTime(certificate.returnTime)}</span></div>
                  </div>
                </div>

                <!-- QR section -->
                <div class="section qrWrap">
                  <h3 style="color:#1f2937; font-weight:700; margin:0 0 8px;">Verification QR Code</h3>
                  <div class="qrBox">
                    ${qrDataUrl ? `<img class="qrImg" src="${qrDataUrl}" alt="QR Code" />` : '<div style="width:120px;height:120px;display:flex;align-items:center;justify-content:center;background:#fff;color:#9ca3af;border:1px solid #e5e7eb;">QR unavailable</div>'}
                  </div>
                  <p style="color:#6b7280; font-size: 12px; margin-top: 6px;">Scan this QR code to verify the approval</p>
                </div>

                <!-- Signature -->
                <div class="sig">
                  <div style="display:inline-block;text-align:center;">
                    <p style="font-weight:600;color:#111827;margin:0 0 4px;font-size:12px;">Approved by:</p>
                    <p style="color:#4b5563;margin:0 0 6px;font-size:12px;">${certificate.wardenName}</p>
                    <div class="sigLine"></div>
                    <p style="color:#6b7280;margin:6px 0 0;font-size:11px;">Warden</p>
                  </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                  <p><strong>Valid until:</strong> ${formatDate(certificate.returnDate)}</p>
                  <p><strong>Generated on:</strong> ${formatDate(certificate.approvedAt?.toDate?.() || new Date())}</p>
                  <p>Keep this document safe and present it when leaving/entering the hostel premises</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleDownload = async () => {
    try {
      const ensureScript = (src) => new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) { existing.onload ? existing.onload = () => resolve() : resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Failed to load ' + src));
        document.head.appendChild(s);
      });

      await ensureScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) throw new Error('jsPDF not available');

      // Build assets
      // 1) QR code as data URL
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCodeLib.toDataURL(qrCodeUrl, { width: 180, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
      } catch (e) {
        console.error('Failed to generate QR:', e);
      }

      // 2) Student photo as data URL (if accessible), else skip
      let studentPhotoDataUrl = '';
      if (certificate.studentPhotoUrl) {
        try {
          const res = await fetch(certificate.studentPhotoUrl, { mode: 'cors' });
          const blob = await res.blob();
          const reader = new FileReader();
          const dataUrlPromise = new Promise((resolve) => { reader.onloadend = () => resolve(reader.result); });
          reader.readAsDataURL(blob);
          studentPhotoDataUrl = await dataUrlPromise;
        } catch (e) {
          console.warn('Could not inline student photo; skipping image in PDF');
        }
      }

      // Create PDF with a card and two-column layout similar to on-screen
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const outerMargin = 32; // page padding
      const cardPad = 32; // inner card padding
      const cardX = outerMargin;
      const cardY = outerMargin;
      const cardW = pageWidth - outerMargin * 2;
      const cardH = pageHeight - outerMargin * 2;

      // Card border (rounded)
      pdf.setDrawColor(31, 41, 55);
      pdf.setLineWidth(3);
      if (pdf.roundedRect) {
        pdf.roundedRect(cardX, cardY, cardW, cardH, 10, 10);
      } else {
        pdf.rect(cardX, cardY, cardW, cardH);
      }

      let y = cardY + cardPad;
      const xCenter = cardX + cardW / 2;

      // Approval box (center)
      const apprBoxW = cardW - cardPad * 2;
      const apprBoxX = cardX + cardPad;
      pdf.setFillColor(243, 244, 246);
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(1);
      if (pdf.roundedRect) {
        pdf.roundedRect(apprBoxX, y, apprBoxW, 56, 6, 6, 'F');
      } else {
        pdf.rect(apprBoxX, y, apprBoxW, 56, 'F');
      }
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Approval Number', xCenter, y + 18, { align: 'center' });
      pdf.setFont('courier', 'bold');
      pdf.setFontSize(24);
      pdf.setTextColor(5, 150, 105);
      pdf.text(String(certificate.approvalNumber || ''), xCenter, y + 40, { align: 'center' });
      y += 74;

      // Status badge
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(5, 150, 105);
      pdf.text('APPROVED', xCenter, y, { align: 'center' });
      y += 22;

      // Identity row: photo at left, text on same horizontal line when possible
      const photoSize = 96;
      const textGap = 16;
      const textAreaW = cardW - cardPad * 2 - photoSize - textGap;
      const photoX = cardX + cardPad;
      const photoY = y;
      if (studentPhotoDataUrl) {
        try { pdf.addImage(studentPhotoDataUrl, 'JPEG', photoX, photoY, photoSize, photoSize); } catch {}
      } else {
        pdf.setDrawColor(209, 213, 219);
        pdf.rect(photoX, photoY, photoSize, photoSize);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(156, 163, 175);
        pdf.text('No Photo', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
      }

      const textX = photoX + photoSize + textGap;
      const textY = photoY + 6;
      const usn = certificate.studentUSN || certificate.studentDetails?.usn || 'N/A';
      const branch = certificate.studentBranch || certificate.studentDetails?.branch || 'N/A';
      const year = certificate.studentYear || certificate.studentDetails?.year || 'N/A';

      // Line 1: Name (bold)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(17, 24, 39);
      pdf.text(String(certificate.studentName || ''), textX, textY + 16);

      // Line 2: USN
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.setTextColor(55, 65, 81);
      pdf.text(`USN: ${usn}`, textX, textY + 32);

      // Line 3: Branch and Year, allow wrapping and use smaller font
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(55, 65, 81);
      const branchYear = `${branch} • Year ${year}`;
      const wrappedBY = pdf.splitTextToSize(branchYear, textAreaW);
      pdf.text(wrappedBY, textX, textY + 48);
      const wrappedCount = Array.isArray(wrappedBY) ? wrappedBY.length : 1;
      const blockHeight = 48 + wrappedCount * 14; // approx line height
      y = Math.max(photoY + photoSize, photoY + blockHeight) + 12;
      // Extra gap before two-column grid
      y += 8;

      // Two-column details grid with titles and bottom borders
      const gridPadX = cardX + cardPad;
      const gridW = cardW - cardPad * 2;
      const gap = 36;
      const colW = (gridW - gap) / 2;
      const leftX = gridPadX;
      const rightX = gridPadX + colW + gap;

      const drawSectionTitle = (x, title) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(31, 41, 55);
        pdf.text(title, x, y);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(1);
        pdf.line(x, y + 6, x + colW, y + 6);
      };
      drawSectionTitle(leftX, 'Student Information');
      drawSectionTitle(rightX, 'Request Details');
      y += 18;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      const labelColor = [107, 114, 128];
      const valueColor = [17, 24, 39];
      const lineH = 18;
      let yLeft = y;
      let yRight = y;
      const row = (x, yy, label, value) => {
        pdf.setTextColor(...labelColor);
        pdf.text(`${label}:`, x, yy);
        pdf.setTextColor(...valueColor);
        const valueX = x + 90;
        const maxW = x + colW - valueX;
        const lines = pdf.splitTextToSize(String(value ?? ''), maxW);
        pdf.text(lines, valueX, yy);
        return Array.isArray(lines) ? lines.length : 1;
      };
      yLeft += row(leftX, yLeft, 'Full Name', certificate.studentName) * lineH;
      yLeft += row(leftX, yLeft, 'USN', usn) * lineH;
      yLeft += row(leftX, yLeft, 'Branch', branch) * lineH;
      yLeft += row(leftX, yLeft, 'Year', year) * lineH;
      yLeft += row(leftX, yLeft, 'Block', certificate.studentBlock || certificate.studentDetails?.block || 'N/A') * lineH;
      yLeft += row(leftX, yLeft, 'Room', certificate.studentRoom || certificate.studentDetails?.room || 'N/A') * lineH;

      yRight += row(rightX, yRight, 'Request Type', certificate.requestType) * lineH;
      yRight += row(rightX, yRight, 'Reason', certificate.reason) * lineH;
      yRight += row(rightX, yRight, 'Out Date', formatDate(certificate.outDate)) * lineH;
      yRight += row(rightX, yRight, 'Out Time', formatTime(certificate.outTime)) * lineH;
      yRight += row(rightX, yRight, 'Return Date', formatDate(certificate.returnDate)) * lineH;
      yRight += row(rightX, yRight, 'Return Time', formatTime(certificate.returnTime)) * lineH;

      y = Math.max(yLeft, yRight) + 20;

      // QR section centered
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(31, 41, 55);
      pdf.text('Verification QR Code', xCenter, y, { align: 'center' });
      y += 12;
      pdf.setFillColor(243, 244, 246);
      const qrOuter = 110;
      const qrX = xCenter - qrOuter / 2;
      const qrY = y;
      if (pdf.roundedRect) {
        pdf.roundedRect(qrX, qrY, qrOuter, qrOuter, 8, 8, 'F');
      } else {
        pdf.rect(qrX, qrY, qrOuter, qrOuter, 'F');
      }
      if (qrDataUrl) {
        try { pdf.addImage(qrDataUrl, 'JPEG', qrX + 6, qrY + 6, qrOuter - 12, qrOuter - 12); } catch {}
      }
      y += qrOuter + 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Scan this QR code to verify the approval', xCenter, y, { align: 'center' });
      y += 22;

      // Distribute remaining space so signature/footer sit at the bottom of the card
      const estimatedFooterBlock = 70; // signature + footer
      const remaining = (cardY + cardH) - (y + estimatedFooterBlock + cardPad);
      if (remaining > 0) {
        y += remaining;
      }

      // Signature block right aligned
      const sigW = 160;
      const sigX1 = cardX + cardW - cardPad - sigW;
      pdf.setDrawColor(31, 41, 55);
      pdf.setLineWidth(2);
      pdf.line(sigX1, y, sigX1 + sigW, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(17, 24, 39);
      pdf.text('Approved by:', sigX1, y - 8);
      pdf.setTextColor(75, 85, 99);
      const wardenName = String(
        certificate.wardenName ||
        certificate.approvedByName ||
        certificate.approvedBy ||
        (certificate.warden && (certificate.warden.fullName || certificate.warden.name)) ||
        'Warden'
      );
      pdf.text(wardenName, sigX1, y + 16);
      y += 34;

      // Footer centered
      pdf.setFontSize(10);
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Valid until: ${formatDate(certificate.returnDate)}`, xCenter, y, { align: 'center' });
      y += 14;
      pdf.text(`Generated on: ${formatDate(certificate.approvedAt?.toDate?.() || new Date())}`, xCenter, y, { align: 'center' });
      y += 14;
      pdf.text('Keep this document safe and present it when leaving/entering the hostel premises', xCenter, y, { align: 'center' });

      pdf.save(`Approval_Certificate_${certificate.approvalNumber}.pdf`);
    } catch (err) {
      console.error('Screenshot PDF download failed:', err);
      alert('Failed to download PDF. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6">
    <div className="max-w-4xl mx-auto px-3 sm:px-4">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-gray-200 text-gray-700 px-2 sm:px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300 transition"
          >
            <ArrowLeftIcon fontSize="small" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex-grow text-center">
            <h1 className="text-xl font-bold text-gray-800 mb-1">
              Hostel Outing Approval Certificate
            </h1>
            {/* <p className="text-sm text-gray-600">Official Authorization Document</p> */}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
            >
              <PrintIcon fontSize="small" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
            >
              <DownloadIcon fontSize="small" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>

        {/* Certificate */}
         <div id="certificate-capture" ref={certRef} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 sm:border-4 border-gray-800">
           {/* Approval Number */}
           <div className="text-center mb-6">
             <div className="bg-gray-100 rounded-lg p-4 mb-3">
               <p className="text-gray-600 text-sm sm:text-base mb-1">Approval Number</p>
               <p className="text-2xl sm:text-3xl font-bold text-green-600 font-mono break-all">
                 {certificate.approvalNumber}
               </p>
             </div>
             <div className="flex items-center justify-center gap-2 text-green-600">
               <CheckCircleIcon fontSize="small" />
               <span className="font-semibold text-sm">APPROVED</span>
             </div>
           </div>

          {/* Identity Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-4 sm:gap-6 mb-6">
            {certificate.studentPhotoUrl ? (
              <img
                src={certificate.studentPhotoUrl}
                alt="Student"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-md object-cover border-2 border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                No Photo
              </div>
            )}
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{certificate.studentName}</div>
              <div className="text-sm sm:text-base text-gray-700 mt-1">
                <span className="font-semibold">USN:</span> {certificate.studentUSN || certificate.studentDetails?.usn || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">{certificate.studentBranch || certificate.studentDetails?.branch || 'N/A'} • Year {certificate.studentYear || certificate.studentDetails?.year || 'N/A'}</div>
            </div>
          </div>

          {/* Student Details */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
             <div>
               <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <SecurityIcon fontSize="small" />
                 Student Information
               </h3>
               <div className="space-y-2 sm:space-y-3">
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Full Name:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentName}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">USN:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentUSN || certificate.studentDetails?.usn || 'N/A'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Branch:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentBranch || certificate.studentDetails?.branch || 'N/A'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Year:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentYear || certificate.studentDetails?.year || 'N/A'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Block:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentBlock || certificate.studentDetails?.block || 'N/A'}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Room:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.studentRoom || certificate.studentDetails?.room || 'N/A'}</p>
                 </div>
               </div>
             </div>

                         <div>
               <h3 className="text-lg font-bold text-gray-800 mb-3">Request Details</h3>
               <div className="space-y-2 sm:space-y-3">
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Request Type:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.requestType}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Reason:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{certificate.reason}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Out Date:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{formatDate(certificate.outDate)}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Out Time:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{formatTime(certificate.outTime)}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Return Date:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{formatDate(certificate.returnDate)}</p>
                 </div>
                 <div className="flex items-center gap-2">
                   <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">Return Time:</label>
                   <p className="text-gray-900 text-sm sm:text-base font-medium">{formatTime(certificate.returnTime)}</p>
                 </div>
               </div>
             </div>
          </div>

                     {/* QR Code */}
           <div className="text-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 mb-3">Verification QR Code</h3>
             <div className="inline-block bg-gray-100 p-3 rounded-lg">
               <QRCode data={qrCodeUrl} size={120} />
             </div>
             <p className="text-xs text-gray-600 mt-2">
               Scan this QR code to verify the approval
             </p>
           </div>

                     {/* Warden Signature */}
           <div className="text-right border-t pt-4">
             <div className="inline-block text-center">
               <p className="font-semibold text-gray-800 mb-1 text-sm">Approved by:</p>
               <p className="text-gray-600 mb-2 text-sm">{certificate.wardenName}</p>
               <div className="border-t-2 border-gray-800 w-24 mx-auto mb-1"></div>
               <p className="text-xs text-gray-600">Warden</p>
             </div>
           </div>

                     {/* Footer */}
           <div className="text-center mt-6 text-xs text-gray-600">
             <p className="mb-1">
               <strong>Valid until:</strong> {formatDate(certificate.returnDate)}
             </p>
             <p className="mb-1">
               <strong>Generated on:</strong> {formatDate(certificate.approvedAt?.toDate?.() || new Date())}
             </p>
             <p className="text-xs">
               Keep this document safe and present it when leaving/entering the hostel premises
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};
