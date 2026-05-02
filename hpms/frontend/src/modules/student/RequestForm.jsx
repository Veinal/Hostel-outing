import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function RequestForm() {
  const [wardens, setWardens] = useState([]);
  const [formData, setFormData] = useState({
    requestType: 'OUTING',
    location: '',
    reason: '',
    wardenId: '',
    outDateTime: '',
    expectedReturnDateTime: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/users/wardens').then(res => {
      setWardens(res.data.data.wardens);
      if (res.data.data.wardens.length > 0) {
        setFormData(prev => ({ ...prev, wardenId: res.data.data.wardens[0].id }));
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const outTime = new Date(formData.outDateTime);
    const retTime = new Date(formData.expectedReturnDateTime);
    const diffHours = (outTime.getTime() - new Date().getTime()) / 3600000;
    
    if (diffHours < 4) return 'Departure time must be at least 4 hours from now';
    if (retTime <= outTime) return 'Return time must be after departure time';
    
    if (formData.requestType === 'OUTING' && !formData.location) return 'Location is required for OUTING';
    
    const day = outTime.getDay();
    if (formData.requestType === 'OUTING' && (day === 0 || day === 6)) {
      if (retTime.getHours() > 19 || (retTime.getHours() === 19 && retTime.getMinutes() > 0)) {
        return 'Weekend outings must return by 19:00';
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        outDateTime: new Date(formData.outDateTime).toISOString(),
        expectedReturnDateTime: new Date(formData.expectedReturnDateTime).toISOString()
      };
      
      await client.post('/requests', payload);
      navigate('/student/dashboard');
    } catch (err) {
      if (err.response?.data?.error?.details) {
        setError(err.response.data.error.details.join(', '));
      } else {
        setError(err.response?.data?.error?.message || 'Failed to submit request');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Submit Request</h2>
      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Request Type:</label>
          <select name="requestType" value={formData.requestType} onChange={handleChange} style={{ width: '100%', padding: '8px' }}>
            <option value="OUTING">Outing</option>
            <option value="HOME_GOING">Home Going</option>
            <option value="OTHERS">Others</option>
          </select>
        </div>

        {formData.requestType === 'OUTING' && (
          <div>
            <label>Location:</label>
            <input name="location" value={formData.location} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
          </div>
        )}

        <div>
          <label>Reason:</label>
          <textarea name="reason" value={formData.reason} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div>
          <label>Warden:</label>
          <select name="wardenId" value={formData.wardenId} onChange={handleChange} required style={{ width: '100%', padding: '8px' }}>
            {wardens.map(w => (
              <option key={w.id} value={w.id}>{w.fullName} ({w.role})</option>
            ))}
          </select>
        </div>

        <div>
          <label>Out Date & Time:</label>
          <input type="datetime-local" name="outDateTime" value={formData.outDateTime} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div>
          <label>Expected Return Date & Time:</label>
          <input type="datetime-local" name="expectedReturnDateTime" value={formData.expectedReturnDateTime} onChange={handleChange} required style={{ width: '100%', padding: '8px' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" disabled={loading} style={{ padding: '10px', flex: 1 }}>{loading ? 'Submitting...' : 'Submit'}</button>
          <button type="button" onClick={() => navigate(-1)} style={{ padding: '10px' }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
