import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import Axios for Cloudinary API requests
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

export const EditStudentProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    year: '',
    branch: '',
    room: '',
    block: '',
    gender: '', // <-- Add gender field
    photoUrl: '', // Add a field for the photo URL
  });
  const [userId, setUserId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null); // State to store the selected photo file
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  // Fetch the current user's data on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);

        // Fetch existing data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setFormData((prev) => ({
            ...prev,
            ...userDoc.data(),
          }));
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file); // Store the selected file in state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    for (const key in formData) {
      if (!formData[key] && key !== 'photoUrl') {
        setSnackbar({ open: true, message: `Please fill out the ${key} field.`, severity: 'error' });
        return;
      }
    }

    // Phone number validation
    if (!/^\d{10}$/.test(formData.phone)) {
      setSnackbar({ open: true, message: 'Phone number must be exactly 10 digits.', severity: 'error' });
      return;
    }

    setLoading(true); // Start loader

    try {
      let photoUrl = formData.photoUrl;

      // Upload the photo to Cloudinary if a new photo is selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('upload_preset', 'Hostel outing'); // Replace with your Cloudinary upload preset
        formData.append('cloud_name', 'dckqij0ar'); // Replace with your Cloudinary cloud name
        formData.append('folder', 'hostel_outing'); // Specify the folder name in Cloudinary

        const response = await axios.post(
          'https://api.cloudinary.com/v1_1/dckqij0ar/image/upload', // Replace with your Cloudinary API endpoint
          formData
        );

        photoUrl = response.data.secure_url; // Get the secure URL of the uploaded image
      }

      // Update Firestore with the form data and photo URL
      const userDocRef = doc(db, 'users', userId);

      await updateDoc(userDocRef, {
        ...formData,
        photoUrl, // Save the photo URL in Firestore
        role: 'student',
      });

      // Store fullName in localStorage for NavBar access
      localStorage.setItem('fullName', formData.fullName);

      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
        navigate('/studentdashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({ open: true, message: 'Failed to update profile. Please try again.', severity: 'error' });
    } finally {
      setLoading(false); // Stop loader
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden">
        <div className="px-8 py-6">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-1">Student Profile</h2>
          <p className="text-gray-500 mb-6">Update your information</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} />
            <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} />

            <SelectField
              label="Year of Study"
              name="year"
              value={formData.year}
              onChange={handleChange}
              options={['1st Year', '2nd Year', '3rd Year', '4th Year']}
            />

            {/* Gender Field */}
            <SelectField
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={['Male', 'Female']}
            />

            <InputField label="Academic Branch" name="branch" value={formData.branch} onChange={handleChange} />
            <InputField label="Hostel Block" name="block" value={formData.block} onChange={handleChange} />
            <InputField label="Room Number" name="room" value={formData.room} onChange={handleChange} />

            {/* Upload Photo Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Photo</label>
              <div className="relative w-full">
                <input
                  id="photoUpload"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange} // Handle photo change
                  className="hidden"
                />
                <label
                  htmlFor="photoUpload"
                  className="inline-block text-xs text-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2.5 rounded-md shadow-sm transition duration-200"
                >
                  Choose Photo
                </label>
                {photoFile && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    Selected: {photoFile.name}
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition duration-200 flex items-center"
              disabled={loading}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              )}
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

const InputField = ({ label, name, type = 'text', value, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      required
      {...(name === 'phone' ? { maxLength: 10, pattern: '\\d*', inputMode: 'numeric' } : {})}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      required
    >
      <option value="">Select {label}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  </div>
);
