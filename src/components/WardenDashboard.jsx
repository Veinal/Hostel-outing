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

export const WardenDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedRequest, setSelectedRequest] = useState(null); // Selected request for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null, // 'approve' or 'reject'
    requestId: null,
    reason: '', // For rejection reason
  });

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

  // Approve Request
  const handleApprove = async (id) => {
    try {
      const requestRef = doc(db, 'outingRequests', id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(), // Add approvedAt timestamp
      });
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
          type: 'request_rejected',
          requestId: id,
          message: `Your outing request was rejected. Reason: ${reason}`,
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

  return (
    <div>
      <div className="max-w-7xl mx-auto p-8 mt-3">
        <h1 className="text-3xl font-bold text-gray-800">Warden Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage and review student outing requests</p>

        {/* Filter and Stats */}
        <div className="mt-6 bg-white p-4 rounded-md shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2 mb-3 md:mb-0">
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
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
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
            {filteredRequests.map((request) => {
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
