import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import Snackbar from '@mui/material/Snackbar'; // Import Snackbar from Material-UI
import Alert from '@mui/material/Alert'; // Import Alert for styled Snackbar
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'; // Import CalendarTodayIcon
import AccessTimeIcon from '@mui/icons-material/AccessTime'; // Import AccessTimeIcon

export const RequestPage = () => {
  const [form, setForm] = useState({
    requestType: '',
    reason: '',
    warden: '',
    outDate: '',
    returnDate: '',
    outTime:'',
    returnTime:''
  });

  const [student, setStudent] = useState({ id: '', name: '' }); // State to store student info
  const [wardens, setWardens] = useState([]); // State to store warden list
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Snackbar state
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    // Fetch the currently logged-in student's ID and name from localStorage
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const fullName = localStorage.getItem('fullName') || 'Unknown Student'; // Get full name from localStorage
        setStudent({ id: user.uid, name: fullName });
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  useEffect(() => {
    // Fetch wardens from Firestore
    const fetchWardens = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'warden'));
        const querySnapshot = await getDocs(q);
        const wardenList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().fullName || 'Unnamed Warden',
        }));
        setWardens(wardenList);
      } catch (error) {
        console.error('Error fetching wardens:', error);
      }
    };

    fetchWardens();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Find the selected warden's UID
      const selectedWarden = wardens.find((warden) => warden.name === form.warden);

      if (!selectedWarden) {
        setSnackbar({ open: true, message: 'Invalid warden selected. Please try again.', severity: 'error' });
        return;
      }

      // Add the form data along with the student ID, name, warden UID, and status to Firestore
      const requestData = {
        ...form,
        outTime: `${form.outHour}:${form.outMinute} ${form.outPeriod}`,
        returnTime: `${form.returnHour}:${form.returnMinute} ${form.returnPeriod}`,
        studentId: student.id,
        studentName: student.name, // Use the full name from localStorage
        wardenUid: selectedWarden.id, // Store the warden's UID
        status: 'pending', // Default status
        timestamp: new Date(), // Add a timestamp for when the request was created
      };

      await addDoc(collection(db, 'outingRequests'), requestData);
      setSnackbar({ open: true, message: 'Request submitted successfully!', severity: 'success' });
      setForm({
        requestType: '',
        reason: '',
        warden: '',
        outDate: '',
        returnDate: '',
      });

      // Redirect to StudentDashboard after a short delay
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
    <div>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-5">
        <h2 className="text-2xl font-bold mb-1">New Outing Request</h2>
        <p className="text-sm text-gray-600 mb-10">
          Fill in the details below to submit your hostel outing request
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Type Dropdown */}
          <div>
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
              {wardens.map((warden) => (
                <option key={warden.id} value={warden.name}>
                  {warden.name}
                </option>
              ))}
            </select>
          </div>

          {/* Out Date and Return Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">
                Out Date <span className="text-red-500">*</span>
              </label>
              <input
                name="outDate"
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.outDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
                required
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Expected Return Date <span className="text-red-500">*</span>
              </label>
              <input
                name="returnDate"
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.returnDate}
                onChange={handleChange}
                min={form.outDate || new Date().toISOString().split('T')[0]} // Prevent past dates and ensure it's after Out Date
                required
              />
            </div>

            {/* Out Time */}
            <div>
              <label className="block font-medium mb-1">
                Out Time <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  name="outHour"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.outHour || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Hour</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select
                  name="outMinute"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.outMinute || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Minute</option>
                  {[0, 15, 30, 45].map((minute) => (
                    <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  name="outPeriod"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.outPeriod || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled >AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Return Time */}
            <div>
              <label className="block font-medium mb-1">
                Expected Return Time <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  name="returnHour"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.returnHour || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Hour</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select
                  name="returnMinute"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.returnMinute || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>Minute</option>
                  {[0, 15, 30, 45].map((minute) => (
                    <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                  ))}
                </select>
                <select
                  name="returnPeriod"
                  className="w-1/4 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                  value={form.returnPeriod || ''}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>AM/PM</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Out Date and Out Time */}
          <div className="flex items-center text-sm text-gray-700 mb-1">
            <CalendarTodayIcon className="w-4 h-4 mr-1" />
            <span>
              <b>Out Date:</b> {form.outDate || 'N/A'} {form.outTime ? `at ${form.outTime}` : ''}
            </span>
          </div>

          {/* Return Date and Return Time */}
          <div className="flex items-center text-sm text-gray-700 mb-2">
            <AccessTimeIcon className="w-4 h-4 mr-1" />
            <span>
              <b>Return Date:</b> {form.returnDate || 'N/A'} {form.returnTime ? `at ${form.returnTime}` : ''}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <Link to="/studentdashboard">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
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
  );
};
