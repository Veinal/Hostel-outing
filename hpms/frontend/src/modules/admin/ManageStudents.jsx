import React, { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import BulkImportModal from './BulkImportModal';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', block: '', branch: '', year: '' });
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]); // Re-fetch on page change

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getStudents({ page, limit: 20, ...filters });
      setStudents(res.students);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => {
    setPage(1);
    fetchData();
  };

  const handleResetPassword = async (id) => {
    if (!window.confirm('Send reset password link?')) return;
    try {
      const res = await adminApi.resetPassword(id);
      alert(res.message);
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Manage Students</h2>
        <button onClick={() => setShowImport(true)} style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}>
          Bulk Import (CSV)
        </button>
      </div>

      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input name="search" placeholder="Search by name or USN" value={filters.search} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <input name="block" placeholder="Block (e.g. M)" value={filters.block} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <input name="branch" placeholder="Branch (e.g. CSE)" value={filters.branch} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <input name="year" placeholder="Year (1-4)" type="number" value={filters.year} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <button onClick={applyFilters} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>Filter</button>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <p>Total records: {total}</p>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>USN</th>
                <th style={{ padding: '10px' }}>Branch/Year</th>
                <th style={{ padding: '10px' }}>Room</th>
                <th style={{ padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '10px' }}>{s.fullName}</td>
                  <td style={{ padding: '10px' }}>{s.usn}</td>
                  <td style={{ padding: '10px' }}>{s.branch} - Year {s.year}</td>
                  <td style={{ padding: '10px' }}>{s.room?.displayName}</td>
                  <td style={{ padding: '10px' }}>
                    <button onClick={() => handleResetPassword(s.id)}>Reset Password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page}</span>
            <button disabled={students.length < 20} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}

      {showImport && (
        <BulkImportModal onClose={() => setShowImport(false)} onComplete={() => { fetchData(); }} />
      )}
    </div>
  );
}
