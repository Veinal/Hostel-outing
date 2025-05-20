import React from 'react'

export const PageNotFound = () => {
  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-4rem)] justify-center bg-gray-100">
      {/* paddingTop ensures content starts below the navbar */}
      <h1 className="text-7xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
      <p className="text-gray-600 mb-6">
        Sorry, the page you are looking for does not exist.
      </p>
      <a
        href="/"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go Back
      </a>
    </div>
  )
}
