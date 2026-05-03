import React, { useEffect, useState, useRef } from 'react';
import client from '../../api/client';
import RequestDetailModal from './RequestDetailModal';

const statusStyles = {
  pending: {
    icon: '⏳',
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  approved: {
    icon: '✅',
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  rejected: {
    icon: '❌',
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
  cancelled: {
    icon: '🚫',
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
  },
  overdue: {
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
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      // TODO: API endpoint needed — GET /api/notifications
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

  const markAsRead = async (notificationId) => {
    try {
      await client.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* TODO: notifications API */ }
  };

  const markAllAsRead = async () => {
    try {
      await client.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) { /* TODO: notifications API */ }
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
    <div>
      <div className="max-w-7xl mx-auto p-8 mt-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Warden Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage and review student outing requests</p>
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
                            notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200 cursor-pointer shadow-sm'
                          }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.requestId) scrollToRequest(notification.requestId);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-semibold text-base mb-1 ${notification.read ? 'text-gray-700' : 'text-blue-900'}`}>
                                {notification.title || 'Notification'}
                                {!notification.read && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">NEW</span>}
                              </p>
                              <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-blue-700'}`}>
                                {notification.message || 'No message'}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                              </p>
                            </div>
                            {!notification.read && <div className="w-4 h-4 bg-blue-500 rounded-full ml-3 mt-1 flex-shrink-0 animate-pulse"></div>}
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
        <div className="mt-6 bg-white p-4 rounded-md shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0 items-center">
            <span className="font-medium text-gray-700 whitespace-nowrap mr-2">Filter:</span>
            <button onClick={() => setFilter('All')} className={`flex items-center gap-1 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors ${filter === 'All' ? 'bg-blue-100 ring-2 ring-blue-300' : ''}`}>
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>All
            </button>
            <button onClick={() => setFilter('Pending')} className={`flex items-center gap-1 text-yellow-600 hover:bg-yellow-100 px-2 py-1 rounded-md transition-colors ${filter === 'Pending' ? 'bg-yellow-100 ring-2 ring-yellow-300' : ''}`}>
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>Pending: {statusCount.Pending}
            </button>
            <button onClick={() => setFilter('Approved')} className={`flex items-center gap-1 text-green-600 hover:bg-green-100 px-2 py-1 rounded-md transition-colors ${filter === 'Approved' ? 'bg-green-100 ring-2 ring-green-300' : ''}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>Approved: {statusCount.Approved}
            </button>
            <button onClick={() => setFilter('Rejected')} className={`flex items-center gap-1 text-red-600 hover:bg-red-100 px-2 py-1 rounded-md transition-colors ${filter === 'Rejected' ? 'bg-red-100 ring-2 ring-red-300' : ''}`}>
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>Rejected: {statusCount.Rejected}
            </button>
            <button onClick={() => setFilter('Cancelled')} className={`flex items-center gap-1 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded-md transition-colors ${filter === 'Cancelled' ? 'bg-orange-100 ring-2 ring-orange-300' : ''}`}>
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>Cancelled: {statusCount.Cancelled}
            </button>
            <button onClick={() => setFilter('Overdue')} className={`flex items-center gap-1 text-gray-600 hover:bg-gray-100 px-2 py-1 rounded-md transition-colors ${filter === 'Overdue' ? 'bg-gray-100 ring-2 ring-gray-300' : ''}`}>
              <span className="w-2 h-2 bg-gray-500 rounded-full"></span>Overdue: {statusCount.Overdue}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm items-center mt-3 md:mt-0">
            <span className="font-medium text-gray-700 whitespace-nowrap mr-2">Sort:</span>
            <button onClick={() => setSortBy('Latest')} className={`text-purple-600 hover:bg-purple-100 px-2 py-1 rounded-md transition-colors ${sortBy === 'Latest' ? 'bg-purple-100 ring-2 ring-purple-300' : ''}`}>
              Latest
            </button>
            <button onClick={() => setSortBy('Oldest')} className={`text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors ${sortBy === 'Oldest' ? 'bg-indigo-100 ring-2 ring-indigo-300' : ''}`}>
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
                const statusKey = request.status?.toLowerCase() || 'pending';
                const styles = statusStyles[statusKey] || statusStyles.pending;

                return (
                  <div
                    key={request.id}
                    id={`request-${request.id}`}
                    className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4 cursor-pointer hover:shadow-md transition-shadow ${highlightedRequest === request.id ? 'ring-4 ring-blue-400 ring-opacity-60' : ''}`}
                    onClick={() => handleViewDetails(request)}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        <span>{styles.icon}</span>
                        <span className={`font-semibold ${styles.text}`}>{request.status}</span>
                      </div>
                      <button className="text-blue-600 hover:underline text-xs">
                        👁️ View
                      </button>
                    </div>

                    {/* Student Photo + Name */}
                    <div className="flex items-center gap-3 mb-3">
                      {request.student?.photoUrl ? (
                        <img src={request.student.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">No Photo</div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{request.student?.fullName}</div>
                        <div className="text-xs text-gray-500">{request.student?.usn} | {request.student?.room?.displayName}</div>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold mb-2">{request.requestType || 'Outing Request'}</h3>

                    <div className="flex items-center text-sm text-gray-700 mb-1">
                      <span className="mr-1">📅</span>
                      <span><b>Out:</b> {request.outDateTime ? `${formatDate(request.outDateTime)} at ${new Date(request.outDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <span className="mr-1">🕐</span>
                      <span><b>Return:</b> {request.expectedReturnDateTime ? `${formatDate(request.expectedReturnDateTime)} at ${new Date(request.expectedReturnDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}</span>
                    </div>

                    <hr className="my-2" />

                    <p className="text-sm truncate">
                      <span className="font-medium">Reason:</span> {request.reason || 'N/A'}
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
