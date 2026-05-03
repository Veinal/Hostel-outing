import React, { useState } from 'react';
import { gateApi } from './gateApi';

export default function ManualTokenEntry({ onScanRequest, onCancel }) {
  const [approvalNumber, setApprovalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!approvalNumber) return;

    setLoading(true);
    setError('');

    try {
      const res = await gateApi.verifyManual(approvalNumber);
      const { certificate } = res.data;
      if (certificate && certificate.qrToken) {
        onScanRequest(certificate.qrToken);
      } else {
        setError('Certificate does not have a valid token');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to verify manual entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl border border-slate-700 w-full mt-4">
      <h3 className="text-lg font-bold text-white mb-1">Manual Token Entry</h3>
      <p className="text-sm text-slate-400 mb-4">Enter approval number (e.g. HO-2025-0001)</p>
      
      {error && <div className="text-red-400 text-sm mb-4 font-medium">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input 
          type="text" 
          value={approvalNumber} 
          onChange={(e) => setApprovalNumber(e.target.value.toUpperCase())}
          placeholder="HO-YYYY-NNNN"
          className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
          required
        />
        <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-colors">
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>
      <button onClick={onCancel} className="w-full mt-3 text-sm text-slate-400 hover:text-white transition-colors">
        Cancel Manual Entry
      </button>
    </div>
  );
}
