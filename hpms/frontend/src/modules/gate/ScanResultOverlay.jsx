import React from 'react';

export default function ScanResultOverlay({ result, error, setScanState, setResultData, setErrorMessage }) {
  const reset = () => {
    setScanState('IDLE');
    setResultData(null);
    setErrorMessage(null);
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-red-600/95 backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center w-full max-w-sm shadow-2xl text-white">
          <div className="text-red-500 text-6xl mb-6 animate-bounce">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Scan Failed</h2>
          <p className="text-slate-400 text-lg mb-8">{error}</p>
          
          <button
            onClick={reset}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    const { scanType, student, permission } = result;
    const isExit = scanType === 'EXIT';
    
    return (
      <div className={`fixed inset-0 ${isExit ? 'bg-amber-600/95' : 'bg-emerald-600/95'} backdrop-blur-md flex items-center justify-center z-[1000] p-4 animate-in zoom-in duration-300`}>
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center w-full max-w-sm shadow-2xl text-white">
          <div className={`text-6xl mb-4 ${isExit ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isExit ? '🚶' : '🏠'}
          </div>
          
          <h2 className={`text-xl font-black mb-6 tracking-widest ${isExit ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isExit ? 'EXIT AUTHORIZED' : 'ENTRY AUTHORIZED'}
          </h2>
          
          <div className="mb-6 relative inline-block">
            {student.photoUrl ? (
              <img 
                src={student.photoUrl} 
                alt="student" 
                className="w-32 h-32 rounded-3xl object-cover border-4 border-white/10 shadow-2xl mx-auto" 
              />
            ) : (
              <div className="w-32 h-32 rounded-3xl bg-slate-800 border-4 border-white/10 flex items-center justify-center text-slate-500 mx-auto text-sm font-medium">
                No Photo
              </div>
            )}
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-slate-900 flex items-center justify-center text-xs ${isExit ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              ✓
            </div>
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-1">{student.fullName}</h3>
          <p className="text-slate-400 font-medium mb-6">
            {student.usn} {student.room ? ` • ${student.room}` : ''}
          </p>
          
          <div className="text-left bg-white/5 p-5 rounded-2xl border border-white/10 mb-8 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Type</span>
              <span className="font-bold">{permission.requestType}</span>
            </div>
            {isExit && (
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Return Before</span>
                <span className="font-bold text-amber-400">
                  {new Date(permission.expectedReturnDateTime).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={reset}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/20 text-lg"
          >
            Scan Next →
          </button>
        </div>
      </div>
    );
  }

  return null;
}
