import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { Event, AuthState, EventFormData } from '../types'
import toast from 'react-hot-toast'

interface AppState extends AuthState {
  events: Event[]
  isLoading: boolean
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  // Event actions
  addEvent: (eventData: EventFormData) => Promise<void>
  updateEvent: (id: string, eventData: EventFormData) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  getEvents: () => Promise<void>
  subscribeToEvents: () => any
}

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@carnival.com',
  password: 'admin123'
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      events: [],

      // Auth actions - SIMPLIFIED (hardcoded)
      login: async (email: string, password: string) => {
        set({ isLoading: true })
        
        try {
          // Simple hardcoded check
          if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            // Create a mock user object
            const mockUser = {
              id: '1',
              email: email,
              name: 'Admin User',
              role: 'admin' as const,
              createdAt: new Date(),
            };
            
            set({
              user: mockUser,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({ isLoading: false })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false })
          return false
        }
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        })
      },

      // Event actions - KEEP Supabase for events
      getEvents: async () => {
        set({ isLoading: true })
        
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error

          set({ events: data || [], isLoading: false })
        } catch (error) {
          console.error('Error fetching events:', error)
          toast.error('Failed to load events')
          set({ isLoading: false })
        }
      },

      addEvent: async (eventData: EventFormData) => {
        try {
          // Only include fields that exist in the database
          const newEvent = {
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            venue: eventData.venue,
            price: eventData.price,
            description: eventData.description,
            capacity: eventData.capacity,
            image: eventData.image,
            tags: eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            gradient: eventData.gradient,
            // Remove rating - let the database use the default
            // Remove created_at and updated_at - let the database handle them
          }

          console.log('Adding new event:', newEvent)

          const { error } = await supabase
            .from('events')
            .insert([newEvent])

          if (error) {
            console.error('Supabase insert error:', error)
            throw error
          }

          console.log('Event added successfully')
          toast.success('Event added successfully!')
          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error adding event:', error)
          toast.error('Failed to add event')
        }
      },

      updateEvent: async (id: string, eventData: EventFormData) => {
        try {
          // Only include fields that exist in the database
          const updatedEvent = {
            title: eventData.title,
            date: eventData.date,
            time: eventData.time,
            venue: eventData.venue,
            price: eventData.price,
            description: eventData.description,
            capacity: eventData.capacity,
            image: eventData.image,
            tags: eventData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            gradient: eventData.gradient,
            // Remove updated_at - let the database handle it automatically
          }

          console.log('Updating event with data:', updatedEvent)

          const { error } = await supabase
            .from('events')
            .update(updatedEvent)
            .eq('id', id)

          if (error) {
            console.error('Supabase update error:', error)
            throw error
          }

          console.log('Event updated successfully')
          toast.success('Event updated successfully!')
          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error updating event:', error)
          toast.error('Failed to update event')
        }
      },

      deleteEvent: async (id: string) => {
        try {
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id)

          if (error) throw error

          toast.success('Event deleted successfully!')
          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error deleting event:', error)
          toast.error('Failed to delete event')
        }
      },

      subscribeToEvents: () => {
        // Real-time subscription
        const subscription = supabase
          .channel('events')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'events' }, 
            (payload) => {
              console.log('Database change detected:', payload)
              // Refresh events when database changes
              get().getEvents()
            }
          )
          .subscribe((status) => {
            console.log('Subscription status:', status)
          })

        return subscription
      }
    }),
    {
      name: 'carnival-admin-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
) 