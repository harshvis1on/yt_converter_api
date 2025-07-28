import React from 'react';
import { Link } from 'react-router-dom';

export default function SetNewPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-indigo-500 mb-2">Pod<span className="text-gray-900">Pay</span></span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Set new password</h2>
          <p className="text-gray-500 text-sm mb-2 text-center">Enter your new password below.</p>
        </div>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" placeholder="Create a password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input type="password" placeholder="Confirm password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <ul className="text-xs text-gray-500 mb-2 space-y-1">
            <li className="flex items-center"><span className="mr-2">✔️</span>Must be at least 8 characters</li>
            <li className="flex items-center"><span className="mr-2">✔️</span>Must contain one special character</li>
          </ul>
          <button type="submit" className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors">Reset password</button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-indigo-500 hover:underline">&larr; Back to log in</Link>
        </div>
      </div>
    </div>
  );
} 