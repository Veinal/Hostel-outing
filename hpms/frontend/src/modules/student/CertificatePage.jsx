import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import client from '../../api/client';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};

export default function CertificatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cert, setCert] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const certRef = useRef(null);

  useEffect(() => {
    client.get(`/certificates/${id}`)
      .then(res => setCert(res.data.data.certificate))
      .catch(() => setError('Failed to load certificate'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
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

  if (!cert) return null;

  const { request } = cert;
  const { student } = request;

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
              ← <span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex-grow text-center">
              <h1 className="text-xl font-bold text-gray-800 mb-1">
                Hostel Outing Approval Certificate
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
              >
                🖨️ <span className="hidden sm:inline">Print</span>
              </button>
            </div>
          </div>
        </div>

        {/* Certificate */}
        <div id="certificate-capture" ref={certRef} className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 sm:border-4 border-gray-800 print-area">
          {/* Approval Number */}
          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-lg p-4 mb-3">
              <p className="text-gray-600 text-sm sm:text-base mb-1">Approval Number</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 font-mono break-all">
                {request.approvalNumber || cert.id}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <span>✅</span>
              <span className="font-semibold text-sm">APPROVED</span>
            </div>
          </div>

          {/* Identity Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center gap-4 sm:gap-6 mb-6">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
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
              <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{student.fullName}</div>
              <div className="text-sm sm:text-base text-gray-700 mt-1">
                <span className="font-semibold">USN:</span> {student.usn || 'N/A'}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {student.branch || 'N/A'} • Year {student.year || 'N/A'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                🔒 Student Information
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {[
                  ['Full Name', student.fullName],
                  ['USN', student.usn || 'N/A'],
                  ['Branch', student.branch || 'N/A'],
                  ['Year', student.year || 'N/A'],
                  ['Block', student.room?.block?.name || 'N/A'],
                  ['Room', student.room?.displayName || 'N/A'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">{label}:</label>
                    <p className="text-gray-900 text-sm sm:text-base font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Request Details</h3>
              <div className="space-y-2 sm:space-y-3">
                {[
                  ['Request Type', request.requestType],
                  ['Reason', request.reason],
                  ['Out Date', formatDate(request.outDateTime)],
                  ['Out Time', formatTime(request.outDateTime)],
                  ['Return Date', formatDate(request.expectedReturnDateTime)],
                  ['Return Time', formatTime(request.expectedReturnDateTime)],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <label className="font-semibold text-gray-700 text-sm min-w-[80px] flex-shrink-0">{label}:</label>
                    <p className="text-gray-900 text-sm sm:text-base font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code — Step 6 rule: use cert.qrToken directly as QR value */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Verification QR Code</h3>
            <div className="inline-block bg-gray-100 p-3 rounded-lg">
              <QRCodeSVG value={cert.qrToken} size={120} />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Scan this QR code to verify the approval
            </p>
          </div>

          {/* Warden Signature */}
          <div className="text-right border-t pt-4">
            <div className="inline-block text-center">
              <p className="font-semibold text-gray-800 mb-1 text-sm">Approved by:</p>
              <p className="text-gray-600 mb-2 text-sm">{request.warden?.fullName || 'Warden'}</p>
              <div className="border-t-2 border-gray-800 w-24 mx-auto mb-1"></div>
              <p className="text-xs text-gray-600">Warden</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-xs text-gray-600">
            <p className="mb-1">
              <strong>Valid until:</strong> {formatDate(request.expectedReturnDateTime)}
            </p>
            <p className="mb-1">
              <strong>Generated on:</strong> {formatDate(cert.createdAt || new Date())}
            </p>
            <p className="text-xs">
              Keep this document safe and present it when leaving/entering the hostel premises
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; border: none; }
        }
      `}</style>
    </div>
  );
}
