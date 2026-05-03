import React from 'react';

export default function ScanResultOverlay({ result, error, onDismiss }) {
  if (error) {
    return (
      <div className="fixed inset-0 bg-red-600/95 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
        <div className="bg-white p-8 rounded-2xl text-center w-full max-w-sm shadow-2xl text-slate-800">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
          <p className="text-lg font-medium text-slate-600 mb-6">{getErrorMessage(error.code) || error.message || 'Unknown error'}</p>
          <button onClick={onDismiss} className="w-full py-3 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl font-bold transition-colors">Dismiss</button>
        </div>
      </div>
    );
  }

  if (result) {
    const { scanType, student, permission } = result;
    return (
      <div className="fixed inset-0 bg-emerald-600/95 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
        <div className="bg-white p-8 rounded-2xl text-center w-full max-w-sm shadow-2xl text-slate-800">
          <div className="text-emerald-500 text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">{scanType === 'EXIT' ? 'EXIT LOGGED' : 'ENTRY LOGGED'}</h2>
          
          <div>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="student" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md mx-auto mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-4 text-sm font-medium shadow-sm">No Photo</div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-slate-800">{student.fullName}</h3>
          <p className="text-slate-500 text-sm mb-6">{student.usn} | {student.room}</p>
          
          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-sm text-slate-600 space-y-2">
            <p><strong className="text-slate-800 font-semibold mr-1">Type:</strong> {permission.requestType}</p>
            {scanType === 'EXIT' && <p><strong className="text-slate-800 font-semibold block mb-0.5">Expected Return:</strong> {new Date(permission.expectedReturnDateTime).toLocaleString()}</p>}
          </div>
          
          <button onClick={onDismiss} className="w-full py-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-xl font-bold transition-colors">Dismiss</button>
        </div>
      </div>
    );
  }

  return null;
}

const getErrorMessage = (code) => {
  switch(code) {
    case 'GATE_QR_INVALID': return "Invalid QR Code";
    case 'GATE_QR_EXPIRED': return "This pass has expired";
    case 'GATE_QR_ALREADY_COMPLETED': return "Already scanned in and out";
    case 'GATE_PERMISSION_CANCELLED': return "Permission was cancelled";
    case 'AUTH_UNAUTHORIZED': return "Scanner not authorized";
    default: return null;
  }
};
