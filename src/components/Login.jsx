import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { GoogleLogin } from '@react-oauth/google';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    login();
    navigate('/dashboard');
  };
  const handleGoogleSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      localStorage.setItem('google_token', credentialResponse.credential);
      login();
      navigate('/dashboard');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg px-8 py-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="text-3xl font-bold text-indigo-500 mb-2">Pod<span className="text-gray-900">Pay</span></span>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Log in to your account</h2>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" placeholder="Enter your email" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" placeholder="Create a password" className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Remember for 30 days
            </label>
            <Link to="/forgot-password" className="text-indigo-500 hover:underline">Forgot password</Link>
          </div>
          <button type="submit" className="w-full bg-indigo-500 text-white py-2 rounded-lg font-semibold text-lg hover:bg-indigo-600 transition-colors">Sign in</button>
        </form>
        <div className="flex items-center my-5">
          <div className="flex-grow h-px bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-gray-200" />
        </div>
        <div className="w-full flex flex-col items-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {}}
            width="100%"
          />
        </div>
        <div className="text-center text-sm text-gray-600">
          Don't have an account? <Link to="/signup" className="text-indigo-500 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
} 