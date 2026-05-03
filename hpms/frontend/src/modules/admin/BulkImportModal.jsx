import React, { useState } from 'react';
import { adminApi } from './adminApi';

export default function BulkImportModal({ onClose, onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = () => {
    // Correct URL for the backend API
    const templateUrl = '/api/admin/students/import/template';
    window.location.href = templateUrl;
  };

  const handleImport = async () => {
    if (!file) return alert('Please select a file');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await adminApi.importStudents(formData);
      setResult(res.data);
      if (res.data.imported > 0) {
        onComplete();
      }
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.error?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 themed-card p-8 rounded-[2rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">Bulk Import Students</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upload a CSV file to add multiple students at once.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!result ? (
          <div className="space-y-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center justify-between">
              <div>
                <p className="text-blue-800 dark:text-blue-300 font-bold text-sm">Download Template</p>
                <p className="text-blue-600/70 dark:text-blue-400/70 text-xs mt-0.5">Use this format to avoid import errors.</p>
              </div>
              <button 
                onClick={handleDownloadTemplate} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                Download CSV
              </button>
            </div>

            <div className="group relative border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <input 
                type="file" 
                accept=".csv" 
                onChange={e => setFile(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3 pointer-events-none">
                <div className="text-4xl">📄</div>
                {file ? (
                  <p className="text-blue-600 dark:text-blue-400 font-bold">{file.name}</p>
                ) : (
                  <>
                    <p className="text-slate-600 dark:text-slate-300 font-bold">Drop CSV here or click to browse</p>
                    <p className="text-slate-400 text-xs">Only .csv files are supported</p>
                  </>
                )}
              </div>
            </div>

            <button 
              onClick={handleImport} 
              disabled={loading || !file} 
              className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/20 dark:shadow-none"
            >
              {loading ? 'Processing File...' : 'Start Import'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center">
              <p className="text-4xl mb-2">🎉</p>
              <p className="text-emerald-800 dark:text-emerald-300 font-black text-xl">Import Finished</p>
              <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-1">
                Successfully added <span className="font-black underline">{result.imported}</span> students
              </p>
            </div>

            {result.failed > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30">
                <p className="text-red-800 dark:text-red-300 font-bold mb-2 flex items-center gap-2">
                  <span>⚠️</span> {result.failed} rows failed to import
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-red-600 dark:text-red-400 text-xs font-medium">
                      Row {err.row}: {err.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <button 
              onClick={onClose} 
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-2xl font-bold transition-all"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
