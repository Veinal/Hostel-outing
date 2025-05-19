import React, { useEffect, useState } from 'react'
import { NavBar } from './NavBar'
import { Footer } from './Footer'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

export const Home = () => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          if (role === 'student') navigate('/studentdashboard');
          else if (role === 'warden') navigate('/wardendashboard');
          else if (role === 'admin') navigate('/admindashboard');
        }
      }
      setCheckingAuth(false); // Done checking
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGetStarted = () => {
    navigate('/login');
  };

  if (checkingAuth) {
    // Show a spinner or blank screen while checking auth
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <span className="loading loading-bars loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_1922,h_689/https://mite.ac.in/wp-content/uploads/2020/07/slider-1-mite.jpg')" }}>
      <div className="absolute inset-0 bg-black opacity-60"></div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-4">
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-6">
          Welcome to the Hostel Outing Permission Portal
        </h1>
        <p className="text-white text-lg md:text-xl mb-8 max-w-2xl">
          Easily request & manage your hostel outing permissions with transparency and accountability.
        </p>
        <button
          className="backdrop-blur-md bg-white/10 text-white border border-white px-8 py-3 rounded-xl hover:bg-white hover:text-black transition duration-300 text-lg font-semibold shadow-lg"
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>
      <Footer />
    </div>
  )
}
