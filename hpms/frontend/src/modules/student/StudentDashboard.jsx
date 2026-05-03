import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../auth/useAuth';

// Status config matching old version exactly
const statusStyles = {
  APPROVED: {
    icon: '✅',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  PENDING: {
    icon: '⏳',
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  REJECTED: {
    icon: '❌',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
  CANCELLED: {
    icon: '🚫',
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
  },
  OVERDUE: {
    icon: '⏰',
    bg: 'bg-gray-100 border-gray-300',
    text: 'text-gray-500',
  },
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
    <div>
      <div className="max-w-7xl mx-auto p-8 mt-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h2 className="text-3xl font-bold">My Outing Requests</h2>
            <p className="text-base text-gray-600">Manage and track your hostel outing requests</p>
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
              <button className="flex items-center px-3 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-full md:w-auto">
                <span className="mr-2">➕</span> New Request
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
        <div className="bg-white p-4 rounded-md shadow flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0 items-center">
            <span className="font-medium text-gray-700 whitespace-nowrap mr-2">Filter:</span>
            <button onClick={() => setFilter('All')} className={`flex items-center gap-1 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors ${filter === 'All' ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`}>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>All
            </button>
            <button onClick={() => setFilter('Pending')} className={`flex items-center gap-1 text-yellow-600 hover:bg-yellow-100 px-2 py-1 rounded-md transition-colors ${filter === 'Pending' ? 'bg-yellow-100 ring-2 ring-yellow-300' : ''}`}>
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>Pending
            </button>
            <button onClick={() => setFilter('Approved')} className={`flex items-center gap-1 text-green-600 hover:bg-green-100 px-2 py-1 rounded-md transition-colors ${filter === 'Approved' ? 'bg-green-100 ring-2 ring-green-300' : ''}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>Approved
            </button>
            <button onClick={() => setFilter('Rejected')} className={`flex items-center gap-1 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md transition-colors ${filter === 'Rejected' ? 'bg-red-100 ring-2 ring-red-300' : ''}`}>
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>Rejected
            </button>
            <button onClick={() => setFilter('Cancelled')} className={`flex items-center gap-1 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors ${filter === 'Cancelled' ? 'bg-orange-100 ring-2 ring-orange-300' : ''}`}>
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>Cancelled
            </button>
            <button onClick={() => setFilter('Overdue')} className={`flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors ${filter === 'Overdue' ? 'bg-gray-100 ring-2 ring-gray-300' : ''}`}>
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>Overdue
            </button>
          </div>

          {/* Sort Buttons */}
          <div className="flex flex-wrap gap-2 text-sm items-center mt-3 md:mt-0">
            <span className="font-medium text-gray-700 whitespace-nowrap mr-2">Sort:</span>
            <button onClick={() => setSortBy('Latest')} className={`flex items-center gap-1 text-purple-600 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors ${sortBy === 'Latest' ? 'bg-purple-100 ring-2 ring-purple-300' : ''}`}>
              Latest
            </button>
            <button onClick={() => setSortBy('Oldest')} className={`flex items-center gap-1 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors ${sortBy === 'Oldest' ? 'bg-indigo-100 ring-2 ring-indigo-300' : ''}`}>
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
              const styles = statusStyles[statusKey] || {
                icon: '⏳',
                bg: 'bg-gray-50 border-gray-200',
                text: 'text-gray-700',
              };

              return (
                <div
                  key={req.id}
                  id={`request-${req.id}`}
                  className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4 ${highlightedRequest === req.id ? 'ring-4 ring-blue-400 ring-opacity-60' : ''}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      <span>{styles.icon}</span>
                      <span className={`font-semibold ${styles.text}`}>{req.status || 'Unknown'}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">{req.requestType || 'Outing Request'}</h3>

                  {/* Out Date and Out Time */}
                  <div className="flex items-center text-sm text-gray-700 mb-1">
                    <span className="mr-1">📅</span>
                    <span>
                      <b>Out Date:</b>{' '}
                      {req.outDateTime ? formatDate(req.outDateTime) : 'N/A'}{' '}
                      {req.outDateTime ? `at ${new Date(req.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  </div>

                  {/* Return Date and Return Time */}
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <span className="mr-1">🕐</span>
                    <span>
                      <b>Return Date:</b>{' '}
                      {req.expectedReturnDateTime ? formatDate(req.expectedReturnDateTime) : 'N/A'}{' '}
                      {req.expectedReturnDateTime ? `at ${new Date(req.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                    </span>
                  </div>

                  <hr className="my-3" />

                  <p className="text-sm">
                    <span className="font-medium">Warden:</span> {req.warden?.fullName || 'N/A'}
                  </p>
                  <p className="text-sm flex items-center flex-nowrap">
                    <span className="font-medium">Reason:</span>
                    <span className="truncate ml-1 max-w-[13rem] inline-block align-bottom" title={req.reason}>
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
          <p className="text-center text-gray-600">No requests found.</p>
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
