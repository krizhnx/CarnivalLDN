import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, Users, Tag, Ticket } from 'lucide-react';
import { useAppStore } from '../store/supabaseStore';
import { Event, EventFormData, TicketTier } from '../types';
import TicketTierForm from './TicketTierForm';

interface EventFormProps {
  event?: Event | null;
  onClose: () => void;
}

const EventForm = ({ event, onClose }: EventFormProps) => {
  const { addEvent, updateEvent } = useAppStore();
  const [showTicketTierForm, setShowTicketTierForm] = useState(false);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>(event?.ticketTiers || []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventFormData>();

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        description: event.description,
        capacity: event.capacity,
        tags: event.tags.join(', '),
        gradient: event.gradient,
        image: event.image,
        bookingUrl: event.bookingUrl,
      });
    }
  }, [event, reset]);

  const onSubmit = (data: EventFormData) => {
    console.log('Form submitted with ticket tiers:', ticketTiers);
    
    // Ensure ticket tiers have the correct eventId
    const updatedTicketTiers = ticketTiers.map(tier => ({
      ...tier,
      eventId: event?.id || 'new_event',
    }));
    
    // Derive display price from the lowest active ticket tier
    const activeTiers = updatedTicketTiers.filter(t => t.isActive !== false && typeof t.price === 'number');
    const minPrice = activeTiers.length > 0 ? Math.min(...activeTiers.map(t => t.price)) : 0;
    const derivedPriceLabel = minPrice > 0 ? `From £${(minPrice / 100).toFixed(0)}` : 'Free';

    const eventData = {
      ...data,
      price: derivedPriceLabel,
      ticketTiers: updatedTicketTiers,
    };
    
    console.log('Final event data to save:', eventData);
    
    if (event) {
      updateEvent(event.id, eventData);
    } else {
      addEvent(eventData);
    }
    onClose();
  };

  const handleTicketTiersSave = (tiers: TicketTier[]) => {
    console.log('Ticket tiers saved in EventForm:', tiers);
    setTicketTiers(tiers);
    setShowTicketTierForm(false);
  };

  const gradientOptions = [
    { value: 'from-gray-600 to-gray-800', label: 'Gray' },
    { value: 'from-gray-700 to-gray-900', label: 'Dark Gray' },
    { value: 'from-gray-800 to-black', label: 'Black' },
    { value: 'from-gray-500 to-gray-700', label: 'Light Gray' },
    { value: 'from-blue-600 to-blue-800', label: 'Blue' },
    { value: 'from-green-600 to-green-800', label: 'Green' },
    { value: 'from-purple-600 to-purple-800', label: 'Purple' },
    { value: 'from-red-600 to-red-800', label: 'Red' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <motion.div
        key={event?.id || 'new-event'}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {event ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter event title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date
              </label>
              <input
                {...register('date', { required: 'Date is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Dec 15, 2024"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Time
              </label>
              <input
                {...register('time', { required: 'Time is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., 7:00 PM"
              />
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
              )}
            </div>

            {/* Venue */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline h-4 w-4 mr-1" />
                Venue
              </label>
              <input
                {...register('venue', { required: 'Venue is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter venue name"
              />
              {errors.venue && (
                <p className="mt-1 text-sm text-red-600">{errors.venue.message}</p>
              )}
            </div>

            {/* Price is derived from ticket tiers; remove manual field */}

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Capacity
              </label>
              <input
                {...register('capacity', { required: 'Capacity is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., 200"
              />
              {errors.capacity && (
                <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Tags (comma-separated)
              </label>
              <input
                {...register('tags', { required: 'Tags are required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="e.g., Corporate, Networking, Formal"
              />
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags.message}</p>
              )}
            </div>

            {/* Gradient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Theme
              </label>
              <select
                {...register('gradient', { required: 'Gradient is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                {gradientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.gradient && (
                <p className="mt-1 text-sm text-red-600">{errors.gradient.message}</p>
              )}
            </div>

            {/* Image URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Image URL
              </label>
              <input
                {...register('image', {
                  required: 'Image URL is required',
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message: 'Please enter a valid URL starting with http:// or https://'
                  }
                })}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://images.unsplash.com/photo-..."
              />
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Tip: You can use Picsum URLs like https://picsum.photos/800/600?random=1 or Unsplash URLs
              </p>
            </div>

            {/* Ticket Tiers Management */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ticket Tiers
                </label>
                <button
                  type="button"
                  onClick={() => setShowTicketTierForm(true)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Ticket className="h-4 w-4" />
                  Manage Tiers
                </button>
              </div>
              {ticketTiers.length > 0 ? (
                <div className="space-y-2">
                  {ticketTiers.sort((a, b) => a.price - b.price).map((tier) => (
                    <div key={tier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{tier.name}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          £{(tier.price / 100).toFixed(2)} - {tier.capacity} available
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {tier.capacity - tier.soldCount} left
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No ticket tiers configured. Click "Manage Tiers" to add pricing options.</p>
              )}
            </div>

            {/* Booking URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booking URL (Optional - will be replaced by Stripe checkout)
              </label>
              <input
                {...register('bookingUrl')}
                type="url"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="https://example.com/book/event (optional)"
              />
              {errors.bookingUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.bookingUrl.message}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Enter event description"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md transition-colors"
            >
              {event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Ticket Tier Management Modal */}
      {showTicketTierForm && (
        <TicketTierForm
          ticketTiers={ticketTiers}
          eventId={event?.id || 'new_event'}
          onSave={handleTicketTiersSave}
          onClose={() => setShowTicketTierForm(false)}
        />
      )}
    </div>
  );
};

export default EventForm;
