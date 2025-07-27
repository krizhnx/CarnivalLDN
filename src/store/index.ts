import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Event, AuthState, EventFormData } from '../types';

interface AppState extends AuthState {
  events: Event[];
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Event actions
  addEvent: (eventData: EventFormData) => void;
  updateEvent: (id: string, eventData: EventFormData) => void;
  deleteEvent: (id: string) => void;
  getEvents: () => Event[];
}

// Mock admin credentials (in real app, this would be handled by backend)
const ADMIN_CREDENTIALS = {
  email: 'admin@carnival.com',
  password: 'admin123',
  user: {
    id: '1',
    email: 'admin@carnival.com',
    name: 'Admin User',
    role: 'admin' as const,
    createdAt: new Date(),
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      events: [
        {
          id: '1',
          title: 'Corporate Gala Evening',
          date: 'Dec 15, 2024',
          time: '7:00 PM',
          venue: 'The Shard, London',
          price: '£85',
          image: 'https://picsum.photos/800/600?random=1',
          description: 'An elegant corporate networking event with fine dining and professional entertainment.',
          capacity: '200',
          rating: '4.9',
          tags: ['Corporate', 'Networking', 'Formal'],
          gradient: 'from-gray-600 to-gray-800',
          bookingUrl: 'https://example.com/book/corporate-gala',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          title: 'Cultural Heritage Festival',
          date: 'Nov 12, 2024',
          time: '6:00 PM',
          venue: 'Royal Festival Hall',
          price: '£45',
          image: 'https://picsum.photos/800/600?random=2',
          description: 'Celebrate diverse cultural heritage with traditional performances and exhibitions.',
          capacity: '1500',
          rating: '5.0',
          tags: ['Cultural', 'Festival', 'Heritage'],
          gradient: 'from-gray-700 to-gray-900',
          bookingUrl: 'https://example.com/book/cultural-festival',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          title: 'New Year Business Reception',
          date: 'Dec 31, 2024',
          time: '8:00 PM',
          venue: 'One Canada Square',
          price: '£125',
          image: 'https://picsum.photos/800/600?random=3',
          description: 'Professional New Year celebration with networking and premium hospitality.',
          capacity: '300',
          rating: '4.8',
          tags: ['New Year', 'Corporate', 'Premium'],
          gradient: 'from-gray-800 to-black',
          bookingUrl: 'https://example.com/book/new-year-reception',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],

      // Auth actions
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
          set({
            user: ADMIN_CREDENTIALS.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({ isLoading: false });
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      // Event actions
                  addEvent: (eventData: EventFormData) => {
        const newEvent: Event = {
          id: Date.now().toString(),
          ...eventData,
          tags: eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          rating: '4.5',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set(state => ({
          events: [...state.events, newEvent],
        }));
      },

      updateEvent: (id: string, eventData: EventFormData) => {
        set(state => ({
          events: state.events.map(event =>
            event.id === id
              ? {
                  ...event,
                  ...eventData,
                  tags: eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                  updatedAt: new Date()
                }
              : event
          ),
        }));
      },

      deleteEvent: (id: string) => {
        set(state => ({
          events: state.events.filter(event => event.id !== id),
        }));
      },

      getEvents: () => {
        return get().events;
      },
    }),
    {
      name: 'carnival-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        events: state.events,
      }),
    }
  )
);
