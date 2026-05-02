import React, { useState } from 'react';
import { adminApi } from './adminApi';

export default function BulkImportModal({ onClose, onComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = () => {
    window.open('/api/admin/students/import/template', '_blank');
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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Bulk Import Students</h2>
          <button onClick={onClose}>X</button>
        </div>

        {!result ? (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <button onClick={handleDownloadTemplate} style={{ padding: '8px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px' }}>Download CSV Template</button>
            </div>
            <div style={{ marginBottom: '20px', padding: '20px', border: '2px dashed #ccc', textAlign: 'center' }}>
              <input type="file" accept=".csv" onChange={e => setFile(e.target.files[0])} />
            </div>
            <button onClick={handleImport} disabled={loading || !file} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', fontSize: '1.1em', border: 'none', borderRadius: '4px' }}>
              {loading ? 'Processing...' : 'Upload & Import'}
            </button>
          </div>
        ) : (
          <div>
            <h3>Import Results</h3>
            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', marginBottom: '10px', borderRadius: '4px' }}>
              Successfully imported: <strong>{result.imported}</strong> students
            </div>
            {result.failed > 0 && (
              <div style={{ padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>
                Failed: <strong>{result.failed}</strong> rows
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  {result.errors.map((err, i) => (
                    <li key={i}>Row {err.row}: {err.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            <button onClick={onClose} style={{ marginTop: '20px', width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
