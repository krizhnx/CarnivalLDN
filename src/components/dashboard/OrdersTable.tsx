import { Order, Event, OrderTicket } from '../../types';
import { Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface OrdersTableProps {
  orders: Order[];
  events: Event[];
}

const OrdersTable = ({ orders, events }: OrdersTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;

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

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.customerEmail?.toLowerCase().includes(searchLower) ||
      order.id?.toLowerCase().includes(searchLower) ||
      events?.find(e => e.id === order.eventId)?.title?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
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

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
        <p className="text-gray-500">No orders to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
          
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
          </div>
        </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scan Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentOrders.map((order) => {
              const scanStatus = getScanStatusDisplay(order);
              const IconComponent = scanStatus.icon;
              
              return (
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {events?.find(e => e.id === order.eventId)?.title || 'Unknown Event'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {order.tickets?.reduce((sum: number, ticket: OrderTicket) => sum + (ticket.quantity || 0), 0) || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(order.totalAmount || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                      order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className={`flex items-center gap-1 ${scanStatus.color}`}>
                        <IconComponent className="h-4 w-4" />
                        <span className="text-xs font-medium">{scanStatus.text}</span>
                      </div>
                      {scanStatus.time && (
                        <span className="text-xs text-gray-500">{scanStatus.time}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt as any).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
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
                  (filtered from {orders.length} total)
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
    </div>
  );
};

export default OrdersTable;
