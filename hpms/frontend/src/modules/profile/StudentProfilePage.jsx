import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/useAuth';
import { profileApi } from './profileApi';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ phone: '', year: '', branch: '', roomId: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ phone: user.phone || '', year: user.year || '', branch: user.branch || '', roomId: user.roomId || '' });
    }
    profileApi.getBlocks().then(setBlocks).catch(console.error);
  }, [user]);

  const handleProfileChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await profileApi.updateStudentProfile(formData);
      alert('Profile updated successfully');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update profile');
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      // TODO: In production, upload to S3/Server via multipart instead of storing base64 strings directly in DB
      const base64Str = reader.result;
      try {
        await profileApi.updateStudentProfile({ photoUrl: base64Str });
        alert('Photo updated successfully! Please refresh.');
      } catch (err) {
        alert('Failed to update photo');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Student Profile</h2>
      
      <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '150px', height: '150px', backgroundColor: '#eee', borderRadius: '50%', overflow: 'hidden', marginBottom: '10px' }}>
            {user?.photoUrl ? <img src={user.photoUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
          </div>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>

        <div style={{ flex: 2 }}>
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
              <label>USN</label>
              <input value={user?.usn || ''} disabled style={{ width: '100%', padding: '8px', backgroundColor: '#f0f0f0' }} />
            </div>
            <div>
              <label>Phone</label>
              <input name="phone" value={formData.phone} onChange={handleProfileChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div>
              <label>Branch</label>
              <input name="branch" value={formData.branch} onChange={handleProfileChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div>
              <label>Year</label>
              <input name="year" type="number" value={formData.year} onChange={handleProfileChange} style={{ width: '100%', padding: '8px' }} />
            </div>
            <div>
              <label>Room</label>
              <select name="roomId" value={formData.roomId} onChange={handleProfileChange} style={{ width: '100%', padding: '8px' }}>
                <option value="">Select Room</option>
                {blocks.map(block => (
                  <optgroup key={block.id} label={`Block ${block.name}`}>
                    {block.floors?.map(floor => 
                      floor.rooms?.map(room => (
                        <option key={room.id} value={room.id}>{room.displayName}</option>
                      ))
                    )}
                  </optgroup>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none' }}>Save Profile</button>
          </form>
        </div>
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
