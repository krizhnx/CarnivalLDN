import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, Phone, FileText, Calendar, Send, Trash2, X, Folder, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { Event, Guestlist } from '../types';

interface GuestlistManagementProps {
  event: Event;
  onClose: () => void;
  onCreateNew?: () => void;
}

const GuestlistManagement: React.FC<GuestlistManagementProps> = ({ event, onClose, onCreateNew }) => {
  const [guestlists, setGuestlists] = useState<Guestlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingCategory, setEditingCategory] = useState<string | null>(null);


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

  // Group guestlists by category
  const guestlistsByCategory = useMemo(() => {
    const categories: Record<string, Guestlist[]> = {
      free: [],
      GL: [],
      tables: [],
      other: []
    };

    guestlists.forEach(guestlist => {
      const category = guestlist.category || 'other';
      if (categories[category]) {
        categories[category].push(guestlist);
      } else {
        categories.other.push(guestlist);
      }
    });

    return categories;
  }, [guestlists]);

  const toggleFolder = (category: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const updateGuestlistCategory = async (guestlistId: string, newCategory: 'free' | 'GL' | 'tables' | 'other') => {
    try {
      const response = await fetch(`/api/guestlists/${guestlistId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category: newCategory }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      // Update local state
      setGuestlists(prev => prev.map(g => 
        g.id === guestlistId ? { ...g, category: newCategory } : g
      ));
      setEditingCategory(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const getCategoryLabel = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      free: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
      GL: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
      tables: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
      other: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' }
    };
    return colors[category] || colors.other;
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

          {/* Folder-based Guestlist View */}
          {guestlists.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No guestlists yet</h3>
              <p className="text-gray-500">Create your first guestlist to get started.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {(['free', 'GL', 'tables', 'other'] as const).map((category) => {
                const categoryGuestlists = guestlistsByCategory[category];
                const isExpanded = expandedFolders.has(category);
                const colors = getCategoryColor(category);
                const totalTickets = categoryGuestlists.reduce((sum, gl) => sum + gl.totalTickets, 0);

                if (categoryGuestlists.length === 0) return null;

                return (
                  <div key={category} className={`${colors.border} border-2 rounded-lg overflow-hidden`}>
                    {/* Folder Header */}
                    <button
                      onClick={() => toggleFolder(category)}
                      className={`w-full ${colors.bg} px-6 py-5 flex items-center justify-between hover:opacity-90 transition-opacity`}
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className={`h-5 w-5 ${colors.text}`} />
                        ) : (
                          <ChevronRight className={`h-5 w-5 ${colors.text}`} />
                        )}
                        <Folder className={`h-5 w-5 ${colors.text}`} />
                        <span className={`font-semibold text-lg ${colors.text}`}>
                          {getCategoryLabel(category)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colors.text} bg-white/60`}>
                            {categoryGuestlists.length} {categoryGuestlists.length === 1 ? 'guestlist' : 'guestlists'}
                          </span>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${colors.text} bg-white/60`}>
                            {totalTickets} {totalTickets === 1 ? 'ticket' : 'tickets'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Folder Content */}
                    {isExpanded && (
                      <div className="bg-white">
                        {/* Table Headings */}
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            <div className="lg:col-span-4 text-center">
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Group Leader</span>
                            </div>
                            <div className="lg:col-span-3 text-center">
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Contact</span>
                            </div>
                            <div className="lg:col-span-3 text-center">
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Tickets & Status</span>
                            </div>
                            <div className="lg:col-span-2 text-center">
                              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Guestlist Items */}
                        <div className="divide-y divide-gray-200">
                          {categoryGuestlists.map((guestlist) => (
                            <div key={guestlist.id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                {/* Group Leader & Notes */}
                                <div className="lg:col-span-4 flex flex-col items-center justify-center text-center">
                                  <div className="text-base font-semibold text-gray-900 mb-1">
                                    {guestlist.leadName}
                                  </div>
                                  {guestlist.notes && (
                                    <div className="text-sm text-gray-600 mt-2 line-clamp-2">
                                      {guestlist.notes}
                                    </div>
                                  )}
                                </div>

                                {/* Contact Information */}
                                <div className="lg:col-span-3 flex flex-col items-center justify-center">
                                  <div className="space-y-2 text-center">
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-900">
                                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      <span className="break-words">{guestlist.leadEmail}</span>
                                    </div>
                                    {guestlist.leadPhone && (
                                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        <span>{guestlist.leadPhone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Tickets & Status */}
                                <div className="lg:col-span-3 flex flex-col items-center justify-center text-center">
                                  <div className="space-y-2">
                                    <div className="text-sm">
                                      <span className="font-semibold text-gray-900">{guestlist.totalTickets}</span>
                                      <span className="text-gray-600 ml-1">tickets</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {guestlist.remainingScans} remaining
                                    </div>
                                    <div className="mt-2 flex justify-center">
                                      <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${
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
                                    </div>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:col-span-2 flex items-center justify-center gap-3">
                                  {editingCategory === guestlist.id ? (
                                    <select
                                      value={guestlist.category || 'other'}
                                      onChange={(e) => updateGuestlistCategory(guestlist.id, e.target.value as any)}
                                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      autoFocus
                                      onBlur={() => setEditingCategory(null)}
                                    >
                                      <option value="free">Free</option>
                                      <option value="GL">GL</option>
                                      <option value="tables">Tables</option>
                                      <option value="other">Other</option>
                                    </select>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setEditingCategory(guestlist.id)}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Change Category"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => resendQRCode(guestlist.id)}
                                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Resend QR Code"
                                      >
                                        <Send className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteGuestlist(guestlist.id)}
                                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Guestlist"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GuestlistManagement;
