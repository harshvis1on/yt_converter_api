import React from 'react';
import { 
  MoreHorizontal, 
  FileText, 
  Users, 
  ChevronDown,
  Plus
} from 'lucide-react';

const documentData = [
  {
    id: 1,
    header: "Cover page",
    sectionType: "Cover page",
    target: 18,
    limit: 5,
    reviewer: "Eddie Lake",
    status: "completed"
  },
  {
    id: 2,
    header: "Table of contents", 
    sectionType: "Table of contents",
    target: 29,
    limit: 24,
    reviewer: "Eddie Lake",
    status: "in_progress"
  },
  {
    id: 3,
    header: "Executive summary",
    sectionType: "Narrative", 
    target: 10,
    limit: 13,
    reviewer: "Eddie Lake",
    status: "pending"
  },
  {
    id: 4,
    header: "Introduction",
    sectionType: "Narrative",
    target: 15,
    limit: 8,
    reviewer: "Sarah Wilson",
    status: "completed"
  },
  {
    id: 5,
    header: "Methodology",
    sectionType: "Narrative",
    target: 12,
    limit: 10,
    reviewer: "Mike Johnson",
    status: "in_progress"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>;
    case 'in_progress':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">In Progress</span>;
    case 'pending':
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Pending</span>;
    default:
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Unknown</span>;
  }
};

export default function PodcastList() {
  const [activeTab, setActiveTab] = React.useState('outline');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Documents</h2>
          <p className="text-gray-600">
            Manage your podcast documentation and content structure
          </p>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'outline', label: 'Outline' },
                { id: 'performance', label: 'Past Performance', badge: '3' },
                { id: 'personnel', label: 'Key Personnel', badge: '2' },
                { id: 'focus', label: 'Focus Documents' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Customize Columns
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Section
            </button>
          </div>
        </div>

        {activeTab === 'outline' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-12 px-6 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Header</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reviewer</th>
                    <th className="w-12 px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center w-6 h-6 bg-gray-100 rounded">
                          <MoreHorizontal className="h-4 w-4 text-gray-400" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.header}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs border border-gray-300 text-gray-700">
                          {item.sectionType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.target}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.limit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.reviewer}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Past Performance</h3>
              <p className="text-gray-600 mb-4">
                Historical data and performance metrics
              </p>
              <div className="text-center py-12 text-gray-500">
                Past performance data would be displayed here
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personnel' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Key Personnel</h3>
              <p className="text-gray-600 mb-4">
                Team members and their roles
              </p>
              <div className="text-center py-12 text-gray-500">
                Personnel information would be displayed here
              </div>
            </div>
          </div>
        )}

        {activeTab === 'focus' && (
          <div className="space-y-4">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Focus Documents</h3>
              <p className="text-gray-600 mb-4">
                Important documents and resources
              </p>
              <div className="text-center py-12 text-gray-500">
                Focus documents would be displayed here
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}