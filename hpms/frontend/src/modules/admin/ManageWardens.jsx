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
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

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

  const totalPages = Math.ceil(wardens.length / rowsPerPage);
  const currentRows = wardens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const inputClass = "border border-slate-300 rounded-lg px-3 py-2.5 text-slate-800 bg-white focus:outline-none focus:border-blue-500 text-sm w-full";
  const labelClass = "text-slate-600 text-xs uppercase font-semibold tracking-wide mb-1 block";

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <SideBar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading wardens...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideBar />
      <main className="flex-1 p-8">

        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Manage Wardens</h1>
            <p className="text-slate-500 text-sm mt-1">Configure staff and block assignments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${showForm ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {showForm ? 'Cancel' : '+ Add Warden'}
          </button>
        </div>

        {/* Add Warden Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">New Staff Member</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className={inputClass} placeholder="Enter full name" />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="warden@hpms.college" />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="+91 00000 00000" />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="••••••••" />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Block Assignment</label>
                <select value={formData.blockId} onChange={e => setFormData({ ...formData, blockId: e.target.value })} className={inputClass}>
                  <option value="">No Assigned Block</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.name} Block</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Photo</th>
                <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Full Name</th>
                <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3">Block</th>
                <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-center">Status</th>
                <th className="text-slate-500 text-xs uppercase font-semibold tracking-wide px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((warden) => (
                <tr key={warden.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    {warden.photoUrl ? (
                      <img src={warden.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        {warden.fullName[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-800 font-semibold">{warden.fullName}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{warden.email}</p>
                  </td>
                  <td className="text-slate-800 px-6 py-4 text-sm">{warden.wardenOf?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${warden.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {warden.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditWarden(warden); setEditForm({ fullName: warden.fullName, email: warden.email, phone: warden.phone || '', blockId: warden.wardenOf?.id || '' }); }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setSelectedWarden(warden)}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        View
                      </button>
                      {warden.isActive && (
                        <button
                          onClick={() => setDeleteWardenId(warden.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-semibold transition-colors"
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
                  <td colSpan={5} className="text-center text-slate-500 py-12 italic">No wardens found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* View Modal */}
      {selectedWarden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedWarden(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl" onClick={() => setSelectedWarden(null)}>✕</button>
            <div className="flex flex-col items-center text-center">
              {selectedWarden.photoUrl ? (
                <img src={selectedWarden.photoUrl} alt="" className="w-20 h-20 rounded-2xl object-cover mb-4 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl mb-4">👤</div>
              )}
              <h3 className="text-xl font-bold text-slate-800 mb-1">{selectedWarden.fullName}</h3>
              <p className="text-blue-600 font-semibold text-sm mb-5">{selectedWarden.wardenOf?.name || 'Unassigned'} Block</p>

              <div className="w-full space-y-3 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="text-slate-800 font-semibold">{selectedWarden.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Phone</span>
                  <span className="text-slate-800 font-semibold">{selectedWarden.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className={`font-bold ${selectedWarden.isActive ? 'text-emerald-600' : 'text-red-500'}`}>{selectedWarden.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editWarden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditWarden(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl" onClick={() => setEditWarden(null)}>✕</button>
            <h3 className="text-xl font-bold text-slate-800 mb-6">Edit Warden</h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input className={inputClass} type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input className={inputClass} type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Block</label>
                <select className={inputClass} value={editForm.blockId} onChange={e => setEditForm({ ...editForm, blockId: e.target.value })}>
                  <option value="">No Block</option>
                  {blocks.map((b) => <option key={b.id} value={b.id}>{b.name} Block</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-semibold transition-colors">Save</button>
                <button type="button" onClick={() => setEditWarden(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-semibold transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {deleteWardenId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Confirm Deactivation</h3>
            <p className="text-slate-500 text-sm mb-6">Are you sure you want to deactivate this warden? They will no longer be able to log in.</p>
            <div className="flex gap-3">
              <button onClick={handleDeactivate} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-semibold transition-colors">Deactivate</button>
              <button onClick={() => setDeleteWardenId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-semibold transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
