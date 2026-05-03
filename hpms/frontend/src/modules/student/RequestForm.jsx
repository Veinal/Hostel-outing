import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import client from '../../api/client';

export default function RequestForm() {
  const navigate = useNavigate();
  const location = useLocation();
  // Step 6.2: Pre-fill from rejected request if navigated with state
  const prefill = location.state?.prefill || null;

  const [form, setForm] = useState({
    requestType: prefill?.requestType || 'OUTING',
    location: prefill?.location || '',
    reason: prefill?.reason || '',
    wardenId: prefill?.wardenId || '',
    outDateTime: '',
    expectedReturnDateTime: '',
  });
  const [wardens, setWardens] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Step 6.1: Delayed return flag for weekend outings
  // delayFlagged is local UI state only — NOT sent to the create API
  // (the backend sets delayFlagged via PUT /requests/:id/delay after stepping out)
  const [delayFlagged, setDelayFlagged] = useState(false);
  // Weekend return note
  const [weekendNote, setWeekendNote] = useState('');

  useEffect(() => {
    client.get('/users/wardens')
      .then(res => {
        const wardenList = res.data.data?.wardens || [];
        setWardens(wardenList);
        // Pre-select warden if prefilling
        if (!form.wardenId && wardenList.length > 0) {
          setForm(prev => ({ ...prev, wardenId: wardenList[0].id }));
        }
      })
      .catch(err => console.error('Error fetching wardens:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  // Step 6.6: Weekend auto-set return time to 19:00 for OUTING
  useEffect(() => {
    if (form.requestType === 'OUTING' && form.outDateTime && isWeekend(form.outDateTime) && !delayFlagged) {
      // Auto-set return time to 19:00 on same day
      const d = new Date(form.outDateTime);
      d.setHours(19, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      const returnStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T19:00`;
      setForm(prev => ({ ...prev, expectedReturnDateTime: returnStr }));
      setWeekendNote('Return time is automatically set to 7:00 PM for weekend outings.');
    } else if (!delayFlagged) {
      setWeekendNote('');
    }
  }, [form.requestType, form.outDateTime, delayFlagged]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'requestType') {
      setDelayedReturn(false);
      setWeekendNote('');
    }
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Step 6.7: Client-side validation — 1h for OUTING, 4h for others
  const validate = () => {
    if (!form.outDateTime || !form.expectedReturnDateTime) {
      return 'Please select both out and return times.';
    }
    const outTime = new Date(form.outDateTime);
    const retTime = new Date(form.expectedReturnDateTime);
    const now = new Date();

    if (retTime <= outTime) return 'Return time must be after departure time.';

    const diffHours = (outTime.getTime() - now.getTime()) / 3600000;

    if (form.requestType === 'OUTING') {
      // Outing: today only, minimum 1 hour notice
      const todayStr = now.toISOString().split('T')[0];
      const outDateStr = form.outDateTime.split('T')[0];
      if (outDateStr !== todayStr) return 'Outing requests must be for today only.';
      if (diffHours < 1) return 'Outing time must be at least 1 hour from now.';
    } else {
      // Leave / Home Going / Others: 4 hours notice
      const todayStr = now.toISOString().split('T')[0];
      const outDateStr = form.outDateTime.split('T')[0];
      if (outDateStr === todayStr && diffHours < 3.5) {
        return 'Out-time must be at least 4 hours from now.';
      }
    }

    if (form.requestType === 'OUTING' && !form.location) return 'Location is required for Outing.';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const validationError = validate();
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      // NOTE: delayFlagged is NOT sent here — it is set by the backend
      // via PUT /requests/:id/delay after the student has stepped out.
      // The create validator does not accept it.
      const payload = {
        requestType: form.requestType,
        location: form.location || undefined,
        reason: form.reason,
        wardenId: form.wardenId,
        outDateTime: new Date(form.outDateTime).toISOString(),
        expectedReturnDateTime: new Date(form.expectedReturnDateTime).toISOString(),
      };
      await client.post('/requests', payload);
      setSnackbar({ open: true, message: 'Request submitted successfully!', severity: 'success' });
      setTimeout(() => navigate('/student/dashboard'), 1500);
    } catch (err) {
      const msg = err.response?.data?.error?.details?.join(', ')
        || err.response?.data?.error?.message
        || 'Failed to submit the request. Please try again.';
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-5">
        <h2 className="text-2xl font-bold mb-1">New Outing Request</h2>
        <p className="text-sm text-gray-600 mb-8">
          Fill in the details below to submit your hostel outing request
        </p>

        {prefill && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <p className="text-indigo-700 text-sm font-medium">
              ℹ️ You are re-applying based on a rejected request. Please review and update the details before submitting.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col md:flex-row md:space-x-4">
            <div className="flex-1">
              <label className="block font-medium mb-1">
                Request Type <span className="text-red-500">*</span>
              </label>
              <select
                name="requestType"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.requestType}
                onChange={handleChange}
                required
              >
                <option value="" disabled>Select Request Type</option>
                <option value="OUTING">Outing</option>
                <option value="LEAVE">Leave</option>
                <option value="HOME_GOING">Home Going</option>
                <option value="OTHERS">Other</option>
              </select>
            </div>

            {form.requestType === 'OUTING' && (
              <div className="flex-1 mt-4 md:mt-0">
                <label className="block font-medium mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  placeholder="Enter location"
                  value={form.location}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block font-medium mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              name="reason"
              placeholder="Provide a reason for your request..."
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          {/* Select Warden */}
          <div>
            <label className="block font-medium mb-1">
              Select Warden <span className="text-red-500">*</span>
            </label>
            <select
              name="wardenId"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
              value={form.wardenId}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Select Warden</option>
              {wardens.map((warden) => (
                <option key={warden.id} value={warden.id}>
                  {warden.fullName}{warden.isActive === false ? ' (Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Out Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="outDateTime"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.outDateTime}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Please make sure to select AM or PM correctly.
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Expected Return Date &amp; Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="expectedReturnDateTime"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.expectedReturnDateTime}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Please make sure to select AM or PM correctly.
              </div>
            </div>
          </div>

          {/* Step 6.6: Weekend note + Step 6.1: Delay checkbox */}
          {form.requestType === 'OUTING' && form.outDateTime && isWeekend(form.outDateTime) && (
            <div className="flex flex-col mt-2">
              <div className="flex items-center mb-1">
                <input
                  type="checkbox"
                  id="delayFlagged"
                  checked={delayFlagged}
                  onChange={() => setDelayFlagged(prev => !prev)}
                  className="mr-2"
                />
                <label htmlFor="delayFlagged" className="text-sm">
                  Flag Delayed Return (allows return after 7 PM)
                </label>
              </div>
              {delayFlagged && (
                <div className="text-yellow-600 text-xs">
                  Warning: You can now set return time after 7 PM. After approval and exit, use the delay report feature if you are running late.
                </div>
              )}
              {!delayFlagged && weekendNote && (
                <div className="text-blue-600 text-xs">
                  {weekendNote} Check the box above to allow later return.
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <Link to="/student/dashboard">
              <button
                type="button"
                className="px-4 py-2 mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className={`px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer flex items-center justify-center ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
            snackbar.severity === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <span>{snackbar.message}</span>
            <button onClick={() => setSnackbar({ ...snackbar, open: false })} className="ml-2 text-white font-bold">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
