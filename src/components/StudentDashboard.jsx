import React, { useState, useEffect, useRef } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import { Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const statusStyles = {
  approved: {
    icon: <CheckCircleIcon className="text-green-600" />,
    bg: 'bg-green-50 border-green-200',
    text: 'text-green-700',
  },
  pending: {
    icon: <PendingIcon className="text-yellow-600" />,
    bg: 'bg-yellow-50 border-yellow-200',
    text: 'text-yellow-700',
  },
  rejected: {
    icon: <CancelIcon className="text-red-600" />,
    bg: 'bg-red-50 border-red-200',
    text: 'text-red-700',
  },
  cancelled: {
    icon: <CancelIcon className="text-orange-600" />,
    bg: 'bg-orange-50 border-orange-200',
    text: 'text-orange-700',
  },
  expired: {
    icon: <PendingIcon className="text-gray-500" />,
    bg: 'bg-gray-100 border-gray-300',
    text: 'text-gray-500',
  },
};

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [notifications, setNotifications] = useState([]); // Notifications state
  const [unreadCount, setUnreadCount] = useState(0); // Unread notifications count
  const [showNotifications, setShowNotifications] = useState(false); // Modal state
  const [highlightedRequest, setHighlightedRequest] = useState(null);
  const statuses = ['All', 'Pending', 'Approved', 'Rejected', 'Cancelled', 'Expired'];

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true); // Start loading
      const user = auth.currentUser;

      if (user) {
        try {
          const requestsRef = collection(db, 'outingRequests');
          const q = query(requestsRef, where('studentId', '==', user.uid)); // Fetch requests for the current user
          const querySnapshot = await getDocs(q);

          let fetchedRequests = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Mark requests as expired if return date/time is in the past
          const now = new Date();
          fetchedRequests = fetchedRequests.map((req) => {
            if (
              req.status &&
              ['pending', 'approved'].includes(req.status.toLowerCase()) &&
              req.returnDate && req.returnTime
            ) {
              const returnDateTime = new Date(`${req.returnDate}T${req.returnTime}`);
              if (returnDateTime < now) {
                return { ...req, status: 'expired' };
              }
            }
            return req;
          });

          setRequests(fetchedRequests);
        } catch (error) {
          console.error('Error fetching requests:', error);
        }
      }

      setIsLoading(false); // Stop loading
    };

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchRequests();
      } else {
        setRequests([]); // Clear requests if no user is logged in
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Fetch notifications for the logged-in student
  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const notificationsRef = collection(db, 'notifications');
          const q = query(notificationsRef, where('student', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const fetchedNotifications = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setNotifications(fetchedNotifications);
          setUnreadCount(fetchedNotifications.filter((n) => n.read === false).length);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchNotifications();
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredRequests =
    filter === 'All'
      ? requests
      : requests.filter((r) => r.status?.toLowerCase() === filter.toLowerCase());

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(n => 
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      );
      await Promise.all(updatePromises);
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Scroll to request card and highlight
  const scrollToRequest = (requestId) => {
    setShowNotifications(false);
    setTimeout(() => {
      const el = document.getElementById('request-' + requestId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedRequest(requestId);
        setTimeout(() => setHighlightedRequest(null), 1500);
      }
    }, 300); // Wait for modal to close
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
              <NotificationsIcon className="text-blue-600" fontSize="large"/>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-600 rounded-full border-2 border-white text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <Link to="/requestpage">
              <button className="flex items-center px-3 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm w-full md:w-auto">
                <span className="mr-2">➕</span> New Request
              </button>
            </Link>
          </div>
        </div>

        {/* Notifications Modal */}
        {showNotifications && (
          <div 
            className="fixed inset-0 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => setShowNotifications(false)}
          >
            <div 
              className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-white/20 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <NotificationsIcon className="text-blue-600" />
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
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 rounded-lg hover:bg-blue-100 transition-all duration-200 hover:scale-105"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <CloseIcon className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {notifications.length > 0 ? (
                  <div className="p-6 space-y-4">
                    {[...notifications]
                      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                      .map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                            notification.read 
                              ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200' 
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 cursor-pointer shadow-sm'
                          }`}
                          onClick={() => {
                            if (!notification.read) markAsRead(notification.id);
                            if (notification.requestId) scrollToRequest(notification.requestId);
                          }}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className={`font-semibold text-base ${
                                  notification.read ? 'text-gray-700' : 'text-blue-900'
                                }`}>
                                  {notification.title || 'Notification'}
                                </p>
                                {!notification.read && (
                                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-bold rounded-full animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm leading-relaxed ${
                                notification.read ? 'text-gray-600' : 'text-blue-700'
                              }`}>
                                {notification.message || notification.content || 'No message'}
                              </p>
                              <div className="flex items-center gap-2 mt-3">
                                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <p className="text-xs text-gray-500 font-medium">
                                  {notification.timestamp?.seconds 
                                    ? new Date(notification.timestamp.seconds * 1000).toLocaleString()
                                    : 'Unknown time'
                                  }
                                </p>
                              </div>
                            </div>
                            {!notification.read && (
                              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full ml-3 mt-1 flex-shrink-0 animate-pulse shadow-lg"></div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="p-16 text-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <NotificationsIcon className="text-blue-400" sx={{ fontSize: 40 }} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-200 rounded-full animate-ping"></div>
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

        {/* Filter and Sort Dropdowns */}
        <div className="bg-white p-4 rounded-md shadow flex flex-wrap items-center gap-2 mb-8">
          <span className="font-medium text-gray-700 whitespace-nowrap">Filter:</span>
          <div className="relative">
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="appearance-none px-4 pr-10 py-1.5 rounded-full text-sm font-medium bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-gray-100 transition cursor-pointer"
              style={{ minWidth: '120px' }}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            {/* Chevron Icon */}
            <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
          {/* Vertical Divider */}
          <span className="mx-3 -mr-1 h-6 w-px bg-gray-300 hidden md:inline-block"></span>
          {/* Sort Dropdown */}
          <div className="relative ml-4">
            <label htmlFor="sortBy" className="sr-only">Sort</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none pl-4 pr-10 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-50 transition cursor-pointer"
              style={{ minWidth: '110px' }}
            >
              {['Latest', 'Oldest'].map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            {/* Chevron Icon */}
            <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>
        </div>

        {/* Requests Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[...filteredRequests]
              .sort((a, b) => {
                if (sortBy === 'Latest') {
                  return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
                } else {
                  return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
                }
              })
              .map((req) => {
                const styles = statusStyles[req.status?.toLowerCase()] || {
                  icon: <PendingIcon className="text-gray-600" />, 
                  bg: 'bg-gray-50 border-gray-200',
                  text: 'text-gray-700',
                }; // Fallback styles for undefined statuses

                return (
                  <div
                    key={req.id}
                    id={`request-${req.id}`}
                    className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4 ${highlightedRequest === req.id ? 'ring-4 ring-blue-400 ring-opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center space-x-2">
                        {styles.icon}
                        <span className={`font-semibold ${styles.text}`}>{req.status || 'Unknown'}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-3">{req.requestType || 'Outing Request'}</h3>

                    {/* Out Date and Out Time */}
                    <div className="flex items-center text-sm text-gray-700 mb-1">
                      <CalendarTodayIcon className="w-4 h-4 mr-1" />
                      <span>
                        <b>Out Date:</b> {req.outDate || 'N/A'} {req.outTime ? `at ${req.outTime}` : ''}
                      </span>
                    </div>

                    {/* Return Date and Return Time */}
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <AccessTimeIcon className="w-4 h-4 mr-1" />
                      <span>
                        <b>Return Date:</b> {req.returnDate || 'N/A'} {req.returnTime ? `at ${req.returnTime}` : ''}
                      </span>
                    </div>

                    <hr className="my-3" />

                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {req.reason || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Warden:</span> {req.warden || 'N/A'}
                    </p>
                    
                    {/* Display rejection or cancellation reason */}
                    {req.rejectReason && req.status === 'rejected' && (
                      <p className="text-sm text-red-600">
                        <span className="font-medium">Rejection Reason:</span> {req.rejectReason}
                      </p>
                    )}
                    {req.cancelReason && req.status === 'cancelled' && (
                      <p className="text-sm text-orange-600">
                        <span className="font-medium">Cancellation Reason:</span> {req.cancelReason}
                      </p>
                    )}

                    {/* Conditionally Render ApprovedAt, RejectedAt, or CancelledAt */}
                    {req.approvedAt && req.status === 'approved' && (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600">
                          <span className="font-medium">Approved At:</span>{' '}
                          {new Date(req.approvedAt.seconds * 1000).toLocaleString()}
                        </p>
                        {req.approvalNumber && (
                          <p className="text-sm text-green-600">
                            <span className="font-medium">Approval Number:</span>{' '}
                            <span className="font-mono font-bold">{req.approvalNumber}</span>
                          </p>
                        )}
                        
                        {/* View Certificate Button */}
                        {req.certificateId && (
                          <div className="mt-3">
                            <button
                              onClick={() => navigate(`/certificate/${req.certificateId}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-sm"
                            >
                              <CheckCircleIcon fontSize="small"/> View Approval Certificate
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {req.rejectedAt && req.status === 'rejected' && (
                      <p className="text-sm text-red-600">
                        <span className="font-medium">Rejected At:</span>{' '}
                        {new Date(req.rejectedAt.seconds * 1000).toLocaleString()}
                      </p>
                    )}
                    {req.cancelledAt && req.status === 'cancelled' && (
                      <p className="text-sm text-orange-600">
                        <span className="font-medium">Cancelled At:</span>{' '}
                        {new Date(req.cancelledAt.seconds * 1000).toLocaleString()}
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
    </div>
  );
};
