import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, CreditCard, Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Order, Event } from '../../types';

interface OrderDetailsModalProps {
  order: Order | null;
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const OrderDetailsModal = ({ order, event, isOpen, onClose }: OrderDetailsModalProps) => {
  if (!order || !event) return null;

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const formatTime = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Get scan status display
  const getScanStatusDisplay = () => {
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

  const scanStatus = getScanStatusDisplay();
  const IconComponent = scanStatus.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <p className="text-blue-100">Order ID: {order.id?.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-white hover:bg-opacity-30 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Order & Customer Info */}
                <div className="space-y-6">
                  {/* Order Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800 border-green-200' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          order.status === 'failed' ? 'bg-red-100 text-red-800 border-red-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {order.status || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(order.totalAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Currency:</span>
                        <span className="text-gray-900">{order.currency?.toUpperCase() || 'GBP'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Date:</span>
                        <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Time:</span>
                        <span className="text-gray-900">{formatTime(order.createdAt)}</span>
                      </div>
                      {order.stripePaymentIntentId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment ID:</span>
                          <span className="text-gray-900 font-mono text-sm">{order.stripePaymentIntentId.slice(0, 20)}...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-green-600" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold text-gray-900">{order.customerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-900">{order.customerEmail || 'N/A'}</span>
                      </div>
                      {order.customerPhone && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="text-gray-900">{order.customerPhone}</span>
                        </div>
                      )}
                                             {order.customerDateOfBirth && (
                         <>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Date of Birth:</span>
                             <span className="text-gray-900">{formatDate(order.customerDateOfBirth)}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-600">Age:</span>
                             <span className="text-gray-900">{calculateAge(order.customerDateOfBirth)} years old</span>
                           </div>
                         </>
                       )}
                      {order.customerGender && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Gender:</span>
                          <span className="text-gray-900">
                            {order.customerGender === 'prefer_not_to_say' ? 'Prefer not to say' : 
                             order.customerGender.charAt(0).toUpperCase() + order.customerGender.slice(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Event & Ticket Info */}
                <div className="space-y-6">
                  {/* Event Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      Event Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Event:</span>
                        <span className="font-semibold text-gray-900">{event.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="text-gray-900">{event.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time:</span>
                        <span className="text-gray-900">{event.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Venue:</span>
                        <span className="text-gray-900">{event.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Capacity:</span>
                        <span className="text-gray-900">{event.capacity} people</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-orange-600" />
                      Ticket Details
                    </h3>
                    {order.tickets && order.tickets.length > 0 ? (
                      <div className="space-y-3">
                        {order.tickets.map((ticket, index) => {
                          const tier = event.ticketTiers?.find(t => t.id === ticket.ticketTierId);
                          return (
                            <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-gray-900">{tier?.name || 'Unknown Tier'}</span>
                                <span className="text-sm text-gray-500">#{index + 1}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Quantity:</span>
                                  <span className="text-gray-900">{ticket.quantity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Unit Price:</span>
                                  <span className="text-gray-900">{tier ? formatCurrency(tier.price) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Total Price:</span>
                                  <span className="font-semibold text-gray-900">{formatCurrency(ticket.totalPrice || 0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No ticket information available</p>
                    )}
                  </div>

                  {/* Scan Status */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                      Scan Status
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                          scanStatus.color === 'text-green-600' ? 'bg-green-100 text-green-800 border-green-200' :
                          scanStatus.color === 'text-blue-600' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          scanStatus.color === 'text-orange-600' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                          'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {scanStatus.text}
                        </span>
                      </div>
                      {order.scans && order.scans.length > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Scans:</span>
                            <span className="text-gray-900">{order.scans.length}</span>
                          </div>
                                                     <div className="flex justify-between">
                             <span className="text-gray-600">Last Scan:</span>
                             <span className="text-gray-900">
                               {formatDate(order.scans[0].scannedAt)} at {formatTime(order.scans[0].scannedAt)}
                             </span>
                           </div>
                          {order.scans[0].scannedBy && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Scanned By:</span>
                              <span className="text-gray-900">{order.scans[0].scannedBy}</span>
                            </div>
                          )}
                          {order.scans[0].location && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="text-gray-900">{order.scans[0].location}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderDetailsModal;
