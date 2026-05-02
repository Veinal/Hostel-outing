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
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '20px', backgroundColor: '#f9f9f9' }}>
      <h3>Manual Token Entry</h3>
      <p style={{ fontSize: '0.9em', color: '#666' }}>Enter approval number (e.g. HO-2025-0001)</p>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={approvalNumber} 
          onChange={(e) => setApprovalNumber(e.target.value.toUpperCase())}
          placeholder="HO-YYYY-NNNN"
          style={{ flex: 1, padding: '10px' }}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? '...' : 'Verify'}
        </button>
      </form>
      <button onClick={onCancel} style={{ marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}>
        Cancel Manual Entry
      </button>
    </div>
  );
}
