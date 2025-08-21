import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { Event, AuthState, EventFormData, Order, TicketValidationResult, TicketScan } from '../types'
import toast from 'react-hot-toast'

interface AppState extends AuthState {
  events: Event[]
  orders: any[]
  isLoading: boolean
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  // Event actions
  addEvent: (eventData: EventFormData) => Promise<void>
  updateEvent: (id: string, eventData: EventFormData) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  archiveEvent: (id: string, isArchived: boolean) => Promise<void>
  getEvents: () => Promise<void>
  subscribeToEvents: () => any
  // Order actions
  getOrders: () => Promise<void>
  // Ticket scanning actions
  validateTicket: (orderId: string, ticketTierId: string, customerEmail: string) => Promise<TicketValidationResult>
  recordTicketScan: (scanData: Omit<TicketScan, 'id' | 'scannedAt'>) => Promise<void>
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
      orders: [],

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
          // First, fetch all events
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .order('created_at', { ascending: false })

          if (eventsError) throw eventsError

          // Then, fetch ticket tiers for all events (include inactive to keep showing manually sold-out tiers)
          const { data: tiersData, error: tiersError } = await supabase
            .from('ticket_tiers')
            .select('*')

          if (tiersError) {
            console.error('Error fetching ticket tiers:', tiersError)
            // Don't throw, just log the error
          }

          // Combine events with their ticket tiers
          const eventsWithTiers = (eventsData || []).map(event => {
            const eventTiers = (tiersData || []).filter(tier => tier.event_id === event.id)
            return {
              ...event,
              isArchived: event.is_archived ?? false,
              ticketTiers: eventTiers.map(tier => ({
                id: tier.id,
                eventId: tier.event_id,
                name: tier.name,
                price: tier.price,
                originalPrice: tier.original_price,
                capacity: tier.capacity,
                soldCount: tier.sold_count,
                availableFrom: tier.available_from,
                availableUntil: tier.available_until,
                description: tier.description,
                benefits: tier.benefits,
                isActive: tier.is_active,
              }))
            }
          })

          console.log('Events with tiers:', eventsWithTiers)
          set({ events: eventsWithTiers, isLoading: false })
        } catch (error) {
          console.error('Error fetching events:', error)
          toast.error('Failed to load events')
          set({ isLoading: false })
        }
      },

      addEvent: async (eventData: EventFormData & { ticketTiers?: any[] }) => {
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
            is_archived: false,
            // Remove rating - let the database use the default
            // Remove created_at and updated_at - let the database handle them
          }

          console.log('Adding new event:', newEvent)

          // First, insert the event
          const { data: eventResult, error: eventError } = await supabase
            .from('events')
            .insert([newEvent])
            .select()
            .single()

          if (eventError) {
            console.error('Supabase insert error:', eventError)
            throw eventError
          }

          console.log('Event added successfully, now adding ticket tiers')

          // If there are ticket tiers, save them to the ticket_tiers table
          if (eventData.ticketTiers && eventData.ticketTiers.length > 0) {
            const ticketTiersToInsert = eventData.ticketTiers.map(tier => ({
              id: tier.id,
              event_id: eventResult.id, // Use the actual event ID from the database
              name: tier.name,
              price: tier.price,
              original_price: tier.originalPrice || null,
              capacity: tier.capacity,
              sold_count: tier.soldCount || 0,
              available_from: tier.availableFrom ? new Date(tier.availableFrom).toISOString() : null,
              available_until: tier.availableUntil ? new Date(tier.availableUntil).toISOString() : null,
              description: tier.description || null,
              benefits: tier.benefits || [],
              is_active: tier.isActive !== false, // Default to true if not specified
            }))

            console.log('Inserting ticket tiers:', ticketTiersToInsert)

            console.log('About to insert ticket tiers into database:', ticketTiersToInsert)

            const { data: tiersResult, error: tiersError } = await supabase
              .from('ticket_tiers')
              .insert(ticketTiersToInsert)
              .select()

            if (tiersError) {
              console.error('Error inserting ticket tiers:', tiersError)
              console.error('Error details:', tiersError.details, tiersError.hint, tiersError.message)
              // Don't throw here, just log the error
            } else {
              console.log('Ticket tiers added successfully:', tiersResult)
            }
          }

          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error adding event:', error)
          toast.error('Failed to add event')
        }
      },

      updateEvent: async (id: string, eventData: EventFormData & { ticketTiers?: any[] }) => {
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

          // Handle ticket tiers update
          if (eventData.ticketTiers) {
            // First, delete existing ticket tiers for this event
            const { error: deleteError } = await supabase
              .from('ticket_tiers')
              .delete()
              .eq('event_id', id)

            if (deleteError) {
              console.error('Error deleting existing ticket tiers:', deleteError)
            }

            // Then, insert the new ticket tiers
            if (eventData.ticketTiers.length > 0) {
              const ticketTiersToInsert = eventData.ticketTiers.map(tier => ({
                id: tier.id,
                event_id: id,
                name: tier.name,
                price: tier.price,
                original_price: tier.originalPrice,
                capacity: tier.capacity,
                sold_count: tier.soldCount,
                available_from: tier.availableFrom,
                available_until: tier.availableUntil,
                description: tier.description,
                benefits: tier.benefits,
                is_active: tier.isActive,
              }))

              console.log('Updating ticket tiers:', ticketTiersToInsert)

              const { error: tiersError } = await supabase
                .from('ticket_tiers')
                .insert(ticketTiersToInsert)

              if (tiersError) {
                console.error('Error updating ticket tiers:', tiersError)
              } else {
                console.log('Ticket tiers updated successfully')
              }
            }
          }

          console.log('Event updated successfully')
          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error updating event:', error)
          toast.error('Failed to update event')
        }
      },

      deleteEvent: async (id: string) => {
        try {
          // Check archive status first
          const { data: eventRow, error: eventFetchError } = await supabase
            .from('events')
            .select('is_archived')
            .eq('id', id)
            .single()

          if (eventFetchError) {
            console.error('Error fetching event before delete:', eventFetchError)
          }

          const isArchived = (eventRow as any)?.is_archived === true

          // Prevent deleting events that have orders
          if (!isArchived) {
            const { data: eventOrders, error: eventOrdersError } = await supabase
              .from('orders')
              .select('id')
              .eq('event_id', id)

            if (eventOrdersError) {
              console.error('Error checking event orders before delete:', eventOrdersError)
            }

            if ((eventOrders || []).length > 0) {
              const error: any = new Error('Event has associated orders and cannot be deleted without handling dependencies')
              error.code = 'EVENT_HAS_ORDERS'
              throw error
            }
          }

          // If archived, hard-delete dependent data first to avoid FK conflicts
          if (isArchived) {
            // Collect order ids for this event
            const { data: ordersToDelete, error: ordersToDeleteError } = await supabase
              .from('orders')
              .select('id')
              .eq('event_id', id)

            if (ordersToDeleteError) {
              console.error('Error fetching orders to delete:', ordersToDeleteError)
            }

            const orderIds = (ordersToDelete || []).map(o => o.id)

            if (orderIds.length > 0) {
              // Delete order_tickets referencing those orders
              const { error: otDeleteError } = await supabase
                .from('order_tickets')
                .delete()
                .in('order_id', orderIds)

              if (otDeleteError) {
                console.error('Error deleting order_tickets for event:', otDeleteError)
              }

              // Delete orders for the event
              const { error: ordersDeleteError } = await supabase
                .from('orders')
                .delete()
                .eq('event_id', id)

              if (ordersDeleteError) {
                console.error('Error deleting orders for event:', ordersDeleteError)
              }
            }
          }

          // Then, delete all ticket tiers for this event
          const { error: tiersError } = await supabase
            .from('ticket_tiers')
            .delete()
            .eq('event_id', id)

          if (tiersError) {
            console.error('Error deleting ticket tiers:', tiersError)
            // Don't throw, just log the error
          }

          // Then delete the event
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id)

          if (error) throw error

          // Refresh events
          await get().getEvents()
        } catch (error) {
          console.error('Error deleting event:', error)
          // @ts-ignore - error shape at runtime
          if ((error as any)?.code === 'EVENT_HAS_ORDERS') {
            toast.error('Cannot delete: this event has existing orders. Consider archiving it or enabling cascade deletes in Supabase.')
          } else {
            toast.error('Failed to delete event')
          }
        }
      },

      archiveEvent: async (id: string, isArchived: boolean) => {
        try {
          const { error } = await supabase
            .from('events')
            .update({ is_archived: isArchived })
            .eq('id', id)

          if (error) throw error

          await get().getEvents()
        } catch (error) {
          console.error('Error archiving event:', error)
          toast.error('Failed to update archive status. Ensure `is_archived boolean default false` exists on events table.')
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
      },

      getOrders: async () => {
        try {
          console.log('🔄 Fetching orders with tickets...')

          // Fetch orders
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

          if (ordersError) throw ordersError

          // For each order, fetch its tickets and map to frontend shape
          const mappedOrders: Order[] = await Promise.all(
            (ordersData || []).map(async (orderRow: any) => {
              const { data: ticketsData, error: ticketsError } = await supabase
                .from('order_tickets')
                .select('*')
                .eq('order_id', orderRow.id)

              if (ticketsError) {
                console.error('Error fetching tickets for order:', orderRow.id, ticketsError)
              }

              const tickets = (ticketsData || []).map((t: any) => ({
                id: t.id,
                orderId: t.order_id,
                ticketTierId: t.ticket_tier_id,
                quantity: t.quantity,
                unitPrice: t.unit_price,
                totalPrice: t.total_price,
              }))

              const mapped: Order = {
                id: orderRow.id,
                eventId: orderRow.event_id,
                userId: orderRow.user_id,
                stripePaymentIntentId: orderRow.stripe_payment_intent_id,
                status: orderRow.status,
                totalAmount: orderRow.total_amount,
                currency: orderRow.currency,
                tickets,
                customerEmail: orderRow.customer_email,
                customerName: orderRow.customer_name,
                createdAt: orderRow.created_at,
                updatedAt: orderRow.updated_at,
              }

              return mapped
            })
          )

          console.log('📦 Orders with tickets (mapped):', mappedOrders)
          set({ orders: mappedOrders })
        } catch (error) {
          console.error('Error fetching orders:', error)
          set({ orders: [] })
        }
      },

      // Ticket scanning actions
      validateTicket: async (orderId: string, ticketTierId: string, customerEmail: string): Promise<TicketValidationResult> => {
        try {
          // First, check if this ticket has already been scanned for entry
          const { data: existingScans, error: scanError } = await supabase
            .from('ticket_scans')
            .select('*')
            .eq('order_id', orderId)
            .eq('ticket_tier_id', ticketTierId)
            .eq('scan_type', 'entry')

          if (scanError) {
            console.error('Error checking existing scans:', scanError)
            return {
              isValid: false,
              message: 'Failed to check ticket status',
              orderStatus: 'unknown',
              eventDate: 'unknown',
              customerName: 'unknown',
              customerEmail: customerEmail
            }
          }

          // If already scanned for entry, check if it's a valid exit scan
          if (existingScans && existingScans.length > 0) {
            const lastScan = existingScans[0]
            return {
              isValid: true,
              message: 'Ticket already scanned for entry, valid for exit',
              orderStatus: 'completed',
              eventDate: lastScan.event_date || 'unknown',
              customerName: lastScan.customer_name || 'unknown',
              customerEmail: customerEmail,
              eventId: lastScan.event_id
            }
          }

          // Check if the order and ticket are valid
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
              *,
              events!inner(*)
            `)
            .eq('id', orderId)
            .eq('customer_email', customerEmail)
            .single()

          if (orderError || !orderData) {
            return {
              isValid: false,
              message: 'Order not found or invalid customer email',
              orderStatus: 'unknown',
              eventDate: 'unknown',
              customerName: 'unknown',
              customerEmail: customerEmail
            }
          }

          // Check if payment is completed
          if (orderData.status !== 'completed') {
            return {
              isValid: false,
              message: 'Payment not completed',
              orderStatus: orderData.status,
              eventDate: orderData.events?.date || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            }
          }

          // Check if event date hasn't passed
          const eventDate = orderData.events?.date
          if (eventDate && new Date(eventDate) < new Date()) {
            return {
              isValid: false,
              message: 'Event has passed',
              orderStatus: orderData.status,
              eventDate: eventDate,
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            }
          }

          // Check if ticket tier exists and is active
          const { data: tierData, error: tierError } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('id', ticketTierId)
            .eq('event_id', orderData.event_id)
            .single()

          if (tierError || !tierData) {
            return {
              isValid: false,
              message: 'Ticket tier not found',
              orderStatus: orderData.status,
              eventDate: eventDate || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            }
          }

          if (!tierData.is_active) {
            return {
              isValid: false,
              message: 'Ticket tier is inactive',
              orderStatus: orderData.status,
              eventDate: eventDate || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            }
          }

          // All validations passed
          return {
            isValid: true,
            message: 'Ticket is valid for entry',
            orderStatus: orderData.status,
            eventDate: eventDate || 'unknown',
            customerName: orderData.customer_name || 'unknown',
            customerEmail: customerEmail,
            eventId: orderData.event_id,
            eventTitle: orderData.events?.title,
            ticketTierName: tierData.name
          }

        } catch (error) {
          console.error('Error validating ticket:', error)
          return {
            isValid: false,
            message: 'Failed to validate ticket',
            orderStatus: 'unknown',
            eventDate: 'unknown',
            customerName: 'unknown',
            customerEmail: customerEmail
          }
        }
      },

      recordTicketScan: async (scanData: Omit<TicketScan, 'id' | 'scannedAt'>) => {
        try {
          const { error } = await supabase
            .from('ticket_scans')
            .insert({
              order_id: scanData.orderId,
              ticket_tier_id: scanData.ticketTierId,
              customer_email: scanData.customerEmail,
              event_id: scanData.eventId,
              scan_type: scanData.scanType,
              scanned_by: scanData.scannedBy,
              location: scanData.location,
              notes: scanData.notes,
              scanned_at: new Date().toISOString()
            })

          if (error) {
            console.error('Error recording ticket scan:', error)
            throw error
          }
        } catch (error) {
          console.error('Error recording ticket scan:', error)
          throw error
        }
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
