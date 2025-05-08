import React,{ useState } from 'react'

export const EditWardenProfile = () => {

    const [fullName, setFullName] = useState("Admin User");
    const [email, setEmail] = useState("admin@example.com");

    const handleSave = (e) => {
        e.preventDefault();
        // TODO: submit updated profile info
        console.log({ fullName, email });
    };

    const handleChangePassword = () => {
        // TODO: navigate to change password flow
        console.log("Change password clicked");
    };  

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Profile Settings</h2>
      <p className="text-gray-600 mb-6">Manage your account information</p>

      {/* Personal Information Section */}
      <section className="bg-blue-50 rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center mb-4">
          {/* <FaUser className="text-blue-600 text-xl mr-3" /> */}
          <div>
            <h3 className="text-lg font-medium text-gray-800">Personal Information</h3>
            <p className="text-gray-600 text-sm">Update your personal details</p>
          </div>
        </div>
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="fullName">Full Name</label>
            <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
              {/* <FaUser className="text-gray-400 ml-3" /> */}
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="flex-1 px-3 py-2 outline-none rounded-r-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">Email Address</label>
            <div className="flex items-center border border-gray-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500">
              {/* <FaEnvelope className="text-gray-400 ml-3" /> */}
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 outline-none rounded-r-lg"
              />
            </div>
          </div>
          <div className="md:col-span-2 text-right">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
            >
              {/* <FaSave className="mr-2" /> */}
              Save Changes
            </button>
          </div>
        </form>
      </section>

      {/* Password Section */}
      <section className="bg-blue-50 rounded-lg shadow-sm p-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* <FaLock className="text-blue-600 text-xl mr-3" /> */}
          <div>
            <h3 className="text-lg font-medium text-gray-800">Password</h3>
            <p className="text-gray-600 text-sm">Update your password</p>
          </div>
        </div>
        <button
          onClick={handleChangePassword}
          className="text-blue-600 hover:underline font-medium"
        >
          Change Password
        </button>
      </section>
    </div>

  )
}
