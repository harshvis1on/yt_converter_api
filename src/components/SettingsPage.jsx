import React, { useState } from 'react';
import PodPayLayout from './PodPayLayout';
import { User, Bell, Lock, CreditCard, Palette, Globe } from 'lucide-react';

export default function SettingsPage({ userInfo }) {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'advanced', label: 'Advanced', icon: Globe }
  ];

  return (
    <PodPayLayout
      activeMenuItem="settings"
      headerTitle="Settings"
      userInfo={userInfo}
    >
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="podpay-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        defaultValue={userInfo?.given_name || 'Harsh'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        defaultValue={userInfo?.family_name || 'Deshmukh'}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={userInfo?.email || 'harsh@example.com'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      rows={4}
                      defaultValue="Podcast creator and digital content enthusiast."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="podpay-btn-primary">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="podpay-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  {[
                    { title: 'New Episodes', description: 'Get notified when your episodes are published' },
                    { title: 'Revenue Updates', description: 'Receive updates about your earnings' },
                    { title: 'System Updates', description: 'Important updates about PodPay features' },
                    { title: 'Marketing', description: 'Tips and insights to grow your podcast' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                          <span className="ml-2 text-sm text-gray-700">Email</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                          <span className="ml-2 text-sm text-gray-700">Push</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="podpay-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Privacy & Security</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 mb-4">Add an extra layer of security to your account</p>
                    <button className="podpay-btn-secondary">Enable 2FA</button>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Data Export</h4>
                    <p className="text-sm text-gray-600 mb-4">Download all your podcast data and analytics</p>
                    <button className="podpay-btn-secondary">Request Export</button>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Account Deletion</h4>
                    <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data</p>
                    <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">Delete Account</button>
                  </div>
                </div>
              </div>
            )}

            {(activeTab === 'billing' || activeTab === 'appearance' || activeTab === 'advanced') && (
              <div className="podpay-card">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  {activeTab === 'billing' && 'Billing & Subscription'}
                  {activeTab === 'appearance' && 'Appearance'}
                  {activeTab === 'advanced' && 'Advanced Settings'}
                </h3>
                <div className="text-center py-12 text-gray-500">
                  <div className="text-sm">
                    {activeTab === 'billing' && 'Billing settings coming soon...'}
                    {activeTab === 'appearance' && 'Theme and appearance settings coming soon...'}
                    {activeTab === 'advanced' && 'Advanced configuration options coming soon...'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PodPayLayout>
  );
}