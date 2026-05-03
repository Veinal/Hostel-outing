import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../auth/useAuth';

const getStatusBadge = (status) => {
  const map = {
    PENDING:   'bg-amber-400 text-white',
    APPROVED:  'bg-emerald-500 text-white',
    REJECTED:  'bg-red-500 text-white',
    CANCELLED: 'bg-gray-500 text-white',
    OVERDUE:   'bg-orange-500 text-white',
    COMPLETED: 'bg-blue-500 text-white',
  };
  return map[status] || 'bg-slate-300 text-slate-700';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString();
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedRequest, setHighlightedRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const pollingRef = useRef(null);

  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Overdue'];

  const fetchRequests = async () => {
    try {
      const res = await client.get('/requests');
      setRequests(res.data.data.requests || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await client.get('/notifications');
      const notifs = res.data.data?.notifications || [];
      setNotifications(notifs);
      // Notification model has no `read` field — derive unread from sentAt being null (queued) or channel=IN_APP
      setUnreadCount(notifs.filter(n => !n.sentAt).length);
    } catch (err) {
      if (err.response?.status === 404) {
        // Endpoint not yet available — stop polling silently, log once
        console.info('[Notifications] GET /api/notifications returned 404 — polling disabled.');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      // All other errors: silently ignore (network blip, etc.)
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchNotifications();

    // Poll every 30 seconds for status updates
    pollingRef.current = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const filteredRequests =
    filter === 'All'
      ? requests
      : requests.filter((r) => r.status?.toUpperCase() === filter.toUpperCase());

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'Latest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  // NOTE: The Notification model has no `read` field in the schema.
  // Marking as read is local-state-only (optimistic UI) until a read-tracking
  // migration is added. No backend call is made.
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, sentAt: n.sentAt || new Date().toISOString() } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, sentAt: n.sentAt || new Date().toISOString() })));
    setUnreadCount(0);
  };

  const scrollToRequest = (requestId) => {
    setShowNotifications(false);
    setTimeout(() => {
      const el = document.getElementById('request-' + requestId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedRequest(requestId);
        setTimeout(() => setHighlightedRequest(null), 1500);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">My Outing Requests</h2>
            <p className="text-slate-500 text-sm mt-1">Manage and track your hostel outing requests</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Notifications Button */}
            <button
              className="relative p-2 rounded-full hover:bg-gray-200 focus:outline-none"
              title="Notifications"
              onClick={() => setShowNotifications(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-600 w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-600 rounded-full border-2 border-white text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Link to="/student/requests/new">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors w-full md:w-auto">
                <span className="mr-1">➕</span> New Request
              </button>
            </Link>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div
            className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowNotifications(false)}
          >
            <div
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
                    <p className="text-sm text-gray-500">Stay updated with your requests</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-200"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-gray-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[70vh]">
                {notifications.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {[...notifications]
                      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                      .map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                            notification.sentAt
                              ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200'
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 cursor-pointer shadow-sm'
                          }`}
                          onClick={() => {
                            if (!notification.sentAt) markAsRead(notification.id);
                            if (notification.requestId) scrollToRequest(notification.requestId);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`font-semibold text-base ${notification.sentAt ? 'text-gray-700' : 'text-blue-900'}`}>
                                  {notification.title || 'Notification'}
                                </p>
                                {!notification.sentAt && (
                                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm leading-relaxed ${notification.sentAt ? 'text-gray-600' : 'text-blue-700'}`}>
                                {notification.message || notification.content || 'No message'}
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <p className="text-xs text-gray-500 font-medium">
                                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Unknown time'}
                                </p>
                              </div>
                            </div>
                            {!notification.sentAt && (
                              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full ml-3 mt-1 flex-shrink-0 animate-pulse shadow-lg"></div>
                            )}
                          </div>
                        </div>
                      ))}

                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-400 w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No new notifications at the moment</p>
                    <p className="text-sm text-gray-400 mt-1">We'll notify you when something important happens</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap mb-8">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0 items-center">
            <span className="text-slate-600 font-medium text-sm mr-2">Filter:</span>
            {statuses.map(statusLabel => (
              <button
                key={statusLabel}
                onClick={() => setFilter(statusLabel)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === statusLabel 
                    ? (statusLabel === 'All' ? 'bg-blue-500 text-white shadow-sm' : getStatusBadge(statusLabel.toUpperCase()) + ' shadow-sm')
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {statusLabel}
              </button>
            ))}
          </div>

          {/* Sort Buttons */}
          <div className="flex flex-wrap gap-2 text-sm items-center mt-3 md:mt-0">
            <span className="text-slate-600 font-medium text-sm mr-2">Sort:</span>
            <button onClick={() => setSortBy('Latest')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${sortBy === 'Latest' ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Latest
            </button>
            <button onClick={() => setSortBy('Oldest')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${sortBy === 'Oldest' ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              Oldest
            </button>
          </div>
        </div>

        {/* Request Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : sortedRequests.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {sortedRequests.map((req) => {
              const statusKey = req.status?.toUpperCase() || 'PENDING';

              return (
                <div
                  key={req.id}
                  id={`request-${req.id}`}
                  className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow ${highlightedRequest === req.id ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(statusKey)}`}>
                      {req.status || 'UNKNOWN'}
                    </span>
                  </div>

                  <h3 className="text-slate-800 font-semibold text-lg mb-3">{req.requestType || 'Outing Request'}</h3>

                  {/* Out Date and Out Time */}
                  <div className="flex items-center text-slate-500 text-sm mb-1">
                    <span className="mr-2">📅</span>
                    <span>
                      <b className="text-slate-700">Out Date:</b>{' '}
                      {req.outDateTime ? formatDate(req.outDateTime) : 'N/A'}{' '}
                      {req.outDateTime ? `at ${new Date(req.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  </div>

                  {/* Return Date and Return Time */}
                  <div className="flex items-center text-slate-500 text-sm mb-2">
                    <span className="mr-2">🕐</span>
                    <span>
                      <b className="text-slate-700">Return Date:</b>{' '}
                      {req.expectedReturnDateTime ? formatDate(req.expectedReturnDateTime) : 'N/A'}{' '}
                      {req.expectedReturnDateTime ? `at ${new Date(req.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  </div>

                  <hr className="my-3 border-slate-200" />

                  <p className="text-slate-500 text-sm mb-1">
                    <span className="font-medium text-slate-700">Warden:</span> {req.warden?.fullName || 'N/A'}
                  </p>
                  <p className="text-slate-500 text-sm flex items-center flex-nowrap mb-2">
                    <span className="font-medium text-slate-700 mr-1">Reason:</span>
                    <span className="truncate max-w-[13rem] inline-block align-bottom" title={req.reason}>
                      {req.reason || 'N/A'}
                    </span>
                  </p>

                  {/* Rejection reason */}
                  {req.rejectionReason && req.status === 'REJECTED' && (
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Rejection Reason:</span> {req.rejectionReason}
                    </p>
                  )}

                  {/* Cancellation reason */}
                  {req.cancelReason && req.status === 'CANCELLED' && (
                    <p className="text-sm text-orange-600">
                      <span className="font-medium">Cancellation Reason:</span> {req.cancelReason}
                    </p>
                  )}

                  {/* Approved — show cert link + approval number */}
                  {/* Note: approvedAt is on ApprovalCertificate (cert.approvedAt), not on OutingRequest */}
                  {req.status === 'APPROVED' && (
                    <div className="space-y-2">
                      {req.approvalNumber && (
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Approval Number:</span>{' '}
                          <span className="font-mono font-bold">{req.approvalNumber}</span>
                        </p>
                      )}
                      {/* View Certificate Button */}
                      {req.certificate?.id && (
                        <div className="mt-3">
                          <button
                            onClick={() => navigate(`/student/certificate/${req.certificate.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-sm"
                          >
                            ✅ View Approval Certificate
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejected — Reapply button */}
                  {/* Note: rejectedAt is not a field on OutingRequest — use updatedAt if needed */}
                  {req.status === 'REJECTED' && (
                    <div className="space-y-2">
                      {req.updatedAt && (
                        <p className="text-sm text-red-600">
                          <span className="font-medium">Rejected At:</span>{' '}
                          {new Date(req.updatedAt).toLocaleString()}
                        </p>
                      )}
                      {/* Step 6.2: Reapply button */}
                      <div className="mt-3">
                        <Link to="/student/requests/new" state={{ prefill: req }}>
                          <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 hover:scale-105 shadow-sm">
                            🔄 Reapply
                          </button>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Cancelled reason — cancelledAt does not exist; show updatedAt instead */}
                  {req.status === 'CANCELLED' && req.updatedAt && (
                    <p className="text-sm text-orange-600">
                      <span className="font-medium">Cancelled At:</span>{' '}
                      {new Date(req.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-400 py-16 text-lg">No requests found.</p>
        )}
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
          snackbar.severity === 'error' ? 'bg-red-600' : snackbar.severity === 'success' ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button onClick={() => setSnackbar({ ...snackbar, open: false })} className="ml-2 text-white font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
