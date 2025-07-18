import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRef } from 'react';

export const WardenDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Latest');
  const sortOptions = ['Latest', 'Oldest'];
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedRequest, setSelectedRequest] = useState(null); // Selected request for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null, // 'approve' or 'reject'
    requestId: null,
    reason: '', // For rejection reason
  });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showParentNotify, setShowParentNotify] = useState(false);
  const [parentNotifyRequest, setParentNotifyRequest] = useState(null);
  const [parentNotifyStatus, setParentNotifyStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true); // Start loading
      const user = auth.currentUser;

      if (user) {
        try {
          // Fetch requests assigned to the logged-in warden
          const requestsRef = collection(db, 'outingRequests');
          const q = query(requestsRef, where('wardenUid', '==', user.uid)); // Filter by warden's UID
          const querySnapshot = await getDocs(q);

          const fetchedRequests = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setAllRequests(fetchedRequests);
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
        setAllRequests([]); // Clear requests if no user is logged in
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // Fetch notifications for the logged-in warden
  useEffect(() => {
    const fetchNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const notificationsRef = collection(db, 'notifications');
          const q = query(notificationsRef, where('warden', '==', user.uid));
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

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const updatePromises = unreadNotifications.map(n => updateDoc(doc(db, 'notifications', n.id), { read: true }));
      await Promise.all(updatePromises);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Filtered requests based on selected filter
  const filteredRequests =
    filter === 'All'
      ? allRequests
      : allRequests.filter((r) => r.status?.toLowerCase() === filter.toLowerCase());

  // Count for each category
  const statusCount = {
    Pending: allRequests.filter((r) => r.status?.toLowerCase() === 'pending').length,
    Approved: allRequests.filter((r) => r.status?.toLowerCase() === 'approved').length,
    Rejected: allRequests.filter((r) => r.status?.toLowerCase() === 'rejected').length,
  };

  // Modified Approve Request
  const handleApprove = async (id) => {
    try {
      const requestRef = doc(db, 'outingRequests', id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(), // Add approvedAt timestamp
      });
      
      // Fetch the request to get studentId and other info
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        // Send notification to student
        await addDoc(collection(db, 'notifications'), {
          student: requestData.studentId, // recipient student UID
          sender: auth.currentUser.uid, // sender is the warden
          type: 'request_approved',
          requestId: id,
          title: 'Request Approved',
          message: `Your ${requestData.requestType} request for ${requestData.outDate} has been approved!`,
          status: 'approved',
          timestamp: serverTimestamp(),
          read: false,
        });
        // Show parent notify modal/button
        setParentNotifyRequest({ ...requestData, requestId: id });
        setShowParentNotify(true);
      }
      
      setAllRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: 'approved', approvedAt: new Date() } : req
        )
      );
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  // Reject Request
  const handleReject = async (id, reason) => {
    try {
      const requestRef = doc(db, 'outingRequests', id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        cancelReason: reason,
      });
      // Fetch the request to get studentId and other info
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        // Send notification to student
        await addDoc(collection(db, 'notifications'), {
          student: requestData.studentId, // recipient student UID
          sender: auth.currentUser.uid, // sender is the warden
          type: 'request_rejected',
          requestId: id,
          title: 'Request Rejected',
          message: `Your ${requestData.requestType} request for ${requestData.outDate} was rejected. Reason: ${reason}`,
          reason: reason,
          status: 'rejected',
          timestamp: serverTimestamp(),
          read: false,
        });
      }
      setAllRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: 'rejected', rejectedAt: new Date(), cancelReason: reason } : req
        )
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Open Modal
  const handleViewDetails = async (request) => {
    try {
      const studentRef = doc(db, 'users', request.studentId); // Fetch student details
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        setSelectedRequest({ ...request, studentDetails: studentData }); // Combine request and student details
        setIsModalOpen(true);
      } else {
        console.error('Student details not found');
      }
    } catch (error) {
      console.error('Error fetching student details:', error);
    }
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  // Function to notify parent
  const handleNotifyParent = async () => {
    if (!parentNotifyRequest) return;
    setParentNotifyStatus('sending');
    try {
      // Fetch student profile to get parent's phone
      const studentRef = doc(db, 'users', parentNotifyRequest.studentId);
      const studentSnap = await getDoc(studentRef);
      let parentPhone = '';
      let studentName = '';
      if (studentSnap.exists()) {
        const studentData = studentSnap.data();
        parentPhone = studentData.parentPhone || '';
        studentName = studentData.fullName || '';
      }
      if (!parentPhone) {
        setParentNotifyStatus('error');
        return;
      }
      // Create a notification for the parent (for now, just in Firestore)
      await addDoc(collection(db, 'parentNotifications'), {
        parentPhone: parentPhone,
        studentName: studentName,
        requestId: parentNotifyRequest.requestId,
        type: 'parent_notify',
        title: 'Outing Approved',
        message: `Your ward ${studentName}'s outing request for ${parentNotifyRequest.outDate} has been approved by the warden.`,
        timestamp: serverTimestamp(),
        read: false,
        sender: auth.currentUser.uid,
      });
      setParentNotifyStatus('sent');
    } catch (error) {
      setParentNotifyStatus('error');
      console.error('Error notifying parent:', error);
    }
  };

  // Add auto-close effect after notification sent
  useEffect(() => {
    if (parentNotifyStatus === 'sent') {
      const timer = setTimeout(() => {
        setShowParentNotify(false);
        setParentNotifyRequest(null);
        setParentNotifyStatus('idle');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [parentNotifyStatus]);

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
              <NotificationsIcon className="text-blue-600" fontSize="large" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-600 rounded-full border-2 border-white text-xs text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter and Stats with Sort Dropdown */}
        <div className="mt-6 bg-white p-4 rounded-md shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0 items-center">
            {['All', 'Pending', 'Approved', 'Rejected'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                  filter === type
                    ? type === 'Pending'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
            {/* Vertical Divider */}
            <span className="mx-3 h-6 w-px bg-gray-300 hidden md:inline-block"></span>
            {/* Sort Dropdown - visually attractive */}
            <div className="relative">
              <label htmlFor="sortBy" className="sr-only">Sort</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-blue-50 transition cursor-pointer"
                style={{ minWidth: '110px' }}
              >
                {sortOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {/* Chevron Icon */}
              <span className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm items-center mt-3 md:mt-0">
            <span className="flex items-center gap-1 text-yellow-600">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>Pending: {statusCount.Pending}
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>Approved: {statusCount.Approved}
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>Rejected: {statusCount.Rejected}
            </span>
          </div>
        </div>

        {/* Request Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center mt-6">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[...filteredRequests]
              .sort((a, b) => {
                switch (sortBy) {
                  case 'Latest':
                    return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
                  case 'Oldest':
                    return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
                  default:
                    return 0;
                }
              })
              .map((request) => {
              const styles = {
                pending: {
                  icon: <PendingIcon className="text-yellow-600" />,
                  bg: 'bg-yellow-50 border-yellow-200',
                  text: 'text-yellow-700',
                },
                approved: {
                  icon: <CheckCircleIcon className="text-green-600" />,
                  bg: 'bg-green-50 border-green-200',
                  text: 'text-green-700',
                },
                rejected: {
                  icon: <CancelIcon className="text-red-600" />,
                  bg: 'bg-red-50 border-red-200',
                  text: 'text-red-700',
                },
              }[request.status?.toLowerCase()] || {
                icon: <PendingIcon className="text-gray-600" />,
                bg: 'bg-gray-50 border-gray-200',
                text: 'text-gray-700',
              }; // Fallback styles for undefined statuses

              return (
                <div key={request.id} className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      {styles.icon}
                      <span className={`font-semibold ${styles.text}`}>{request.status || 'Unknown'}</span>
                    </div>
                    <button onClick={() => handleViewDetails(request)} className="text-gray-500 hover:text-gray-800">
                      <VisibilityIcon />
                    </button>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">{request.requestType || 'Outing Request'}</h3>

                  <div className="flex items-center text-sm text-gray-700 mb-1">
                    <CalendarTodayIcon className="w-4 h-4 mr-1" />
                    <span>
                      Out Date: {request.outDate || 'N/A'}
                      {request.outTime && (
                        <span className="ml-2">
                          at {request.outTime}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <AccessTimeIcon className="w-4 h-4 mr-1" />
                    <span>
                      Return Date: {request.returnDate || 'N/A'}
                      {request.returnTime && (
                        <span className="ml-2">
                          at {request.returnTime}
                        </span>
                      )}
                    </span>
                  </div>

                  <hr className="my-3" />

                  <p className="text-sm">
                    <span className="font-medium">Student Name:</span> {request.studentName || 'N/A'}
                  </p>
                  <p className="text-sm flex items-center flex-nowrap">
                    <span className="font-medium">Reason:</span>
                    <span
                      className="truncate ml-1 max-w-[13rem] inline-block align-bottom"
                      title={request.reason}
                    >
                      {request.reason || 'N/A'}
                    </span>
                  </p>

                  {request.status?.toLowerCase() === 'pending' && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => setConfirmModal({ open: true, action: 'approve', requestId: request.id, reason: '' })}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm px-2.5 py-1.5 rounded"
                      >
                        <CheckIcon fontSize="small"/> Approve
                      </button>
                      <button
                        onClick={() => setConfirmModal({ open: true, action: 'reject', requestId: request.id, reason: '' })}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm px-2.5 py-1.5 rounded"
                      >
                        <CloseIcon fontSize='small'/> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && selectedRequest && (
        <div
          className="fixed inset-0 bg-opacity-50 backdrop-blur-md flex justify-center items-center z-50"
          onClick={handleCloseModal} // Close modal when clicking outside
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
            <h2 className="text-2xl font-bold mb-6 text-center uppercase tracking-wide text-blue-700">Student Details</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-8">
              {/* Student Image */}
              <div className="flex-shrink-0 mb-4 md:mb-0 flex flex-col items-center">
                <img
                  src={selectedRequest.studentDetails?.photoUrl || 'https://via.placeholder.com/150'}
                  alt="Student"
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-200 shadow"
                />
                <div className="mt-2 text-sm text-gray-500 text-center break-all max-w-[8rem]">
                  {selectedRequest.studentDetails?.fullName || 'N/A'}
                </div>
              </div>

              {/* Student Details */}
              <div className="w-full">
                <div className="grid grid-cols-1 gap-y-3">
                  <DetailRow label="Email" value={selectedRequest.studentDetails?.email} />
                  <DetailRow label="Phone" value={selectedRequest.studentDetails?.phone} />
                  <DetailRow label="Branch" value={selectedRequest.studentDetails?.branch} isLong />
                  <DetailRow label="Year" value={selectedRequest.studentDetails?.year} />
                  <DetailRow label="Block" value={selectedRequest.studentDetails?.block} />
                  <DetailRow label="Parent's Contact" value={selectedRequest.studentDetails?.parentPhone} />
                  <DetailRow label="Room" value={selectedRequest.studentDetails?.room} />
                  <DetailRow label="Reason" value={selectedRequest.reason} />
                  <div className="flex gap-4">
                    <DetailRow label="Out Date" value={selectedRequest.outDate} inline />
                    <DetailRow label="Out Time" value={selectedRequest.outTime} inline />
                  </div>
                  <div className="flex gap-4">
                    <DetailRow label="Return Date" value={selectedRequest.returnDate} inline />
                    <DetailRow label="Return Time" value={selectedRequest.returnTime} inline />
                  </div>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleCloseModal}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setConfirmModal({ open: false, action: null, requestId: null, reason: '' })}
        >
          <div
            className="bg-white rounded-xl shadow-lg px-7 py-5 w-full max-w-lg mx-4 sm:px-8 sm:py-8"
            onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
          >
            <h3 className="text-lg font-semibold mb-6 ">
              {confirmModal.action === 'approve'
                ? 'Are you sure you want to approve this request?'
                : 'Are you sure you want to reject this request?'}
            </h3>
            {confirmModal.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Rejection <span className="text-red-500">*</span></label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  rows={2}
                  value={confirmModal.reason}
                  onChange={e => setConfirmModal({ ...confirmModal, reason: e.target.value })}
                  placeholder="Enter reason for rejection"
                  required
                />
              </div>
            )}
            <div className="flex justify-end gap-4 mt-8">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => setConfirmModal({ open: false, action: null, requestId: null, reason: '' })}
              >
                <CloseIcon fontSize="small" />
                Cancel
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 rounded text-white ${
                  confirmModal.action === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                onClick={async () => {
                  if (confirmModal.action === 'approve') {
                    await handleApprove(confirmModal.requestId);
                    setConfirmModal({ open: false, action: null, requestId: null, reason: '' });
                  } else {
                    if (!confirmModal.reason.trim()) return; // Require reason
                    await handleReject(confirmModal.requestId, confirmModal.reason.trim());
                    setConfirmModal({ open: false, action: null, requestId: null, reason: '' });
                  }
                }}
                disabled={confirmModal.action === 'reject' && !confirmModal.reason.trim()}
              >
                <CheckIcon fontSize="small" />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parent Notify Modal */}
      {showParentNotify && parentNotifyRequest && (
        <div
          className="fixed inset-0 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => { setShowParentNotify(false); setParentNotifyRequest(null); setParentNotifyStatus('idle'); }}
        >
          <div
            className="bg-white rounded-xl shadow-lg px-7 py-5 w-full max-w-md mx-4 relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Icon */}
            <button
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
              onClick={() => { setShowParentNotify(false); setParentNotifyRequest(null); setParentNotifyStatus('idle'); }}
              aria-label="Close"
            >
              <CloseIcon className="text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold mb-4 text-center">Notify Parent?</h3>
            <p className="mb-4 text-gray-700 text-center">
              Would you like to notify the parent of <b>{parentNotifyRequest.studentName || 'the student'}</b> about the approval?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                onClick={() => { setShowParentNotify(false); setParentNotifyRequest(null); setParentNotifyStatus('idle'); }}
              >
                No, Thanks
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${parentNotifyStatus === 'sent' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={handleNotifyParent}
                disabled={parentNotifyStatus === 'sending' || parentNotifyStatus === 'sent'}
              >
                {parentNotifyStatus === 'idle' && 'Notify Parent'}
                {parentNotifyStatus === 'sending' && 'Sending...'}
                {parentNotifyStatus === 'sent' && 'Notification Sent!'}
                {parentNotifyStatus === 'error' && 'Error!'}
              </button>
            </div>
            {parentNotifyStatus === 'sent' && (
              <div className="text-green-600 text-center mt-4">Parent has been notified.</div>
            )}
            {parentNotifyStatus === 'error' && (
              <div className="text-red-600 text-center mt-4">Could not notify parent (missing phone or error).</div>
            )}
          </div>
        </div>
      )}

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
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-5 rounded-xl border transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
                        notification.read
                          ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 hover:from-gray-100 hover:to-gray-200'
                          : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 cursor-pointer shadow-sm'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className={`font-bold text-lg ${
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
                          <p className={`text-base leading-relaxed ${
                            notification.read ? 'text-gray-600' : 'text-blue-700'
                          }`}>
                            {notification.message || notification.content || 'No message'}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <p className="text-sm text-gray-500 font-medium">
                              {notification.timestamp?.seconds
                                ? new Date(notification.timestamp.seconds * 1000).toLocaleString()
                                : 'Unknown time'}
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
    </div>
  );
};

const DetailRow = ({ label, value, isLong, inline }) => (
  <div className={inline ? "flex-1 min-w-0" : ""}>
    <span className="font-semibold text-gray-700">{label}:</span>
    <span
      className={`ml-2 text-gray-800 ${isLong ? "break-words max-w-md inline-block align-top" : ""}`}
      style={isLong ? { wordBreak: 'break-word' } : {}}
    >
      {value || 'N/A'}
    </span>
  </div>
);
