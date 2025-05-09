import React from 'react'
import { NavBar } from './NavBar'
import { Footer } from './Footer'
import { Link } from 'react-router-dom'

export const Home = () => {
  return (
    <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('https://sp-ao.shortpixel.ai/client/to_webp,q_glossy,ret_img,w_1922,h_689/https://mite.ac.in/wp-content/uploads/2020/07/slider-1-mite.jpg')" }}>
      <div className="absolute inset-0 bg-black opacity-60"></div>

      <div className="relative z-10">
        <NavBar />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-4">
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-6">
          Welcome to the Hostel Outing Permission Portal
        </h1>
        <p className="text-white text-lg md:text-xl mb-8 max-w-2xl">
          Easily request & manage your hostel outing permissions with transparency and accountability.
        </p>
        <span className='flex gap-5'>
          <Link to='/login'>
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition duration-300">
              Login
            </button>
          </Link>
          <Link to='/signup'>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition duration-300">
              Sign Up
            </button>
          </Link>
        </span>
      </div>
      <Footer/>
    </div>
  )
}
