import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { profileApi } from './profileApi';
import client from '../../api/client';

export default function WardenProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ phone: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setFormData({ phone: user.phone || '' });
  }, [user]);

  const handleProfileChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.put('/users/me/profile', formData);
      alert('Profile updated successfully');
    } catch (err) {
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      return alert('New passwords do not match');
    }
    setLoading(true);
    try {
      await profileApi.changePassword(passwordData.currentPassword, passwordData.newPassword);
      alert('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Warden Profile</h2>
      
      <div style={{ marginBottom: '30px' }}>
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Full Name</label>
            <input value={user?.fullName || ''} disabled style={{ width: '100%', padding: '8px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label>Email</label>
            <input value={user?.email || ''} disabled style={{ width: '100%', padding: '8px', backgroundColor: '#f0f0f0' }} />
          </div>
          <div>
            <label>Phone</label>
            <input name="phone" value={formData.phone} onChange={handleProfileChange} style={{ width: '100%', padding: '8px' }} />
          </div>
          <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>Save Profile</button>
        </form>
      </div>

      <div style={{ borderTop: '1px solid #ccc', paddingTop: '20px' }}>
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
          <input type="password" name="currentPassword" placeholder="Current Password" required value={passwordData.currentPassword} onChange={handlePasswordChange} style={{ padding: '8px' }} />
          <input type="password" name="newPassword" placeholder="New Password" required value={passwordData.newPassword} onChange={handlePasswordChange} style={{ padding: '8px' }} />
          <input type="password" name="confirmNewPassword" placeholder="Confirm New Password" required value={passwordData.confirmNewPassword} onChange={handlePasswordChange} style={{ padding: '8px' }} />
          <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', border: 'none' }}>Update Password</button>
        </form>
      </div>
    </div>
  );
}
