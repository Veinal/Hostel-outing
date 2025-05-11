import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // Import Firestore and Firebase Auth
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const RequestPage = () => {
  const [form, setForm] = useState({
    requestType: '',
    reason: '',
    warden: '',
    outDate: '',
    returnDate: '',
  });

  const [student, setStudent] = useState({ id: '', name: '' }); // State to store student info
  const [wardens, setWardens] = useState([]); // State to store warden list

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
        alert('Invalid warden selected. Please try again.');
        return;
      }

      // Add the form data along with the student ID, name, warden UID, and status to Firestore
      const requestData = {
        ...form,
        studentId: student.id,
        studentName: student.name, // Use the full name from localStorage
        wardenUid: selectedWarden.id, // Store the warden's UID
        status: 'pending', // Default status
        timestamp: new Date(), // Add a timestamp for when the request was created
      };

      await addDoc(collection(db, 'outingRequests'), requestData);
      alert('Request submitted successfully!');
      setForm({
        requestType: '',
        reason: '',
        warden: '',
        outDate: '',
        returnDate: '',
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit the request. Please try again.');
    }
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
              <option value="outing">Outing</option>
              <option value="leave">Leave</option>
              <option value="other">Other</option>
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
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
