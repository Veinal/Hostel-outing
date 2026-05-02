import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from './adminApi';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    adminApi.getSummary().then(setSummary).catch(console.error);
  }, []);

  if (!summary) return <div>Loading summary...</div>;

  const cardStyle = { padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px', flex: 1, minWidth: '150px', textAlign: 'center' };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Dashboard</h2>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
        <div style={cardStyle}>
          <h3>Total Students</h3>
          <p style={{ fontSize: '2em', margin: 0 }}>{summary.totalStudents}</p>
        </div>
        <div style={cardStyle}>
          <h3>Active Requests</h3>
          <p style={{ fontSize: '2em', margin: 0 }}>{summary.activeRequests}</p>
        </div>
        <div style={cardStyle}>
          <h3>Approved Today</h3>
          <p style={{ fontSize: '2em', margin: 0 }}>{summary.approvedToday}</p>
        </div>
        <div style={cardStyle}>
          <h3>Overdue Now</h3>
          <p style={{ fontSize: '2em', margin: 0, color: 'red' }}>{summary.overdueNow}</p>
        </div>
        <div style={cardStyle}>
          <h3>Stepped Out</h3>
          <p style={{ fontSize: '2em', margin: 0, color: 'orange' }}>{summary.steppedOutNow}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <Link to="/admin/wardens" style={{ padding: '15px 30px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Manage Wardens</Link>
        <Link to="/admin/students" style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Manage Students</Link>
        <Link to="/admin/reports" style={{ padding: '15px 30px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Reports</Link>
      </div>
    </div>
  );
}
