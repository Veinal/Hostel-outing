import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';
import dayjs from 'dayjs';

export const RequestPage = () => {
  // Helper function to format time with leading zeros
  const formatTime = (hour, minute) => {
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  };

  const [form, setForm] = useState({
    requestType: '',
    location: '',
    reason: '',
    warden: '',
    outDateTime: null,
    returnDateTime: null,
  });

  const [student, setStudent] = useState({ id: '', name: '' });
  const [wardens, setWardens] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [delayedReturn, setDelayedReturn] = useState(false);

  useEffect(() => {
    // Fetch the currently logged-in student's ID and name from Firestore
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        setStudent({
          id: user.uid,
          name: userDoc.exists() ? userDoc.data().fullName || '' : '',
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchWardens = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'warden'));
        const querySnapshot = await getDocs(q);
        const wardenList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().fullName || 'Unnamed Warden',
          status: doc.data().status || 'inactive',
        }));
        setWardens(wardenList);
      } catch (error) {
        console.error('Error fetching wardens:', error);
      }
    };

    fetchWardens();
  }, []);

  const isWeekend = (dateTime) => {
    if (!dateTime) return false;
    const day = dateTime.day();
    return day === 0 || day === 6;
  };

  useEffect(() => {
    if (
      form.requestType === 'Outing' &&
      form.outDateTime &&
      isWeekend(form.outDateTime) &&
      !delayedReturn
    ) {
      // Set return time to 7 PM on the same day for weekend outings
      const returnDateTime = form.outDateTime.hour(19).minute(0).second(0);
      setForm((prev) => ({
        ...prev,
        returnDateTime: returnDateTime,
      }));
    }
  }, [form.requestType, form.outDateTime, delayedReturn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special logic for requestType
    if (name === 'requestType') {
      if (value === 'Outing') {
        setForm({
          ...form,
          requestType: value,
          outDateTime: dayjs(),
          returnDateTime: dayjs().add(1, 'hour'),
        });
      } else {
        setForm({
          ...form,
          requestType: value,
          outDateTime: null,
          returnDateTime: null,
        });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleDateTimeChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate date times
    if (!form.outDateTime || !form.returnDateTime) {
      setSnackbar({ open: true, message: 'Please select both out and return times.', severity: 'error' });
      return;
    }

    // Check if return time is after out time
    if (form.returnDateTime.isBefore(form.outDateTime)) {
      setSnackbar({ open: true, message: 'Return time must be after out time.', severity: 'error' });
      return;
    }

    // Minimum Time Window Enforcement (4 hours before out-time)
    // Only check if outDate is today
    const now = dayjs();
    const outDateTime = form.outDateTime;
    const diffHours = outDateTime.diff(now, 'hour', true);
    
    const todayStr = now.format('YYYY-MM-DD');
    const outDateStr = outDateTime.format('YYYY-MM-DD');
    
    if (outDateStr === todayStr) {
      if (diffHours < 3.5) {
        setSnackbar({ open: true, message: 'Out-time must be at least 4 hours from now.', severity: 'error' });
        return;
      }
    }

    try {
      const selectedWarden = wardens.find((warden) => warden.name === form.warden);

      if (!selectedWarden) {
        setSnackbar({ open: true, message: 'Invalid warden selected. Please try again.', severity: 'error' });
        return;
      }

      const requestData = {
        requestType: form.requestType,
        location: form.location,
        reason: form.reason,
        warden: form.warden,
        outDate: form.outDateTime.format('YYYY-MM-DD'),
        returnDate: form.returnDateTime.format('YYYY-MM-DD'),
        outTime: form.outDateTime.format('h:mm A'),
        returnTime: form.returnDateTime.format('h:mm A'),
        studentId: student.id,
        studentName: student.name,
        wardenUid: selectedWarden.id,
        status: 'pending',
        timestamp: new Date(),
        delayedReturn: delayedReturn,
      };

      // Add the request to Firestore
      const requestDocRef = await addDoc(collection(db, 'outingRequests'), requestData);
      
      // Create notification for the warden
      const notificationData = {
        warden: selectedWarden.id, // warden's UID
        sender: student.id, // sender is the student
        type: 'new_request',
        requestId: requestDocRef.id,
        title: 'New Outing Request',
        message: `New ${form.requestType} request from ${student.name} for ${form.outDateTime.format('YYYY-MM-DD')} at ${form.outDateTime.format('h:mm A')}`,
        studentName: student.name,
        requestType: form.requestType,
        outDate: form.outDateTime.format('YYYY-MM-DD'),
        outTime: form.outDateTime.format('h:mm A'),
        timestamp: new Date(),
        read: false,
      };

      // Add notification to Firestore
      await addDoc(collection(db, 'notifications'), notificationData);

      setSnackbar({ open: true, message: 'Request submitted successfully!', severity: 'success' });
      setForm({
        requestType: '',
        location: '',
        reason: '',
        warden: '',
        outDateTime: null,
        returnDateTime: null,
      });
      setDelayedReturn(false);

      setTimeout(() => navigate('/studentdashboard'), 1500);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSnackbar({ open: true, message: 'Failed to submit the request. Please try again.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div>
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-5">
          <h2 className="text-2xl font-bold mb-1">New Outing Request</h2>
          <p className="text-sm text-gray-600 mb-8">
            Fill in the details below to submit your hostel outing request
          </p>

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
                  <option value="" disabled>
                    Select Request Type
                  </option>
                  <option value="Outing">Outing</option>
                  <option value="Leave">Leave</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex-1 mt-4 md:mt-0">
                <label className="block font-medium mb-1">
                  Location {form.requestType === 'Outing' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="location"
                  className={`w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200 ${form.requestType !== 'Outing' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholder="Enter location"
                  value={form.location || ''}
                  onChange={handleChange}
                  required={form.requestType === 'Outing'}
                  disabled={form.requestType !== 'Outing'}
                />
                {form.requestType !== 'Outing' && (
                  <p className="text-xs text-gray-400 mt-1">Location is only required for Outing requests.</p>
                )}
              </div>
            </div>

            {/* Reason Textarea */}
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

            {/* Select Warden Dropdown */}
            <div>
              <label className="block font-medium mb-1">
                Select Warden <span className="text-red-500">*</span>
              </label>
              <select
                name="warden"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.warden}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Warden
                </option>
                {wardens
                  .filter(warden => warden.status === 'active' || warden.status === 'inactive')
                  .map((warden) => (
                    warden.status === 'active' ? (
                      <option key={warden.id} value={warden.name}>
                        {warden.name}
                      </option>
                    ) : (
                      <option key={warden.id} value={warden.name} disabled className="text-gray-400 bg-gray-100">
                        {warden.name} (Inactive)
                      </option>
                    )
                  ))}
              </select>
            </div>

            {/* Out Date/Time and Return Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">
                  Out Date & Time <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={form.outDateTime}
                  onChange={(value) => handleDateTimeChange('outDateTime', value)}
                  minDateTime={dayjs()}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "w-full",
                    },
                  }}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">
                  Expected Return Date & Time <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={form.returnDateTime}
                  onChange={(value) => handleDateTimeChange('returnDateTime', value)}
                  minDateTime={form.outDateTime || dayjs()}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      className: "w-full",
                    },
                  }}
                />
              </div>
            </div>

            {/* Delay Checkbox for Outing on Weekend */}
            {form.requestType === 'Outing' && form.outDateTime && isWeekend(form.outDateTime) && (
              <div className="flex flex-col mt-2">
                <div className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id="delayedReturn"
                    checked={delayedReturn}
                    onChange={() => setDelayedReturn((prev) => !prev)}
                    className="mr-2"
                  />
                  <label htmlFor="delayedReturn" className="text-sm">
                    Flag Delayed Return (update expected return time)
                  </label>
                </div>
                {delayedReturn && (
                  <div className="text-yellow-600 text-xs">
                    Warning: Warden will be alerted about delayed return.
                  </div>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <Link to="/studentdashboard">
                <button
                  type="button"
                  className="px-4 py-2 mt-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                className="px-4 py-2 mt-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </LocalizationProvider>
  );
};
