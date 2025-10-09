import { RefreshCw } from 'lucide-react';

// Affiliate tracking tab added
interface DashboardHeaderProps {
  selectedTimeframe: '7d' | '30d' | '90d';
  selectedEvent: string;
  events: any[];
  activeTab: 'analytics' | 'events' | 'orders' | 'affiliate';
  onTimeframeChange: (timeframe: '7d' | '30d' | '90d') => void;
  onEventChange: (eventId: string) => void;
  onTabChange: (tab: 'analytics' | 'events' | 'orders' | 'affiliate') => void;
  onRefresh: () => void;
}

const DashboardHeader = ({
  selectedTimeframe,
  selectedEvent,
  events,
  activeTab,
  onTimeframeChange,
  onEventChange,
  onTabChange,
  onRefresh
}: DashboardHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage analytics, events, orders, affiliate tracking, and scan tickets</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedTimeframe}
              onChange={(e) => onTimeframeChange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <select
              value={selectedEvent}
              onChange={(e) => onEventChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Events</option>
              {events?.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={() => onTabChange('analytics')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'analytics' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => onTabChange('events')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'events' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Event Management
          </button>
          <button
            onClick={() => onTabChange('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'orders' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Orders
          </button>
          <button
            onClick={() => onTabChange('affiliate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'affiliate' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            Affiliate Tracking
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
