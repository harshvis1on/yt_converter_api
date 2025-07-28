import React from 'react';
import PodPayLayout from './PodPayLayout';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

export default function TransactionsPage({ userInfo }) {
  const transactions = [
    { id: '1', date: 'Jan 15, 2025', description: 'Spotify Revenue', amount: '+$45.32', status: 'completed' },
    { id: '2', date: 'Jan 12, 2025', description: 'Apple Podcasts Revenue', amount: '+$23.18', status: 'completed' },
    { id: '3', date: 'Jan 10, 2025', description: 'Google Podcasts Revenue', amount: '+$15.67', status: 'completed' },
    { id: '4', date: 'Jan 8, 2025', description: 'Hosting Fee', amount: '-$9.99', status: 'completed' },
    { id: '5', date: 'Jan 5, 2025', description: 'YouTube Revenue', amount: '+$67.45', status: 'pending' }
  ];

  return (
    <PodPayLayout
      activeMenuItem="transactions"
      headerTitle="Transactions"
      userInfo={userInfo}
    >
      <div className="p-8 space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">Track your revenue and expenses</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Revenue</h3>
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">$1,847.23</div>
            <div className="text-sm text-green-600 mt-1">+12.5% this month</div>
          </div>

          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Monthly Expenses</h3>
              <div className="p-2 bg-red-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">$89.97</div>
            <div className="text-sm text-red-600 mt-1">+4.2% this month</div>
          </div>

          <div className="podpay-stat-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Net Profit</h3>
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">$1,757.26</div>
            <div className="text-sm text-green-600 mt-1">+14.8% this month</div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="podpay-card">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-gray-600 text-sm mt-1">Your latest revenue and expense transactions</p>
          </div>
          
          <table className="podpay-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td className="font-medium">{transaction.description}</td>
                  <td className={`font-medium ${
                    transaction.amount.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount}
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PodPayLayout>
  );
}