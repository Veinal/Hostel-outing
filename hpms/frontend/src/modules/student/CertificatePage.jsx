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

  const handleBack = () => {
    // If we have history, go back. Otherwise, go to dashboard based on role
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      const dashboardPath = 
        user?.role === 'STUDENT' ? '/student/dashboard' :
        (user?.role === 'WARDEN' || user?.role === 'CHIEF_WARDEN') ? '/warden/dashboard' :
        user?.role === 'ADMIN' ? '/admin/dashboard' :
        user?.role === 'SECURITY' ? '/gate/dashboard' : '/';
      navigate(dashboardPath);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 dark:text-slate-400 font-medium">Validating certificate...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
      <div className="themed-card rounded-2xl p-8 shadow-xl text-center max-w-md w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="text-red-500 font-bold text-xl mb-2">Access Denied</p>
        <p className="text-slate-600 dark:text-slate-400 mb-8">{error}</p>
        <button 
          onClick={handleBack}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 
            text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition-all"
        >
          Return to Dashboard
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 transition-colors duration-300">

      {/* Action Bar — hidden on print */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold"
        >
          <span className="text-xl">←</span> Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <span>🖨️</span> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Certificate Card */}
      <div 
        ref={printRef}
        className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden"
      >

        {/* Header Band */}
        <div className="bg-slate-800 dark:bg-slate-950 px-10 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
          <div className="relative z-10">
            <p className="text-blue-400 text-[10px] uppercase font-black tracking-[0.2em] mb-2">
              Mangalore Institute of Technology & Engineering
            </p>
            <h1 className="text-white font-black text-3xl tracking-tight">
              Hostel Outing Permission
            </h1>
            <div className="flex items-center gap-3 mt-4">
              <span className="bg-white/10 text-white px-4 py-1.5 rounded-full text-xs font-black tracking-wider border border-white/10 uppercase">
                {request.approvalNumber}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                certificate.status === 'ACTIVE' ? 'bg-blue-600' :
                certificate.status === 'STEPPED_OUT' ? 'bg-amber-500' :
                certificate.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-slate-600'
              }`}>
                {certificate.status}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-10 dark:text-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

            {/* Left Column — Student Details */}
            <div className="md:col-span-2 space-y-10">

              {/* Student Info */}
              <section>
                <h2 className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></span> Student Identity
                </h2>
                <div className="flex items-center gap-6 mb-6">
                  {student?.photoUrl ? (
                    <img 
                      src={student.photoUrl} 
                      alt={student.fullName}
                      className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-50 dark:border-slate-800 shadow-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 border-4 border-slate-50 dark:border-slate-800 shadow-lg">
                      <span className="text-4xl">👤</span>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-900 dark:text-white font-black text-2xl leading-tight">
                      {student?.fullName}
                    </p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold font-mono mt-1">
                      {student?.usn}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {student?.branch} • Year {student?.year}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black mb-1">Assigned Room</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">
                      {room?.displayName || 'N/A'}
                      {block ? ` (Block ${block.name})` : ''}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black mb-1">Phone Number</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">
                      {student?.phone || 'N/A'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Request Details */}
              <section>
                <h2 className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></span> Permission Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black mb-1">Permission Type</p>
                    <p className="text-slate-800 dark:text-slate-200 font-bold">{request.requestType?.replace('_', ' ')}</p>
                  </div>
                  {request.location && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black mb-1">Destination</p>
                      <p className="text-slate-800 dark:text-slate-200 font-bold">{request.location}</p>
                    </div>
                  )}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black mb-1">Purpose / Reason</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium italic">"{request.reason}"</p>
                  </div>
                </div>
              </section>

              {/* Timing Details */}
              <section>
                <h2 className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-2">
                  <span className="w-4 h-[1px] bg-slate-200 dark:bg-slate-800"></span> Time Schedule
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <p className="text-blue-500 dark:text-blue-400 text-[10px] uppercase font-black mb-1">Expected Departure</p>
                    <p className="text-slate-900 dark:text-white font-bold">{formatDateTime(request.outDateTime)}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-black mb-1">Expected Return</p>
                    <p className="text-slate-900 dark:text-white font-bold">{formatDateTime(request.expectedReturnDateTime)}</p>
                  </div>
                  {certificate.exitScannedAt && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                      <p className="text-amber-600 dark:text-amber-400 text-[10px] uppercase font-black mb-1">Actual Exit Log</p>
                      <p className="text-slate-900 dark:text-white font-bold">{formatDateTime(certificate.exitScannedAt)}</p>
                    </div>
                  )}
                  {certificate.entryScannedAt && (
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-black mb-1">Actual Return Log</p>
                      <p className="text-slate-900 dark:text-white font-bold">{formatDateTime(certificate.entryScannedAt)}</p>
                    </div>
                  )}
                </div>
              </section>

            </div>

            {/* Right Column — QR Code */}
            <div className="md:col-span-1">
              <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 sticky top-8 shadow-sm">
                <p className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-black tracking-widest text-center">Security Verification QR</p>
                
                <div className="p-3 bg-white rounded-3xl shadow-inner border border-slate-100">
                  {certificate.qrToken ? (
                    <QRCodeSVG
                      value={certificate.qrToken}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center rounded-3xl text-slate-400 gap-2">
                      <span className="text-3xl">⚠️</span>
                      <p className="text-[10px] font-bold">QR NOT LOADED</p>
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-bold font-mono">
                    {request.approvalNumber}
                  </p>
                  <div className="h-[1px] w-12 bg-slate-200 dark:bg-slate-700 mx-auto"></div>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-medium leading-relaxed max-w-[120px]">
                    Valid for one entry & one exit only.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
            <p>Authorized by: {warden?.fullName}</p>
            <p>© 2026 MITE Hostel Management System</p>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .shadow-2xl { box-shadow: none !important; }
          .rounded-[2rem] { border-radius: 0 !important; }
          .bg-slate-50 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
