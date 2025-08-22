import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, FileText, Calendar, Send, Trash2, X } from 'lucide-react';
import { Event, Guestlist } from '../types';

interface GuestlistManagementProps {
  event: Event;
  onClose: () => void;
  onCreateNew?: () => void;
}

const GuestlistManagement: React.FC<GuestlistManagementProps> = ({ event, onClose, onCreateNew }) => {
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    fetchGuestlists();
  }, [event.id]);

  const fetchGuestlists = async () => {
    try {
      console.log('🔍 Fetching guestlists for event:', event.id);
      const response = await fetch(`/api/guestlists?eventId=${event.id}`);
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch guestlists');
      }
      
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      setGuestlists(data.guestlists || []);
    } catch (err) {
      console.error('❌ Error fetching guestlists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resendQRCode = async (guestlistId: string) => {
    try {
      const response = await fetch('/api/resend-guestlist-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestlistId }),
      });

      if (!response.ok) {
        throw new Error('Failed to resend QR code');
      }

      // Show success message
      alert('QR code resent successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to resend QR code');
    }
  };

  const deleteGuestlist = async (guestlistId: string) => {
    if (!confirm('Are you sure you want to delete this guestlist? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/guestlists/${guestlistId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete guestlist');
      }

      // Remove from local state
      setGuestlists(prev => prev.filter(g => g.id !== guestlistId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete guestlist');
    }
  };

  const getTotalGuestlistTickets = () => {
    return guestlists.reduce((total, guestlist) => total + guestlist.totalTickets, 0);
  };

  const getTotalScansUsed = () => {
    return guestlists.reduce((total, guestlist) => {
      return total + (guestlist.totalTickets - guestlist.remainingScans);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading guestlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Guestlist Management</h2>
              <p className="text-gray-600">{event.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Create New Guestlist
                </button>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total Guestlists</p>
                  <p className="text-2xl font-bold text-blue-900">{guestlists.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Tickets</p>
                  <p className="text-2xl font-bold text-green-900">{getTotalGuestlistTickets()}</p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-orange-600 font-medium">Tickets Used</p>
                  <p className="text-2xl font-bold text-orange-900">{getTotalScansUsed()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Guestlists Table */}
          {guestlists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No guestlists yet</h3>
              <p className="text-gray-500">Create your first guestlist to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Group Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guestlists.map((guestlist) => (
                    <tr key={guestlist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {guestlist.leadName}
                          </div>
                          {guestlist.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {guestlist.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {guestlist.leadEmail}
                          </div>
                          {guestlist.leadPhone && (
                            <div className="flex items-center gap-1 text-gray-500">
                              <Phone className="h-4 w-4 text-gray-400" />
                              {guestlist.leadPhone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">{guestlist.totalTickets}</div>
                          <div className="text-gray-500">
                            {guestlist.remainingScans} remaining
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          guestlist.remainingScans === 0
                            ? 'bg-red-100 text-red-800'
                            : guestlist.remainingScans < guestlist.totalTickets
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {guestlist.remainingScans === 0
                            ? 'All Used'
                            : guestlist.remainingScans < guestlist.totalTickets
                            ? 'Partially Used'
                            : 'Unused'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(guestlist.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => resendQRCode(guestlist.id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            title="Resend QR Code"
                          >
                            <Send className="h-4 w-4" />
                            Resend
                          </button>
                          <button
                            onClick={() => deleteGuestlist(guestlist.id)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Delete Guestlist"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GuestlistManagement;
