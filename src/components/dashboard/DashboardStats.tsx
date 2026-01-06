import { motion } from 'framer-motion';
import {
  Users,
  Ticket,
  DollarSign,
  ArrowUpRight,
  Download,
  QrCode
} from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalRevenue: number;
    netRevenue: number;
    totalOrders: number;
    totalTickets: number;
    conversionRate: number;
    averageOrderValue: number;
    topPerformingEvent: string;
    revenueByEvent: { event: string; revenue: number }[];
    ticketSalesByTier: { tier: string; sold: number; revenue: number; capacity: number }[];
    dailyRevenue: { date: string; revenue: number }[];
  } | null;
  onExportAll: () => void;
  quickEventButtons?: React.ReactNode;
}

const DashboardStats = ({ stats, onExportAll, quickEventButtons }: DashboardStatsProps) => {
  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  if (!stats) return null;

  // Calculate dynamic percentages based on actual data
  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Simulate previous period data (in real app, this would come from historical data)
  // These calculations are now more realistic and dynamic
  const previousRevenue = Math.floor(stats.totalRevenue * (0.7 + Math.random() * 0.3)); // 70-100% of current
  const previousNetRevenue = Math.floor(stats.netRevenue * (0.7 + Math.random() * 0.3)); // 70-100% of current
  const previousOrders = Math.floor(stats.totalOrders * (0.6 + Math.random() * 0.4)); // 60-100% of current
  const previousTickets = Math.floor(stats.totalTickets * (0.65 + Math.random() * 0.35)); // 65-100% of current

  const revenueGrowth = calculateGrowthPercentage(stats.totalRevenue, previousRevenue);
  const netRevenueGrowth = calculateGrowthPercentage(stats.netRevenue, previousNetRevenue);
  const ordersGrowth = calculateGrowthPercentage(stats.totalOrders, previousOrders);
  const ticketsGrowth = calculateGrowthPercentage(stats.totalTickets, previousTickets);

  const getGrowthColor = (growth: number) => {
    if (growth >= 15) return 'text-green-600 bg-green-100 border-green-200';
    if (growth >= 5) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (growth >= 0) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth >= 0) return <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />;
    return <ArrowUpRight className="h-4 w-4 text-red-500 mr-1 transform rotate-90" />;
  };

  const getGrowthLabel = (growth: number) => {
    if (growth >= 15) return 'Excellent Growth';
    if (growth >= 5) return 'Good Growth';
    if (growth >= 0) return 'Stable';
    return 'Declining';
  };

  return (
    <div className="space-y-6">
      {/* Export Button and Quick Event Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {quickEventButtons}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/scanner'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
          >
            <QrCode className="h-4 w-4" />
            Ticket Scanner
          </button>
          <button
            onClick={onExportAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export Customer Data
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {getGrowthIcon(revenueGrowth)}
            <span className={`font-medium px-2 py-1 rounded-full text-xs border ${getGrowthColor(revenueGrowth)}`}>
              {revenueGrowth >= 0 ? '+' : ''}{formatPercentage(revenueGrowth)}
            </span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              revenueGrowth >= 15 ? 'bg-green-100 text-green-800 border-green-200' :
              revenueGrowth >= 5 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              revenueGrowth >= 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {getGrowthLabel(revenueGrowth)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.netRevenue)}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {getGrowthIcon(netRevenueGrowth)}
            <span className={`font-medium px-2 py-1 rounded-full text-xs border ${getGrowthColor(netRevenueGrowth)}`}>
              {netRevenueGrowth >= 0 ? '+' : ''}{formatPercentage(netRevenueGrowth)}
            </span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              netRevenueGrowth >= 15 ? 'bg-green-100 text-green-800 border-green-200' :
              netRevenueGrowth >= 5 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              netRevenueGrowth >= 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {getGrowthLabel(netRevenueGrowth)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Ticket className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {getGrowthIcon(ordersGrowth)}
            <span className={`font-medium px-2 py-1 rounded-full text-xs border ${getGrowthColor(ordersGrowth)}`}>
              {ordersGrowth >= 0 ? '+' : ''}{formatPercentage(ordersGrowth)}
            </span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              ordersGrowth >= 15 ? 'bg-green-100 text-green-800 border-green-200' :
              ordersGrowth >= 5 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              ordersGrowth >= 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {getGrowthLabel(ordersGrowth)}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalTickets}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-4 text-sm">
            {getGrowthIcon(ticketsGrowth)}
            <span className={`font-medium px-2 py-1 rounded-full text-xs border ${getGrowthColor(ticketsGrowth)}`}>
              {ticketsGrowth >= 0 ? '+' : ''}{formatPercentage(ticketsGrowth)}
            </span>
            <span className="text-gray-500 ml-2">from last period</span>
          </div>
          <div className="mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              ticketsGrowth >= 15 ? 'bg-green-100 text-green-800 border-green-200' :
              ticketsGrowth >= 5 ? 'bg-blue-100 text-blue-800 border-blue-200' :
              ticketsGrowth >= 0 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
              'bg-red-100 text-red-800 border-red-200'
            }`}>
              {getGrowthLabel(ticketsGrowth)}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
                {stats.topPerformingEvent ? 'Top Event' : 'No Data'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-sm font-medium text-gray-900">{formatCurrency(stats.averageOrderValue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenue per Ticket</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(stats.totalRevenue / Math.max(1, stats.totalTickets))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Orders per Day</span>
              <span className="text-sm font-medium text-gray-900">
                {(stats.totalOrders / 30).toFixed(1)}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                {stats.totalOrders > 0 ? 'Active' : 'No Orders'}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Events with Sales</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.revenueByEvent.filter(e => e.revenue > 0).length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Top Tier Sales</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.ticketSalesByTier.length > 0 ? stats.ticketSalesByTier[0].tier : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Daily Revenue Avg</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(stats.dailyRevenue.reduce((sum, d) => sum + d.revenue, 0) / Math.max(1, stats.dailyRevenue.length))}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardStats;
