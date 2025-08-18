import { motion } from 'framer-motion';
import { TrendingUp, Users, ChevronLeft, ChevronRight, Calendar, Star, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface DashboardChartsProps {
  stats: {
    dailyRevenue: { date: string; revenue: number }[];
    revenueByEvent: { event: string; revenue: number }[];
    ticketSalesByTier: { tier: string; sold: number; revenue: number; capacity: number }[];
  } | null;
  events: any[];
}

const DashboardCharts = ({ stats, events }: DashboardChartsProps) => {
  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;

  if (!stats || !events) return null;

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return events
      .filter(event => !event.isArchived)
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  };

  // Calculate event capacity utilization
  const getCapacityUtilization = () => {
    const activeEvents = events.filter(event => !event.isArchived);
    if (activeEvents.length === 0) return 0;

    const totalCapacity = activeEvents.reduce((sum, event) => sum + (parseInt(event.capacity) || 0), 0);
    const totalSold = stats.ticketSalesByTier.reduce((sum, tier) => sum + tier.sold, 0);

    return totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;
  };

  // Get top selling ticket tier
  const getTopSellingTier = () => {
    if (stats.ticketSalesByTier.length === 0) return null;

    return stats.ticketSalesByTier
      .sort((a, b) => b.sold - a.sold)[0];
  };

  // Calculate event health score
  const getEventHealthScore = () => {
    const upcomingEvents = getUpcomingEvents();
    if (upcomingEvents.length === 0) return { score: 0, label: 'No Events', color: 'gray' };

    const avgUtilization = getCapacityUtilization();
    const daysUntilEvents = upcomingEvents.map(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    });

    let score = 0;

    // Capacity utilization (40% weight)
    if (avgUtilization >= 80) score += 40;
    else if (avgUtilization >= 60) score += 30;
    else if (avgUtilization >= 40) score += 20;
    else score += 10;

    // Time until events (30% weight)
    const avgDaysUntil = daysUntilEvents.reduce((sum, days) => sum + days, 0) / daysUntilEvents.length;
    if (avgDaysUntil <= 3) score += 30;
    else if (avgDaysUntil <= 7) score += 25;
    else if (avgDaysUntil <= 14) score += 20;
    else score += 15;

    // Revenue performance (30% weight)
    const recentRevenue = stats.dailyRevenue.slice(-7).reduce((sum, day) => sum + day.revenue, 0);
    if (recentRevenue >= 10000) score += 30;
    else if (recentRevenue >= 5000) score += 25;
    else if (recentRevenue >= 1000) score += 20;
    else score += 10;

    if (score >= 80) return { score, label: 'Excellent', color: 'green' };
    if (score >= 60) return { score, label: 'Good', color: 'blue' };
    if (score >= 40) return { score, label: 'Fair', color: 'yellow' };
    return { score, label: 'Needs Attention', color: 'red' };
  };

  const upcomingEvents = getUpcomingEvents();
  const capacityUtilization = getCapacityUtilization();
  const topSellingTier = getTopSellingTier();
  const eventHealth = getEventHealthScore();

  const getHealthColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100 border-green-200';
      case 'blue': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'yellow': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'red': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthIcon = (color: string) => {
    switch (color) {
      case 'green': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'blue': return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case 'yellow': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'red': return <AlertCircle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Event Performance Overview and Business Insights - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
        {/* Event Performance Overview (replacing Revenue Chart) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Event Performance</h3>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                Live Data
              </span>
            </div>
          </div>

          {/* Event Performance Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Upcoming Events */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Upcoming Events</p>
                  <p className="text-xs text-gray-500">Next 7 days</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-900">{upcomingEvents.length}</p>
                {upcomingEvents.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {upcomingEvents[0]?.title?.slice(0, 15)}...
                  </p>
                )}
              </div>
            </div>

            {/* Capacity Utilization */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Capacity</p>
                  <p className="text-xs text-gray-500">Utilization</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-900">{capacityUtilization.toFixed(0)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Top Selling Tier */}
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Star className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Best Selling</p>
                  <p className="text-xs text-gray-500">Ticket Tier</p>
                </div>
              </div>
              <div className="text-center">
                {topSellingTier ? (
                  <>
                    <p className="text-lg font-bold text-purple-900">{topSellingTier.tier.split(' - ')[1]}</p>
                    <p className="text-xs text-purple-600 mt-1">
                      {topSellingTier.sold} sold
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-bold text-gray-400">No sales yet</p>
                )}
              </div>
            </div>

            {/* Event Health Score */}
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-full">
                  {getHealthIcon(eventHealth.color)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Event Health</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-900">{eventHealth.label}</p>
                <p className="text-xs text-orange-600 mt-1">
                  {eventHealth.score}/100
                </p>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex gap-2 justify-center">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                capacityUtilization >= 80 ? 'bg-green-100 text-green-800 border-green-200' :
                capacityUtilization >= 60 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                capacityUtilization >= 40 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {capacityUtilization.toFixed(0)}% Capacity Filled
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                {stats.ticketSalesByTier.filter(t => t.revenue > 0).length} Active Tiers
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
                    <TrendingUp className="h-5 w-5 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-700">Event Performance</p>
                    <p className="text-xs text-gray-500">Success Rate</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-900">
                    {stats.revenueByEvent.filter(e => e.revenue > 0).length}/{stats.revenueByEvent.length}
                  </p>
                  <p className="text-xs text-purple-600">Events with sales</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardCharts;

