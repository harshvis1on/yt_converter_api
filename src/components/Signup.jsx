import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate('/dashboard');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-indigo-500 mb-2">Pod<span className="text-gray-900">Pay</span></span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create an account</h2>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" placeholder="Enter your name" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="flex">
              <select className="border rounded-l-lg px-2 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="eg">🇪🇬 +20</option>
                {/* Add more country codes as needed */}
              </select>
              <input type="tel" placeholder="0 00 00 00 00" className="w-full px-4 py-2 border-t border-b border-r rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" placeholder="Create a password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <ul className="text-xs text-gray-500 mb-2 space-y-1">
            <li className="flex items-center"><span className="mr-2">✔️</span>Must be at least 8 characters</li>
            <li className="flex items-center"><span className="mr-2">✔️</span>Must contain one special character</li>
          </ul>
          <button type="submit" className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors">Get started</button>
        </form>
        <div className="flex items-center my-5">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <button className="w-full flex items-center justify-center border border-gray-300 py-2 rounded-lg font-medium text-gray-700 hover:bg-gray-50 mb-4">
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 mr-2" />
          Sign up with Google
        </button>
        <div className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-indigo-500 hover:underline">Log in</Link>
        </div>
      </div>
    </div>
  );
} 