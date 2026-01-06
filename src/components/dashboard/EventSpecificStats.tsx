import { motion } from 'framer-motion';
import { Calendar, MapPin, Star, TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Event, Order } from '../../types';
import OrderDetailsModal from './OrderDetailsModal';


interface EventSpecificStatsProps {
  events: Event[];
  orders: Order[];
  selectedEvent: string;
  onExportEventData: (eventId: string) => void;
}

const EventSpecificStats = ({ events, orders, selectedEvent, onExportEventData }: EventSpecificStatsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const event = events.find(e => e.id === selectedEvent);
  if (!event) return null;

  // Filter orders for this specific event
  const eventOrders = orders.filter(order => order.eventId === selectedEvent);
  
  // Debug: Log the orders data to see what we're working with
  console.log('🔍 EventSpecificStats Debug:', {
    selectedEvent,
    totalOrders: orders.length,
    eventOrdersCount: eventOrders.length,
    sampleOrder: eventOrders[0],
    ordersWithAge: eventOrders.filter(o => o.customerDateOfBirth).length,
    ordersWithGender: eventOrders.filter(o => o.customerGender).length
  });

  // Filter orders based on search term
  const filteredOrders = eventOrders.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerEmail?.toLowerCase().includes(searchLower) ||
      order.id?.toLowerCase().includes(searchLower)
    );
  });



  // Get scan status display
  const getScanStatusDisplay = (order: Order) => {
    if (!order.scans || order.scans.length === 0) {
      return { text: 'Not Scanned', color: 'text-gray-500', icon: Clock };
    }

    const entryScans = order.scans.filter(s => s.scanType === 'entry');
    const exitScans = order.scans.filter(s => s.scanType === 'exit');
    const lastScan = order.scans[0]; // Most recent scan

    if (entryScans.length > 0 && exitScans.length > 0) {
      return { 
        text: 'Scanned In & Out', 
        color: 'text-blue-600', 
        icon: CheckCircle,
        time: new Date(lastScan.scannedAt).toLocaleTimeString()
      };
    } else if (entryScans.length > 0) {
      return { 
        text: 'Scanned In', 
        color: 'text-green-600', 
        icon: CheckCircle,
        time: new Date(lastScan.scannedAt).toLocaleTimeString()
      };
    } else if (exitScans.length > 0) {
      return { 
        text: 'Scanned Out', 
        color: 'text-orange-600', 
        icon: XCircle,
        time: new Date(lastScan.scannedAt).toLocaleTimeString()
      };
    }

    return { text: 'Not Scanned', color: 'text-gray-500', icon: Clock };
  };

  // Calculate processing fee per ticket based on ticket price
  const calculateProcessingFee = (ticketPrice: number): number => {
    // Up to £40: £1.50 per ticket
    if (ticketPrice <= 4000) {
      return 150; // £1.50 = 150 pence
    }
    // £40-50: £2.00 per ticket
    if (ticketPrice <= 5000) {
      return 200; // £2.00 = 200 pence
    }
    // Above £50: £2.50 per ticket
    return 250; // £2.50 = 250 pence
  };

  // Calculate event-specific stats
  const totalRevenue = eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  // Calculate total processing fees for this event
  const totalProcessingFees = eventOrders.reduce((sum, order) => {
    if (!order.tickets) return sum;
    return sum + order.tickets.reduce((ticketSum, ticket) => {
      const ticketPrice = ticket.unitPrice || 0;
      const quantity = ticket.quantity || 0;
      const feePerTicket = calculateProcessingFee(ticketPrice);
      return ticketSum + (feePerTicket * quantity);
    }, 0);
  }, 0);
  
  const netRevenue = totalRevenue - totalProcessingFees;
  
  const eventStats = {
    totalRevenue,
    netRevenue,
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

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  // Calculate peak sales day from event orders
  const getPeakSalesDay = () => {
    if (eventOrders.length === 0) return { date: 'N/A', revenue: 0 };

    const dailyRevenue = eventOrders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toDateString();
      acc[date] = (acc[date] || 0) + (order.totalAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const peakDay = Object.entries(dailyRevenue).reduce((max, [date, revenue]) =>
      revenue > max.revenue ? { date, revenue } : max,
      { date: '', revenue: 0 }
    );

    return {
      date: peakDay.date ? new Date(peakDay.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : 'N/A',
      revenue: peakDay.revenue
    };
  };

  // Calculate active days count
  const getActiveDaysCount = () => {
    if (eventOrders.length === 0) return 0;

    const uniqueDays = new Set(
      eventOrders.map(order => new Date(order.createdAt).toDateString())
    );

    return uniqueDays.size;
  };

  // Pagination for orders table
  const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleRecordsPerPageChange = (records: number) => {
    setRecordsPerPage(records);
    setCurrentPage(1);
  };

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // Export sales info for the event
  const exportSalesInfo = () => {
    const salesData = eventOrders.map(order => {
      const orderTickets = order.tickets?.map(ticket => {
        const tier = event.ticketTiers?.find(t => t.id === ticket.ticketTierId);
        const scanStatus = getScanStatusDisplay(order);
        const lastScanTime = order.scans && order.scans.length > 0 ? 
          new Date(order.scans[0].scannedAt).toLocaleString() : 'Never';
        
        return {
          'Order ID': order.id?.slice(0, 8) || 'N/A',
          'Customer Name': order.customerName || 'N/A',
          'Customer Email': order.customerEmail || 'N/A',
          'Ticket Tier': tier?.name || 'Unknown Tier',
          'Quantity': ticket.quantity || 0,
          'Unit Price': tier ? `£${(tier.price / 100).toFixed(2)}` : 'N/A',
          'Total Price': `£${((ticket.totalPrice || 0) / 100).toFixed(2)}`,
          'Order Status': order.status || 'N/A',
          'Scan Status': scanStatus.text,
          'Last Scan Time': lastScanTime,
          'Order Date': new Date(order.createdAt).toLocaleDateString(),
          'Order Time': new Date(order.createdAt).toLocaleTimeString()
        };
      }) || [];

      return orderTickets;
    }).flat();

    if (salesData.length > 0) {
      const csvContent = [
        'Order ID,Customer Name,Customer Email,Ticket Tier,Quantity,Unit Price,Total Price,Order Status,Scan Status,Last Scan Time,Order Date,Order Time',
        ...salesData.map(row =>
          `${row['Order ID']},${row['Customer Name']},${row['Customer Email']},${row['Ticket Tier']},${row['Quantity']},${row['Unit Price']},${row['Total Price']},${row['Order Status']},${row['Scan Status']},${row['Last Scan Time']},${row['Order Date']},${row['Order Time']}`
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
              transition={{ delay: 0.25 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(eventStats.netRevenue)}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
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
            </div>

             {/* Customer Demographics Charts */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Age Distribution Card */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.6 }}
           className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
         >
           <h3 className="text-lg font-semibold text-gray-900 mb-6">Age Distribution</h3>
           {(() => {
                           // Calculate age distribution
              const ageGroups = {
                '18-24': 0,
                '25-34': 0,
                '35-44': 0,
                '45+': 0
              };

             let totalWithAge = 0;
             eventOrders.forEach(order => {
               if (order.customerDateOfBirth) {
                 const birthDate = new Date(order.customerDateOfBirth);
                 const today = new Date();
                 let age = today.getFullYear() - birthDate.getFullYear();
                 const monthDiff = today.getMonth() - birthDate.getMonth();
                 
                 if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                   age--;
                 }

                                   if (age >= 18 && age <= 24) ageGroups['18-24']++;
                  else if (age >= 25 && age <= 34) ageGroups['25-34']++;
                  else if (age >= 35 && age <= 44) ageGroups['35-44']++;
                  else if (age >= 45) ageGroups['45+']++;
                 
                 totalWithAge++;
               }
             });

                           const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
             const total = Object.values(ageGroups).reduce((sum, count) => sum + count, 0);

                           return total > 0 ? (
                <div className="flex gap-8 items-center">
                  {/* Donut Chart - Left Side */}
                  <div className="flex-shrink-0">
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {Object.entries(ageGroups).map(([group, count], index) => {
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          const circumference = 2 * Math.PI * 45;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const offset = index === 0 ? 0 : 
                            Object.entries(ageGroups).slice(0, index).reduce((sum, [_, prevCount]) => 
                              sum + (prevCount / total) * 100, 0) * circumference / 100;
                          
                          return (
                            <circle
                              key={group}
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={colors[index]}
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={-offset}
                              className={`transition-all duration-300 hover:stroke-width-10 ${
                                count === 0 ? 'opacity-30' : ''
                              }`}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900">{total}</div>
                          <div className="text-sm text-gray-600">Customers</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend - Right Side */}
                  <div className="flex-1 space-y-2">
                    {Object.entries(ageGroups).map(([group, count], index) => {
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={group} className={`flex items-center justify-between p-2 rounded-lg ${
                          count === 0 ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: colors[index] }}
                            />
                            <span className={`text-sm font-medium ${
                              count === 0 ? 'text-gray-500' : 'text-gray-700'
                            }`}>{group}</span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              count === 0 ? 'text-gray-400' : 'text-gray-900'
                            }`}>{count}</div>
                            <div className={`text-xs ${
                              count === 0 ? 'text-gray-400' : 'text-gray-500'
                            }`}>{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             ) : (
               <div className="text-center py-8 text-gray-500">
                 <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                 <p>No age data available</p>
               </div>
             );
           })()}
         </motion.div>

         {/* Gender Distribution Card */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.7 }}
           className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
         >
           <h3 className="text-lg font-semibold text-gray-900 mb-6">Gender Distribution</h3>
           {(() => {
             // Calculate gender distribution
             const genderCounts = {
               'male': 0,
               'female': 0,
               'other': 0,
               'prefer_not_to_say': 0
             };

             let totalWithGender = 0;
             eventOrders.forEach(order => {
               if (order.customerGender) {
                 genderCounts[order.customerGender]++;
                 totalWithGender++;
               }
             });

             const colors = ['#3B82F6', '#EC4899', '#10B981', '#6B7280'];
             const total = Object.values(genderCounts).reduce((sum, count) => sum + count, 0);

                           return total > 0 ? (
                <div className="flex gap-8 items-center">
                  {/* Donut Chart - Left Side */}
                  <div className="flex-shrink-0">
                    <div className="relative w-56 h-56">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {Object.entries(genderCounts).map(([gender, count], index) => {
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          const circumference = 2 * Math.PI * 45;
                          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                          const offset = index === 0 ? 0 : 
                            Object.entries(genderCounts).slice(0, index).reduce((sum, [_, prevCount]) => 
                              sum + (prevCount / total) * 100, 0) * circumference / 100;
                          
                          return (
                            <circle
                              key={gender}
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={colors[index]}
                              strokeWidth="8"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={-offset}
                              className={`transition-all duration-300 hover:stroke-width-10 ${
                                count === 0 ? 'opacity-30' : ''
                              }`}
                            />
                          );
                        })}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-gray-900">{total}</div>
                          <div className="text-sm text-gray-600">Customers</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Legend - Right Side */}
                  <div className="flex-1 space-y-2">
                    {Object.entries(genderCounts).map(([gender, count], index) => {
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      const genderLabel = gender === 'prefer_not_to_say' ? 'Prefer not to say' : 
                                       gender.charAt(0).toUpperCase() + gender.slice(1);
                      return (
                        <div key={gender} className={`flex items-center justify-between p-2 rounded-lg ${
                          count === 0 ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: colors[index] }}
                            />
                            <span className={`text-sm font-medium ${
                              count === 0 ? 'text-gray-500' : 'text-gray-700'
                            }`}>{genderLabel}</span>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-bold ${
                              count === 0 ? 'text-gray-400' : 'text-gray-900'
                            }`}>{count}</div>
                            <div className={`text-xs ${
                              count === 0 ? 'text-gray-400' : 'text-gray-500'
                            }`}>{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
             ) : (
               <div className="text-center py-8 text-gray-500">
                 <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                 <p>No gender data available</p>
               </div>
             );
           })()}
         </motion.div>
       </div>

      {/* Ticket Tier Performance and Useful Stats - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ticket Tier Performance - Left Aligned */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
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
          transition={{ delay: 0.9 }}
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
                    {getPeakSalesDay().date}
                  </p>
                  <p className="text-xs text-purple-600">
                    {formatCurrency(getPeakSalesDay().revenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Pills */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex gap-2 justify-center">
              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                getActiveDaysCount() >= 20 ? 'bg-green-100 text-green-800 border-green-200' :
                getActiveDaysCount() >= 15 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                getActiveDaysCount() >= 10 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'
              }`}>
                {getActiveDaysCount()} Active Days
              </span>
              <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                {tierPerformance.filter(t => t.revenue > 0).length} Active Tiers
              </span>
            </div>
          </div>
        </motion.div>
      </div>






      {/* Event Orders Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Event Orders</h3>
            
            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page when searching
                  }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
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
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Status</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                                     {currentOrders.map((order) => (
                     <tr 
                       key={order.id} 
                       className="hover:bg-gray-50 cursor-pointer transition-colors"
                       onClick={() => handleOrderClick(order)}
                     >
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
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const scanStatus = getScanStatusDisplay(order);
                          const IconComponent = scanStatus.icon;
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <div className={`flex items-center gap-1 ${scanStatus.color}`}>
                                <IconComponent className="h-4 w-4" />
                                <span className="text-xs font-medium">{scanStatus.text}</span>
                              </div>
                              {scanStatus.time && (
                                <span className="text-xs text-gray-500">{scanStatus.time}</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination and Records Per Page */}
            <div className="px-6 py-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                {/* Records per page selector - Bottom Left */}
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
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">records</span>
                </div>

                {/* Pagination Info and Controls - Bottom Right */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} results
                    {searchTerm && (
                      <span className="ml-2 text-blue-600">
                        (filtered from {eventOrders.length} total)
                      </span>
                    )}
                  </div>
                  
                  {totalPages > 1 && (
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
                  )}
                </div>
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

       {/* Order Details Modal */}
       <OrderDetailsModal
         order={selectedOrder}
         event={event}
         isOpen={isModalOpen}
         onClose={handleCloseModal}
       />
     </div>
   );
 };

export default EventSpecificStats;
