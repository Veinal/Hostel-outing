import React, { useState } from 'react'

export const RequestPage = () => {

    const [form, setForm] = useState({
        reason: '',
        destination: '',
        outDate: '',
        outTime: '',
        returnDate: '',
        returnTime: '',
        notes: '',
    });
    
    const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
    // Add submission logic here
    };

  return (
    <div>
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-md mt-5">
        <h2 className="text-2xl font-bold mb-1">New Outing Request</h2>
        <p className="text-sm text-gray-600 mb-10">
            Fill in the details below to submit your hostel outing request
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block font-medium mb-1">
                Reason for Outing <span className="text-red-500">*</span>
            </label>
            <input
                name="reason"
                type="text"
                placeholder="E.g., Family visit, Medical appointment, etc."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.reason}
                onChange={handleChange}
                required
            />
            </div>

            <div>
            <label className="block font-medium mb-1">
                Destination <span className="text-red-500">*</span>
            </label>
            <input
                name="destination"
                type="text"
                placeholder="Where are you going?"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.destination}
                onChange={handleChange}
                required
            />
            </div>

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

            <div>
                <label className="block font-medium mb-1">
                Out Time <span className="text-red-500">*</span>
                </label>
                <input
                name="outTime"
                type="time"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.outTime}
                onChange={handleChange}
                required
                />
            </div>

            <div>
                <label className="block font-medium mb-1">
                Expected Return Time <span className="text-red-500">*</span>
                </label>
                <input
                name="returnTime"
                type="time"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.returnTime}
                onChange={handleChange}
                required
                />
            </div>
            </div>

            <div>
            <label className="block font-medium mb-1">Additional Notes (Optional)</label>
            <textarea
                name="notes"
                placeholder="Any additional information you'd like to provide..."
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                value={form.notes}
                onChange={handleChange}
                rows={3}
            />
            </div>

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
  )
}
