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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header with Actions */}
        <div className="flex justify-between items-center mb-6 print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            🖨️ Print
          </button>
        </div>

        {/* Certificate */}
        <div id="certificate-capture" ref={certRef} className="bg-white rounded-2xl shadow-lg border border-slate-200 w-full print-area">
          {/* Certificate Header Band */}
          <div className="bg-slate-800 text-white rounded-t-2xl px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-white font-bold text-2xl">Approval Certificate</h1>
              <p className="text-slate-300 text-sm mt-1">Hostel Outing Pass</p>
            </div>
            <div className="text-right">
              <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold inline-block">
                {request.approvalNumber || cert.id}
              </span>
            </div>
          </div>

          <div className="p-8">

          {/* Identity Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-start gap-4 sm:gap-6 mb-8 pb-8 border-b border-slate-200">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="Student"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover shadow-sm border border-slate-200"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-sm bg-slate-50">
                No Photo
              </div>
            )}
            <div className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-bold text-slate-800 leading-tight mb-2">{student.fullName}</div>
              <div className="text-sm sm:text-base text-slate-600">
                <span className="font-medium text-slate-800">USN:</span> {student.usn || 'N/A'}
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {student.branch || 'N/A'} • Year {student.year || 'N/A'}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                Student Information
              </h3>
              <div className="space-y-3">
                {[
                  ['Full Name', student.fullName],
                  ['USN', student.usn || 'N/A'],
                  ['Branch', student.branch || 'N/A'],
                  ['Year', student.year || 'N/A'],
                  ['Block', student.room?.block?.name || 'N/A'],
                  ['Room', student.room?.displayName || 'N/A'],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <label className="text-slate-500 text-xs uppercase font-semibold tracking-wide min-w-[100px] flex-shrink-0">{label}:</label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200">Request Details</h3>
              <div className="space-y-3">
                {[
                  ['Request Type', request.requestType],
                  ['Reason', request.reason],
                  ['Out Date', formatDate(request.outDateTime)],
                  ['Out Time', formatTime(request.outDateTime)],
                  ['Return Date', formatDate(request.expectedReturnDateTime)],
                  ['Return Time', formatTime(request.expectedReturnDateTime)],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2">
                    <label className="text-slate-500 text-xs uppercase font-semibold tracking-wide min-w-[100px] flex-shrink-0">{label}:</label>
                    <p className="text-slate-800 font-medium text-sm sm:text-base">{val}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QR Code — Step 6 rule: use cert.qrToken directly as QR value */}
          <div className="text-center mb-8 border-t border-slate-200 pt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Verification QR Code</h3>
            <div className="inline-block bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <QRCodeSVG value={cert.qrToken} size={140} />
            </div>
            <p className="text-sm text-slate-500 mt-3">
              Scan this QR code to verify the approval
            </p>
          </div>

          {/* Warden Signature */}
          <div className="text-right pb-4">
            <div className="inline-block text-center">
              <p className="font-semibold text-slate-800 mb-2 text-sm">Approved by:</p>
              <p className="text-slate-600 mb-3 text-sm">{request.warden?.fullName || 'Warden'}</p>
              <div className="border-t-2 border-slate-800 w-32 mx-auto mb-1"></div>
              <p className="text-xs text-slate-500 font-medium">Warden</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-6 border-t border-slate-200 text-sm text-slate-500">
            <p className="mb-1">
              <strong className="text-slate-700">Valid until:</strong> {formatDate(request.expectedReturnDateTime)}
            </p>
            <p className="mb-2">
              <strong className="text-slate-700">Generated on:</strong> {formatDate(cert.createdAt || new Date())}
            </p>
            <p className="text-xs text-slate-400">
              Keep this document safe and present it when leaving/entering the hostel premises
            </p>
          </div>
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
