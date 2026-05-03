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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="relative z-50 bg-white rounded-2xl shadow-lg border border-slate-200 p-8 w-full max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">New Outing Request</h2>
        <p className="text-slate-500 text-sm mb-6">
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
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                Request Type <span className="text-red-500 ml-1">*</span>
              </label>
              {/* pointer-events:auto and position:relative required — 
                  parent overlay div can intercept clicks without these */}
              <select
                name="requestType"
                value={form.requestType}
                onChange={(e) => {
                  const val = e.target.value;
                  setDelayFlagged(false);
                  setWeekendNote('');
                  setForm(prev => ({
                    ...prev,
                    requestType: val,
                    location: val !== 'OUTING' ? '' : prev.location
                  }));
                }}
                required
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-auto"
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
                <label className="block text-gray-700 font-medium mb-1 text-sm">
                  Location <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
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
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Reason <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              name="reason"
              placeholder="Provide a reason for your request..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          {/* Select Warden */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">
              Select Warden <span className="text-red-500 ml-1">*</span>
            </label>
            {/* pointer-events:auto and position:relative required — 
                parent overlay div can intercept clicks without these */}
            <select
              name="wardenId"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-auto"
              style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
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
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                Out Date &amp; Time <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="datetime-local"
                name="outDateTime"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                value={form.outDateTime}
                onChange={handleChange}
                required
              />
              <div className="text-xs text-gray-500 mt-1">
                Please make sure to select AM or PM correctly.
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1 text-sm">
                Expected Return Date &amp; Time <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="datetime-local"
                name="expectedReturnDateTime"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
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
                <label htmlFor="delayFlagged" className="text-slate-600 text-sm ml-2">
                  Flag Delayed Return (allows return after 7 PM)
                </label>
              </div>
              {delayFlagged && (
                <div className="text-amber-600 text-xs mt-1">
                  Warning: You can now set return time after 7 PM. After approval and exit, use the delay report feature if you are running late.
                </div>
              )}
              {!delayFlagged && weekendNote && (
                <div className="text-blue-600 text-xs mt-1">
                  {weekendNote} Check the box above to allow later return.
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <Link to="/student/dashboard">
              <button
                type="button"
                className="bg-slate-100 hover:bg-slate-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className={`bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
