import React from 'react';
import client from '../../api/client';

export default function RequestDetailModal({ request, onClose, onActionComplete }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/approve`);
      onActionComplete();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.length < 10) {
      alert('Rejection reason must be at least 10 characters long');
      return;
    }
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/reject`, { rejectionReason });
      onActionComplete();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const reason = prompt('Enter cancellation reason (e.g. parent request):');
    if (!reason) return;
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/cancel`, { reason });
      onActionComplete();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const student = request.student;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Request Details</h2>
          <button onClick={onClose} style={{ cursor: 'pointer' }}>X</button>
        </div>
        
        <div style={{ margin: '20px 0', border: '1px solid #eee', padding: '15px' }}>
          <h3>Student Profile</h3>
          <p><strong>Name:</strong> {student.fullName}</p>
          <p><strong>USN:</strong> {student.usn}</p>
          <p><strong>Room:</strong> {student.room?.displayName}</p>
          <p><strong>Phone:</strong> {student.phone || 'N/A'}</p>
          {request.requestType === 'HOME_GOING' && (
            <p><strong>Parent Phone:</strong> {student.parentPhone || 'N/A'} (HOME GOING)</p>
          )}
        </div>

        <div style={{ margin: '20px 0', border: '1px solid #eee', padding: '15px' }}>
          <h3>Request Details</h3>
          <p><strong>Type:</strong> {request.requestType}</p>
          <p><strong>Reason:</strong> {request.reason}</p>
          {request.location && <p><strong>Location:</strong> {request.location}</p>}
          <p><strong>Out Time:</strong> {new Date(request.outDateTime).toLocaleString()}</p>
          <p><strong>Expected Return:</strong> {new Date(request.expectedReturnDateTime).toLocaleString()}</p>
          <p><strong>Status:</strong> {request.status}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexDirection: 'column' }}>
          {request.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleApprove} disabled={loading} style={{ flex: 1, padding: '10px', backgroundColor: 'green', color: 'white' }}>Approve</button>
              <button onClick={() => setShowRejectInput(!showRejectInput)} disabled={loading} style={{ flex: 1, padding: '10px', backgroundColor: 'red', color: 'white' }}>Reject</button>
            </div>
          )}

          {showRejectInput && request.status === 'PENDING' && (
            <div style={{ marginTop: '10px' }}>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection (min 10 chars)" style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
              <button onClick={handleReject} disabled={loading} style={{ padding: '8px', width: '100%', backgroundColor: 'darkred', color: 'white' }}>Confirm Rejection</button>
            </div>
          )}

          {request.status === 'APPROVED' && (
            <button onClick={handleCancel} disabled={loading} style={{ padding: '10px', backgroundColor: 'gray', color: 'white' }}>Cancel Approved Request</button>
          )}
        </div>
      </div>
    </div>
  );
}
