import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { SideBar } from './SideBar';

export const ManageRequests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteRequestId, setDeleteRequestId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // State to track loading
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      const auth = getAuth();

      // Listen for authentication state changes
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          // If no user is logged in, redirect to home page
          navigate('/');
          return;
        }

        // Fetch the user's role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData.role;

          if (userRole !== 'admin') {
            // If the user is not an admin, redirect to home page
            navigate('/');
          } else {
            // User is an admin, allow access
            setIsLoading(false);
          }
        } else {
          // If the user's role is not found, redirect to home page
          navigate('/');
        }
      });
    };

    checkAdminRole();
  }, [navigate]);

  useEffect(() => {
    const fetchRequests = async () => {
      const requestsCollection = collection(db, 'outingRequests');
      const requestDocs = await getDocs(requestsCollection);
      const requestList = requestDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRequests(requestList);
    };

    fetchRequests();
  }, []);

  const handleDelete = async () => {
    if (deleteRequestId) {
      await deleteDoc(doc(db, 'outingRequests', deleteRequestId));
      setRequests(requests.filter((request) => request.id !== deleteRequestId));
      setDeleteRequestId(null);
    }
  };

  const handleView = (request) => {
    setSelectedRequest(request);
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = requests.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(requests.length / rowsPerPage);

  if (isLoading) {
    // Show a loading spinner or message while checking the user's role
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-4 md:p-8 bg-gray-50">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Requests</h1>
        {/* Controls above table */}
        <div className="mb-3 flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-700">Rows</label>
          <select
            className="select select-bordered select-md w-16"
            value={rowsPerPage}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              setRowsPerPage(next);
              setCurrentPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="bg-gray-100 text-gray-600">Student Name</th>
                <th className="bg-gray-100 text-gray-600">Request Type</th>
                <th className="bg-gray-100 text-gray-600">Reason</th>
                <th className="bg-gray-100 text-gray-600">Out Date</th>
                <th className="bg-gray-100 text-gray-600">Return Date</th>
                <th className="bg-gray-100 text-gray-600">Status</th>
                <th className="bg-gray-100 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((request) => (
                <tr key={request.id}>
                  <td className="text-gray-800">{request.studentName}</td>
                  <td className="text-gray-800">{request.requestType}</td>
                  <td className="text-gray-800">{request.reason}</td>
                  <td className="text-gray-800">{request.outDate}</td>
                  <td className="text-gray-800">{request.returnDate}</td>
                  <td className="text-gray-800">{request.status}</td>
                  <td>
                    <button
                      onClick={() => handleView(request)}
                      className="btn btn-sm btn-primary mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setDeleteRequestId(request.id)}
                      className="btn btn-sm btn-error"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="join mt-4 flex justify-center">
          {Array.from({ length: totalPages }, (_, index) => (
            <input
              key={index + 1}
              type="radio"
              name="pagination"
              aria-label={`${index + 1}`}
              className={`join-item btn btn-square ${
                currentPage === index + 1 ? 'btn-primary' : ''
              }`}
              onClick={() => setCurrentPage(index + 1)}
            />
          ))}
        </div>

        {/* View Request Modal */}
        {selectedRequest && (
          <div
            className="modal modal-open flex items-center justify-center"
            onClick={() => setSelectedRequest(null)} // Close modal on outside click
          >
            <div
              className="modal-box relative bg-white rounded-lg shadow-lg p-6"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <button
                className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                onClick={() => setSelectedRequest(null)}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg text-center mb-4">Request Details</h3>
              <div className="flex flex-col items-center">
                <p className="text-gray-800">
                  <strong>Student Name:</strong> {selectedRequest.studentName}
                </p>
                <p className="text-gray-800">
                  <strong>Request Type:</strong> {selectedRequest.requestType}
                </p>
                <p className="text-gray-800">
                  <strong>Reason:</strong> {selectedRequest.reason}
                </p>
                <p className="text-gray-800">
                  <strong>Out Date:</strong> {selectedRequest.outDate}
                </p>
                <p className="text-gray-800">
                  <strong>Return Date:</strong> {selectedRequest.returnDate}
                </p>
                <p className="text-gray-800">
                  <strong>Status:</strong> {selectedRequest.status}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteRequestId && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-red-600">Confirm Deletion</h3>
              <p>Are you sure you want to delete this request?</p>
              <div className="modal-action">
                <button
                  onClick={handleDelete}
                  className="btn btn-sm btn-error"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteRequestId(null)}
                  className="btn btn-sm btn-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
