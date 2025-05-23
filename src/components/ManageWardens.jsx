import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { SideBar } from './SideBar';
import axios from 'axios';

export const ManageWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [deleteWardenId, setDeleteWardenId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true); // State to track loading
  const [editWarden, setEditWarden] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', block: '', status: '', photo: '' });
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [blocks, setBlocks] = useState([]); // State for all hostel blocks
  const navigate = useNavigate();
  const rowsPerPage = 10;

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

  useEffect(() => {
    // Fetch all blocks from both boysHostel and girlsHostel
    const fetchBlocks = async () => {
      try {
        const boysSnapshot = await getDocs(collection(db, 'boysHostel'));
        const girlsSnapshot = await getDocs(collection(db, 'girlsHostel'));
        const boysBlocks = boysSnapshot.docs.map((doc) => doc.id);
        const girlsBlocks = girlsSnapshot.docs.map((doc) => doc.id);
        const allBlocks = Array.from(new Set([...boysBlocks, ...girlsBlocks]));
        setBlocks(allBlocks);
      } catch (err) {
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, []);

  const handleDelete = async () => {
    if (deleteWardenId) {
      await deleteDoc(doc(db, 'users', deleteWardenId));
      setWardens(wardens.filter((warden) => warden.id !== deleteWardenId));
      setDeleteWardenId(null);
    }
  };

  const handleView = (warden) => {
    setSelectedWarden(warden);
  };

  const handleEdit = (warden) => {
    setEditWarden(warden);
    setEditForm({
      fullName: warden.fullName || '',
      email: warden.email || '',
      block: warden.block || '',
      status: warden.status || '',
      photo: warden.photo || '',
    });
    setEditPhotoFile(null);
  };

  // Pagination logic
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = wardens.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(wardens.length / rowsPerPage);

  if (isLoading) {
    // Show a loading spinner or message while checking the user's role
    return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-bars loading-lg"></span></div>;
  }

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Wardens</h1>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full border border-gray-200 rounded-lg shadow">
            <thead>
              <tr>
                <th className="bg-gray-100 text-gray-600">Photo</th>
                <th className="bg-gray-100 text-gray-600">Full Name</th>
                <th className="bg-gray-100 text-gray-600">Email</th>
                <th className="bg-gray-100 text-gray-600">Block</th>
                <th className="bg-gray-100 text-gray-600">Status</th>
                <th className="bg-gray-100 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((warden) => (
                <tr key={warden.id}>
                  <td className="text-center">
                    <img
                      src={warden.photo || 'https://via.placeholder.com/50'}
                      alt="warden"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </td>
                  <td className="text-gray-800">{warden.fullName}</td>
                  <td className="text-gray-600">{warden.email}</td>
                  <td className="text-gray-600">{warden.block || 'N/A'}</td>
                  <td className="text-gray-600">{warden.status || 'N/A'}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(warden)}
                      className="btn btn-sm btn-success mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleView(warden)}
                      className="btn btn-sm btn-primary mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setDeleteWardenId(warden.id)}
                      className="btn btn-sm btn-error mr-2"
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

        {/* View Warden Modal */}
        {selectedWarden && (
          <div
            className="modal modal-open flex items-center justify-center"
            onClick={() => setSelectedWarden(null)} // Close modal on outside click
          >
            <div
              className="modal-box relative bg-white rounded-lg shadow-lg p-6"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
              <button
                className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                onClick={() => setSelectedWarden(null)}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg text-center mb-4">Warden Details</h3>
              <div className="flex flex-col items-center">
                <img
                  src={selectedWarden.photo || 'https://via.placeholder.com/100'}
                  alt="Warden"
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />
                <p className="text-gray-800">
                  <strong>Full Name:</strong> {selectedWarden.fullName}
                </p>
                <p className="text-gray-800">
                  <strong>Email:</strong> {selectedWarden.email}
                </p>
                <p className="text-gray-800">
                  <strong>Block:</strong> {selectedWarden.block || 'N/A'}
                </p>
                <p className="text-gray-800">
                  <strong>Status:</strong> {selectedWarden.status || 'N/A'}
                </p>
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

        {editWarden && (
          <div
            className="modal modal-open flex items-center justify-center"
            onClick={() => setEditWarden(null)}
          >
            <div
              className="modal-box relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                onClick={() => setEditWarden(null)}
              >
                ✕
              </button>
              <h3 className="font-bold text-2xl text-center mb-6 text-primary">Edit Warden</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  let photoUrl = editForm.photo;
                  if (editPhotoFile) {
                    const formDataCloud = new FormData();
                    formDataCloud.append('file', editPhotoFile);
                    formDataCloud.append('upload_preset', 'Hostel outing');
                    formDataCloud.append('cloud_name', 'dckqij0ar');
                    formDataCloud.append('folder', 'hostel_outing');
                    const response = await axios.post(
                      'https://api.cloudinary.com/v1_1/dckqij0ar/image/upload',
                      formDataCloud
                    );
                    photoUrl = response.data.secure_url;
                  }
                  await updateDoc(doc(db, 'users', editWarden.id), {
                    fullName: editForm.fullName,
                    email: editForm.email,
                    block: editForm.block,
                    status: editForm.status,
                    photo: photoUrl,
                  });
                  setWardens((prev) =>
                    prev.map((w) =>
                      w.id === editWarden.id ? { ...w, ...editForm, photo: photoUrl } : w
                    )
                  );
                  setEditWarden(null);
                }}
                className="flex flex-col gap-5"
              >
                <div className="form-control flex flex-col items-center">
                  {/* <label className="label font-semibold text-gray-700">Photo</label> */}
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={editPhotoFile ? URL.createObjectURL(editPhotoFile) : (editForm.photo || 'https://via.placeholder.com/100')}
                      alt="Warden"
                      className="w-28 h-28 rounded-full object-cover border shadow mb-2"
                    />
                    <input
                      id="editPhotoUpload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => setEditPhotoFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="editPhotoUpload"
                      className="btn btn-sm btn-primary px-4 py-1 text-xs font-semibold cursor-pointer"
                    >
                      Choose Photo
                    </label>
                  </div>
                </div>
                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Full Name</label>
                  <input
                    className="input input-bordered input-primary w-full"
                    type="text"
                    placeholder="Full Name"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Email</label>
                  <input
                    className="input input-bordered input-primary w-full"
                    type="email"
                    placeholder="Email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Block</label>
                  <select
                    className="select select-bordered select-primary w-full"
                    value={editForm.block}
                    onChange={(e) => setEditForm({ ...editForm, block: e.target.value })}
                    required
                  >
                    <option value="">Select Block</option>
                    {blocks.map((block) => (
                      <option key={block} value={block}>{block}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label font-semibold text-gray-700">Status</label>
                  <select
                    className="select select-bordered select-primary w-full"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="modal-action flex justify-end gap-2 mt-4">
                  <button type="submit" className="btn btn-primary btn-sm px-6 font-semibold">
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm px-6 font-semibold"
                    onClick={() => setEditWarden(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};