import React, { useState } from 'react';
import Papa from 'papaparse';
import { adminApi } from './adminApi';
import SideBar from '../../shared/SideBar';

const inputClass = "border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full";
const labelClass = "text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block";

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
    <div className="flex min-h-screen bg-slate-50">
      <SideBar />
      <main className="flex-1 p-8">

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Reporting Engine</h1>
            <p className="text-slate-500 text-sm mt-1">Generate and export system activity reports</p>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!data.length}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>📥</span> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-40">
              <label className={labelClass}>From Date</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className={inputClass} />
            </div>
            <div className="w-40">
              <label className={labelClass}>To Date</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className={inputClass} />
            </div>
            <div className="w-48">
              <label className={labelClass}>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className={inputClass}>
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
            <div className="w-24">
              <label className={labelClass}>Block</label>
              <input type="text" name="block" placeholder="Block" value={filters.block} onChange={handleFilterChange} className={inputClass} />
            </div>
            <div className="flex gap-2">
              <button onClick={loadRequestsReport} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                Run General Report
              </button>
              <button onClick={loadOverdueReport} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors">
                Show Active Overdue
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Generating report...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Approval #</th>
                  <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Student</th>
                  <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Type</th>
                  <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Out Time</th>
                  <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(req => (
                  <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="text-slate-800 px-6 py-4 text-sm font-mono font-bold text-blue-600">{req.approvalNumber || '—'}</td>
                    <td className="text-slate-800 px-6 py-4 text-sm">
                      <p className="text-slate-800 font-semibold">{req.student?.fullName}</p>
                      <p className="text-slate-500 text-xs font-mono">{req.student?.usn}</p>
                    </td>
                    <td className="text-slate-800 px-6 py-4 text-sm">{req.requestType?.replace(/_/g, ' ')}</td>
                    <td className="text-slate-800 px-6 py-4 text-sm">
                      <p>{new Date(req.outDateTime).toLocaleDateString()}</p>
                      <p className="text-slate-500 text-xs">{new Date(req.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        req.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 py-12 italic">No records found. Run a report above.</td>
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
