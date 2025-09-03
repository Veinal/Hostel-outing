import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { doc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore'; // Import Firestore methods
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
    gender: '',
    photoUrl: '',
    parentPhone: '',
  });
  const [userId, setUserId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]); // <-- State for branches
  const [blocks, setBlocks] = useState([]); // Add this state for hostel blocks
  const [rooms, setRooms] = useState([]); // Add this state for rooms
  const [isNewProfile, setIsNewProfile] = useState(true); // <-- Add this
  const [isLoading, setIsLoading] = useState(true); // Add loading state for role check
  const navigate = useNavigate();

  // Fetch academic branches from Firestore
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'branches'));
        let allBranchesArr = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (Array.isArray(data.allBranches)) {
            allBranchesArr = data.allBranches; // If you only want the first document's array
          }
        });
        setBranches(allBranchesArr);
      } catch (err) {
        setBranches([]);
      }
    };
    fetchBranches();
  }, []);

  // Check if the logged-in user is a student and fetch their data
  useEffect(() => {
    const checkStudentRole = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          // If no user is logged in, redirect to home page
          navigate('/');
          return;
        }

        try {
          // Fetch the user's role from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const userRole = userData.role;
            
            if (userRole !== 'student') {
              // If the user is not a student, redirect to home page
              navigate('/');
              return;
            } else {
              // User is a student, allow access and set user data
              setUserId(user.uid);
              setFormData((prev) => ({
                ...prev,
                ...userData,
              }));
              // Check if profile is new (all required fields are empty)
              const requiredFields = ['fullName', 'phone', 'year', 'branch', 'room', 'block', 'gender', 'parentPhone'];
              const isNew = requiredFields.some(field => !userData[field]);
              setIsNewProfile(isNew);
              setIsLoading(false);
            }
          } else {
            // If the user's role is not found, redirect to home page
            navigate('/');
            return;
          }
        } catch (error) {
          console.error('Error checking user role:', error);
          navigate('/');
          return;
        }
      });

      return unsubscribe;
    };

    checkStudentRole();
  }, [navigate]);

  // Fetch hostel blocks when gender changes
  useEffect(() => {
    const fetchBlocks = async () => {
      if (!formData.gender) {
        setBlocks([]);
        return;
      }
      const hostelCollection = formData.gender === 'Male' ? 'boysHostel' : 'girlsHostel';
      try {
        const querySnapshot = await getDocs(collection(db, hostelCollection));
        const blocksArr = [];
        querySnapshot.forEach((doc) => {
          blocksArr.push(doc.id); // Assuming each document is a block
        });
        setBlocks(blocksArr);
      } catch (err) {
        setBlocks([]);
      }
    };
    fetchBlocks();
  }, [formData.gender]);

  // Fetch rooms when block or gender changes
  useEffect(() => {
    const fetchRooms = async () => {
      setRooms([]);
      if (!formData.gender || !formData.block) return;

      const hostelCollection = formData.gender === 'Male' ? 'boysHostel' : 'girlsHostel';
      const floorsCollectionRef = collection(db, hostelCollection, formData.block, 'Floors');
      try {
        const floorsSnapshot = await getDocs(floorsCollectionRef);
        let allRooms = [];
        for (const floorDoc of floorsSnapshot.docs) {
          const floorData = floorDoc.data();
          if (Array.isArray(floorData.Rooms)) {
            allRooms = allRooms.concat(floorData.Rooms);
          }
        }
        // Sort room numbers in ascending order (numeric if possible)
        allRooms.sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
          }
          return String(a).localeCompare(String(b));
        });
        setRooms(allRooms);
      } catch (err) {
        setRooms([]);
      }
    };
    fetchRooms();
  }, [formData.gender, formData.block]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhotoFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const key in formData) {
      if (!formData[key] && key !== 'photoUrl') {
        setSnackbar({ open: true, message: `Please fill out the ${key} field.`, severity: 'error' });
        return;
      }
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      setSnackbar({ open: true, message: 'Phone number must be exactly 10 digits.', severity: 'error' });
      return;
    }
    if (!/^\d{10}$/.test(formData.parentPhone)) {
      setSnackbar({ open: true, message: "Parent's contact number must be exactly 10 digits.", severity: 'error' });
      return;
    }

    setLoading(true);

    try {
      let photoUrl = formData.photoUrl;

      if (photoFile) {
        const formDataCloud = new FormData();
        formDataCloud.append('file', photoFile);
        formDataCloud.append('upload_preset', 'Hostel outing');
        formDataCloud.append('cloud_name', 'dckqij0ar');
        formDataCloud.append('folder', 'hostel_outing');

        const response = await axios.post(
          'https://api.cloudinary.com/v1_1/dckqij0ar/image/upload',
          formDataCloud
        );

        photoUrl = response.data.secure_url;
      }

      const userDocRef = doc(db, 'users', userId);

      await updateDoc(userDocRef, {
        ...formData,
        photoUrl,
        role: 'student',
      });

      // Notify NavBar to refresh user info
      window.dispatchEvent(new Event('profileUpdated'));

      // localStorage.setItem('fullName', formData.fullName);

      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
      setTimeout(() => {
        setSnackbar({ ...snackbar, open: false });
        navigate('/studentdashboard');
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setSnackbar({ open: true, message: 'Failed to update profile. Please try again.', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking user role
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

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

            {/* Academic Branch Dropdown */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Academic Branch</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              >
                <option value="">Select Academic Branch</option>
                {branches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>

            <SelectField
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={['Male', 'Female']}
            />

            {/* Hostel Block Dropdown */}
            <SelectField
              label="Hostel Block"
              name="block"
              value={formData.block}
              onChange={handleChange}
              options={blocks}
            />

            {/* Room Number Dropdown */}
            <SelectField
              label="Room Number"
              name="room"
              value={formData.room}
              onChange={handleChange}
              options={rooms}
            />

            {/* Parent's Contact Number */}
            <InputField
              label="Parent's Contact Number"
              name="parentPhone"
              type="tel"
              value={formData.parentPhone}
              onChange={handleChange}
            />

            {/* Upload Photo Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Photo</label>
              <div className="flex items-center space-x-3">
                {(formData.photoUrl || photoFile) && (
                  <img
                    src={photoFile ? URL.createObjectURL(photoFile) : formData.photoUrl}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover border border-gray-300"
                  />
                )}
                <input
                  id="photoUpload"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photoUpload"
                  className="inline-block text-xs text-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-2.5 rounded-md shadow-sm transition duration-200"
                >
                  Choose Photo
                </label>
                {photoFile && (
                  <p className="text-xs text-gray-600 ml-2 truncate">
                    Selected: {photoFile.name}
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="mt-6 flex justify-end gap-3">
            {!isNewProfile && ( 
              <button
                type="button"
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-2 rounded-xl shadow-md transition duration-200"
                disabled={loading}
                onClick={() => navigate('/studentdashboard')}
              >
                Cancel
              </button>
            )}
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
      {...(name === 'phone' || name === 'parentPhone'
        ? {
            maxLength: 10,
            pattern: '\\d*',
            inputMode: 'numeric',
            onKeyPress: (e) => {
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            },
          }
        : {})}
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
