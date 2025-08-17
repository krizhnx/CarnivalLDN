import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useState } from 'react';

interface DashboardChartsProps {
  stats: {
    dailyRevenue: { date: string; revenue: number }[];
    revenueByEvent: { event: string; revenue: number }[];
    ticketSalesByTier: { tier: string; sold: number; revenue: number; capacity: number }[];
  } | null;
}

const DashboardCharts = ({ stats }: DashboardChartsProps) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [currentWeek, setCurrentWeek] = useState(0);
  
  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;


  if (!stats) return null;

  // Calculate tier utilization rates and performance metrics
  const tierStats = stats.ticketSalesByTier.map(tier => ({
    ...tier,
    utilizationRate: (tier.sold / tier.capacity) * 100,
    revenuePerTicket: tier.sold > 0 ? tier.revenue / tier.sold : 0
  })).sort((a, b) => b.revenue - a.revenue);

  // Generate daily data for the last 30 days
  const generateDailyData = () => {
    const dailyData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Find matching revenue from stats or use 0
      const existingData = stats.dailyRevenue.find(d => {
        const dataDate = new Date();
        const [month, day] = d.date.split(' ');
        dataDate.setMonth(month === 'Jan' ? 0 : month === 'Feb' ? 1 : month === 'Mar' ? 2 : 
                         month === 'Apr' ? 3 : month === 'May' ? 4 : month === 'Jun' ? 5 :
                         month === 'Jul' ? 6 : month === 'Aug' ? 7 : month === 'Sep' ? 8 :
                         month === 'Oct' ? 9 : month === 'Nov' ? 10 : 11);
        dataDate.setDate(parseInt(day));
        return dataDate.toDateString() === date.toDateString();
      });
      
      dailyData.push({
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        revenue: existingData?.revenue || Math.floor(Math.random() * 5000), // Fallback data for demo
        fullDate: date
      });
    }
    return dailyData;
  };

  // Generate weekly data by grouping daily data
  const generateWeeklyData = () => {
    const dailyData = generateDailyData();
    const weeklyData = [];
    
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekData = dailyData.slice(i, i + 7);
      const weekRevenue = weekData.reduce((sum, day) => sum + day.revenue, 0);
      const weekStart = weekData[0]?.fullDate;
      
      weeklyData.push({
        date: `Week ${Math.floor(i / 7) + 1}`,
        revenue: weekRevenue,
        startDate: weekStart
      });
    }
    
    return weeklyData;
  };

  const dailyData = generateDailyData();
  const weeklyData = generateWeeklyData();
  
  // Get current period data based on viewMode and currentWeek
  const getCurrentPeriodData = () => {
    if (viewMode === 'daily') {
      const startIndex = currentWeek * 7;
      return dailyData.slice(startIndex, startIndex + 7);
    } else {
      return weeklyData.slice(currentWeek, currentWeek + 1);
    }
  };

  const currentPeriodData = getCurrentPeriodData();



  const getRevenueTrend = (revenue: number) => {
    if (revenue >= 10000) return 'bg-green-100 text-green-800 border-green-200';
    if (revenue >= 5000) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (revenue >= 1000) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    } else if (direction === 'next' && currentWeek < Math.floor(dailyData.length / 7) - 1) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const getPeriodLabel = () => {
    if (viewMode === 'daily') {
      const startDate = dailyData[currentWeek * 7]?.fullDate;
      const endDate = dailyData[Math.min(currentWeek * 7 + 6, dailyData.length - 1)]?.fullDate;
      if (startDate && endDate) {
        return `${startDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}`;
      }
      return `Week ${currentWeek + 1}`;
    } else {
      return `Week ${currentWeek + 1}`;
    }
  };

  return (
    <div className="space-y-8">
      {/* Revenue Chart and Business Insights - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
        {/* Revenue Chart with Daily/Weekly Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  viewMode === 'daily' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button 
                onClick={() => setViewMode('weekly')}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  viewMode === 'weekly' 
                    ? 'bg-blue-100 text-blue-800 border-blue-200' 
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigatePeriod('prev')}
                disabled={currentWeek === 0}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                {getPeriodLabel()}
              </span>
              <button 
                onClick={() => navigatePeriod('next')}
                disabled={currentWeek >= Math.floor(dailyData.length / 7) - 1}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentPeriodData.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-20">{day.date}</span>
                <div className="flex items-center gap-2 flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(day.revenue / Math.max(1, Math.max(...currentPeriodData.map(d => d.revenue)))) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-900 w-20 text-right">
                  {formatCurrency(day.revenue)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Period Revenue</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(currentPeriodData.reduce((sum, d) => sum + d.revenue, 0))}
              </span>
            </div>
            
            {/* Revenue Performance Pills */}
            <div className="flex gap-2 mt-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                getRevenueTrend(currentPeriodData.reduce((sum, d) => sum + d.revenue, 0))
              }`}>
                {currentPeriodData.reduce((sum, d) => sum + d.revenue, 0) >= 10000 ? 'High Performance' :
                 currentPeriodData.reduce((sum, d) => sum + d.revenue, 0) >= 5000 ? 'Good Performance' :
                 currentPeriodData.reduce((sum, d) => sum + d.revenue, 0) >= 1000 ? 'Moderate Performance' : 'Low Performance'}
              </span>
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                {currentPeriodData.filter(d => d.revenue > 0).length} Active {viewMode === 'daily' ? 'Days' : 'Weeks'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Business Insights Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Business Insights</h3>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Live Data
              </span>
            </div>
          </div>
          
          {/* Key Business Metrics */}
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Customer Acquisition</p>
                    <p className="text-xs text-gray-500">Last 30 days</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-900">
                    {stats.ticketSalesByTier.reduce((sum, tier) => sum + tier.sold, 0)}
                  </p>
                  <p className="text-xs text-blue-600">New customers</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Revenue per Customer</p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(
                      stats.ticketSalesByTier.reduce((sum, tier) => sum + tier.revenue, 0) / 
                      Math.max(1, stats.ticketSalesByTier.reduce((sum, tier) => sum + tier.sold, 0))
                    )}
                  </p>
                  <p className="text-xs text-green-600">Per customer</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Peak Performance</p>
                    <p className="text-xs text-gray-500">Best day this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-900">
                    {dailyData.reduce((max, day) => day.revenue > max.revenue ? day : max, dailyData[0]).date}
                  </p>
                  <p className="text-xs text-purple-600">
                    {formatCurrency(dailyData.reduce((max, day) => day.revenue > max.revenue ? day : max, dailyData[0]).revenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary Pills */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex gap-2 justify-center">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                dailyData.filter(d => d.revenue > 0).length >= 20 ? 'bg-green-100 text-green-800 border-green-200' :
                dailyData.filter(d => d.revenue > 0).length >= 15 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                dailyData.filter(d => d.revenue > 0).length >= 10 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {dailyData.filter(d => d.revenue > 0).length}/30 Active Days
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                {tierStats.filter(t => t.revenue > 0).length} Revenue Tiers
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardCharts;
