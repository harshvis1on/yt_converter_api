import React from 'react';
import PodPayLayout from './PodPayLayout';
import AnalyticsChart from './AnalyticsChart';

export default function AnalyticsPage({ userInfo }) {
  return (
    <PodPayLayout
      activeMenuItem="analytics"
      headerTitle="Analytics"
      userInfo={userInfo}
    >
      <div className="p-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your podcast performance and growth</p>
        </div>
        
        <AnalyticsChart />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="podpay-stat-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Downloads</h3>
            <div className="text-3xl font-bold text-gray-900">12,543</div>
            <div className="text-sm text-green-600 mt-1">+15.2% from last month</div>
          </div>
          
          <div className="podpay-stat-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Unique Listeners</h3>
            <div className="text-3xl font-bold text-gray-900">8,942</div>
            <div className="text-sm text-green-600 mt-1">+8.3% from last month</div>
          </div>
          
          <div className="podpay-stat-card">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Average Duration</h3>
            <div className="text-3xl font-bold text-gray-900">24m 35s</div>
            <div className="text-sm text-red-600 mt-1">-2.1% from last month</div>
          </div>
        </div>
      </div>
    </PodPayLayout>
  );
}