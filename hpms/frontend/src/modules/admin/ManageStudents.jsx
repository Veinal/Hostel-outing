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
    <div className="flex min-h-screen bg-slate-50">
      <SideBar />
      <main className="flex-1 p-8">

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Manage Students</h1>
            <p className="text-slate-500 text-sm mt-1">Directory of all hostel residents</p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>📤</span> Bulk Import (CSV)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block">Search Students</label>
              <input
                name="search"
                placeholder="Name or USN..."
                value={filters.search}
                onChange={handleFilterChange}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full"
              />
            </div>
            <div className="w-24">
              <label className="text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block">Block</label>
              <input
                name="block"
                placeholder="e.g. M"
                value={filters.block}
                onChange={handleFilterChange}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full"
              />
            </div>
            <div className="w-24">
              <label className="text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block">Branch</label>
              <input
                name="branch"
                placeholder="CSE"
                value={filters.branch}
                onChange={handleFilterChange}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full"
              />
            </div>
            <div className="w-20">
              <label className="text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block">Year</label>
              <input
                name="year"
                placeholder="1-4"
                type="number"
                value={filters.year}
                onChange={handleFilterChange}
                className="border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Filter
              </button>
              <button
                onClick={() => { setFilters({ search: '', block: '', branch: '', year: '' }); setPage(1); setTimeout(fetchData, 0); }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <p className="text-slate-600 font-semibold text-sm mb-3">Found {total} residents</p>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Loading student records...</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-left">Student Identity</th>
                    <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-left">Branch & Year</th>
                    <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-left">Room</th>
                    <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="text-slate-800 px-6 py-4 text-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {s.fullName[0]}
                          </div>
                          <div>
                            <p className="text-slate-800 font-semibold leading-tight">{s.fullName}</p>
                            <p className="text-slate-500 text-xs font-mono mt-0.5">{s.usn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-800 px-6 py-4 text-sm">
                        <p className="text-slate-800">{s.branch}</p>
                        <p className="text-slate-500 text-xs">Year {s.year}</p>
                      </td>
                      <td className="text-slate-800 px-6 py-4 text-sm">
                        {s.room ? (
                          <>
                            <p className="text-slate-800 font-medium">{s.room.displayName}</p>
                            <p className="text-slate-500 text-xs">Block {s.room.floor?.block?.name}</p>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleResetPassword(s.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                        >
                          🔑 Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-500 py-12 italic">No students found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex justify-center items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                ← Prev
              </button>
              <span className="text-sm font-semibold text-slate-600">Page {page}</span>
              <button
                disabled={students.length < 20}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next →
              </button>
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
