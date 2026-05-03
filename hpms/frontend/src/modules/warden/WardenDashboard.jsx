import React, { useEffect, useState, useRef } from 'react';
import client from '../../api/client';
import RequestDetailModal from './RequestDetailModal';

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

export default function WardenDashboard() {
  const [allRequests, setAllRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedRequest, setHighlightedRequest] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const pollingRef = useRef(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await client.get('/requests');
      setAllRequests(res.data.data.requests || []);
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
      // Notification model has no `read` field — treat unsent (sentAt=null) as unread
      setUnreadCount(notifs.filter(n => !n.sentAt).length);
    } catch (err) {
      if (err.response?.status === 404) {
        console.info('[Notifications] GET /api/notifications returned 404 — polling disabled.');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
      // All other errors: silently ignore
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchNotifications();

    // Poll every 30 seconds
    pollingRef.current = setInterval(() => {
      fetchRequests();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const filteredRequests =
    filter === 'All'
      ? allRequests
      : allRequests.filter((r) => r.status?.toUpperCase() === filter.toUpperCase());

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'Latest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  });

  // Count for each category
  const statusCount = {
    Pending: allRequests.filter((r) => r.status?.toUpperCase() === 'PENDING').length,
    Approved: allRequests.filter((r) => r.status?.toUpperCase() === 'APPROVED').length,
    Rejected: allRequests.filter((r) => r.status?.toUpperCase() === 'REJECTED').length,
    Cancelled: allRequests.filter((r) => r.status?.toUpperCase() === 'CANCELLED').length,
    Overdue: allRequests.filter((r) => r.status?.toUpperCase() === 'OVERDUE').length,
  };

  const handleViewDetails = async (request) => {
    try {
      const res = await client.get(`/requests/${request.id}`);
      setSelectedRequest(res.data.data.request);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching request details:', err);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  const handleActionComplete = (message) => {
    handleCloseModal();
    fetchRequests();
    if (message) {
      setSnackbar({ open: true, message, severity: 'success' });
    }
  };

  // NOTE: Notification model has no `read` field — local-state-only optimistic marking
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
        setTimeout(() => setHighlightedRequest(null), 2000);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Warden Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and review student outing requests</p>
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
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div
            className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowNotifications(false)}
          >
            <div
              className="bg-white/95 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="text-blue-600 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Notifications</h3>
                    <p className="text-sm text-gray-500">New student requests and updates</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-200">
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-gray-200 rounded-full">
                    ✕
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[70vh]">
                {notifications.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {[...notifications]
                      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                      .map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg ${
                            notification.sentAt ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200 cursor-pointer shadow-sm'
                          }`}
                          onClick={() => {
                            if (!notification.sentAt) markAsRead(notification.id);
                            if (notification.requestId) scrollToRequest(notification.requestId);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-semibold text-base mb-1 ${notification.sentAt ? 'text-gray-700' : 'text-blue-900'}`}>
                                {notification.title || 'Notification'}
                                {!notification.sentAt && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">NEW</span>}
                              </p>
                              <p className={`text-sm ${notification.sentAt ? 'text-gray-600' : 'text-blue-700'}`}>
                                {notification.message || 'No message'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                              </p>
                            </div>
                            {!notification.sentAt && <div className="w-4 h-4 bg-blue-500 rounded-full ml-3 mt-1 flex-shrink-0 animate-pulse"></div>}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <h3 className="text-xl font-bold text-gray-700 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No new notifications at the moment</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Section */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-3 flex-wrap mt-6 mb-8">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0 items-center">
            <span className="text-slate-600 font-medium text-sm mr-2">Filter:</span>
            {[
              { label: 'All', value: 'All' },
              { label: `Pending: ${statusCount.Pending}`, value: 'Pending' },
              { label: `Approved: ${statusCount.Approved}`, value: 'Approved' },
              { label: `Rejected: ${statusCount.Rejected}`, value: 'Rejected' },
              { label: `Cancelled: ${statusCount.Cancelled}`, value: 'Cancelled' },
              { label: `Overdue: ${statusCount.Overdue}`, value: 'Overdue' }
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filter === value 
                    ? (value === 'All' ? 'bg-blue-500 text-white shadow-sm' : getStatusBadge(value.toUpperCase()) + ' shadow-sm')
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
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
          <div className="flex justify-center items-center mt-6">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {sortedRequests.length === 0 ? (
              <div className="col-span-3 text-center text-gray-500 py-8">No requests found.</div>
            ) : (
              sortedRequests.map((request) => {
                const statusKey = request.status?.toUpperCase() || 'PENDING';

                return (
                  <div
                    key={request.id}
                    id={`request-${request.id}`}
                    className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow ${highlightedRequest === request.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => handleViewDetails(request)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(statusKey)}`}>
                        {request.status || 'UNKNOWN'}
                      </span>
                      <button className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                        View Details
                      </button>
                    </div>

                    {/* Student Photo + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      {request.student?.photoUrl ? (
                        <img src={request.student.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs shadow-sm">No Photo</div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-800">{request.student?.fullName}</div>
                        <div className="text-xs text-slate-500">{request.student?.usn} | {request.student?.room?.displayName}</div>
                      </div>
                    </div>

                    <h3 className="text-slate-800 font-semibold text-lg mb-2">{request.requestType || 'Outing Request'}</h3>

                    <div className="flex items-center text-slate-500 text-sm mb-1">
                      <span className="mr-2">📅</span>
                      <span><b className="text-slate-700">Out:</b> {request.outDateTime ? `${formatDate(request.outDateTime)} at ${new Date(request.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-slate-500 text-sm mb-2">
                      <span className="mr-2">🕐</span>
                      <span><b className="text-slate-700">Return:</b> {request.expectedReturnDateTime ? `${formatDate(request.expectedReturnDateTime)} at ${new Date(request.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</span>
                    </div>

                    <hr className="my-3 border-slate-200" />

                    <p className="text-slate-500 text-sm truncate mb-1">
                      <span className="font-medium text-slate-700 mr-1">Reason:</span> {request.reason || 'N/A'}
                    </p>

                    {/* Approved — show approval number + certificate link */}
                    {request.status?.toUpperCase() === 'APPROVED' && (
                      <div className="mt-2">
                        {request.approvalNumber && (
                          <p className="text-xs text-green-600 font-mono font-bold">#{request.approvalNumber}</p>
                        )}
                        {request.certificate?.id && (
                          <a
                            href={`/student/certificate/${request.certificate.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Certificate →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Request Detail Modal */}
      {isModalOpen && selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          onClose={handleCloseModal}
          onActionComplete={handleActionComplete}
        />
      )}

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
          snackbar.severity === 'error' ? 'bg-red-600' : snackbar.severity === 'warning' ? 'bg-yellow-600' : 'bg-green-600'
        }`}>
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button onClick={() => setSnackbar({ ...snackbar, open: false })} className="ml-2 font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
