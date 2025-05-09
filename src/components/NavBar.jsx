import React from 'react'
import {Link} from 'react-router-dom'

export const NavBar = () => {
  return (
    <div>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <img
            src="https://mite.ac.in/wp-content/uploads/2025/03/mite-logo.svg"
            className="w-7 ml-5"
            alt="MITE Logo"
          />
          <a className="font-semibold ml-3 text-xl">MITE Hostel</a>
        </div>
        <div className="navbar-end">
          <Link to='/login'>
            <a className="btn bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 rounded-md px-4 py-2 shadow">
              Login
            </a>
          </Link>
        </div>
      </div>
    </div>
  )
}
