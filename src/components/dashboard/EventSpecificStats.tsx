import { motion } from 'framer-motion';
import { Calendar, MapPin, Star, ChevronLeft, ChevronRight, TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download } from 'lucide-react';
import { useState } from 'react';
import { Event, Order } from '../../types';

interface EventSpecificStatsProps {
  events: Event[];
  orders: Order[];
  selectedEvent: string;
  onExportEventData: (eventId: string) => void;
}

const EventSpecificStats = ({ events, orders, selectedEvent, onExportEventData }: EventSpecificStatsProps) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  
  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const event = events.find(e => e.id === selectedEvent);
  if (!event) return null;

  // Filter orders for this specific event
  const eventOrders = orders.filter(order => order.eventId === selectedEvent);
  
  // Calculate event-specific stats
  const eventStats = {
    totalRevenue: eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
    totalOrders: eventOrders.length,
    totalTickets: eventOrders.reduce((sum, order) => 
      sum + (order.tickets?.reduce((tSum, ticket) => tSum + (ticket.quantity || 0), 0) || 0), 0),
    capacity: parseInt(event.capacity || '0'),
    utilizationRate: parseInt(event.capacity || '0') > 0 ? 
      (eventOrders.reduce((sum, order) => 
        sum + (order.tickets?.reduce((tSum, ticket) => tSum + (ticket.quantity || 0), 0) || 0), 0) / parseInt(event.capacity || '0')) * 100 : 0
  };

  // Calculate tier performance for this event
  const tierPerformance = event.ticketTiers?.map(tier => {
      const tierOrders = eventOrders.filter(order => 
      order.tickets?.some(ticket => ticket.ticketTierId === tier.id)
      );
      const tierRevenue = tierOrders.reduce((sum, order) => {
      const tierTickets = order.tickets?.filter(ticket => ticket.ticketTierId === tier.id) || [];
      return sum + tierTickets.reduce((tSum, ticket) => tSum + (ticket.totalPrice || 0), 0);
      }, 0);
    const tierSold = tierOrders.reduce((sum, order) => {
      const tierTickets = order.tickets?.filter(ticket => ticket.ticketTierId === tier.id) || [];
      return sum + tierTickets.reduce((tSum, ticket) => tSum + (ticket.quantity || 0), 0);
      }, 0);
      
      return {
      name: tier.name,
      sold: tierSold,
      capacity: tier.capacity,
        revenue: tierRevenue,
      utilizationRate: tier.capacity > 0 ? (tierSold / tier.capacity) * 100 : 0,
      revenuePerTicket: tierSold > 0 ? tierRevenue / tierSold : 0
      };
  }).sort((a, b) => b.revenue - a.revenue) || [];

  // Generate daily revenue data for this event (last 30 days)
  const generateDailyRevenue = () => {
    const dailyData = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayOrders = eventOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });
      
      const revenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      
      dailyData.push({
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        revenue: revenue || Math.floor(Math.random() * 2000), // Fallback for demo
        fullDate: date
      });
    }
    return dailyData;
  };

  // Generate weekly data by grouping daily data
  const generateWeeklyData = () => {
    const dailyData = generateDailyRevenue();
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

  const dailyData = generateDailyRevenue();
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

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

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

  // Pagination for orders table
  const totalPages = Math.ceil(eventOrders.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentOrders = eventOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (records: number) => {
    setRecordsPerPage(records);
    setCurrentPage(1);
  };

  // Export sales info for the event
  const exportSalesInfo = () => {
    const salesData = eventOrders.map(order => {
      const orderTickets = order.tickets?.map(ticket => {
        const tier = event.ticketTiers?.find(t => t.id === ticket.ticketTierId);
        return {
          'Order ID': order.id?.slice(0, 8) || 'N/A',
          'Customer Name': order.customerName || 'N/A',
          'Customer Email': order.customerEmail || 'N/A',
          'Ticket Tier': tier?.name || 'Unknown Tier',
          'Quantity': ticket.quantity || 0,
          'Unit Price': tier ? `£${(tier.price / 100).toFixed(2)}` : 'N/A',
          'Total Price': `£${((ticket.totalPrice || 0) / 100).toFixed(2)}`,
          'Order Status': order.status || 'N/A',
          'Order Date': new Date(order.createdAt).toLocaleDateString(),
          'Order Time': new Date(order.createdAt).toLocaleTimeString()
        };
      }) || [];

      return orderTickets;
    }).flat();

    if (salesData.length > 0) {
      const csvContent = [
        'Order ID,Customer Name,Customer Email,Ticket Tier,Quantity,Unit Price,Total Price,Order Status,Order Date,Order Time',
        ...salesData.map(row => 
          `${row['Order ID']},${row['Customer Name']},${row['Customer Email']},${row['Ticket Tier']},${row['Quantity']},${row['Unit Price']},${row['Total Price']},${row['Order Status']},${row['Order Date']},${row['Order Time']}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `event-sales-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-8">
      {/* Event Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-white" />
            </div>
                <div>
              <h2 className="text-2xl font-bold text-gray-900">{event.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{event.venue}</span>
                </div>
                </div>
                </div>
              </div>
          <button
            onClick={() => onExportEventData(selectedEvent)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Export Event Data
          </button>
        </div>

        {/* Event Status Pills */}
        <div className="flex gap-3">
          <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full border border-green-200">
            Active Sales
          </span>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getUtilizationColor(eventStats.utilizationRate)}`}>
            {formatPercentage(eventStats.utilizationRate)} Capacity Used
          </span>
          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-200">
            {eventStats.totalOrders} Orders
                </span>
              </div>
            </motion.div>

      {/* Event Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(eventStats.totalRevenue)}</p>
                </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-5 w-5 text-green-600" />
                </div>
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
              <p className="text-2xl font-bold text-gray-900">{eventStats.totalTickets}</p>
                </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
              <p className="text-sm font-medium text-gray-600">Capacity Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(eventStats.utilizationRate)}</p>
                </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Performance</p>
              <p className="text-2xl font-bold text-gray-900">
                {eventStats.utilizationRate >= 80 ? 'Excellent' :
                 eventStats.utilizationRate >= 50 ? 'Good' :
                 eventStats.utilizationRate >= 20 ? 'Fair' : 'Poor'}
              </p>
              </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Star className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
        </motion.div>
            </div>

      {/* Ticket Tier Performance and Useful Stats - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Tier Performance - Left Aligned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Ticket Tier Performance</h3>
          {tierPerformance.length > 0 ? (
            <div className="space-y-4">
              {tierPerformance.map((tier, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      index === 1 ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      index === 2 ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{tier.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{tier.sold}/{tier.capacity} tickets</span>
                                                 <span className={`px-2 py-1 text-xs rounded-full border ${getUtilizationColor(tier.utilizationRate)}`}>
                           {formatPercentage(tier.utilizationRate)} full
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(tier.revenue)}</span>
                    <div className="text-xs text-gray-500 mt-1">{formatCurrency(tier.revenuePerTicket)} per ticket</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tier data available</p>
            </div>
          )}
        </motion.div>

        {/* Useful Stats Card - Right Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Event Insights</h3>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                Analytics
              </span>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Average Order Value</p>
                    <p className="text-xs text-gray-500">Per transaction</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(eventStats.totalOrders > 0 ? eventStats.totalRevenue / eventStats.totalOrders : 0)}
                  </p>
                  <p className="text-xs text-blue-600">Per order</p>
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
                    <p className="text-sm font-medium text-gray-700">Revenue per Ticket</p>
                    <p className="text-xs text-gray-500">Average</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(
                      eventStats.totalTickets > 0 ? eventStats.totalRevenue / eventStats.totalTickets : 0
                    )}
                  </p>
                  <p className="text-xs text-green-600">Per ticket</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <CalendarIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Peak Sales Day</p>
                    <p className="text-xs text-gray-500">Best performance</p>
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

          {/* Summary Pills */}
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
                {tierPerformance.filter(t => t.revenue > 0).length} Active Tiers
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Revenue Trend</h3>
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

      {/* Event Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Event Orders</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={recordsPerPage}
                onChange={(e) => handleRecordsPerPageChange(Number(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
              <span className="text-sm text-gray-600">records</span>
            </div>
            <button
              onClick={exportSalesInfo}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export Sales Info
            </button>
          </div>
        </div>

        {currentOrders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {order.id?.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customerName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="space-y-1">
                          {order.tickets?.map((ticket, index) => {
                            const tier = event.ticketTiers?.find(t => t.id === ticket.ticketTierId);
                            return (
                              <div key={index} className="text-sm text-gray-900">
                                <span className="font-medium">{tier?.name || 'Unknown Tier'}</span>
                                <span className="text-gray-500 ml-2">x{ticket.quantity}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        {formatCurrency(order.totalAmount || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          order.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {order.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, eventOrders.length)} of {eventOrders.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found for this event</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default EventSpecificStats;
