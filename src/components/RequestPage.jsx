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
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your service ID
emailjs.init("SjHmsrhvp6R0qw-Vx"); // Replace with your actual EmailJS public key

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
  const [loading, setLoading] = useState(false);

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
          email: doc.data().email || '',
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

  // Function to get minimum date for outing requests
  const getMinDateTime = () => {
    if (form.requestType === 'Outing') {
      // For outings, only allow today's date
      const today = dayjs().startOf('day');
      return today;
    }
    // For other request types, allow any future date
    return dayjs();
  };

  // Function to get maximum date for outing requests
  const getMaxDateTime = () => {
    if (form.requestType === 'Outing') {
      // For outings, only allow today's date
      const today = dayjs().endOf('day');
      return today;
    }
    // For other request types, no maximum limit
    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Special logic for requestType
    if (name === 'requestType') {
      if (value === 'Outing') {
        const now = dayjs();
        setForm({
          ...form,
          requestType: value,
          outDateTime: now,
          returnDateTime: now.add(1, 'hour'),
        });
        // Reset delayed return when switching to outing
        setDelayedReturn(false);
      } else {
        setForm({
          ...form,
          requestType: value,
          outDateTime: null,
          returnDateTime: null,
        });
        // Reset delayed return when switching away from outing
        setDelayedReturn(false);
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
    if (loading) return;
    setLoading(true);

    // Validate date times
    if (!form.outDateTime || !form.returnDateTime) {
      setSnackbar({ open: true, message: 'Please select both out and return times.', severity: 'error' });
      setLoading(false);
      return;
    }

    // Check if return time is after out time
    if (form.returnDateTime.isBefore(form.outDateTime)) {
      setSnackbar({ open: true, message: 'Return time must be after out time.', severity: 'error' });
      setLoading(false);
      return;
    }

    // Validation for outing requests
    if (form.requestType === 'Outing') {
      const now = dayjs();
      const outDateTime = form.outDateTime;
      const todayStr = now.format('YYYY-MM-DD');
      const outDateStr = outDateTime.format('YYYY-MM-DD');
      
      // Check if outing is for today only
      if (outDateStr !== todayStr) {
        setSnackbar({ open: true, message: 'Outing requests must be for today only.', severity: 'error' });
        setLoading(false);
        return;
      }
      
      // Check minimum time window (2 hours before out-time for outings)
      const diffHours = outDateTime.diff(now, 'hour', true);
      if (diffHours < 1.5) {
        setSnackbar({ open: true, message: 'Outing time must be at least 2 hours from now.', severity: 'error' });
        setLoading(false);
        return;
      }
    } else {
      // For non-outing requests, check minimum time window (4 hours before out-time)
      const now = dayjs();
      const outDateTime = form.outDateTime;
      const diffHours = outDateTime.diff(now, 'hour', true);
      
      const todayStr = now.format('YYYY-MM-DD');
      const outDateStr = outDateTime.format('YYYY-MM-DD');
      
      if (outDateStr === todayStr) {
        if (diffHours < 3.5) {
          setSnackbar({ open: true, message: 'Out-time must be at least 4 hours from now.', severity: 'error' });
          setLoading(false);
          return;
        }
      }
    }

    try {
      const selectedWarden = wardens.find((warden) => warden.name === form.warden);

      if (!selectedWarden) {
        setSnackbar({ open: true, message: 'Invalid warden selected. Please try again.', severity: 'error' });
        setLoading(false);
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

      // Send email using EmailJS if warden has an email
      if (selectedWarden.email) {
        try {
          // Option 1: Using EmailJS Template (Recommended)
          const templateParams = {
            to_email: selectedWarden.email,
            to_name: form.warden,
            student_name: student.name,
            request_type: form.requestType,
            out_date: form.outDateTime.format('YYYY-MM-DD'),
            out_time: form.outDateTime.format('h:mm A'),
            return_date: form.returnDateTime.format('YYYY-MM-DD'),
            return_time: form.returnDateTime.format('h:mm A'),
            location: form.location || '-',
            reason: form.reason,
          };

          await emailjs.send(
            'service_ozk7gdj', // Replace with your EmailJS service ID
            'template_5mr7m3l', // Replace with your EmailJS template ID
            templateParams
          );

          // Option 2: Send email without template (Alternative approach)
          // Uncomment the code below if you prefer not to use a template
          /*
          const emailParams = {
            to_email: selectedWarden.email,
            to_name: form.warden,
            subject: `New ${form.requestType} Request from ${student.name}`,
            message: `
              Hello ${form.warden},

              A new ${form.requestType} request has been submitted by ${student.name}.

              Request Details:
              - Student Name: ${student.name}
              - Request Type: ${form.requestType}
              - Out Date: ${form.outDateTime.format('YYYY-MM-DD')}
              - Out Time: ${form.outDateTime.format('h:mm A')}
              - Return Date: ${form.returnDateTime.format('YYYY-MM-DD')}
              - Return Time: ${form.returnDateTime.format('h:mm A')}
              - Location: ${form.location || '-'}
              - Reason: ${form.reason}

              Please log into the hostel management system to review and take action on this request.

              This is an automated notification. Please do not reply to this email.
            `
          };

          await emailjs.send(
            'YOUR_EMAILJS_SERVICE_ID',
            'YOUR_EMAILJS_TEMPLATE_ID_FOR_DIRECT_EMAIL', // Different template for direct email
            emailParams
          );
          */
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Don't fail the entire request if email fails
        }
      }

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
    } finally {
      setLoading(false);
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

              {form.requestType === 'Outing' && (
                <div className="flex-1 mt-4 md:mt-0">
                  <label className="block font-medium mb-1">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    placeholder="Enter location"
                    value={form.location || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
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
                  minDateTime={getMinDateTime()}
                  maxDateTime={getMaxDateTime()}
                  format="DD/MM/YYYY hh:mm A"
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
                  format="DD/MM/YYYY hh:mm A"
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
                    Flag Delayed Return (allows return after 7 PM)
                  </label>
                </div>
                {delayedReturn && (
                  <div className="text-yellow-600 text-xs">
                    Warning: Warden will be alerted about delayed return. You can now set return time after 7 PM.
                  </div>
                )}
                {!delayedReturn && (
                  <div className="text-blue-600 text-xs">
                    Return time is automatically set to 7 PM for weekend outings. Check the box above to allow later return.
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
