import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export const ManageWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [selectedWarden, setSelectedWarden] = useState(null); // For viewing warden details
  const [deleteWardenId, setDeleteWardenId] = useState(null); // For confirming deletion

  useEffect(() => {
    const fetchWardens = async () => {
      const wardensCollection = collection(db, 'users');
      const wardenDocs = await getDocs(wardensCollection);
      const wardenList = wardenDocs.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.role === 'warden');
      setWardens(wardenList);
    };

    fetchWardens();
  }, []);

  const handleDelete = async () => {
    if (deleteWardenId) {
      await deleteDoc(doc(db, 'users', deleteWardenId));
      setWardens(wardens.filter((warden) => warden.id !== deleteWardenId));
      setDeleteWardenId(null); // Close the delete modal
    }
  };

  const handleView = (warden) => {
    setSelectedWarden(warden); // Open the view modal with warden details
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Wardens</h1>
      <div className="overflow-x-auto">
        <table className="table w-full border border-gray-200 rounded-lg shadow">
          <thead>
            <tr>
              <th className="bg-gray-100 text-gray-600">Photo</th>
              <th className="bg-gray-100 text-gray-600">Full Name</th>
              <th className="bg-gray-100 text-gray-600">Email</th>
              <th className="bg-gray-100 text-gray-600">Block</th>
              <th className="bg-gray-100 text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wardens.map((warden) => (
              <tr key={warden.id}>
                <td className="text-center">
                  <img
                    src={warden.photoURL || 'https://via.placeholder.com/50'}
                    alt="warden"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </td>
                <td className="text-gray-800">{warden.fullName}</td>
                <td className="text-gray-600">{warden.email}</td>
                <td className="text-gray-600">{warden.block || 'N/A'}</td>
                <td>
                  <button
                    onClick={() => handleView(warden)}
                    className="btn btn-sm btn-primary mr-2"
                  >
                    View
                  </button>
                  <button
                    onClick={() => setDeleteWardenId(warden.id)}
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

      {/* View Warden Modal */}
      {selectedWarden && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Warden Details</h3>
            <div className="card bg-gray-100 shadow-md p-4 mt-4">
              <img
                src={selectedWarden.photoURL || 'https://via.placeholder.com/100'}
                alt="warden"
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4"
              />
              <p><strong>Full Name:</strong> {selectedWarden.fullName}</p>
              <p><strong>Email:</strong> {selectedWarden.email}</p>
              <p><strong>Block:</strong> {selectedWarden.block || 'N/A'}</p>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setSelectedWarden(null)}
                className="btn btn-sm btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteWardenId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Deletion</h3>
            <p>Are you sure you want to delete this warden?</p>
            <div className="modal-action">
              <button
                onClick={handleDelete}
                className="btn btn-sm btn-error"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteWardenId(null)}
                className="btn btn-sm btn-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};