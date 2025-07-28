import React from 'react';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const chartData = [
  { date: "Jun 2", visitors: 320, revenue: 180 },
  { date: "Jun 4", visitors: 280, revenue: 150 },
  { date: "Jun 6", visitors: 380, revenue: 220 },
  { date: "Jun 8", visitors: 420, revenue: 280 },
  { date: "Jun 10", visitors: 360, revenue: 240 },
  { date: "Jun 12", visitors: 480, revenue: 320 },
  { date: "Jun 14", visitors: 520, revenue: 380 },
  { date: "Jun 16", visitors: 580, revenue: 420 },
  { date: "Jun 18", visitors: 480, revenue: 340 },
  { date: "Jun 20", visitors: 620, revenue: 480 },
  { date: "Jun 22", visitors: 680, revenue: 520 },
  { date: "Jun 24", visitors: 720, revenue: 580 },
  { date: "Jun 26", visitors: 660, revenue: 540 },
  { date: "Jun 28", visitors: 780, revenue: 620 },
  { date: "Jun 30", visitors: 820, revenue: 680 },
];

export default function AnalyticsChart() {
  const [activeTab, setActiveTab] = React.useState('last3months');

  return (
    <div className="podpay-chart-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Total Visitors</h3>
          <p className="text-gray-600 text-sm">
            Total for the last 3 months
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { id: 'last3months', label: 'Last 3 months' },
            { id: 'last30days', label: 'Last 30 days' },
            { id: 'last7days', label: 'Last 7 days' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {activeTab === 'last3months' && (
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
                className="text-gray-500"
              />
              <YAxis hide />
              <defs>
                <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#6C6BFF"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="#6C6BFF"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="#C8AAFF"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="#C8AAFF"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <Area
                dataKey="visitors"
                type="natural"
                fill="url(#fillVisitors)"
                fillOpacity={1}
                stroke="#6C6BFF"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                fillOpacity={1}
                stroke="#C8AAFF"
                strokeWidth={2}
                stackId="a"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {activeTab === 'last30days' && (
        <div className="h-[280px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm">Last 30 days chart would go here</div>
            <div className="text-xs mt-1 text-gray-400">Coming soon</div>
          </div>
        </div>
      )}
      
      {activeTab === 'last7days' && (
        <div className="h-[280px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm">Last 7 days chart would go here</div>
            <div className="text-xs mt-1 text-gray-400">Coming soon</div>
          </div>
        </div>
      )}
    </div>
  );
}