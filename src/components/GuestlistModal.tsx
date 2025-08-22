import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, FileText, Send } from 'lucide-react';
import { Event, GuestlistFormData } from '../types';

interface GuestlistModalProps {
  event: Event;
  onClose: () => void;
  onSuccess: (guestlist: any) => void;
  onManageGuestlists?: () => void;
}

const GuestlistModal: React.FC<GuestlistModalProps> = ({ event, onClose, onSuccess, onManageGuestlists }) => {
  const [formData, setFormData] = useState<GuestlistFormData>({
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    totalTickets: 1,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leadName || !formData.leadEmail || formData.totalTickets < 1) {
      setError('Please fill in all required fields and ensure at least 1 ticket.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/create-guestlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          ...formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create guestlist');
      }

      const result = await response.json();
      onSuccess(result.guestlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof GuestlistFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Guestlist</h2>
              <p className="text-gray-600">{event.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {onManageGuestlists && (
                <button
                  onClick={onManageGuestlists}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Manage Guestlists
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Lead Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Leader Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Name *
                </label>
                <input
                  type="text"
                  value={formData.leadName}
                  onChange={(e) => handleInputChange('leadName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., John Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Email *
                </label>
                <input
                  type="email"
                  value={formData.leadEmail}
                  onChange={(e) => handleInputChange('leadEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lead Phone (Optional)
              </label>
              <input
                type="tel"
                value={formData.leadPhone}
                onChange={(e) => handleInputChange('leadPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+44 123 456 7890"
              />
            </div>
          </div>

          {/* Ticket Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Details
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Tickets *
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('totalTickets', Math.max(1, formData.totalTickets - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                  disabled={formData.totalTickets <= 1}
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">
                  {formData.totalTickets}
                </span>
                <button
                  type="button"
                  onClick={() => handleInputChange('totalTickets', formData.totalTickets + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This will create one QR code that can be scanned {formData.totalTickets} times for entry.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Notes
            </h3>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., VIP table, special dietary requirements, arrival time..."
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Event:</span>
                <span className="font-medium">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Group Leader:</span>
                <span className="font-medium">{formData.leadName || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact:</span>
                <span className="font-medium">{formData.leadEmail || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tickets:</span>
                <span className="font-medium">{formData.totalTickets}</span>
              </div>
              {formData.notes && (
                <div className="flex justify-between">
                  <span>Notes:</span>
                  <span className="font-medium text-gray-600">{formData.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Guestlist...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Create Guestlist & Send QR Code</span>
              </>
            )}
          </button>

          <div className="text-center text-sm text-gray-500">
            <p>This will create a guestlist and automatically send a QR code to the group leader.</p>
            <p>The QR code can be scanned {formData.totalTickets} times for entry.</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default GuestlistModal;
