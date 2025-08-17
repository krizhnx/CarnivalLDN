import { Event, Order } from '../../types';

export interface CSVExportData {
  filename: string;
  data: any[];
  headers: string[];
}

export const exportToCSV = ({ filename, data, headers }: CSVExportData) => {
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportCustomerData = (orders: Order[], events: Event[], timeframe: string) => {
  const filename = `customer-data-${timeframe}-${new Date().toISOString().split('T')[0]}`;
  
  // Filter orders by timeframe
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90));
    return orderDate >= cutoffDate;
  });

  // Customer purchase details
  const customerData = filteredOrders.map(order => {
    const event = events.find(e => e.id === order.eventId);
    const ticketDetails = order.tickets?.map(ticket => {
      const tier = event?.ticketTiers?.find(t => t.id === ticket.ticketTierId);
      return {
        'Customer Name': order.customerName || 'N/A',
        'Customer Email': order.customerEmail || 'N/A',
        'Order ID': order.id?.slice(0, 8) || 'N/A',
        'Event Title': event?.title || 'Unknown Event',
        'Event Date': event?.date || 'N/A',
        'Event Venue': event?.venue || 'N/A',
        'Ticket Tier': tier?.name || 'Unknown Tier',
        'Ticket Price': tier ? `£${(tier.price / 100).toFixed(2)}` : 'N/A',
        'Quantity': ticket.quantity || 0,
        'Total Price': `£${((ticket.totalPrice || 0) / 100).toFixed(2)}`,
        'Order Status': order.status || 'N/A',
        'Order Date': new Date(order.createdAt).toLocaleDateString(),
        'Order Time': new Date(order.createdAt).toLocaleTimeString(),
        'Currency': order.currency || 'gbp',
        'Stripe Payment ID': order.stripePaymentIntentId || 'N/A'
      };
    }) || [];

    return ticketDetails;
  }).flat();

  // Export customer purchase details
  if (customerData.length > 0) {
    const headers = [
      'Customer Name', 'Customer Email', 'Order ID', 'Event Title', 'Event Date', 
      'Event Venue', 'Ticket Tier', 'Ticket Price', 'Quantity', 'Total Price',
      'Order Status', 'Order Date', 'Order Time', 'Currency', 'Stripe Payment ID'
    ];
    
    exportToCSV({ 
      filename: `${filename}-purchases`, 
      data: customerData, 
      headers 
    });
  }

  // Customer summary statistics
  const customerSummary = filteredOrders.reduce((acc, order) => {
    const email = order.customerEmail || 'Unknown';
    if (!acc[email]) {
      acc[email] = {
        'Customer Email': email,
        'Customer Name': order.customerName || 'N/A',
        'Total Orders': 0,
        'Total Spent': 0,
        'Total Tickets': 0,
        'Events Attended': new Set(),
        'First Order': new Date(order.createdAt),
        'Last Order': new Date(order.createdAt),
        'Favorite Event': '',
        'Most Expensive Order': 0
      };
    }
    
    acc[email]['Total Orders']++;
    acc[email]['Total Spent'] += order.totalAmount || 0;
    acc[email]['Total Tickets'] += order.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0;
    
    const event = events.find(e => e.id === order.eventId);
    if (event) {
      acc[email]['Events Attended'].add(event.title);
    }
    
    if (new Date(order.createdAt) < acc[email]['First Order']) {
      acc[email]['First Order'] = new Date(order.createdAt);
    }
    if (new Date(order.createdAt) > acc[email]['Last Order']) {
      acc[email]['Last Order'] = new Date(order.createdAt);
    }
    
    if ((order.totalAmount || 0) > acc[email]['Most Expensive Order']) {
      acc[email]['Most Expensive Order'] = order.totalAmount || 0;
    }
    
    return acc;
  }, {} as Record<string, any>);

  // Convert customer summary to array format
  const customerSummaryData = Object.values(customerSummary).map(customer => ({
    ...customer,
    'Events Attended': Array.from(customer['Events Attended']).join(', '),
    'First Order': customer['First Order'].toLocaleDateString(),
    'Last Order': customer['Last Order'].toLocaleDateString(),
    'Total Spent': `£${(customer['Total Spent'] / 100).toFixed(2)}`,
    'Most Expensive Order': `£${(customer['Most Expensive Order'] / 100).toFixed(2)}`
  }));

  // Export customer summary
  if (customerSummaryData.length > 0) {
    const summaryHeaders = [
      'Customer Email', 'Customer Name', 'Total Orders', 'Total Spent', 'Total Tickets',
      'Events Attended', 'First Order', 'Last Order', 'Favorite Event', 'Most Expensive Order'
    ];
    
    exportToCSV({ 
      filename: `${filename}-summary`, 
      data: customerSummaryData, 
      headers: summaryHeaders 
    });
  }

  // Customer behavior analysis
  const behaviorData = filteredOrders.map(order => {
    const event = events.find(e => e.id === order.eventId);
    const orderDate = new Date(order.createdAt);
    const dayOfWeek = orderDate.toLocaleDateString('en-GB', { weekday: 'long' });
    const hourOfDay = orderDate.getHours();
    const timeOfDay = hourOfDay < 12 ? 'Morning' : hourOfDay < 17 ? 'Afternoon' : 'Evening';
    
    return {
      'Customer Email': order.customerEmail || 'N/A',
      'Customer Name': order.customerName || 'N/A',
      'Order ID': order.id?.slice(0, 8) || 'N/A',
      'Event Title': event?.title || 'Unknown Event',
      'Event Category': event?.tags?.join(', ') || 'N/A',
      'Day of Week': dayOfWeek,
      'Time of Day': timeOfDay,
      'Hour of Day': hourOfDay,
      'Order Amount': `£${((order.totalAmount || 0) / 100).toFixed(2)}`,
      'Ticket Count': order.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0,
      'Order Status': order.status || 'N/A',
      'Order Date': orderDate.toLocaleDateString(),
      'Days Until Event': event?.date ? 'N/A' : 'N/A' // Would need event date parsing
    };
  });

  // Export customer behavior data
  if (behaviorData.length > 0) {
    const behaviorHeaders = [
      'Customer Email', 'Customer Name', 'Order ID', 'Event Title', 'Event Category',
      'Day of Week', 'Time of Day', 'Hour of Day', 'Order Amount', 'Ticket Count',
      'Order Status', 'Order Date', 'Days Until Event'
    ];
    
    exportToCSV({ 
      filename: `${filename}-behavior`, 
      data: behaviorData, 
      headers: behaviorHeaders 
    });
  }

  // High-value customer analysis
  const highValueCustomers = customerSummaryData
    .filter(customer => parseFloat(customer['Total Spent'].replace('£', '')) >= 100)
    .sort((a, b) => parseFloat(b['Total Spent'].replace('£', '')) - parseFloat(a['Total Spent'].replace('£', '')));

  if (highValueCustomers.length > 0) {
    const highValueHeaders = [
      'Customer Email', 'Customer Name', 'Total Spent', 'Total Orders', 'Total Tickets',
      'Events Attended', 'First Order', 'Last Order', 'Customer Value Tier'
    ];
    
    const highValueData = highValueCustomers.map(customer => {
      const totalSpent = parseFloat(customer['Total Spent'].replace('£', ''));
      let valueTier = 'Bronze';
      if (totalSpent >= 500) valueTier = 'Platinum';
      else if (totalSpent >= 300) valueTier = 'Gold';
      else if (totalSpent >= 150) valueTier = 'Silver';
      
      return {
        ...customer,
        'Customer Value Tier': valueTier
      };
    });
    
    exportToCSV({ 
      filename: `${filename}-high-value-customers`, 
      data: highValueData, 
      headers: highValueHeaders 
    });
  }
};

export const exportDashboardStats = (stats: any, timeframe: string) => {
  const filename = `dashboard-stats-${timeframe}-${new Date().toISOString().split('T')[0]}`;
  
  const data = [
    {
      'Metric': 'Total Revenue',
      'Value': `£${(stats.totalRevenue / 100).toFixed(2)}`,
      'Period': timeframe
    },
    {
      'Metric': 'Total Orders',
      'Value': stats.totalOrders,
      'Period': timeframe
    },
    {
      'Metric': 'Total Tickets',
      'Value': stats.totalTickets,
      'Period': timeframe
    },
    {
      'Metric': 'Conversion Rate',
      'Value': `${stats.conversionRate.toFixed(1)}%`,
      'Period': timeframe
    },
    {
      'Metric': 'Average Order Value',
      'Value': `£${(stats.averageOrderValue / 100).toFixed(2)}`,
      'Period': timeframe
    }
  ];

  const headers = ['Metric', 'Value', 'Period'];
  
  exportToCSV({ filename, data, headers });
};

export const exportEventData = (event: Event, orders: Order[], timeframe: string) => {
  const filename = `event-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${timeframe}-${new Date().toISOString().split('T')[0]}`;
  
  const eventOrders = orders.filter(order => order.eventId === event.id);
  
  // Event overview data
  const overviewData = [
    {
      'Event': event.title,
      'Date': event.date,
      'Venue': event.venue,
      'Total Revenue': `£${(eventOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0) / 100).toFixed(2)}`,
      'Total Orders': eventOrders.length,
      'Total Tickets': eventOrders.reduce((sum, order) => 
        sum + (order.tickets?.reduce((tSum, ticket) => tSum + (ticket.quantity || 0), 0) || 0), 0),
      'Period': timeframe
    }
  ];

  // Export event overview
  exportToCSV({ 
    filename: `${filename}-overview`, 
    data: overviewData, 
    headers: ['Event', 'Date', 'Venue', 'Total Revenue', 'Total Orders', 'Total Tickets', 'Period'] 
  });

  // Export detailed orders
  if (eventOrders.length > 0) {
    const ordersData = eventOrders.map(order => ({
      'Order ID': order.id?.slice(0, 8) || 'N/A',
      'Customer Name': order.customerName || 'N/A',
      'Customer Email': order.customerEmail || 'N/A',
      'Amount': `£${((order.totalAmount || 0) / 100).toFixed(2)}`,
      'Status': order.status || 'N/A',
      'Date': new Date(order.createdAt).toLocaleDateString(),
      'Tickets': order.tickets?.reduce((sum, ticket) => sum + (ticket.quantity || 0), 0) || 0
    }));

    exportToCSV({ 
      filename: `${filename}-orders`, 
      data: ordersData, 
      headers: ['Order ID', 'Customer Name', 'Customer Email', 'Amount', 'Status', 'Date', 'Tickets'] 
    });
  }

  // Export tier performance
  if (event.ticketTiers && event.ticketTiers.length > 0) {
    const tierData = event.ticketTiers.map(tier => {
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
        'Tier Name': tier.name,
        'Price': `£${(tier.price / 100).toFixed(2)}`,
        'Capacity': tier.capacity,
        'Sold': tierSold,
        'Available': tier.capacity - tierSold,
        'Utilization': `${((tierSold / tier.capacity) * 100).toFixed(1)}%`,
        'Revenue': `£${(tierRevenue / 100).toFixed(2)}`,
        'Revenue per Ticket': tierSold > 0 ? `£${((tierRevenue / tierSold) / 100).toFixed(2)}` : '£0.00'
      };
    });

    exportToCSV({ 
      filename: `${filename}-tiers`, 
      data: tierData, 
      headers: ['Tier Name', 'Price', 'Capacity', 'Sold', 'Available', 'Utilization', 'Revenue', 'Revenue per Ticket'] 
    });
  }
};

export const exportAllData = (events: Event[], orders: Order[], timeframe: string) => {
  const filename = `complete-dashboard-data-${timeframe}-${new Date().toISOString().split('T')[0]}`;
  
  // Export all events
  const eventsData = events.map(event => ({
    'Event ID': event.id,
    'Title': event.title,
    'Date': event.date,
    'Time': event.time,
    'Venue': event.venue,
    'Price': event.price,
    'Capacity': event.capacity,
    'Rating': event.rating || 'N/A',
    'Tags': event.tags?.join(', ') || 'N/A',
    'Is Archived': event.isArchived ? 'Yes' : 'No',
    'Created': new Date(event.createdAt).toLocaleDateString()
  }));

  exportToCSV({ 
    filename: `${filename}-events`, 
    data: eventsData, 
    headers: ['Event ID', 'Title', 'Date', 'Time', 'Venue', 'Price', 'Capacity', 'Rating', 'Tags', 'Is Archived', 'Created'] 
  });

  // Export all orders
  if (orders.length > 0) {
    const ordersData = orders.map(order => ({
      'Order ID': order.id?.slice(0, 8) || 'N/A',
      'Event ID': order.eventId || 'N/A',
      'Event Title': events.find(e => e.id === order.eventId)?.title || 'Unknown Event',
      'Customer Name': order.customerName || 'N/A',
      'Customer Email': order.customerEmail || 'N/A',
      'Amount': `£${((order.totalAmount || 0) / 100).toFixed(2)}`,
      'Status': order.status || 'N/A',
      'Currency': order.currency || 'gbp',
      'Created': new Date(order.createdAt).toLocaleDateString(),
      'Updated': new Date(order.updatedAt).toLocaleDateString()
    }));

    exportToCSV({ 
      filename: `${filename}-orders`, 
      data: ordersData, 
      headers: ['Order ID', 'Event ID', 'Event Title', 'Customer Name', 'Customer Email', 'Amount', 'Status', 'Currency', 'Created', 'Updated'] 
    });
  }

  // Export summary statistics
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const totalTickets = orders.reduce((sum, order) => 
    sum + (order.tickets?.reduce((tSum, ticket) => tSum + (ticket.quantity || 0), 0) || 0), 0);
  
  const summaryData = [
    {
      'Metric': 'Total Revenue',
      'Value': `£${(totalRevenue / 100).toFixed(2)}`,
      'Period': timeframe
    },
    {
      'Metric': 'Total Orders',
      'Value': totalOrders,
      'Period': timeframe
    },
    {
      'Metric': 'Total Tickets',
      'Value': totalTickets,
      'Period': timeframe
    },
    {
      'Metric': 'Average Order Value',
      'Value': totalOrders > 0 ? `£${((totalRevenue / totalOrders) / 100).toFixed(2)}` : '£0.00',
      'Period': timeframe
    },
    {
      'Metric': 'Events Count',
      'Value': events.length,
      'Period': timeframe
    },
    {
      'Metric': 'Active Events',
      'Value': events.filter(e => !e.isArchived).length,
      'Period': timeframe
    }
  ];

  exportToCSV({ 
    filename: `${filename}-summary`, 
    data: summaryData, 
    headers: ['Metric', 'Value', 'Period'] 
  });
};
