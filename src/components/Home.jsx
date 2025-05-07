import React from 'react'
import { NavBar } from './NavBar'
import { Footer } from './Footer'

export const Home = () => {
  return (
    <div className="relative h-screen w-full bg-cover bg-center" style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?college,campus')" }}>
      <div className="absolute inset-0 bg-black opacity-60"></div>

      <div className="relative z-10">
        <NavBar />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-4">
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-6">
          Welcome to the Hotel Outing Permission Portal
        </h1>
        <p className="text-white text-lg md:text-xl mb-8 max-w-2xl">
          Easily request and manage your hotel outing permissions with transparency and accountability.
        </p>
        <span className='flex gap-5'>
          <button className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition duration-300">
            Login
          </button>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition duration-300">
            Sign Up
          </button>
        </span>
      </div>
      <Footer/>
    </div>
  )
}
