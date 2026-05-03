import React, { useState } from 'react';
import client from '../../api/client';

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

  const statusBadge = {
    PENDING: 'badge badge-warning',
    APPROVED: 'badge badge-success',
    REJECTED: 'badge badge-error',
    CANCELLED: 'badge badge-ghost',
    OVERDUE: 'badge badge-neutral',
  };

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-all">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Student Profile Block */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
              👤 Student Profile
            </h3>
            <div className="flex items-center gap-4 mb-3">
              {/* Step 5: Student photo */}
              {student?.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt="Student"
                  className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs">
                  No Photo
                </div>
              )}
              <div>
                <p className="font-bold text-gray-800 text-base">{student?.fullName}</p>
                <p className="text-sm text-gray-600">USN: {student?.usn}</p>
                <p className="text-sm text-gray-600">Room: {student?.room?.displayName || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium text-gray-700">Phone:</span> {student?.phone || 'N/A'}</p>
              {/* Step 4: Parent phone — only for HOME_GOING */}
              {request.requestType === 'HOME_GOING' && student?.parentPhone && (
                <p className="text-blue-700">
                  <span className="font-medium">Parent Phone:</span> {student.parentPhone}
                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1 rounded">HOME GOING</span>
                </p>
              )}
            </div>
          </div>

          {/* Request Details Block */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="font-bold text-gray-700 mb-3">📋 Request Details</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`${statusBadge[request.status] || 'badge badge-ghost'}`}>{request.status}</span>
              </div>
              <p><span className="font-medium text-gray-700">Type:</span> {request.requestType}</p>
              <p><span className="font-medium text-gray-700">Reason:</span> {request.reason}</p>
              {request.location && <p><span className="font-medium text-gray-700">Location:</span> {request.location}</p>}
              <p><span className="font-medium text-gray-700">Out Time:</span> {request.outDateTime ? new Date(request.outDateTime).toLocaleString() : 'N/A'}</p>
              <p><span className="font-medium text-gray-700">Expected Return:</span> {request.expectedReturnDateTime ? new Date(request.expectedReturnDateTime).toLocaleString() : 'N/A'}</p>
              {request.rejectionReason && (
                <p className="text-red-600"><span className="font-medium">Rejection Reason:</span> {request.rejectionReason}</p>
              )}
              {request.cancelReason && (
                <p className="text-orange-600"><span className="font-medium">Cancellation Reason:</span> {request.cancelReason}</p>
              )}
              {/* Approval number */}
              {request.approvalNumber && (
                <p className="text-green-700">
                  <span className="font-medium">Approval Number:</span>{' '}
                  <span className="font-mono font-bold">{request.approvalNumber}</span>
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
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => { setShowRejectInput(!showRejectInput); setShowCancelInput(false); setShowParentCancelInput(false); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                </div>
                {showRejectInput && (
                  <div>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (minimum 10 characters)"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-red-200 text-sm"
                      rows={3}
                    />
                    <button
                      onClick={handleReject}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
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
                    className="flex-1 px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    🚫 Cancel Request
                  </button>
                  {/* Step 6.9: Distinct "Cancel (Parent Request)" button */}
                  <button
                    onClick={() => { setShowParentCancelInput(!showParentCancelInput); setShowCancelInput(false); }}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    👨‍👩‍👦 Cancel (Parent Request)
                  </button>
                </div>
                {showCancelInput && (
                  <div>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Cancellation reason"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-gray-200 text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                )}
                {showParentCancelInput && (
                  <div>
                    <p className="text-xs text-orange-600 mb-1 font-medium">Parent-requested cancellation — reason will be prefixed with "Parent Request:"</p>
                    <textarea
                      value={parentCancelReason}
                      onChange={(e) => setParentCancelReason(e.target.value)}
                      placeholder="Parent's reason for cancellation"
                      className="w-full p-2 border border-orange-300 rounded-md focus:outline-none focus:ring focus:ring-orange-200 text-sm"
                      rows={2}
                    />
                    <button
                      onClick={handleParentCancel}
                      disabled={loading}
                      className="mt-2 w-full px-4 py-2 bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                    >
                      Confirm Parent Cancellation
                    </button>
                  </div>
                )}

                {/* View Certificate for approved */}
                {request.certificate?.id && (
                  <a
                    href={`/student/certificate/${request.certificate.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all"
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
