import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  ArrowUpRight,
  Star
} from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { Event, Order, OrderTicket } from '../types';
import EventForm from './EventForm';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingEvent: string;
  recentOrders: Order[];
  revenueByEvent: { event: string; revenue: number }[];
  ticketSalesByTier: { tier: string; sold: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

const Dashboard = () => {
  const { events, orders, getEvents, getOrders, addEvent, deleteEvent, archiveEvent } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [creatingEvents, setCreatingEvents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'events' | 'orders'>('analytics');
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [confirm, setConfirm] = useState<{type: 'archive' | 'delete', event: Event} | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []); // Only run once on mount

  useEffect(() => {
    if (events && orders) {
      const calculatedStats = calculateStats();
      setStats(calculatedStats);
    }
  }, [events, orders, selectedTimeframe, selectedEvent]);

  const loadDashboardData = async () => {
    console.log('🔄 Loading dashboard data...');
    setIsLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Loading timeout - forcing completion');
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    try {
      console.log('📡 Fetching events and orders...');
      await Promise.all([getEvents(), getOrders()]);
      console.log('✅ Data fetched successfully');
      
      // Calculate comprehensive stats
      const calculatedStats = calculateStats();
      setStats(calculatedStats);
      console.log('📊 Stats calculated:', calculatedStats);
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      console.log('🏁 Dashboard loading complete');
    }
  };

  const handleAddEventClick = () => {
    setEditingEvent(null);
    setIsEventFormOpen(true);
  };

  const handleEditEventClick = (event: Event) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleDeleteEventClick = (ev: Event) => {
    setConfirm({ type: 'delete', event: ev });
  };

  const handleArchiveToggle = (ev: Event) => {
    setConfirm({ type: 'archive', event: ev });
  };

  const createTestEvent = async (type: 'sundowner' | 'bollywood' | 'carnival') => {
    setCreatingEvents(prev => [...prev, type]);
    
    const now = new Date();
    const eventDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    
    let eventData: any;
    
    switch (type) {
      case 'sundowner':
        eventData = {
          title: 'Carnival LDN Sundowner',
          date: eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          time: '18:00 - 22:00',
          venue: 'Sky Garden, 20 Fenchurch St, London EC3M 3BY',
          price: 'From £25',
          description: 'Experience the magic of London at sunset with our exclusive Carnival LDN Sundowner. Enjoy live music, craft cocktails, and breathtaking city views from one of London\'s most iconic venues.',
          capacity: '150',
          image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
          tags: 'sundowner,networking,music,cocktails,views',
          gradient: 'from-orange-400 via-red-500 to-pink-500',
          ticketTiers: [
            {
              id: `tier_${Date.now()}_1`,
              name: 'Early Bird',
              price: 2500, // £25.00
              originalPrice: 3500,
              capacity: 50,
              soldCount: 0,
              description: 'Limited early bird tickets',
              benefits: ['Priority entry', 'Welcome drink', 'Canapés'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_2`,
              name: 'Standard',
              price: 3500, // £35.00
              originalPrice: null,
              capacity: 80,
              soldCount: 0,
              description: 'Standard admission',
              benefits: ['Entry', 'Welcome drink', 'Canapés', 'Live music'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_3`,
              name: 'VIP',
              price: 5500, // £55.00
              originalPrice: null,
              capacity: 20,
              soldCount: 0,
              description: 'Premium experience',
              benefits: ['Priority entry', 'Premium drinks', 'Full catering', 'Reserved seating', 'Meet & greet with artists'],
              isActive: true
            }
          ]
        };
        break;
        
      case 'bollywood':
        eventData = {
          title: 'Bollywood Night - Carnival LDN',
          date: eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          time: '19:00 - 02:00',
          venue: 'O2 Academy Brixton, 211 Stockwell Rd, London SW9 9SL',
          price: 'From £20',
          description: 'Get ready for the most vibrant Bollywood night in London! Dance to the latest Bollywood hits, enjoy authentic Indian cuisine, and experience the magic of Indian cinema with live performances.',
          capacity: '200',
          image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
          tags: 'bollywood,indian,music,dance,food,culture',
          gradient: 'from-purple-400 via-pink-500 to-red-500',
          ticketTiers: [
            {
              id: `tier_${Date.now()}_1`,
              name: 'General Admission',
              price: 2000, // £20.00
              originalPrice: null,
              capacity: 120,
              soldCount: 0,
              description: 'Basic entry',
              benefits: ['Entry', 'Live music', 'Dance floor access'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_2`,
              name: 'Premium',
              price: 3500, // £35.00
              originalPrice: null,
              capacity: 60,
              soldCount: 0,
              description: 'Enhanced experience',
              benefits: ['Entry', 'Live music', 'Dance floor access', 'Food vouchers', 'Reserved seating'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_3`,
              name: 'VIP Experience',
              price: 6500, // £65.00
              originalPrice: null,
              capacity: 20,
              soldCount: 0,
              description: 'Ultimate Bollywood experience',
              benefits: ['Priority entry', 'Premium seating', 'All-inclusive food & drinks', 'Meet performers', 'Photo opportunities', 'Exclusive dance workshop'],
              isActive: true
            }
          ]
        };
        break;
        
      case 'carnival':
        eventData = {
          title: 'Carnival LDN Street Festival',
          date: eventDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          time: '12:00 - 20:00',
          venue: 'Brockwell Park, London SE24 9BJ',
          price: 'Free - £40',
          description: 'Join us for the biggest Caribbean carnival celebration in London! Experience vibrant costumes, steel pan music, Caribbean food stalls, and an unforgettable day of culture and celebration.',
          capacity: '500',
          image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
          tags: 'carnival,caribbean,culture,music,food,family',
          gradient: 'from-green-400 via-blue-500 to-purple-500',
          ticketTiers: [
            {
              id: `tier_${Date.now()}_1`,
              name: 'Free Entry',
              price: 0, // Free
              originalPrice: null,
              capacity: 300,
              soldCount: 0,
              description: 'General festival access',
              benefits: ['Entry', 'Live music', 'Food stalls access', 'Family activities'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_2`,
              name: 'Premium Pass',
              price: 2500, // £25.00
              originalPrice: null,
              capacity: 150,
              soldCount: 0,
              description: 'Enhanced festival experience',
              benefits: ['Priority entry', 'Reserved seating areas', 'Food vouchers', 'Exclusive bar access', 'Meet & greet with performers'],
              isActive: true
            },
            {
              id: `tier_${Date.now()}_3`,
              name: 'VIP Experience',
              price: 4000, // £40.00
              originalPrice: null,
              capacity: 50,
              soldCount: 0,
              description: 'Ultimate carnival experience',
              benefits: ['Priority entry', 'VIP seating', 'All-inclusive food & drinks', 'Backstage access', 'Exclusive workshops', 'Commemorative gift bag'],
              isActive: true
            }
          ]
        };
        break;
    }
    
    try {
      await addEvent(eventData);
      toast.success(`${eventData.title} created successfully!`);
      await loadDashboardData(); // Refresh the dashboard
    } catch (error) {
      console.error('Error creating test event:', error);
      toast.error('Failed to create test event');
    } finally {
      setCreatingEvents(prev => prev.filter(t => t !== type));
    }
  };

  const calculateStats = (): DashboardStats => {
    if (!events || !orders) return {
      totalRevenue: 0,
      totalOrders: 0,
      totalTickets: 0,
      conversionRate: 0,
      averageOrderValue: 0,
      topPerformingEvent: 'N/A',
      recentOrders: [],
      revenueByEvent: [],
      ticketSalesByTier: [],
      dailyRevenue: []
    };

    const filteredOrders = orders.filter(order => {
      if (selectedEvent !== 'all' && order.eventId !== selectedEvent) return false;
      
      const orderDate = new Date(order.createdAt);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : 90));
      
      return orderDate >= cutoffDate;
    });

    const totalRevenue = filteredOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const totalOrders = filteredOrders.length;
    const totalTickets = filteredOrders.reduce((sum: number, order: any) => sum + (order.tickets?.reduce((tSum: number, ticket: any) => tSum + (ticket.quantity || 0), 0) || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate conversion rate (orders / total visitors - simplified)
    const conversionRate = totalOrders > 0 ? Math.min(95, Math.random() * 20 + 5) : 0; // Placeholder

    // Find top performing event
    const eventRevenue = events.map(event => {
      const eventOrders = filteredOrders.filter((order: any) => order.eventId === event.id);
      const revenue = eventOrders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      return { event: event.title, revenue };
    });
    const topPerformingEvent = eventRevenue.sort((a, b) => b.revenue - a.revenue)[0]?.event || 'N/A';

    // Revenue by event
    const revenueByEvent = eventRevenue.filter(e => e.revenue > 0);

    // Ticket sales by tier
    const ticketSalesByTier: { tier: string; sold: number }[] = [];
    events.forEach(event => {
      event.ticketTiers?.forEach(tier => {
        ticketSalesByTier.push({
          tier: `${event.title} - ${tier.name}`,
          sold: tier.soldCount || 0
        });
      });
    });

    // Daily revenue (last 7 days)
    const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });
      const revenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      return {
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        revenue
      };
    }).reverse();

    return {
      totalRevenue,
      totalOrders,
      totalTickets,
      conversionRate,
      averageOrderValue,
      topPerformingEvent,
      recentOrders: filteredOrders.slice(0, 5),
      revenueByEvent,
      ticketSalesByTier,
      dailyRevenue
    };
  };

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // Helpers for Event Management segmentation
  const parseEventDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null;
    let s = String(dateStr).trim();
    // If begins with weekday, remove it: e.g., "Sunday, 20 October 2024" -> "20 October 2024"
    const weekdayMatch = s.match(/^[A-Za-z]+,\s*(.*)$/);
    if (weekdayMatch) s = weekdayMatch[1];

    // Try native parse first
    let d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // Try "DD Month YYYY" -> "Month DD, YYYY"
    const dmyMatch = s.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (dmyMatch) {
      const [, dd, mon, yyyy] = dmyMatch;
      d = new Date(`${mon} ${dd}, ${yyyy}`);
      if (!isNaN(d.getTime())) return d;
    }

    // Try "DD/MM/YYYY" or "DD-MM-YYYY"
    const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) {
      const [, dd, mm, yyyy] = slashMatch;
      const pad = (n: string) => n.padStart(2, '0');
      d = new Date(`${yyyy}-${pad(mm)}-${pad(dd)}`);
      if (!isNaN(d.getTime())) return d;
    }

    return null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentEvents = (events || []).filter(ev => !ev.isArchived).sort((a, b) => {
    const da = parseEventDate(a.date);
    const db = parseEventDate(b.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da.getTime() - db.getTime();
  });

  // Removed completedEvents view per request

  const archivedEvents = (events || []).filter(ev => ev.isArchived).sort((a, b) => {
    const da = parseEventDate(a.date);
    const db = parseEventDate(b.date);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading Dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few seconds...</p>
          
          {/* Fallback button if loading takes too long */}
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              setIsLoading(false);
              loadDashboardData();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage analytics, events, and orders</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Events</option>
                {events?.map(event => (
                  <option key={event.id} value={event.id}>{event.title}</option>
                ))}
              </select>
              <button
                onClick={loadDashboardData}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
          {/* Tabs */}
          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'analytics' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'events' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Event Management
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${activeTab === 'orders' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Orders
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && (
        <>
        {/* Quick Event Creation Buttons (moved here to avoid nav distortion) */}
        <div className="flex items-center justify-end mb-6 gap-2">
          <button
            onClick={() => createTestEvent('sundowner')}
            disabled={creatingEvents.includes('sundowner')}
            className="px-3 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-medium rounded-lg hover:from-orange-500 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creatingEvents.includes('sundowner') ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>🌅 Add Sundowner</>
            )}
          </button>
          <button
            onClick={() => createTestEvent('bollywood')}
            disabled={creatingEvents.includes('bollywood')}
            className="px-3 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creatingEvents.includes('bollywood') ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>🎭 Add Bollywood Night</>
            )}
          </button>
          <button
            onClick={() => createTestEvent('carnival')}
            disabled={creatingEvents.includes('carnival')}
            className="px-3 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creatingEvents.includes('carnival') ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </>
            ) : (
              <>🎪 Add Carnival</>
            )}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+12.5%</span>
              <span className="text-gray-500 ml-1">from last period</span>
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
                <p className="text-3xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+8.2%</span>
              <span className="text-gray-500 ml-1">from last period</span>
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
                <p className="text-3xl font-bold text-gray-900">{stats?.totalTickets || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+15.3%</span>
              <span className="text-gray-500 ml-1">from last period</span>
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
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{formatPercentage(stats?.conversionRate || 0)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+2.1%</span>
              <span className="text-gray-500 ml-1">from last period</span>
            </div>
          </motion.div>
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {stats?.dailyRevenue.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{day.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(day.revenue / Math.max(1, Math.max(...stats.dailyRevenue.map(d => d.revenue)))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {formatCurrency(day.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Performing Events */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Events</h3>
              <Star className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats?.revenueByEvent.slice(0, 5).map((event, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{event.event}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(event.revenue)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 font-mono">
                        {order.id?.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {events?.find(e => e.id === order.eventId)?.title || 'Unknown Event'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount || 0)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        </>
        )}

        {activeTab === 'events' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Manage Events</h3>
              <button
                onClick={handleAddEventClick}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-sm"
              >
                Add Event
              </button>
            </div>

            {/* Current Events */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-800">Current Events</h4>
                <span className="text-sm text-gray-500">{currentEvents.length} events</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiers</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{ev.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[180px]">{ev.venue}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.ticketTiers?.length || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleEditEventClick(ev)} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50">Edit</button>
                            <button onClick={() => handleArchiveToggle(ev)} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50">Archive</button>
                            <button onClick={() => handleDeleteEventClick(ev)} className="px-3 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Completed Events removed */}

            {/* Archived Events */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-md font-semibold text-gray-800">Archived Events</h4>
                <span className="text-sm text-gray-500">{archivedEvents.length} events</span>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Venue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiers</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {archivedEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{ev.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[180px]">{ev.venue}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ev.ticketTiers?.length || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button onClick={() => handleArchiveToggle(ev)} className="px-3 py-1 rounded-md border text-gray-700 hover:bg-gray-50">Unarchive</button>
                            <button onClick={() => handleDeleteEventClick(ev)} className="px-3 py-1 rounded-md border border-red-200 text-red-700 hover:bg-red-50">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders?.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 font-mono">{order.id?.slice(0, 8)}...</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                          <div className="text-sm text-gray-500">{order.customerEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{events?.find(e => e.id === order.eventId)?.title || 'Unknown Event'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.tickets?.reduce((sum: number, ticket: OrderTicket) => sum + (ticket.quantity || 0), 0) || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount || 0)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>{order.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.createdAt as any).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {isEventFormOpen && (
        <EventForm
          event={editingEvent}
          onClose={() => {
            setIsEventFormOpen(false)
            setEditingEvent(null)
            // refresh after closing in case changes were made
            loadDashboardData()
          }}
        />
      )}
      {confirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirm.type === 'delete' ? 'Delete Event' : confirm.event.isArchived ? 'Unarchive Event' : 'Archive Event'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirm.type === 'delete'
                ? 'This will permanently delete the event and related data (if archived). This action cannot be undone.'
                : confirm.event.isArchived
                  ? 'This will unarchive the event and make it visible again.'
                  : 'This will archive the event and hide it from public view.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-md border text-gray-700">Cancel</button>
              {confirm.type === 'delete' ? (
                <button
                  onClick={async () => {
                    await deleteEvent(confirm.event.id);
                    setConfirm(null);
                  }}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Delete
                </button>
              ) : (
                <button
                  onClick={async () => {
                    await archiveEvent(confirm.event.id, !confirm.event.isArchived);
                    setConfirm(null);
                  }}
                  className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-gray-800"
                >
                  {confirm.event.isArchived ? 'Unarchive' : 'Archive'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
