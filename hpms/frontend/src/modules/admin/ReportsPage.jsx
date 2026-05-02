import React, { useState } from 'react';
import Papa from 'papaparse';
import { adminApi } from './adminApi';

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
      setData(res.requests);
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
      setData(res.requests);
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
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Reporting Engine</h2>
        <button onClick={exportToCSV} disabled={!data.length} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          Export CSV
        </button>
      </div>

      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <input type="date" name="from" value={filters.from} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <input type="date" name="to" value={filters.to} onChange={handleFilterChange} style={{ padding: '8px' }} />
        <select name="status" value={filters.status} onChange={handleFilterChange} style={{ padding: '8px' }}>
          <option value="">All Statuses</option>
          <option value="APPROVED">APPROVED</option>
          <option value="PENDING">PENDING</option>
          <option value="REJECTED">REJECTED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
        <input type="text" name="block" placeholder="Block" value={filters.block} onChange={handleFilterChange} style={{ padding: '8px' }} />
        
        <button onClick={loadRequestsReport} style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>Run General Report</button>
        <button onClick={loadOverdueReport} style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}>Show Active Overdue</button>
      </div>

      {loading ? <div>Loading report...</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Approval #</th>
              <th style={{ padding: '10px' }}>Student</th>
              <th style={{ padding: '10px' }}>Type</th>
              <th style={{ padding: '10px' }}>Out Time</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '10px' }}>{req.approvalNumber}</td>
                <td style={{ padding: '10px' }}>{req.student?.fullName} ({req.student?.usn})</td>
                <td style={{ padding: '10px' }}>{req.requestType}</td>
                <td style={{ padding: '10px' }}>{new Date(req.outDateTime).toLocaleString()}</td>
                <td style={{ padding: '10px', fontWeight: 'bold', color: req.status === 'OVERDUE' ? 'red' : 'black' }}>{req.status}</td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No records found</td></tr>}
          </tbody>
        </table>
      )}
    </div>
  );
}
