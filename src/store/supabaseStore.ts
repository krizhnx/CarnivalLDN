import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { Event, AuthState, EventFormData, Order, TicketValidationResult, TicketScan, TicketSearchResult, GuestlistScan } from '../types'
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
      validateTicket: (orderId: string, ticketTierId: string, customerEmail: string, scanType?: 'entry' | 'exit') => Promise<TicketValidationResult>
      validateGuestlist: (guestlistId: string, scanType?: 'entry' | 'exit') => Promise<TicketValidationResult>
      recordTicketScan: (scanData: Omit<TicketScan, 'id' | 'scannedAt'>) => Promise<void>
      recordGuestlistScan: (scanData: Omit<GuestlistScan, 'id' | 'scannedAt'>) => Promise<void>
      debugTicketData: (orderId: string, ticketTierId: string) => Promise<string>
      // Ticket search actions
      searchTickets: (searchTerm: string) => Promise<TicketSearchResult[]>
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
              })).sort((a, b) => a.price - b.price) // Sort by price in ascending order
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
          console.log('🔄 Fetching orders with tickets and scans...')

          // Fetch orders
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

          if (ordersError) throw ordersError

          // For each order, fetch its tickets and scans and map to frontend shape
          const mappedOrders: Order[] = await Promise.all(
            (ordersData || []).map(async (orderRow: any) => {
              // Fetch tickets for this order
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

              // Fetch scans for this order
              const { data: scansData, error: scansError } = await supabase
                .from('ticket_scans')
                .select('*')
                .eq('order_id', orderRow.id)
                .order('scanned_at', { ascending: false })

              if (scansError) {
                console.error('Error fetching scans for order:', orderRow.id, scansError)
              }

              const scans = (scansData || []).map((s: any) => ({
                id: s.id,
                orderId: s.order_id,
                ticketTierId: s.ticket_tier_id,
                customerEmail: s.customer_email,
                eventId: s.event_id,
                scanType: s.scan_type,
                scannedAt: s.scanned_at,
                scannedBy: s.scanned_by,
                location: s.location,
                notes: s.notes,
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
                scans,
              }

              return mapped
            })
          )

          console.log('📦 Orders with tickets and scans (mapped):', mappedOrders)
          set({ orders: mappedOrders })
        } catch (error) {
          console.error('Error fetching orders:', error)
          set({ orders: [] })
        }
      },

      // Ticket scanning actions
      validateTicket: async (orderId: string, ticketTierId: string, customerEmail: string, scanType: 'entry' | 'exit' = 'entry'): Promise<TicketValidationResult> => {
        try {
          console.log('🔍 Validating ticket:', { orderId, ticketTierId, customerEmail });

          // Check existing scans based on scan type
          if (scanType === 'entry') {
            // For entry scans, check if already scanned for entry
            const { data: existingEntryScans, error: scanError } = await supabase
              .from('ticket_scans')
              .select('*')
              .eq('order_id', orderId)
              .eq('ticket_tier_id', ticketTierId)
              .eq('scan_type', 'entry');

            if (scanError) {
              console.error('Error checking existing entry scans:', scanError);
            }

            // If already scanned for entry, return error
            if (existingEntryScans && existingEntryScans.length > 0) {
              console.log('❌ Ticket already scanned for entry');
              return {
                isValid: false,
                message: 'Ticket already scanned for entry',
                orderStatus: 'completed',
                eventDate: 'unknown',
                customerName: 'unknown',
                customerEmail: customerEmail,
                eventId: existingEntryScans[0].event_id
              };
            }
          } else if (scanType === 'exit') {
            // For exit scans, check if already scanned for entry (required for exit)
            const { data: existingEntryScans, error: scanError } = await supabase
              .from('ticket_scans')
              .select('*')
              .eq('order_id', orderId)
              .eq('ticket_tier_id', ticketTierId)
              .eq('scan_type', 'entry');

            if (scanError) {
              console.error('Error checking existing entry scans for exit:', scanError);
            }

            // Must have entry scan before exit scan
            if (!existingEntryScans || existingEntryScans.length === 0) {
              console.log('❌ Cannot exit without entry scan');
              return {
                isValid: false,
                message: 'Cannot exit without entry scan',
                orderStatus: 'completed',
                eventDate: 'unknown',
                customerName: 'unknown',
                customerEmail: customerEmail
              };
            }

            // Check if already scanned for exit
            const { data: existingExitScans, error: exitScanError } = await supabase
              .from('ticket_scans')
              .select('*')
              .eq('order_id', orderId)
              .eq('ticket_tier_id', ticketTierId)
              .eq('scan_type', 'exit');

            if (exitScanError) {
              console.error('Error checking existing exit scans:', exitScanError);
            }

            // If already scanned for exit, return error
            if (existingExitScans && existingExitScans.length > 0) {
              console.log('❌ Ticket already scanned for exit');
              return {
                isValid: false,
                message: 'Ticket already scanned for exit',
                orderStatus: 'completed',
                eventDate: 'unknown',
                customerName: 'unknown',
                customerEmail: customerEmail,
                eventId: existingEntryScans[0].event_id
              };
            }
          }

          // Check if the order exists and get basic order info
          const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('customer_email', customerEmail)
            .single();

          if (orderError || !orderData) {
            console.log('❌ Order not found:', { orderError, orderId, customerEmail });
            
            // Try to find the order without email constraint to debug
            const { data: orderWithoutEmail } = await supabase
              .from('orders')
              .select('*')
              .eq('id', orderId)
              .single();
            
            if (orderWithoutEmail) {
              console.log('🔍 Order found but email mismatch:', { 
                orderEmail: orderWithoutEmail.customer_email, 
                scannedEmail: customerEmail 
              });
              return {
                isValid: false,
                message: 'Customer email does not match order',
                orderStatus: orderWithoutEmail.status || 'unknown',
                eventDate: 'unknown',
                customerName: orderWithoutEmail.customer_name || 'unknown',
                customerEmail: customerEmail
              };
            }
            
            return {
              isValid: false,
              message: 'Order not found',
              orderStatus: 'unknown',
              eventDate: 'unknown',
              customerName: 'unknown',
              customerEmail: customerEmail
            };
          }

          console.log('✅ Order found:', orderData);

          // Check if payment is completed
          if (orderData.status !== 'completed') {
            console.log('❌ Payment not completed:', orderData.status);
            return {
              isValid: false,
              message: 'Payment not completed',
              orderStatus: orderData.status,
              eventDate: 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          // Get event details
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', orderData.event_id)
            .single();

          if (eventError || !eventData) {
            console.log('❌ Event not found:', eventError);
            return {
              isValid: false,
              message: 'Event not found',
              orderStatus: orderData.status,
              eventDate: 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          console.log('✅ Event found:', eventData);

          // Check if event date hasn't passed
          const eventDate = eventData.date;
          if (eventDate && new Date(eventDate) < new Date()) {
            console.log('❌ Event has passed:', eventDate);
            return {
              isValid: false,
              message: 'Event has passed',
              orderStatus: orderData.status,
              eventDate: eventDate,
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          // Check if ticket tier exists and is active
          console.log('🔍 Looking for ticket tier:', { ticketTierId, orderEventId: orderData.event_id });
          
          const { data: tierData, error: tierError } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('id', ticketTierId)
            .single();

          if (tierError || !tierData) {
            console.log('❌ Ticket tier not found:', { ticketTierId, error: tierError });
            
            // Try to find any ticket tiers for this event to debug
            const { data: allTiersForEvent, error: allTiersError } = await supabase
              .from('ticket_tiers')
              .select('*')
              .eq('event_id', orderData.event_id);
            
            console.log('🔍 All ticket tiers for this event:', { 
              eventId: orderData.event_id, 
              tiers: allTiersForEvent, 
              error: allTiersError 
            });
            
            return {
              isValid: false,
              message: 'Ticket tier not found',
              orderStatus: orderData.status,
              eventDate: eventDate || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          // Verify the ticket tier belongs to the correct event
          if (tierData.event_id !== orderData.event_id) {
            console.log('❌ Ticket tier does not belong to this event:', { 
              tierEventId: tierData.event_id, 
              orderEventId: orderData.event_id 
            });
            return {
              isValid: false,
              message: 'Ticket tier does not belong to this event',
              orderStatus: orderData.status,
              eventDate: eventDate || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          console.log('✅ Ticket tier found:', tierData);

          if (!tierData.is_active) {
            console.log('❌ Ticket tier is inactive');
            return {
              isValid: false,
              message: 'Ticket tier is inactive',
              orderStatus: orderData.status,
              eventDate: eventDate || 'unknown',
              customerName: orderData.customer_name || 'unknown',
              customerEmail: customerEmail
            };
          }

          // All validations passed
          console.log('✅ Ticket validation successful');
          return {
            isValid: true,
            message: `Ticket is valid for ${scanType}`,
            orderStatus: orderData.status,
            eventDate: eventDate || 'unknown',
            customerName: orderData.customer_name || 'unknown',
            customerEmail: customerEmail,
            eventId: orderData.event_id,
            eventTitle: eventData.title,
            ticketTierName: tierData.name
          };

        } catch (error) {
          console.error('❌ Error validating ticket:', error);
          return {
            isValid: false,
            message: 'Failed to validate ticket',
            orderStatus: 'unknown',
            eventDate: 'unknown',
            customerName: 'unknown',
            customerEmail: customerEmail
          };
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
            });

          if (error) {
            console.error('Error recording ticket scan:', error);
            throw error;
          }
        } catch (error) {
          console.error('Error recording ticket scan:', error);
          throw error;
        }
      },

      // Search for specific tickets
      searchTickets: async (searchTerm: string): Promise<TicketSearchResult[]> => {
        try {
          console.log('🔍 Searching for tickets with term:', searchTerm)
          
          // Search in orders table by customer name, email, or order ID
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
              *,
              events!inner(title, date, venue),
              ticket_tiers!inner(name)
            `)
            .or(`customer_name.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
            .order('created_at', { ascending: false })

          if (ordersError) throw ordersError

          // For each matching order, fetch detailed information
          const searchResults = await Promise.all(
            (ordersData || []).map(async (orderRow: any) => {
              // Fetch tickets for this order
              const { data: ticketsData, error: ticketsError } = await supabase
                .from('order_tickets')
                .select('*')
                .eq('order_id', orderRow.id)

              if (ticketsError) {
                console.error('Error fetching tickets for order:', orderRow.id, ticketsError)
              }

              // Fetch scans for this order
              const { data: scansData, error: scansError } = await supabase
                .from('ticket_scans')
                .select('*')
                .eq('order_id', orderRow.id)
                .order('scanned_at', { ascending: false })

              if (scansError) {
                console.error('Error fetching scans for order:', orderRow.id, scansError)
              }

              const scans = (scansData || []).map((s: any) => ({
                id: s.id,
                orderId: s.order_id,
                ticketTierId: s.ticket_tier_id,
                customerEmail: s.customer_email,
                eventId: s.event_id,
                scanType: s.scan_type,
                scannedAt: s.scanned_at,
                scannedBy: s.scanned_by,
                location: s.location,
                notes: s.notes,
              }))

              // Determine scan status
              const entryScans = scans.filter(s => s.scanType === 'entry')
              const exitScans = scans.filter(s => s.scanType === 'exit')
              let scanStatus: 'not_scanned' | 'scanned_in' | 'scanned_out' | 'scanned_both' = 'not_scanned'
              
              if (entryScans.length > 0 && exitScans.length > 0) {
                scanStatus = 'scanned_both'
              } else if (entryScans.length > 0) {
                scanStatus = 'scanned_in'
              } else if (exitScans.length > 0) {
                scanStatus = 'scanned_out'
              }

              const lastScanTime = scans.length > 0 ? new Date(scans[0].scannedAt) : undefined

              // Create result for each ticket in the order
              const ticketResults: TicketSearchResult[] = (ticketsData || []).map((ticket: any) => ({
                orderId: orderRow.id,
                customerName: orderRow.customer_name || 'N/A',
                customerEmail: orderRow.customer_email || 'N/A',
                eventTitle: orderRow.events?.title || 'N/A',
                eventDate: orderRow.events?.date || 'N/A',
                eventVenue: orderRow.events?.venue || 'N/A',
                ticketTierName: ticket.ticket_tier_id || 'N/A',
                quantity: ticket.quantity || 0,
                totalPrice: ticket.total_price || 0,
                orderStatus: orderRow.status || 'N/A',
                orderDate: new Date(orderRow.created_at),
                scans,
                lastScanTime,
                scanStatus,
              }))

              return ticketResults
            })
          )

          // Flatten the results since each order can have multiple tickets
          const flattenedResults: TicketSearchResult[] = searchResults.flat()
          console.log('🔍 Search results:', flattenedResults)
          return flattenedResults

        } catch (error) {
          console.error('Error searching tickets:', error)
          return []
        }
      },

      // Debug function to check database state
      debugTicketData: async (orderId: string, ticketTierId: string): Promise<string> => {
        try {
          let debugOutput = `🔍 Debug: Checking database for:\nOrder ID: ${orderId}\nTicket Tier ID: ${ticketTierId}\n\n`;
          
          // Check order
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
          
          if (orderError) {
            debugOutput += `❌ Order Error: ${orderError.message}\n`;
          } else if (order) {
            debugOutput += `✅ Order Found:\n- Status: ${order.status}\n- Customer: ${order.customer_name}\n- Email: ${order.customer_email}\n- Event ID: ${order.event_id}\n\n`;
          } else {
            debugOutput += `❌ Order Not Found\n\n`;
          }
          
          // Check ticket tier
          const { data: tier, error: tierError } = await supabase
            .from('ticket_tiers')
            .select('*')
            .eq('id', ticketTierId)
            .single();
          
          if (tierError) {
            debugOutput += `❌ Ticket Tier Error: ${tierError.message}\n`;
          } else if (tier) {
            debugOutput += `✅ Ticket Tier Found:\n- Name: ${tier.name}\n- Event ID: ${tier.event_id}\n- Active: ${tier.is_active}\n\n`;
          } else {
            debugOutput += `❌ Ticket Tier Not Found\n\n`;
          }
          
          // Check event
          if (order?.event_id) {
            const { data: event, error: eventError } = await supabase
              .from('events')
              .select('*')
              .eq('id', order.event_id)
              .single();
            
            if (eventError) {
              debugOutput += `❌ Event Error: ${eventError.message}\n`;
            } else if (event) {
              debugOutput += `✅ Event Found:\n- Title: ${event.title}\n- Date: ${event.date}\n\n`;
            } else {
              debugOutput += `❌ Event Not Found\n\n`;
            }
          }
          
          // Check all ticket tiers for this event
          if (order?.event_id) {
            const { data: allTiers, error: tiersError } = await supabase
              .from('ticket_tiers')
              .select('*')
              .eq('event_id', order.event_id);
            
            if (tiersError) {
              debugOutput += `❌ Event Tiers Error: ${tiersError.message}\n`;
            } else if (allTiers && allTiers.length > 0) {
              debugOutput += `✅ Event Ticket Tiers (${allTiers.length}):\n`;
              allTiers.forEach(t => debugOutput += `- ${t.id}: ${t.name}\n`);
              debugOutput += '\n';
            } else {
              debugOutput += `❌ No Ticket Tiers Found for Event\n\n`;
            }
          }
          
          // Check ALL ticket tiers in the database
          const { data: allTiersInDB, error: allTiersError } = await supabase
            .from('ticket_tiers')
            .select('*');
          
          if (allTiersError) {
            debugOutput += `❌ All Tiers Error: ${allTiersError.message}\n`;
          } else if (allTiersInDB && allTiersInDB.length > 0) {
            debugOutput += `📊 Total Ticket Tiers in DB: ${allTiersInDB.length}\n`;
            allTiersInDB.slice(0, 5).forEach(t => debugOutput += `- ${t.id}: ${t.name}\n`);
            if (allTiersInDB.length > 5) debugOutput += `... and ${allTiersInDB.length - 5} more\n`;
            debugOutput += '\n';
          } else {
            debugOutput += `❌ No Ticket Tiers in Database\n\n`;
          }
          
          return debugOutput;
          
        } catch (error) {
          return `❌ Debug Error: ${error}\n`;
        }
      },

      // Guestlist validation
      validateGuestlist: async (guestlistId: string, scanType: 'entry' | 'exit' = 'entry'): Promise<TicketValidationResult> => {
        try {
          console.log('🔍 Validating guestlist:', { guestlistId, scanType });

          // Check if guestlist exists and can be scanned
          const { data: guestlist, error: guestlistError } = await supabase
            .from('guestlists')
            .select('*')
            .eq('id', guestlistId)
            .single();

          if (guestlistError || !guestlist) {
            console.log('❌ Guestlist not found:', guestlistError);
            return {
              isValid: false,
              message: 'Guestlist not found',
              orderStatus: 'unknown',
              eventDate: 'unknown',
              customerName: 'unknown',
              customerEmail: 'unknown'
            };
          }

          // Check if remaining scans > 0
          if (guestlist.remaining_scans <= 0) {
            console.log('❌ No remaining scans for guestlist');
            return {
              isValid: false,
              message: 'All tickets from this group pass have been used',
              orderStatus: 'completed',
              eventDate: 'unknown',
              customerName: guestlist.lead_name,
              customerEmail: guestlist.lead_email
            };
          }

          // Get event details
          const { data: event, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', guestlist.event_id)
            .single();

          if (eventError || !event) {
            console.log('❌ Event not found:', eventError);
            return {
              isValid: false,
              message: 'Event not found',
              orderStatus: 'completed',
              eventDate: 'unknown',
              customerName: guestlist.lead_name,
              customerEmail: guestlist.lead_email
            };
          }

          // Check if event date hasn't passed
          const eventDate = event.date;
          if (eventDate && new Date(eventDate) < new Date()) {
            console.log('❌ Event has passed:', eventDate);
            return {
              isValid: false,
              message: 'Event has passed',
              orderStatus: 'completed',
              eventDate: eventDate,
              customerName: guestlist.lead_name,
              customerEmail: guestlist.lead_email
            };
          }

          // All validations passed
          console.log('✅ Guestlist validation successful');
          return {
            isValid: true,
            message: `Group pass valid - ${guestlist.remaining_scans} tickets remaining`,
            orderStatus: 'completed',
            eventDate: eventDate || 'unknown',
            customerName: guestlist.lead_name,
            customerEmail: guestlist.lead_email,
            eventId: guestlist.event_id,
            eventTitle: event.title,
            ticketTierName: `Group Pass (${guestlist.total_tickets} tickets)`
          };

        } catch (error) {
          console.error('❌ Error validating guestlist:', error);
          return {
            isValid: false,
            message: 'Failed to validate guestlist',
            orderStatus: 'unknown',
            eventDate: 'unknown',
            customerName: 'unknown',
            customerEmail: 'unknown'
          };
        }
      },

      // Record guestlist scan
      recordGuestlistScan: async (scanData: Omit<GuestlistScan, 'id' | 'scannedAt'>) => {
        try {
          // First, decrement the remaining scans
          const { error: decrementError } = await supabase
            .rpc('decrement_guestlist_scans', { guestlist_uuid: scanData.guestlistId });

          if (decrementError) {
            console.error('Error decrementing guestlist scans:', decrementError);
            throw decrementError;
          }

          // Then, record the scan (include all required fields from the database schema)
          const { error } = await supabase
            .from('guestlist_scans')
            .insert({
              guestlist_id: scanData.guestlistId,
              event_id: scanData.eventId, // Required field
              scan_type: scanData.scanType, // Required field with default 'entry'
              scanned_by: scanData.scannedBy || 'admin',
              location: scanData.location || '',
              notes: scanData.notes || '',
              scanned_at: new Date().toISOString()
            });

          if (error) {
            console.error('Error recording guestlist scan:', error);
            throw error;
          }
        } catch (error) {
          console.error('Error recording guestlist scan:', error);
          throw error;
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
