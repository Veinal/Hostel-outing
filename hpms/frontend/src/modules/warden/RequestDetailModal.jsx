import React, { useState } from 'react';
import client from '../../api/client';

const formatRequestType = (type) => {
  if (!type) return '';
  return type.replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
};

export default function RequestDetailModal({ request, onClose, onActionComplete }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  // Step 6.9: Parent cancellation — separate input
  const [showParentCancelInput, setShowParentCancelInput] = useState(false);
  const [parentCancelReason, setParentCancelReason] = useState('');
  const [loading, setLoading] = useState(false);

  const student = request.student;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/approve`);
      // Step 6.10: Show "Approval notification sent" toast
      onActionComplete('Request approved successfully! Approval notification sent.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      alert('Rejection reason must be at least 10 characters long.');
      return;
    }
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/reject`, { rejectionReason });
      onActionComplete('Request rejected successfully! Notification sent to student.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  // Step 6.9: Regular cancellation
  const handleCancel = async () => {
    if (!cancelReason || cancelReason.trim().length < 3) {
      alert('Please enter a cancellation reason.');
      return;
    }
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/cancel`, { reason: cancelReason });
      onActionComplete('Request cancelled successfully! Notification sent to student.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  // Step 6.9: Parent-requested cancellation — distinct label
  const handleParentCancel = async () => {
    const reason = `Parent Request: ${parentCancelReason}`;
    if (!parentCancelReason || parentCancelReason.trim().length < 3) {
      alert('Please enter the parent cancellation reason.');
      return;
    }
    setLoading(true);
    try {
      await client.put(`/requests/${request.id}/cancel`, { reason });
      onActionComplete('Request cancelled by parent request. Notification sent to student.');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      PENDING:   'bg-amber-400 text-white',
      APPROVED:  'bg-emerald-500 text-white',
      REJECTED:  'bg-red-500 text-white',
      CANCELLED: 'bg-gray-500 text-white',
      OVERDUE:   'bg-orange-500 text-white',
      COMPLETED: 'bg-blue-500 text-white',
    };
    return `px-3 py-1 rounded-full text-xs font-semibold ${map[status] || 'bg-slate-300 text-slate-700'}`;
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800">Request Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 text-slate-500 rounded-full transition-all">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Profile Block */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
              👤 Student Profile
            </h3>
            <div className="flex items-center gap-4 mb-4">
              {/* Step 5: Student photo */}
              {student?.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Student"
                  className="w-20 h-20 rounded-lg object-cover shadow-sm border border-slate-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs bg-white">
                  No Photo
                </div>
              )}
              <div>
                <p className="font-bold text-slate-800 text-base mb-1">{student?.fullName}</p>
                <p className="text-sm text-slate-600">USN: {student?.usn}</p>
                <p className="text-sm text-slate-600">Room: {student?.room?.displayName || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-medium text-slate-700">Phone:</span> <span className="text-slate-600">{student?.phone || 'N/A'}</span></p>
              {/* Step 4: Parent phone — only for HOME_GOING */}
              {request.requestType === 'HOME_GOING' && student?.parentPhone && (
                <p className="text-blue-600">
                  <span className="font-medium">Parent Phone:</span> {student.parentPhone}
                  <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">HOME GOING</span>
                </p>
              )}
            </div>
          </div>

          {/* Request Details Block */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h3 className="font-bold text-slate-700 mb-4">📋 Request Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">Status:</span>
                <span className={getStatusBadge(request.status)}>{request.status}</span>
              </div>
              <p><span className="font-medium text-slate-700">Type:</span> <span className="text-slate-600">{formatRequestType(request.requestType)}</span></p>
              <p><span className="font-medium text-slate-700">Reason:</span> <span className="text-slate-600">{request.reason}</span></p>
              {request.location && <p><span className="font-medium text-slate-700">Location:</span> <span className="text-slate-600">{request.location}</span></p>}
              <p><span className="font-medium text-slate-700">Out Time:</span> <span className="text-slate-600">{request.outDateTime ? new Date(request.outDateTime).toLocaleString() : 'N/A'}</span></p>
              <p><span className="font-medium text-slate-700">Expected Return:</span> <span className="text-slate-600">{request.expectedReturnDateTime ? new Date(request.expectedReturnDateTime).toLocaleString() : 'N/A'}</span></p>
              {request.rejectionReason && (
                <p className="text-red-600 mt-2"><span className="font-medium">Rejection Reason:</span> {request.rejectionReason}</p>
              )}
              {request.cancelReason && (
                <p className="text-orange-600 mt-2"><span className="font-medium">Cancellation Reason:</span> {request.cancelReason}</p>
              )}
              {/* Approval number */}
              {request.approvalNumber && (
                <p className="text-emerald-600 mt-2">
                  <span className="font-medium">Approval Number:</span>{' '}
                  <span className="font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{request.approvalNumber}</span>
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {/* PENDING actions: Approve + Reject */}
            {request.status === 'PENDING' && (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => { setShowRejectInput(!showRejectInput); setShowCancelInput(false); setShowParentCancelInput(false); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                </div>
                {showRejectInput && (
                  <div className="mt-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (minimum 10 characters)"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 text-sm bg-white"
                      rows={3}
                    />
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                )}
              </>
            )}

            {/* APPROVED actions: Cancel + Cancel (Parent Request) */}
            {request.status === 'APPROVED' && (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCancelInput(!showCancelInput); setShowParentCancelInput(false); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    🚫 Cancel Request
                  </button>
                  {/* Step 6.9: Distinct "Cancel (Parent Request)" button */}
                  <button
                    onClick={() => { setShowParentCancelInput(!showParentCancelInput); setShowCancelInput(false); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    👨‍👩‍👦 Cancel (Parent Request)
                  </button>
                </div>
                {showCancelInput && (
                  <div className="mt-3">
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Cancellation reason"
                      className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 text-sm bg-white"
                      rows={2}
                    />
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                )}
                {showParentCancelInput && (
                  <div className="mt-3">
                    <p className="text-xs text-orange-600 mb-2 font-medium">Parent-requested cancellation — reason will be prefixed with "Parent Request:"</p>
                    <textarea
                      value={parentCancelReason}
                      onChange={(e) => setParentCancelReason(e.target.value)}
                      placeholder="Parent's reason for cancellation"
                      className="w-full p-3 border border-orange-300 rounded-lg focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm bg-orange-50"
                      rows={2}
                    />
                    <button
                      onClick={handleParentCancel}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Confirm Parent Cancellation
                    </button>
                  </div>
                )}

                {/* View Certificate for approved */}
                {request.certificate?.id && (
                  <a
                    href={`/certificate/${request.certificate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors mt-4"
                  >
                    📜 View Certificate
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
