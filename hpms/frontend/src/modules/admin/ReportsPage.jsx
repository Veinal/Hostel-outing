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
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Reporting Engine</h1>
          <button onClick={exportToCSV} disabled={!data.length} className="btn btn-success">
            📥 Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
              <input type="date" name="from" value={filters.from} onChange={handleFilterChange} className="input input-bordered input-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
              <input type="date" name="to" value={filters.to} onChange={handleFilterChange} className="input input-bordered input-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="select select-bordered select-sm">
                <option value="">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
                <option value="REJECTED">REJECTED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Block</label>
              <input type="text" name="block" placeholder="Block" value={filters.block} onChange={handleFilterChange} className="input input-bordered input-sm w-24" />
            </div>
            <button onClick={loadRequestsReport} className="btn btn-primary btn-sm">Run General Report</button>
            <button onClick={loadOverdueReport} className="btn btn-error btn-sm">Show Active Overdue</button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
            <table className="table w-full">
              <thead>
                <tr className="bg-gray-100 text-gray-600">
                  <th>Approval #</th>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Out Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map(req => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="font-mono text-sm">{req.approvalNumber || '—'}</td>
                    <td>{req.student?.fullName} <span className="text-xs text-gray-500">({req.student?.usn})</span></td>
                    <td>{req.requestType}</td>
                    <td>{new Date(req.outDateTime).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${req.status === 'OVERDUE' ? 'badge-error' : req.status === 'APPROVED' ? 'badge-success' : 'badge-ghost'}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-8">No records found. Run a report above.</td>
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
