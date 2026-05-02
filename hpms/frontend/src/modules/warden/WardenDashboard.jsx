import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import RequestDetailModal from './RequestDetailModal';

export default function WardenDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const qs = filter !== 'ALL' ? `?status=${filter}` : '';
      const res = await client.get(`/requests${qs}`);
      setRequests(res.data.data.requests);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleRowClick = async (id) => {
    try {
      const res = await client.get(`/requests/${id}`);
      setSelectedRequest(res.data.data.request);
    } catch(err) {
      console.error('Failed to fetch request details');
    }
  };

  const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Warden Dashboard</h2>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {TABS.map(tab => (
          <button 
            key={tab} 
            onClick={() => setFilter(tab)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: filter === tab ? '#007bff' : '#f8f9fa',
              color: filter === tab ? 'white' : 'black',
              border: '1px solid #ccc',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', backgroundColor: '#f9f9f9' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Student</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Type</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Out Time</th>
              <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} onClick={() => handleRowClick(req.id)} style={{ borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#ccc', overflow: 'hidden' }}>
                    {req.student.photoUrl ? <img src={req.student.photoUrl} alt="" style={{width: '100%', height:'100%', objectFit: 'cover'}}/> : null}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{req.student.fullName}</div>
                    <div style={{ fontSize: '0.8em', color: '#666' }}>{req.student.room?.displayName} | {req.student.usn}</div>
                  </div>
                </td>
                <td style={{ padding: '10px' }}>{req.requestType}</td>
                <td style={{ padding: '10px' }}>{new Date(req.outDateTime).toLocaleString()}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{req.status}</td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No requests found</td></tr>
            )}
          </tbody>
        </table>
      )}

      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest} 
          onClose={() => setSelectedRequest(null)} 
          onActionComplete={() => {
            setSelectedRequest(null);
            fetchRequests();
          }} 
        />
      )}
    </div>
  );
}
