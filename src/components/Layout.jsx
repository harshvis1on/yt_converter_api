import React from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../App';

export default function Layout({ children }) {
  const { userInfo } = useAuth();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userInfo={userInfo} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}