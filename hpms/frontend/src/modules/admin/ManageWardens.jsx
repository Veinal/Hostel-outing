import React, { useEffect, useState } from 'react';
import { adminApi } from './adminApi';
import SideBar from '../../shared/SideBar';

export default function ManageWardens() {
  const [wardens, setWardens] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarden, setSelectedWarden] = useState(null);
  const [editWarden, setEditWarden] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', blockId: '' });
  const [deleteWardenId, setDeleteWardenId] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', blockId: '' });
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [wData, bData] = await Promise.all([adminApi.getWardens(), adminApi.getBlocks()]);
      setWardens(wData);
      setBlocks(bData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminApi.createWarden({ ...formData, blockId: formData.blockId || null });
      setShowForm(false);
      setFormData({ fullName: '', email: '', phone: '', password: '', blockId: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to create warden');
    }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await adminApi.updateWarden(editWarden.id, {
        fullName: editForm.fullName,
        email: editForm.email,
        phone: editForm.phone,
        blockId: editForm.blockId || null,
      });
      setEditWarden(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update warden');
    }
  };

  const handleDeactivate = async () => {
    if (!deleteWardenId) return;
    try {
      await adminApi.deleteWarden(deleteWardenId);
      setDeleteWardenId(null);
      fetchData();
    } catch (err) {
      alert('Failed to deactivate warden');
    }
  };

  const handleAssign = async (id, blockId) => {
    try {
      await adminApi.assignWarden(id, blockId || null);
      fetchData();
    } catch (err) {
      alert('Failed to assign block');
    }
  };

  // Pagination
  const totalPages = Math.ceil(wardens.length / rowsPerPage);
  const currentRows = wardens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <SideBar />
        <main className="flex-1 flex items-center justify-center">
          <span className="loading loading-bars loading-lg"></span>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <SideBar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Manage Wardens</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : '+ Add Warden'}
          </button>
        </div>

        {/* Add Warden Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow mb-6 border border-gray-200">
            <h3 className="font-bold text-lg mb-4">New Warden</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="input input-bordered w-full" />
              <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input input-bordered w-full" />
              <input type="text" placeholder="Phone" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input input-bordered w-full" />
              <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="input input-bordered w-full" />
              <select value={formData.blockId} onChange={e => setFormData({ ...formData, blockId: e.target.value })} className="select select-bordered w-full">
                <option value="">No Block</option>
                {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" className="btn btn-primary btn-sm px-6">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm px-6">Cancel</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="table w-full">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th>Photo</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Block</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((warden) => (
                <tr key={warden.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td>
                    {warden.photoUrl ? (
                      <img src={warden.photoUrl} alt="Warden" className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        No Photo
                      </div>
                    )}
                  </td>
                  <td className="text-gray-800 font-medium">{warden.fullName}</td>
                  <td className="text-gray-600">{warden.email}</td>
                  <td className="text-gray-600">{warden.wardenOf?.name || 'N/A'}</td>
                  <td>
                    <span className={`badge ${warden.isActive ? 'badge-success' : 'badge-error'}`}>
                      {warden.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditWarden(warden); setEditForm({ fullName: warden.fullName, email: warden.email, phone: warden.phone || '', blockId: warden.wardenOf?.id || '' }); }}
                        className="btn btn-sm btn-success"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedWarden(warden)}
                        className="btn btn-sm btn-primary"
                      >
                        View
                      </button>
                      {warden.isActive && (
                        <button
                          onClick={() => setDeleteWardenId(warden.id)}
                          className="btn btn-sm btn-error"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {wardens.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No wardens found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="join mt-4 flex justify-center">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`join-item btn btn-square ${currentPage === i + 1 ? 'btn-primary' : ''}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* View Modal */}
      {selectedWarden && (
        <div className="modal modal-open flex items-center justify-center" onClick={() => setSelectedWarden(null)}>
          <div className="modal-box relative bg-white rounded-lg shadow-lg p-6" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 btn btn-sm btn-circle btn-error" onClick={() => setSelectedWarden(null)}>✕</button>
            <h3 className="font-bold text-lg text-center mb-4">Warden Details</h3>
            <div className="flex flex-col items-center">
              {selectedWarden.photoUrl ? (
                <img src={selectedWarden.photoUrl} alt="Warden" className="w-24 h-24 rounded-full object-cover mb-4" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-4">No Photo</div>
              )}
              <p className="text-gray-800"><strong>Full Name:</strong> {selectedWarden.fullName}</p>
              <p className="text-gray-800"><strong>Email:</strong> {selectedWarden.email}</p>
              <p className="text-gray-800"><strong>Block:</strong> {selectedWarden.wardenOf?.name || 'N/A'}</p>
              <p className="text-gray-800"><strong>Status:</strong> {selectedWarden.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editWarden && (
        <div className="modal modal-open flex items-center justify-center" onClick={() => setEditWarden(null)}>
          <div className="modal-box relative bg-white rounded-lg shadow-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-2 right-2 btn btn-sm btn-circle btn-error" onClick={() => setEditWarden(null)}>✕</button>
            <h3 className="font-bold text-2xl text-center mb-6 text-primary">Edit Warden</h3>
            <form onSubmit={handleEditSave} className="flex flex-col gap-5">
              <div className="form-control">
                <label className="label font-semibold text-gray-700">Full Name</label>
                <input className="input input-bordered input-primary w-full" type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700">Email</label>
                <input className="input input-bordered input-primary w-full" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700">Phone</label>
                <input className="input input-bordered input-primary w-full" type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="form-control">
                <label className="label font-semibold text-gray-700">Block</label>
                <select className="select select-bordered select-primary w-full" value={editForm.blockId} onChange={e => setEditForm({ ...editForm, blockId: e.target.value })}>
                  <option value="">No Block</option>
                  {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="modal-action flex justify-end gap-2 mt-4">
                <button type="submit" className="btn btn-primary btn-sm px-6 font-semibold">Save</button>
                <button type="button" onClick={() => setEditWarden(null)} className="btn btn-outline btn-sm px-6 font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {deleteWardenId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-red-600">Confirm Deactivation</h3>
            <p>Are you sure you want to deactivate this warden? They will no longer be able to log in.</p>
            <div className="modal-action">
              <button onClick={handleDeactivate} className="btn btn-sm btn-error">Deactivate</button>
              <button onClick={() => setDeleteWardenId(null)} className="btn btn-sm btn-primary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
