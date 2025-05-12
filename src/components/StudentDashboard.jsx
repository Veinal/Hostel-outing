import React, { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Schedule';
import CancelIcon from '@mui/icons-material/Cancel';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, query, where, getDocs } from 'firebase/firestore';
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
};

export const StudentDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const statuses = ['All', 'Pending', 'Approved', 'Rejected'];

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true); // Start loading
      const user = auth.currentUser;

      if (user) {
        try {
          const requestsRef = collection(db, 'outingRequests');
          const q = query(requestsRef, where('studentId', '==', user.uid)); // Fetch requests for the current user
          const querySnapshot = await getDocs(q);

          const fetchedRequests = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

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

  const filteredRequests =
    filter === 'All'
      ? requests
      : requests.filter((r) => r.status?.toLowerCase() === filter.toLowerCase());

  return (
    <div>
      <div className="max-w-7xl mx-auto p-8 mt-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold">My Outing Requests</h2>
            <p className="text-base text-gray-600">Manage and track your hostel outing requests</p>
          </div>
          <Link to="/requestpage">
            <button className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
              <span className="mr-2">➕</span> New Request
            </button>
          </Link>
        </div>

        {/* Filter Buttons */}
        <div className="bg-gray-100 p-4 rounded-md flex items-center space-x-4 mb-8">
          <span className="font-medium text-gray-700">Filter:</span>
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Requests Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-bars loading-lg"></span>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredRequests.map((req) => {
              const styles = statusStyles[req.status?.toLowerCase()] || {
                icon: <PendingIcon className="text-gray-600" />,
                bg: 'bg-gray-50 border-gray-200',
                text: 'text-gray-700',
              }; // Fallback styles for undefined statuses

              return (
                <div key={req.id} className={`border rounded-xl p-6 shadow-sm ${styles.bg} border-l-4`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-2">
                      {styles.icon}
                      <span className={`font-semibold ${styles.text}`}>{req.status || 'Unknown'}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">{req.requestType || 'Outing Request'}</h3>

                  <div className="flex items-center text-sm text-gray-700 mb-1">
                    <CalendarTodayIcon className="w-4 h-4 mr-1" />
                    <span>Out Date: {req.outDate || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700 mb-2">
                    <AccessTimeIcon className="w-4 h-4 mr-1" />
                    <span>Return Date: {req.returnDate || 'N/A'}</span>
                  </div>

                  <hr className="my-3" />

                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {req.reason || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Warden:</span> {req.warden || 'N/A'}
                  </p>

                  {/* Conditionally Render ApprovedAt or RejectedAt */}
                  {req.approvedAt && (
                    <p className="text-sm text-green-600">
                      <span className="font-medium">Approved At:</span>{' '}
                      {new Date(req.approvedAt.seconds * 1000).toLocaleString()}
                    </p>
                  )}
                  {req.rejectedAt && (
                    <p className="text-sm text-red-600">
                      <span className="font-medium">Rejected At:</span>{' '}
                      {new Date(req.rejectedAt.seconds * 1000).toLocaleString()}
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
