import React, { useEffect, useState } from 'react';
import { adminApi } from './adminApi';

export default function ManageWardens() {
  const [wardens, setWardens] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', password: '', blockId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [wData, bData] = await Promise.all([adminApi.getWardens(), adminApi.getBlocks()]);
    setWardens(wData);
    setBlocks(bData);
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

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this warden?')) return;
    try {
      await adminApi.deleteWarden(id);
      fetchData();
    } catch (err) {
      alert('Failed to deactivate');
    }
  };

  const handleAssign = async (id, blockId) => {
    try {
      await adminApi.assignWarden(id, blockId || null);
      fetchData();
    } catch (err) {
      alert('Failed to assign');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Manage Wardens</h2>
      <button onClick={() => setShowForm(!showForm)} style={{ marginBottom: '20px', padding: '10px' }}>
        {showForm ? 'Cancel' : 'Add Warden'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ padding: '20px', border: '1px solid #ccc', marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Full Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ padding: '8px' }} />
          <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '8px' }} />
          <input type="text" placeholder="Phone" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ padding: '8px' }} />
          <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '8px' }} />
          <select value={formData.blockId} onChange={e => setFormData({...formData, blockId: e.target.value})} style={{ padding: '8px' }}>
            <option value="">No Block</option>
            {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <button type="submit" style={{ padding: '8px 16px' }}>Save</button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#eee', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Name</th>
            <th style={{ padding: '10px' }}>Email</th>
            <th style={{ padding: '10px' }}>Status</th>
            <th style={{ padding: '10px' }}>Block Assign</th>
            <th style={{ padding: '10px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {wardens.map(w => (
            <tr key={w.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '10px' }}>{w.fullName}</td>
              <td style={{ padding: '10px' }}>{w.email}</td>
              <td style={{ padding: '10px', color: w.isActive ? 'green' : 'red' }}>{w.isActive ? 'Active' : 'Inactive'}</td>
              <td style={{ padding: '10px' }}>
                <select value={w.wardenOf?.id || ''} onChange={(e) => handleAssign(w.id, e.target.value)} disabled={!w.isActive}>
                  <option value="">None</option>
                  {blocks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </td>
              <td style={{ padding: '10px' }}>
                {w.isActive && <button onClick={() => handleDeactivate(w.id)} style={{ color: 'red' }}>Deactivate</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
