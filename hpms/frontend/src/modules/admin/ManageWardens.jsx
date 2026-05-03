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

  // Pagination
  const totalPages = Math.ceil(wardens.length / rowsPerPage);
  const currentRows = wardens.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
        <SideBar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading wardens...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <SideBar />
      <main className="flex-1 p-4 md:p-8">
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Manage Wardens</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Configure staff and block assignments</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`${showForm ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200' : 'bg-blue-600 text-white'} px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2`}
          >
            {showForm ? 'Cancel' : '<span>+</span> Add Warden'}
          </button>
        </div>

        {/* Add Warden Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="themed-card p-8 rounded-3xl shadow-sm mb-8 animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-black text-xl mb-6 text-slate-800 dark:text-white flex items-center gap-2">
              <span className="text-blue-600">●</span> New Staff Member
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Full Name</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="themed-input w-full rounded-2xl px-5 py-3 text-sm outline-none" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Email Address</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="themed-input w-full rounded-2xl px-5 py-3 text-sm outline-none" placeholder="warden@hpms.college" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Phone Number</label>
                <input type="text" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="themed-input w-full rounded-2xl px-5 py-3 text-sm outline-none" placeholder="+91 00000 00000" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Secure Password</label>
                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="themed-input w-full rounded-2xl px-5 py-3 text-sm outline-none" placeholder="••••••••" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Block Assignment</label>
                <select value={formData.blockId} onChange={e => setFormData({ ...formData, blockId: e.target.value })} className="themed-input w-full rounded-2xl px-5 py-3 text-sm outline-none appearance-none">
                  <option value="">No Assigned Block</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.name} Block</option>)}
                </select>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold text-sm">Save Staff Record</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-8 py-3 rounded-xl font-bold text-sm">Dismiss</button>
            </div>
          </form>
        )}

        <div className="themed-card rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Staff Info</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400">Assignment</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-center">Status</th>
                <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-black text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {currentRows.map((warden) => (
                <tr key={warden.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      {warden.photoUrl ? (
                        <img src={warden.photoUrl} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl">
                          {warden.fullName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-800 dark:text-white leading-tight">{warden.fullName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{warden.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{warden.wardenOf?.name || 'Unassigned'}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Primary Block</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${warden.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {warden.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => { setEditWarden(warden); setEditForm({ fullName: warden.fullName, email: warden.email, phone: warden.phone || '', blockId: warden.wardenOf?.id || '' }); }}
                        className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                        title="Edit Record"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setSelectedWarden(warden)}
                        className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                        title="View Details"
                      >
                        👁️
                      </button>
                      {warden.isActive && (
                        <button
                          onClick={() => setDeleteWardenId(warden.id)}
                          className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                          title="Deactivate"
                        >
                          🚫
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 border border-slate-100 dark:border-slate-800'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* View Modal */}
      {selectedWarden && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => setSelectedWarden(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setSelectedWarden(null)}>✕</button>
            <div className="flex flex-col items-center text-center">
              {selectedWarden.photoUrl ? (
                <img src={selectedWarden.photoUrl} alt="" className="w-24 h-24 rounded-3xl object-cover mb-6 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-4xl mb-6">👤</div>
              )}
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-1">{selectedWarden.fullName}</h3>
              <p className="text-blue-600 font-bold text-sm mb-6 uppercase tracking-widest">{selectedWarden.wardenOf?.name || 'Unassigned'} Warden</p>
              
              <div className="w-full space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="font-black text-slate-400 uppercase tracking-tighter">Email</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedWarden.email}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-black text-slate-400 uppercase tracking-tighter">Phone</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">{selectedWarden.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-black text-slate-400 uppercase tracking-tighter">Status</span>
                  <span className={`font-black uppercase ${selectedWarden.isActive ? 'text-emerald-500' : 'text-red-500'}`}>{selectedWarden.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editWarden && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200" onClick={() => setEditWarden(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <button className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors" onClick={() => setEditWarden(null)}>✕</button>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8">Update Records</h3>
            <form onSubmit={handleEditSave} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Full Name</label>
                <input className="themed-input w-full rounded-2xl px-5 py-3 text-sm" type="text" value={editForm.fullName} onChange={e => setEditForm({ ...editForm, fullName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Email Address</label>
                <input className="themed-input w-full rounded-2xl px-5 py-3 text-sm" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Phone Number</label>
                <input className="themed-input w-full rounded-2xl px-5 py-3 text-sm" type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2 ml-1">Block Assignment</label>
                <select className="themed-input w-full rounded-2xl px-5 py-3 text-sm appearance-none" value={editForm.blockId} onChange={e => setEditForm({ ...editForm, blockId: e.target.value })}>
                  <option value="">No Block</option>
                  {blocks.map((b) => <option key={b.id} value={b.id}>{b.name} Block</option>)}
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="submit" className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-bold transition-all">Save Changes</button>
                <button type="button" onClick={() => setEditWarden(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-2xl font-bold transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation */}
      {deleteWardenId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">⚠️</div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Confirm Action</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Are you sure you want to deactivate this staff member? This will immediately revoke their system access.</p>
            <div className="flex gap-3">
              <button onClick={handleDeactivate} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold transition-all">Deactivate</button>
              <button onClick={() => setDeleteWardenId(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-xl font-bold transition-all">Go Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
