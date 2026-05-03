import React, { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import SideBar from '../../shared/SideBar';
import BulkImportModal from './BulkImportModal';

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ search: '', block: '', branch: '', year: '' });
  const [showImport, setShowImport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getStudents({ page, limit: 20, ...filters });
      setStudents(res.students || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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
    if (!window.confirm('Send a password reset link to this student?')) return;
    try {
      const res = await adminApi.resetPassword(id);
      alert(res.message || 'Password reset link sent.');
    } catch (err) {
      alert('Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Students</h1>
          <button
            onClick={() => setShowImport(true)}
            className="btn btn-primary"
          >
            📤 Bulk Import (CSV)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 border border-gray-200">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <input
                name="search"
                placeholder="Name or USN"
                value={filters.search}
                onChange={handleFilterChange}
                className="input input-bordered input-sm w-48"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Block</label>
              <input
                name="block"
                placeholder="e.g. M"
                value={filters.block}
                onChange={handleFilterChange}
                className="input input-bordered input-sm w-24"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Branch</label>
              <input
                name="branch"
                placeholder="e.g. CSE"
                value={filters.branch}
                onChange={handleFilterChange}
                className="input input-bordered input-sm w-24"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
              <input
                name="year"
                placeholder="1-4"
                type="number"
                value={filters.year}
                onChange={handleFilterChange}
                className="input input-bordered input-sm w-20"
              />
            </div>
            <button onClick={applyFilters} className="btn btn-primary btn-sm">Filter</button>
            <button onClick={() => { setFilters({ search: '', block: '', branch: '', year: '' }); setPage(1); setTimeout(fetchData, 0); }} className="btn btn-ghost btn-sm">Clear</button>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-4">Total: {total} students</p>

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
              <table className="table w-full">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th>Name</th>
                    <th>USN</th>
                    <th>Branch / Year</th>
                    <th>Room</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="font-medium text-gray-800">{s.fullName}</td>
                      <td className="text-gray-600 font-mono text-sm">{s.usn}</td>
                      <td className="text-gray-600">{s.branch} — Year {s.year}</td>
                      <td className="text-gray-600">{s.room?.displayName || 'N/A'}</td>
                      <td>
                        <button
                          onClick={() => handleResetPassword(s.id)}
                          className="btn btn-sm btn-outline"
                        >
                          🔑 Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center gap-3">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn btn-sm btn-ghost">← Previous</button>
              <span className="btn btn-sm btn-disabled">Page {page}</span>
              <button disabled={students.length < 20} onClick={() => setPage(page + 1)} className="btn btn-sm btn-ghost">Next →</button>
            </div>
          </>
        )}
      </main>

      {showImport && (
        <BulkImportModal onClose={() => setShowImport(false)} onComplete={() => { fetchData(); }} />
      )}
    </div>
  );
}
