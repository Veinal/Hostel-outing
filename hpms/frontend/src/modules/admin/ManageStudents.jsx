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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <SideBar />
      <main className="flex-1 p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Manage Students</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Directory of all hostel residents</p>
          </div>
          <button
            onClick={() => setShowImport(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <span>📤</span> Bulk Import (CSV)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="themed-card p-6 rounded-3xl shadow-sm mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Search Students</label>
              <input
                name="search"
                placeholder="Name or USN..."
                value={filters.search}
                onChange={handleFilterChange}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Block</label>
              <input
                name="block"
                placeholder="e.g. M"
                value={filters.block}
                onChange={handleFilterChange}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="w-24">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Branch</label>
              <input
                name="branch"
                placeholder="CSE"
                value={filters.branch}
                onChange={handleFilterChange}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="w-20">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Year</label>
              <input
                name="year"
                placeholder="1-4"
                type="number"
                value={filters.year}
                onChange={handleFilterChange}
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={applyFilters} 
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all"
              >
                Filter
              </button>
              <button 
                onClick={() => { setFilters({ search: '', block: '', branch: '', year: '' }); setPage(1); setTimeout(fetchData, 0); }} 
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl transition-colors"
                title="Clear Filters"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4 px-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Found {total} residents</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-24 themed-card rounded-3xl">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium italic">Scanning student records...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto themed-card rounded-3xl shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Student Identity</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Branch & Year</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Location</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {students.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                            {s.fullName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white leading-tight">{s.fullName}</p>
                            <p className="text-xs font-mono text-slate-400 mt-0.5">{s.usn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{s.branch}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Year {s.year}</p>
                      </td>
                      <td className="px-6 py-5">
                        {s.room ? (
                          <>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.room.displayName}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Block {s.room.floor?.block?.name}</p>
                          </>
                        ) : (
                          <span className="text-slate-300 italic text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleResetPassword(s.id)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                        >
                          🔑 Reset Password
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-slate-400 py-16 italic">No students found matching your criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex justify-center items-center gap-4">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)} 
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
              >
                ← Prev
              </button>
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Page {page}</span>
              <button 
                disabled={students.length < 20} 
                onClick={() => setPage(page + 1)} 
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-50 transition-all"
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
