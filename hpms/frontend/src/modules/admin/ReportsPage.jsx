import React, { useState } from 'react';
import Papa from 'papaparse';
import { adminApi } from './adminApi';
import SideBar from '../../shared/SideBar';

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ from: '', to: '', status: '', block: '' });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const loadRequestsReport = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getRequestsReport(filters);
      setData(res.requests || []);
    } catch (err) {
      alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const loadOverdueReport = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOverdueReport();
      setData(res.requests || []);
    } catch (err) {
      alert('Failed to load overdue report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data.length) return alert('No data to export');

    const csvData = data.map(req => ({
      Approval_Number: req.approvalNumber,
      Student_Name: req.student?.fullName,
      USN: req.student?.usn,
      Room: req.student?.room?.displayName,
      Type: req.requestType,
      Status: req.status,
      Out_Time: new Date(req.outDateTime).toLocaleString(),
      Expected_Return: new Date(req.expectedReturnDateTime).toLocaleString()
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `hpms_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <SideBar />
      <main className="flex-1 p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Reporting Engine</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Generate and export system activity reports</p>
          </div>
          <button 
            onClick={exportToCSV} 
            disabled={!data.length} 
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span>📥</span> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="themed-card p-6 rounded-3xl shadow-sm mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">From Date</label>
              <input 
                type="date" 
                name="from" 
                value={filters.from} 
                onChange={handleFilterChange} 
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div className="w-40">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">To Date</label>
              <input 
                type="date" 
                name="to" 
                value={filters.to} 
                onChange={handleFilterChange} 
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div className="w-48">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Status</label>
              <select 
                name="status" 
                value={filters.status} 
                onChange={handleFilterChange} 
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
            <div className="w-24">
              <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-1.5 ml-1">Block</label>
              <input 
                type="text" 
                name="block" 
                placeholder="Block" 
                value={filters.block} 
                onChange={handleFilterChange} 
                className="themed-input w-full rounded-xl px-4 py-2.5 text-sm outline-none" 
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={loadRequestsReport} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-blue-500/20"
              >
                Run Report
              </button>
              <button 
                onClick={loadOverdueReport} 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-red-500/20"
              >
                Show Overdue
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 themed-card rounded-3xl">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium italic">Compiling data engine results...</p>
          </div>
        ) : (
          <div className="overflow-x-auto themed-card rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Approval #</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Student Identity</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Type</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Out Time</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {data.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-5">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {req.approvalNumber || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800 dark:text-white leading-tight">{req.student?.fullName}</p>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">{req.student?.usn}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {req.requestType?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {new Date(req.outDateTime).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(req.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === 'OVERDUE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-16 italic">No records found. Run a report to view activity.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
