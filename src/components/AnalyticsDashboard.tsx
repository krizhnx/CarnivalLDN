import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  // TrendingUp, 
  Eye, 
  ShoppingCart, 
  // Clock, 
  // Smartphone, 
  // Monitor, 
  // Tablet,
  BarChart3,
  // PieChart,
  // Activity,
  Target,
  DollarSign,
  Calendar,
  RefreshCw,
  // Download,
  // Filter,
  MapPin,
  Globe,
  // MousePointer,
  // MousePointerClick,
  // UserCheck,
  // UserX,
  CheckCircle
} from 'lucide-react';

interface AnalyticsMetrics {
  // Real-time metrics
  liveVisitors: number;
  currentSessions: number;
  
  // Session metrics
  totalSessions: number;
  averageSessionDuration: number;
  bounceRate: number;
  
  // Page metrics
  totalPageViews: number;
  averageTimeOnPage: number;
  mostVisitedPages: Array<{
    page: string;
    views: number;
    averageTime: number;
  }>;
  
  // Event metrics
  totalEventsViewed: number;
  mostViewedEvents: Array<{
    eventId: string;
    views: number;
    uniqueViewers: number;
  }>;
  
  // Conversion metrics
  totalCheckouts: number;
  totalPurchases: number;
  conversionRate: number;
  averageOrderValue: number;
  
  // Traffic metrics
  trafficSources: Array<{
    source: string;
    sessions: number;
    conversionRate: number;
  }>;
  
  // Device metrics
  deviceBreakdown: Array<{
    device: string;
    sessions: number;
    percentage: number;
  }>;
  
  // Geographic metrics
  topLocations: Array<{
    location: string;
    sessions: number;
    conversionRate: number;
  }>;
}

interface AnalyticsDashboardProps {
  className?: string;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'conversions' | 'events' | 'users'>('overview');

  // Mock data for demonstration - replace with real GA4 data
  useEffect(() => {
    const loadMockData = () => {
      setIsLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockMetrics: AnalyticsMetrics = {
          liveVisitors: Math.floor(Math.random() * 50) + 10,
          currentSessions: Math.floor(Math.random() * 30) + 5,
          totalSessions: Math.floor(Math.random() * 1000) + 500,
          averageSessionDuration: Math.floor(Math.random() * 300) + 120,
          bounceRate: Math.random() * 40 + 20,
          totalPageViews: Math.floor(Math.random() * 3000) + 1500,
          averageTimeOnPage: Math.floor(Math.random() * 180) + 60,
          mostVisitedPages: [
            { page: '/', views: 450, averageTime: 120 },
            { page: '/events', views: 320, averageTime: 180 },
            { page: '/about', views: 180, averageTime: 90 },
            { page: '/contact', views: 120, averageTime: 60 }
          ],
          totalEventsViewed: Math.floor(Math.random() * 200) + 100,
          mostViewedEvents: [
            { eventId: '1', views: 85, uniqueViewers: 65 },
            { eventId: '2', views: 72, uniqueViewers: 58 },
            { eventId: '3', views: 68, uniqueViewers: 52 }
          ],
          totalCheckouts: Math.floor(Math.random() * 50) + 20,
          totalPurchases: Math.floor(Math.random() * 30) + 15,
          conversionRate: Math.random() * 15 + 5,
          averageOrderValue: Math.floor(Math.random() * 50) + 25,
          trafficSources: [
            { source: 'Google', sessions: 450, conversionRate: 8.5 },
            { source: 'Direct', sessions: 280, conversionRate: 12.3 },
            { source: 'Social Media', sessions: 180, conversionRate: 6.2 },
            { source: 'Referral', sessions: 90, conversionRate: 4.1 }
          ],
          deviceBreakdown: [
            { device: 'Mobile', sessions: 520, percentage: 52 },
            { device: 'Desktop', sessions: 380, percentage: 38 },
            { device: 'Tablet', sessions: 100, percentage: 10 }
          ],
          topLocations: [
            { location: 'London', sessions: 650, conversionRate: 9.8 },
            { location: 'Manchester', sessions: 120, conversionRate: 7.2 },
            { location: 'Birmingham', sessions: 85, conversionRate: 6.5 },
            { location: 'Leeds', sessions: 65, conversionRate: 5.8 }
          ]
        };
        
        setMetrics(mockMetrics);
        setLastUpdated(new Date());
        setIsLoading(false);
      }, 1000);
    };

    loadMockData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadMockData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  const updateMetrics = () => {
    setIsLoading(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time insights into your Carnival LDN website performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={updateMetrics}
                disabled={isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'traffic', label: 'Traffic', icon: Globe },
              { id: 'conversions', label: 'Conversions', icon: Target },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'users', label: 'Users', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Live Visitors</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.liveVisitors}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Page Views</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.totalPageViews?.toLocaleString()}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversions</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.conversionRate?.toFixed(1)}%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">£{metrics?.averageOrderValue}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Traffic Sources */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
                <div className="space-y-4">
                  {metrics?.trafficSources.map((source, index) => (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 
                          index === 2 ? 'bg-purple-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{source.source}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{source.sessions.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{source.conversionRate.toFixed(1)}% conversion</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h3>
                <div className="space-y-4">
                  {metrics?.deviceBreakdown.map((device, index) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-500' : 
                          index === 1 ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <span className="text-sm font-medium text-gray-900">{device.device}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{device.sessions.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{device.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Visited Pages</h3>
              <div className="space-y-3">
                {metrics?.mostVisitedPages.map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="text-sm font-medium text-gray-900">{page.page}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{page.views.toLocaleString()} views</p>
                      <p className="text-xs text-gray-500">{page.averageTime}s avg time</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'traffic' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {metrics?.topLocations.map((location, index) => (
                  <div key={location.location} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{location.location}</span>
                      </div>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sessions:</span>
                        <span className="font-medium">{location.sessions.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Conversion Rate:</span>
                        <span className="font-medium text-green-600">{location.conversionRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'conversions' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Page Views</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{metrics?.totalPageViews?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Checkouts Started</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{metrics?.totalCheckouts}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Purchases Completed</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">{metrics?.totalPurchases}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Performance</h3>
              <div className="space-y-4">
                {metrics?.mostViewedEvents.map((event, index) => (
                  <div key={event.eventId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      <span className="font-medium text-gray-900">Event {event.eventId}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{event.views} views</p>
                      <p className="text-xs text-gray-500">{event.uniqueViewers} unique viewers</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sessions:</span>
                    <span className="font-medium">{metrics?.totalSessions?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Duration:</span>
                    <span className="font-medium">{Math.floor((metrics?.averageSessionDuration || 0) / 60)}m {(metrics?.averageSessionDuration || 0) % 60}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bounce Rate:</span>
                    <span className="font-medium">{metrics?.bounceRate?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Engagement</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Page Views:</span>
                    <span className="font-medium">{metrics?.totalPageViews?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Time on Page:</span>
                    <span className="font-medium">{Math.floor((metrics?.averageTimeOnPage || 0) / 60)}m {(metrics?.averageTimeOnPage || 0) % 60}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
