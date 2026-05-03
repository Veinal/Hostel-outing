import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../auth/useAuth';
import client from '../../api/client';

export default function CertificatePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const printRef = useRef();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await client.get(`/certificates/${id}`);
        setCertificate(res.data.data.certificate);
      } catch (err) {
        setError(
          err.response?.data?.error?.message || 
          'Failed to load certificate'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id]);

  const handlePrint = () => window.print();

  const formatDateTime = (dt) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center 
      justify-center">
      <div className="text-slate-500 text-lg">
        Loading certificate...
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center 
      justify-center">
      <div className="bg-white rounded-xl p-8 shadow text-center">
        <p className="text-red-500 font-semibold text-lg">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 bg-slate-100 hover:bg-slate-200 
            text-gray-700 px-6 py-2 rounded-lg"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  if (!certificate) return null;

  const { request } = certificate;
  const { student, warden } = request;
  const room = student?.room;
  const block = room?.floor?.block;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">

      {/* Action Bar — hidden on print */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between 
        items-center print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-100 hover:bg-slate-200 text-gray-700 
            px-4 py-2 rounded-lg text-sm font-medium"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-500 hover:bg-blue-600 text-white 
              px-6 py-2 rounded-lg text-sm font-medium"
          >
            🖨️ Print / Download PDF
          </button>
        </div>
      </div>

      {/* Certificate Card */}
      <div 
        ref={printRef}
        className="max-w-3xl mx-auto bg-white rounded-2xl 
          shadow-lg border border-slate-200 overflow-hidden"
      >

        {/* Header Band */}
        <div className="bg-slate-800 px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs uppercase 
                tracking-widest mb-1">
                Mangalore Institute of Technology & Engineering
              </p>
              <h1 className="text-white font-bold text-2xl">
                Hostel Outing Permission
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Official Approval Certificate
              </p>
            </div>
            <div className="text-right">
              <span className="bg-emerald-500 text-white px-4 py-1 
                rounded-full text-sm font-bold block mb-2">
                {request.approvalNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs 
                font-semibold ${
                  certificate.status === 'ACTIVE' 
                    ? 'bg-blue-500 text-white'
                  : certificate.status === 'STEPPED_OUT'
                    ? 'bg-amber-400 text-white'
                  : certificate.status === 'COMPLETED'
                    ? 'bg-emerald-500 text-white'
                  : 'bg-gray-500 text-white'
                }`}>
                {certificate.status}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          <div className="grid grid-cols-3 gap-8">

            {/* Left Column — Student Details */}
            <div className="col-span-2 space-y-6">

              {/* Student Info */}
              <div>
                <h2 className="text-slate-500 text-xs uppercase 
                  font-semibold tracking-wide mb-3 border-b 
                  border-slate-100 pb-2">
                  Student Details
                </h2>
                <div className="flex items-center gap-4 mb-4">
                  {student?.photoUrl ? (
                    <img 
                      src={student.photoUrl} 
                      alt={student.fullName}
                      className="w-16 h-16 rounded-full object-cover 
                        border-2 border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full 
                      bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-500 text-xl font-bold">
                        {student?.fullName?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-800 font-bold text-xl">
                      {student?.fullName}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {student?.usn}
                    </p>
                    <p className="text-slate-500 text-sm">
                      {student?.branch} — Year {student?.year}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase 
                      font-semibold">Room</p>
                    <p className="text-slate-800 font-medium">
                      {room?.displayName || 'N/A'}
                      {block ? ` (Block ${block.name})` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase 
                      font-semibold">Phone</p>
                    <p className="text-slate-800 font-medium">
                      {student?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h2 className="text-slate-500 text-xs uppercase 
                  font-semibold tracking-wide mb-3 border-b 
                  border-slate-100 pb-2">
                  Permission Details
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs uppercase 
                      font-semibold">Request Type</p>
                    <p className="text-slate-800 font-medium">
                      {request.requestType?.replace('_', ' ')}
                    </p>
                  </div>
                  {request.location && (
                    <div>
                      <p className="text-slate-400 text-xs uppercase 
                        font-semibold">Destination</p>
                      <p className="text-slate-800 font-medium">
                        {request.location}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-400 text-xs uppercase 
                      font-semibold">Reason</p>
                    <p className="text-slate-800 font-medium">
                      {request.reason}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs uppercase 
                      font-semibold">Approved By</p>
                    <p className="text-slate-800 font-medium">
                      {warden?.fullName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timing Details */}
              <div>
                <h2 className="text-slate-500 text-xs uppercase 
                  font-semibold tracking-wide mb-3 border-b 
                  border-slate-100 pb-2">
                  Timing
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3 
                    border border-blue-100">
                    <p className="text-blue-500 text-xs uppercase 
                      font-semibold mb-1">Expected Departure</p>
                    <p className="text-slate-800 font-bold">
                      {formatDateTime(request.outDateTime)}
                    </p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-3 
                    border border-emerald-100">
                    <p className="text-emerald-600 text-xs uppercase 
                      font-semibold mb-1">Expected Return</p>
                    <p className="text-slate-800 font-bold">
                      {formatDateTime(request.expectedReturnDateTime)}
                    </p>
                  </div>
                  {certificate.exitScannedAt && (
                    <div className="bg-amber-50 rounded-lg p-3 
                      border border-amber-100">
                      <p className="text-amber-600 text-xs uppercase 
                        font-semibold mb-1">Actual Exit</p>
                      <p className="text-slate-800 font-bold">
                        {formatDateTime(certificate.exitScannedAt)}
                      </p>
                    </div>
                  )}
                  {certificate.entryScannedAt && (
                    <div className="bg-slate-50 rounded-lg p-3 
                      border border-slate-200">
                      <p className="text-slate-500 text-xs uppercase 
                        font-semibold mb-1">Actual Return</p>
                      <p className="text-slate-800 font-bold">
                        {formatDateTime(certificate.entryScannedAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column — QR Code */}
            <div className="col-span-1 flex flex-col items-center 
              justify-start pt-2">
              <div className="bg-white border-2 border-slate-200 
                rounded-xl p-4 flex flex-col items-center gap-3
                sticky top-4">
                <p className="text-slate-500 text-xs uppercase 
                  font-semibold text-center">Scan at Gate</p>
                {certificate.qrToken ? (
                  <QRCodeSVG
                    value={certificate.qrToken}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-40 h-40 bg-slate-100 
                    flex items-center justify-center rounded-lg">
                    <p className="text-slate-400 text-xs text-center">
                      QR not available
                    </p>
                  </div>
                )}
                <p className="text-slate-400 text-xs text-center">
                  {request.approvalNumber}
                </p>
                <p className="text-slate-400 text-xs text-center">
                  Valid for single exit + entry
                </p>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 
            flex justify-between items-center text-xs text-slate-400">
            <p>
              Approved on {formatDateTime(certificate.approvedAt)}
            </p>
            <p>HPMS — MITE Hostel Management</p>
          </div>

        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white; }
          .shadow-lg { box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
