import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-indigo-500 mb-2">Pod<span className="text-gray-900">Pay</span></span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Forgot password?</h2>
          <p className="text-gray-500 text-sm mb-2 text-center">No worries, we'll send you reset instructions.</p>
        </div>
        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button type="submit" className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors">Reset password</button>
        </form>
        <div className="text-center text-sm text-gray-600 mt-6">
          <Link to="/login" className="text-indigo-500 hover:underline">&larr; Back to log in</Link>
        </div>
      </div>
    </div>
  );
} 