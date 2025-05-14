import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const WardenDashboard = () => {
  const [allRequests, setAllRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const [selectedRequest, setSelectedRequest] = useState(null); // Selected request for modal
  const [isModalOpen, setIsModalOpen] = useState(false); // Modal visibility

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
  const handleReject = async (id) => {
    try {
      const requestRef = doc(db, 'outingRequests', id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(), // Add rejectedAt timestamp
      });
      setAllRequests((prev) =>
        prev.map((req) =>
          req.id === id ? { ...req, status: 'rejected', rejectedAt: new Date() } : req
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
      <div className="p-8 bg-gray-50 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-gray-800">Warden Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage and review student outing requests</p>

          {/* Filter and Stats */}
          <div className="mt-6 bg-white p-5 rounded-lg shadow flex flex-col md:flex-row md:items-center md:justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
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
                      <span>Out Date: {request.outDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700 mb-2">
                      <AccessTimeIcon className="w-4 h-4 mr-1" />
                      <span>Return Date: {request.returnDate || 'N/A'}</span>
                    </div>

                    <hr className="my-3" />

                    <p className="text-sm">
                      <span className="font-medium">Student Name:</span> {request.studentName || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reason:</span> {request.reason || 'N/A'}
                    </p>
                    {/* <p className="text-sm">
                      <span className="font-medium">Warden:</span> {request.warden || 'N/A'}
                    </p> */}

                    {request.status?.toLowerCase() === 'pending' && (
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-1.5 rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-1.5 rounded"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl mx-4">
            <h2 className="text-2xl font-bold mb-6 text-center uppercase">Student Details</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start md:space-x-6">
              {/* Student Image */}
              <div className="flex-shrink-0">
                <img
                  src={selectedRequest.studentDetails?.photoUrl || 'https://via.placeholder.com/150'}
                  alt="Student"
                  className="w-32 h-32 rounded-full object-cover mb-4 md:mb-0"
                />
              </div>

              {/* Student Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 w-full">
                <p className="text-gray-800">
                  <strong>Full Name:</strong> {selectedRequest.studentDetails?.fullName || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Email:</strong> {selectedRequest.studentDetails?.email || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Phone:</strong> {selectedRequest.studentDetails?.phone || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Branch:</strong> {selectedRequest.studentDetails?.branch || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Year:</strong> {selectedRequest.studentDetails?.year || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Block:</strong> {selectedRequest.studentDetails?.block || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Room:</strong> {selectedRequest.studentDetails?.room || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Reason:</strong> {selectedRequest.reason || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Out Date:</strong> {selectedRequest.outDate || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Return Date:</strong> {selectedRequest.returnDate || 'N/A'}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleCloseModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
