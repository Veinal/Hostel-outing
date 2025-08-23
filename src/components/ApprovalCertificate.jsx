import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDate, formatTime, generateQRData } from '../utils/approvalUtils';
import { QRCode } from './QRCode';
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version and download as PDF
    const printWindow = window.open('', '_blank');
    
    // Generate QR pattern for the download version
    const generateQRPattern = (text) => {
      const hash = text.split('').reduce((a, b) => {
        a = ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff;
        return a;
      }, 0);
      
      const pattern = [];
      for (let i = 0; i < 25; i++) {
        pattern.push((hash >> i) & 1);
      }
      return pattern;
    };
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Approval Certificate - ${certificate?.approvalNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .certificate { border: 3px solid #1f2937; padding: 30px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .subtitle { font-size: 16px; color: #6b7280; }
            .approval-number { background: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .approval-number span { font-size: 24px; font-weight: bold; color: #059669; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .detail-item { margin-bottom: 15px; }
            .detail-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .detail-value { color: #1f2937; }
            .qr-section { text-align: center; margin: 30px 0; }
            .qr-code { max-width: 150px; }
            .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 14px; }
            .warden-signature { margin-top: 30px; text-align: right; }
            .signature-line { border-top: 1px solid #000; width: 200px; display: inline-block; margin-top: 5px; }
            @media print { body { margin: 0; } .certificate { border: none; } }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">
              <div class="title">HOSTEL OUTING APPROVAL CERTIFICATE</div>
              <div class="subtitle">Official Authorization Document</div>
            </div>
            
            <div class="approval-number">
              <div>Approval Number:</div>
              <span>${certificate?.approvalNumber}</span>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Student Name:</div>
                <div class="detail-value">${certificate?.studentName}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">USN:</div>
                <div class="detail-value">${certificate?.studentRollNo}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Branch:</div>
                <div class="detail-value">${certificate?.studentBranch}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Year:</div>
                <div class="detail-value">${certificate?.studentYear}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Block:</div>
                <div class="detail-value">${certificate?.studentBlock}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Room:</div>
                <div class="detail-value">${certificate?.studentRoom}</div>
              </div>
            </div>
            
            <div class="details">
              <div class="detail-item">
                <div class="detail-label">Request Type:</div>
                <div class="detail-value">${certificate?.requestType}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Reason:</div>
                <div class="detail-value">${certificate?.reason}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Out Date:</div>
                <div class="detail-value">${formatDate(certificate?.outDate)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Out Time:</div>
                <div class="detail-value">${formatTime(certificate?.outTime)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Return Date:</div>
                <div class="detail-value">${formatDate(certificate?.returnDate)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Return Time:</div>
                <div class="detail-value">${formatTime(certificate?.returnTime)}</div>
              </div>
            </div>
            
            <div class="qr-section">
              <div>Verification QR Code:</div>
              <div class="qr-code">
                <div style="display: inline-block; background: white; padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                  <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; width: 150px; height: 150px;">
                    ${generateQRPattern(qrCodeUrl).map((cell, index) => 
                      `<div style="width: 100%; height: 100%; background: ${cell ? '#000' : '#fff'}; min-height: 1px;"></div>`
                    ).join('')}
                  </div>
                  <div style="text-align: center; font-size: 12px; color: #666; margin-top: 4px;">QR Code</div>
                </div>
              </div>
            </div>
            
            <div class="warden-signature">
              <div>Approved by:</div>
              <div>${certificate?.wardenName}</div>
              <div class="signature-line"></div>
              <div>Warden</div>
            </div>
            
            <div class="footer">
              <p>This certificate is valid until ${formatDate(certificate?.returnDate)}</p>
              <p>Generated on ${formatDate(certificate?.approvedAt?.toDate?.() || new Date())}</p>
              <p>Keep this document safe and present it when leaving/entering the hostel premises</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
      <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300 transition"
          >
            <ArrowLeftIcon fontSize="small" />
            <span>Back</span>
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
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700"
            >
              <DownloadIcon fontSize="small" />
              Download
            </button>
          </div>
        </div>
      </div>

                 {/* Certificate */}
         <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 sm:border-4 border-gray-800">
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

                     {/* Student Details */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
             <div>
               <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                 <SecurityIcon fontSize="small" />
                 Student Information
               </h3>
               <div className="space-y-2 sm:space-y-3">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Full Name:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentName}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Roll Number:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentRollNo || certificate.studentDetails?.rollNo || 'N/A'}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Branch:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentBranch || certificate.studentDetails?.branch || 'N/A'}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Year:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentYear || certificate.studentDetails?.year || 'N/A'}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Block:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentBlock || certificate.studentDetails?.block || 'N/A'}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Room:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.studentRoom || certificate.studentDetails?.room || 'N/A'}</p>
                 </div>
               </div>
             </div>

                         <div>
               <h3 className="text-lg font-bold text-gray-800 mb-3">Request Details</h3>
               <div className="space-y-2 sm:space-y-3">
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Request Type:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.requestType}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Reason:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{certificate.reason}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Out Date:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{formatDate(certificate.outDate)}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Out Time:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{formatTime(certificate.outTime)}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Return Date:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{formatDate(certificate.returnDate)}</p>
                 </div>
                 <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                   <label className="font-semibold text-gray-600 text-sm min-w-[80px]">Return Time:</label>
                   <p className="text-gray-800 text-sm sm:text-base">{formatTime(certificate.returnTime)}</p>
                 </div>
               </div>
             </div>
          </div>

                     {/* QR Code */}
           <div className="text-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 mb-3">Verification QR Code</h3>
             <div className="inline-block bg-gray-100 p-3 rounded-lg">
               <QRCode data={qrCodeUrl} size={100} />
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
