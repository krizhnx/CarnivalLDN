import { useState, useEffect } from 'react';
import { useAppStore } from '../store/supabaseStore';
import { Event, Order } from '../types';
import EventForm from './EventForm';
import toast from 'react-hot-toast';
import {
  DashboardHeader,
  DashboardStats,
  DashboardCharts,
  RecentOrdersTable,
  QuickEventCreation,
  EventManagement,
  OrdersTable,
  ConfirmationModal,
  EventSpecificStats,
  TicketScanner
} from './dashboard/index';
import { exportCustomerData, exportEventData } from './dashboard/CSVExport';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingEvent: string;
  recentOrders: Order[];
  revenueByEvent: { event: string; revenue: number }[];
  ticketSalesByTier: { tier: string; sold: number; revenue: number; capacity: number }[];
  dailyRevenue: { date: string; revenue: number }[];
}

const Dashboard = () => {
  const { events, orders, getEvents, getOrders, addEvent, deleteEvent, archiveEvent } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [creatingEvents, setCreatingEvents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'analytics' | 'events' | 'orders' | 'scanner'>('analytics');
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
          venue: 'Sky Garden, London',
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
          venue: 'O2 Academy Brixton, London',
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

    // Ticket sales by tier with enhanced data
    const ticketSalesByTier: { tier: string; sold: number; revenue: number; capacity: number }[] = [];
    events.forEach(event => {
      event.ticketTiers?.forEach(tier => {
        const tierOrders = filteredOrders.filter((order: any) =>
          order.tickets?.some((ticket: any) => ticket.ticketTierId === tier.id)
        );
        const tierRevenue = tierOrders.reduce((sum: number, order: any) => {
          const tierTickets = order.tickets?.filter((ticket: any) => ticket.ticketTierId === tier.id) || [];
          return sum + tierTickets.reduce((tSum: number, ticket: any) => tSum + (ticket.totalPrice || 0), 0);
        }, 0);
        const tierSold = tierOrders.reduce((sum: number, order: any) => {
          const tierTickets = order.tickets?.filter((ticket: any) => ticket.ticketTierId === tier.id) || [];
          return sum + tierTickets.reduce((tSum: number, ticket: any) => tSum + (ticket.quantity || 0), 0);
        }, 0);

        ticketSalesByTier.push({
          tier: `${event.title} - ${tier.name}`,
          sold: tierSold,
          revenue: tierRevenue,
          capacity: tier.capacity || 0
        });
      });
    });

    // Daily revenue (last 30 days with proper data aggregation)
    const dailyRevenue = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i)); // Start from 30 days ago, go to today

      const dayOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.toDateString() === date.toDateString();
      });

      const revenue = dayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

      return {
        date: date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
        revenue
      };
    });

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

  // CSV Export handlers
  const handleExportCustomerData = () => {
    if (events && orders) {
      exportCustomerData(orders, events, selectedTimeframe);
      toast.success('Customer data exported successfully!');
    }
  };

  const handleExportEventData = (eventId: string) => {
    const event = events?.find(e => e.id === eventId);
    if (event && orders) {
      exportEventData(event, orders, selectedTimeframe);
      toast.success(`${event.title} data exported successfully!`);
    }
  };

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
      <DashboardHeader
        selectedTimeframe={selectedTimeframe}
        selectedEvent={selectedEvent}
        events={events || []}
        activeTab={activeTab}
        onTimeframeChange={setSelectedTimeframe}
        onEventChange={setSelectedEvent}
        onTabChange={setActiveTab}
        onRefresh={loadDashboardData}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' && (
        <>
            {/* Show event-specific stats when an event is selected */}
            {selectedEvent !== 'all' ? (
              <EventSpecificStats
                events={events || []}
                orders={orders || []}
                selectedEvent={selectedEvent}
                onExportEventData={handleExportEventData}
              />
            ) : (
              <>
                <DashboardStats
                  stats={stats}
                  onExportAll={handleExportCustomerData}
                  quickEventButtons={
                    <QuickEventCreation
                      creatingEvents={creatingEvents}
                      onCreateEvent={createTestEvent}
                    />
                  }
                />
                <DashboardCharts stats={stats} events={events || []} />
                <RecentOrdersTable
                  orders={stats?.recentOrders || []}
                  events={events || []}
                />
              </>
            )}
        </>
        )}

        {activeTab === 'events' && (
          <EventManagement
            currentEvents={currentEvents}
            archivedEvents={archivedEvents}
            onAddEvent={handleAddEventClick}
            onEditEvent={handleEditEventClick}
            onArchiveToggle={handleArchiveToggle}
            onDeleteEvent={handleDeleteEventClick}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTable orders={orders || []} events={events || []} />
        )}

        {activeTab === 'scanner' && (
          <TicketScanner />
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

      <ConfirmationModal
        confirm={confirm}
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm) return;

          if (confirm.type === 'delete') {
                    await deleteEvent(confirm.event.id);
          } else {
                    await archiveEvent(confirm.event.id, !confirm.event.isArchived);
          }
                    setConfirm(null);
                  }}
      />
    </div>
  );
};

export default Dashboard;
