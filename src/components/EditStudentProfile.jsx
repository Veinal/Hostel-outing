import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase'; // Import Firebase auth and Firestore
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Import Firestore methods
import { onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Import Firebase Storage methods

export const EditStudentProfile = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    year: '',
    branch: '',
    room: '',
    block: '',
    photo: null,
  });
  const [userId, setUserId] = useState(null);

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
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    for (const key in formData) {
      if (!formData[key] && key !== 'photo') {
        alert(`Please fill out the ${key} field.`);
        return;
      }
    }

    try {
      const userDocRef = doc(db, 'users', userId);
      let photoURL = null;

      // Upload photo to Firebase Storage if a photo is selected
      if (formData.photo) {
        const storage = getStorage(); // Initialize Firebase Storage
        const photoRef = ref(storage, `user_photos/${userId}/${formData.photo.name}`); // Create a reference
        await uploadBytes(photoRef, formData.photo); // Upload the photo
        photoURL = await getDownloadURL(photoRef); // Get the download URL
      }

      // Update Firestore document
      await updateDoc(userDocRef, {
        ...formData,
        photo: photoURL, // Save the photo's download URL in Firestore
      });

      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
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

            <InputField label="Academic Branch" name="branch" value={formData.branch} onChange={handleChange} />
            <InputField label="Hostel Block" name="block" value={formData.block} onChange={handleChange} />
            <InputField label="Room Number" name="room" value={formData.room} onChange={handleChange} />

            {/* Upload Photo Field with Custom Style */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Upload Photo</label>
              <div className="relative w-full">
                <input
                  id="photoUpload"
                  type="file"
                  name="photo"
                  accept="image/*"
                  onChange={handleChange}
                  className="hidden"
                />
                <label
                  htmlFor="photoUpload"
                  className="inline-block text-xs text-center cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-md shadow-sm transition duration-200"
                >
                  Choose Photo
                </label>
                {formData.photo && (
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    Selected: {formData.photo.name || formData.photo}
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow-md transition duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
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
