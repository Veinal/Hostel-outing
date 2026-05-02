import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';

export default function StudentDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await client.get('/requests');
      setRequests(res.data.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'REJECTED': return 'red';
      case 'CANCELLED': return 'gray';
      case 'OVERDUE': return 'darkorange';
      default: return 'black';
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Student Dashboard</h2>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/student/requests/new">
          <button style={{ padding: '10px' }}>Submit New Request</button>
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Out Time</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Return Time</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{req.requestType}</td>
              <td style={{ padding: '8px' }}>{new Date(req.outDateTime).toLocaleString()}</td>
              <td style={{ padding: '8px' }}>{new Date(req.expectedReturnDateTime).toLocaleString()}</td>
              <td style={{ padding: '8px', color: getStatusColor(req.status), fontWeight: 'bold' }}>
                {req.status}
              </td>
              <td style={{ padding: '8px' }}>
                {req.status === 'APPROVED' && (
                  <Link to={`/student/certificate/${req.id}`}>View Certificate</Link>
                )}
                {req.status === 'REJECTED' && req.rejectionReason && (
                  <div style={{ fontSize: '0.8em', color: 'red' }}>Reason: {req.rejectionReason}</div>
                )}
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr><td colSpan="5" style={{ padding: '8px', textAlign: 'center' }}>No requests found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
