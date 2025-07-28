import React from 'react';
import PodPayLayout from './PodPayLayout';
import { Users, Share2, DollarSign, Gift } from 'lucide-react';

export default function ReferralsPage({ userInfo }) {
  return (
    <PodPayLayout
      activeMenuItem="referrals"
      headerTitle="Referrals"
      userInfo={userInfo}
    >
      <div className="p-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h1>
          <p className="text-gray-600">Earn rewards by referring new podcasters</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Referrals</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">23</div>
            <div className="text-sm text-green-600 mt-1">+5 this month</div>
          </div>

          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Active Referrals</h3>
              <div className="p-2 bg-green-50 rounded-lg">
                <Share2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">18</div>
            <div className="text-sm text-green-600 mt-1">78% conversion</div>
          </div>

          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Earnings</h3>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">$345.00</div>
            <div className="text-sm text-green-600 mt-1">+$67 this month</div>
          </div>

          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Rewards</h3>
              <div className="p-2 bg-purple-50 rounded-lg">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">12</div>
            <div className="text-sm text-purple-600 mt-1">Available to claim</div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="podpay-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value="https://podpay.com/ref/harsh-deshmukh"
                readOnly
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm"
              />
            </div>
            <button className="podpay-btn-primary">
              Copy Link
            </button>
          </div>
          <p className="text-gray-600 text-sm mt-3">
            Share this link and earn $15 for each new podcaster who signs up and creates their first episode!
          </p>
        </div>

        {/* Recent Referrals */}
        <div className="podpay-card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Referrals</h3>
          <div className="space-y-4">
            {[
              { name: 'Alex Johnson', email: 'alex@example.com', status: 'Active', earnings: '$15.00', date: 'Jan 20, 2025' },
              { name: 'Sarah Chen', email: 'sarah@example.com', status: 'Pending', earnings: '$0.00', date: 'Jan 18, 2025' },
              { name: 'Mike Wilson', email: 'mike@example.com', status: 'Active', earnings: '$15.00', date: 'Jan 15, 2025' }
            ].map((referral, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{referral.name}</div>
                  <div className="text-sm text-gray-500">{referral.email}</div>
                </div>
                <div className="text-center">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    referral.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {referral.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">{referral.earnings}</div>
                  <div className="text-sm text-gray-500">{referral.date}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PodPayLayout>
  );
}