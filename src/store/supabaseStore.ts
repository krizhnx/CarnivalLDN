import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import { Event, AuthState, EventFormData, Order, TicketValidationResult, TicketScan, TicketSearchResult, GuestlistScan, AffiliateSociety, AffiliateFormData, AffiliateLink, AffiliateStats, SocietyPerformance } from '../types'
import toast from 'react-hot-toast'

interface AppState extends AuthState {
  events: Event[]
  orders: any[]
  isLoading: boolean
  // Affiliate tracking state
  affiliateSocieties: AffiliateSociety[]
  affiliateLinks: AffiliateLink[]
  affiliateStats: AffiliateStats | null
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
  // Affiliate tracking actions
  getAffiliateSocieties: () => Promise<void>
  addAffiliateSociety: (societyData: AffiliateFormData) => Promise<void>
  updateAffiliateSociety: (id: string, societyData: AffiliateFormData) => Promise<void>
  deleteAffiliateSociety: (id: string) => Promise<void>
  getAffiliateLinks: () => Promise<void>
  createAffiliateLinks: (societyIds: string[], eventId: string) => Promise<void>
  getAffiliateStats: () => Promise<void>
  getSocietyPerformance: () => Promise<SocietyPerformance[]>
  trackAffiliateClick: (linkId: string, sessionId?: string) => Promise<void>
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
      // Affiliate tracking initial state
      affiliateSocieties: [],
      affiliateLinks: [],
      affiliateStats: null,

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

          // Prevent deleting non-archived events
          if (!isArchived) {
            toast.error('Cannot delete: Only archived events can be deleted. Please archive the event first.')
            const error: any = new Error('Cannot delete non-archived events')
            error.code = 'EVENT_NOT_ARCHIVED'
            throw error
          }

          // Check if event has any data that would prevent deletion
          const { data: eventOrders, error: eventOrdersError } = await supabase
            .from('orders')
            .select('id')
            .eq('event_id', id)

          if (eventOrdersError) {
            console.error('Error checking event orders before delete:', eventOrdersError)
          }

          if ((eventOrders || []).length > 0) {
            console.log(`📊 Event has ${(eventOrders || []).length} orders - proceeding with deletion of all related data`)
          }

          // If archived, hard-delete dependent data first to avoid FK conflicts
          if (isArchived) {
            console.log(`🗑️ Deleting archived event ${id} and all related data...`)
            
            // Delete in reverse dependency order to avoid FK conflicts
            
            // 1. Delete ticket_scans first (they reference both orders and events)
            const { error: scansDeleteError } = await supabase
              .from('ticket_scans')
              .delete()
              .eq('event_id', id)

            if (scansDeleteError) {
              console.error('Error deleting ticket_scans for event:', scansDeleteError)
            } else {
              console.log('✅ Deleted ticket_scans for event')
            }

            // 2. Delete guestlist_scans (they reference events)
            const { error: guestlistScansError } = await supabase
              .from('guestlist_scans')
              .delete()
              .eq('event_id', id)

            if (guestlistScansError) {
              console.error('Error deleting guestlist_scans for event:', guestlistScansError)
            } else {
              console.log('✅ Deleted guestlist_scans for event')
            }

            // 3. Collect order ids for this event
            const { data: ordersToDelete, error: ordersToDeleteError } = await supabase
              .from('orders')
              .select('id')
              .eq('event_id', id)

            if (ordersToDeleteError) {
              console.error('Error fetching orders to delete:', ordersToDeleteError)
            }

            const orderIds = (ordersToDelete || []).map(o => o.id)

            if (orderIds.length > 0) {
              console.log(`🗑️ Deleting ${orderIds.length} orders and related data...`)
              
              // 4. Delete order_tickets referencing those orders
              const { error: otDeleteError } = await supabase
                .from('order_tickets')
                .delete()
                .in('order_id', orderIds)

              if (otDeleteError) {
                console.error('Error deleting order_tickets for event:', otDeleteError)
              } else {
                console.log('✅ Deleted order_tickets for event')
              }

              // 5. Delete orders for the event
              const { error: ordersDeleteError } = await supabase
                .from('orders')
                .delete()
                .eq('event_id', id)

              if (ordersDeleteError) {
                console.error('Error deleting orders for event:', ordersDeleteError)
              } else {
                console.log('✅ Deleted orders for event')
              }
            }

            // 6. Delete guestlists for this event
            const { error: guestlistsError } = await supabase
              .from('guestlists')
              .delete()
              .eq('event_id', id)

            if (guestlistsError) {
              console.error('Error deleting guestlists for event:', guestlistsError)
            } else {
              console.log('✅ Deleted guestlists for event')
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
          
          toast.success('Event deleted successfully')
        } catch (error) {
          console.error('Error deleting event:', error)
          // @ts-ignore - error shape at runtime
          if ((error as any)?.code === 'EVENT_HAS_ORDERS') {
            toast.error('Cannot delete: this event has existing orders. Consider archiving it or enabling cascade deletes in Supabase.')
          } else if ((error as any)?.code === 'EVENT_NOT_ARCHIVED') {
            // This error is already handled with a toast above
          } else if ((error as any)?.code === '23503') {
            toast.error('Cannot delete event: There are still references to this event in the system. Please contact support if this persists.')
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
                customerPhone: orderRow.customer_phone,
                customerDateOfBirth: orderRow.customer_date_of_birth,
                customerGender: orderRow.customer_gender,
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

          // Get ticket quantity from order_tickets
          const { data: orderTicket, error: orderTicketError } = await supabase
            .from('order_tickets')
            .select('quantity')
            .eq('order_id', orderId)
            .eq('ticket_tier_id', ticketTierId)
            .single();

          if (orderTicketError || !orderTicket) {
            console.error('Error fetching order ticket quantity:', orderTicketError);
            // Fallback: assume quantity is 1 if we can't find it
            console.log('⚠️ Could not find order ticket, assuming quantity 1');
          }

          const ticketQuantity = orderTicket?.quantity || 1;
          console.log('🎫 Ticket quantity:', ticketQuantity);

          // Check existing scans based on scan type
          if (scanType === 'entry') {
            // For entry scans, check how many times it's been scanned
            const { data: existingEntryScans, error: scanError } = await supabase
              .from('ticket_scans')
              .select('*')
              .eq('order_id', orderId)
              .eq('ticket_tier_id', ticketTierId)
              .eq('scan_type', 'entry');

            if (scanError) {
              console.error('Error checking existing entry scans:', scanError);
            }

            const scanCount = existingEntryScans?.length || 0;
            console.log(`🔢 Entry scans: ${scanCount}/${ticketQuantity}`);

            // If already scanned the maximum number of times, return error
            if (scanCount >= ticketQuantity) {
              console.log(`❌ Ticket already scanned ${scanCount} times (max: ${ticketQuantity})`);
              return {
                isValid: false,
                message: `Ticket already scanned ${scanCount} time${scanCount > 1 ? 's' : ''} (maximum: ${ticketQuantity})`,
                orderStatus: 'completed',
                eventDate: 'unknown',
                customerName: 'unknown',
                customerEmail: customerEmail,
                eventId: existingEntryScans?.[0]?.event_id
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

            // Check how many times it's been scanned for exit
            const { data: existingExitScans, error: exitScanError } = await supabase
              .from('ticket_scans')
              .select('*')
              .eq('order_id', orderId)
              .eq('ticket_tier_id', ticketTierId)
              .eq('scan_type', 'exit');

            if (exitScanError) {
              console.error('Error checking existing exit scans:', exitScanError);
            }

            const exitScanCount = existingExitScans?.length || 0;
            console.log(`🔢 Exit scans: ${exitScanCount}/${ticketQuantity}`);

            // If already scanned the maximum number of times for exit, return error
            if (exitScanCount >= ticketQuantity) {
              console.log(`❌ Ticket already scanned for exit ${exitScanCount} times (max: ${ticketQuantity})`);
              return {
                isValid: false,
                message: `Ticket already scanned for exit ${exitScanCount} time${exitScanCount > 1 ? 's' : ''} (maximum: ${ticketQuantity})`,
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
      },

      // Affiliate tracking actions
      getAffiliateSocieties: async () => {
        try {
          console.log('🔍 Fetching affiliate societies from Supabase...');
          console.log('🔗 Supabase client:', supabase);
          
          const { data: societies, error } = await supabase
            .from('affiliate_societies')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Error fetching affiliate societies:', error);
            throw error;
          }

          console.log('📊 Raw societies data from Supabase:', societies);

          const transformedSocieties = (societies || []).map(society => ({
            id: society.id,
            name: society.name,
            code: society.code,
            contactName: society.contact_name,
            contactEmail: society.contact_email,
            contactPhone: society.contact_phone,
            university: society.university,
            societyType: society.society_type,
            commissionRate: society.commission_rate,
            isActive: society.is_active,
            createdAt: society.created_at,
            updatedAt: society.updated_at,
          }));

          console.log('✅ Transformed societies:', transformedSocieties);
          set({ affiliateSocieties: transformedSocieties });
        } catch (error) {
          console.error('Error fetching affiliate societies:', error);
          toast.error('Failed to load affiliate societies');
        }
      },

      addAffiliateSociety: async (societyData: AffiliateFormData) => {
        try {
          const { data: society, error } = await supabase
            .from('affiliate_societies')
            .insert({
              name: societyData.name,
              code: societyData.code,
              contact_name: societyData.contactName || null,
              contact_email: societyData.contactEmail || null,
              contact_phone: societyData.contactPhone || null,
              university: societyData.university || null,
              society_type: societyData.societyType || null,
              commission_rate: societyData.commissionRate,
              is_active: true,
            })
            .select()
            .single();

          if (error) throw error;

          const transformedSociety = {
            id: society.id,
            name: society.name,
            code: society.code,
            contactName: society.contact_name,
            contactEmail: society.contact_email,
            contactPhone: society.contact_phone,
            university: society.university,
            societyType: society.society_type,
            commissionRate: society.commission_rate,
            isActive: society.is_active,
            createdAt: society.created_at,
            updatedAt: society.updated_at,
          };

          set(state => ({
            affiliateSocieties: [transformedSociety, ...state.affiliateSocieties]
          }));

          toast.success('Society created successfully!');
        } catch (error) {
          console.error('Error creating affiliate society:', error);
          toast.error('Failed to create society');
          throw error;
        }
      },

      updateAffiliateSociety: async (id: string, societyData: AffiliateFormData) => {
        try {
          const { data: society, error } = await supabase
            .from('affiliate_societies')
            .update({
              name: societyData.name,
              code: societyData.code,
              contact_name: societyData.contactName || null,
              contact_email: societyData.contactEmail || null,
              contact_phone: societyData.contactPhone || null,
              university: societyData.university || null,
              society_type: societyData.societyType || null,
              commission_rate: societyData.commissionRate,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const transformedSociety = {
            id: society.id,
            name: society.name,
            code: society.code,
            contactName: society.contact_name,
            contactEmail: society.contact_email,
            contactPhone: society.contact_phone,
            university: society.university,
            societyType: society.society_type,
            commissionRate: society.commission_rate,
            isActive: society.is_active,
            createdAt: society.created_at,
            updatedAt: society.updated_at,
          };

          set(state => ({
            affiliateSocieties: state.affiliateSocieties.map(s => 
              s.id === id ? transformedSociety : s
            )
          }));

          toast.success('Society updated successfully!');
        } catch (error) {
          console.error('Error updating affiliate society:', error);
          toast.error('Failed to update society');
          throw error;
        }
      },

      deleteAffiliateSociety: async (id: string) => {
        try {
          // Get all affiliate links for this society first
          const { data: societyLinks, error: linksQueryError } = await supabase
            .from('affiliate_links')
            .select('id')
            .eq('society_id', id);

          if (linksQueryError) {
            console.error('Error querying affiliate links:', linksQueryError);
            throw linksQueryError;
          }

          const linkIds = societyLinks?.map(link => link.id) || [];

          if (linkIds.length > 0) {
            // Step 1: Delete all affiliate clicks associated with these links
            console.log('🗑️ Deleting affiliate clicks for links:', linkIds);
            const { error: clicksError } = await supabase
              .from('affiliate_clicks')
              .delete()
              .in('link_id', linkIds);

            if (clicksError) {
              console.error('Error deleting affiliate clicks:', clicksError);
              throw clicksError;
            }

            // Step 2: Delete all affiliate links associated with this society
            console.log('🗑️ Deleting affiliate links for society:', id);
            const { error: linksError } = await supabase
              .from('affiliate_links')
              .delete()
              .eq('society_id', id);

            if (linksError) {
              console.error('Error deleting affiliate links:', linksError);
              throw linksError;
            }
          }

          // Step 3: Delete the society itself
          console.log('🗑️ Deleting society:', id);
          const { error: societyError } = await supabase
            .from('affiliate_societies')
            .delete()
            .eq('id', id);

          if (societyError) {
            console.error('Error deleting society:', societyError);
            throw societyError;
          }

          // Update local state
          set(state => ({
            affiliateSocieties: state.affiliateSocieties.filter(s => s.id !== id),
            affiliateLinks: state.affiliateLinks.filter(link => link.societyId !== id)
          }));

          toast.success('Society and all associated data deleted successfully!');
        } catch (error) {
          console.error('Error deleting affiliate society:', error);
          toast.error('Failed to delete society. It may have associated orders or other constraints.');
          throw error;
        }
      },

      getAffiliateLinks: async () => {
        try {
          console.log('🔍 Fetching affiliate links from Supabase...');
          const { data: links, error } = await supabase
            .from('affiliate_links')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('❌ Error fetching affiliate links:', error);
            throw error;
          }

          console.log('📊 Raw links data from Supabase:', links);

          const transformedLinks = (links || []).map(link => ({
            id: link.id,
            societyId: link.society_id,
            eventId: link.event_id,
            linkCode: link.link_code,
            customUrl: link.custom_url,
            isActive: link.is_active,
            createdAt: link.created_at,
          }));

          console.log('✅ Transformed links:', transformedLinks);
          set({ affiliateLinks: transformedLinks });
        } catch (error) {
          console.error('Error fetching affiliate links:', error);
          toast.error('Failed to load affiliate links');
        }
      },

      createAffiliateLinks: async (societyIds: string[], eventId: string) => {
        try {
          const linksToCreate = societyIds.map(societyId => ({
            society_id: societyId,
            event_id: eventId,
            link_code: `${societyId}-${eventId}-${Date.now()}`,
            is_active: true,
          }));

          const { data: links, error } = await supabase
            .from('affiliate_links')
            .insert(linksToCreate)
            .select();

          if (error) throw error;

          const transformedLinks = (links || []).map(link => ({
            id: link.id,
            societyId: link.society_id,
            eventId: link.event_id,
            linkCode: link.link_code,
            customUrl: link.custom_url,
            isActive: link.is_active,
            createdAt: link.created_at,
          }));

          set(state => ({
            affiliateLinks: [...transformedLinks, ...state.affiliateLinks]
          }));

          toast.success(`${societyIds.length} tracking link(s) created successfully!`);
        } catch (error) {
          console.error('Error creating affiliate links:', error);
          toast.error('Failed to create tracking links');
          throw error;
        }
      },

      getAffiliateStats: async () => {
        try {
          // Get total societies
          const { count: societyCount } = await supabase
            .from('affiliate_societies')
            .select('*', { count: 'exact', head: true });

          // Get total clicks
          const { count: clickCount } = await supabase
            .from('affiliate_clicks')
            .select('*', { count: 'exact', head: true });

          // Get total tickets sold and revenue from orders with affiliate links
          const { data: affiliateOrders, error: ordersError } = await supabase
            .from('orders')
            .select(`
              total_amount,
              order_tickets (quantity)
            `)
            .not('affiliate_link_id', 'is', null)
            .eq('status', 'completed');

          if (ordersError) throw ordersError;

          const totalRevenue = (affiliateOrders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
          const totalTicketsSold = (affiliateOrders || []).reduce((sum, order) => {
            const orderTickets = order.order_tickets || [];
            return sum + orderTickets.reduce((ticketSum: number, ticket: any) => ticketSum + (ticket.quantity || 0), 0);
          }, 0);

          const stats: AffiliateStats = {
            totalSocieties: societyCount || 0,
            totalClicks: clickCount || 0,
            totalTicketsSold,
            totalRevenue,
          };

          set({ affiliateStats: stats });
        } catch (error) {
          console.error('Error fetching affiliate stats:', error);
          toast.error('Failed to load affiliate statistics');
        }
      },

      getSocietyPerformance: async (): Promise<SocietyPerformance[]> => {
        try {
          // Get all societies
          const { data: societies, error: societiesError } = await supabase
            .from('affiliate_societies')
            .select('*')
            .order('created_at', { ascending: false });

          if (societiesError) throw societiesError;

          const performanceData: SocietyPerformance[] = [];

          for (const society of societies || []) {
            // Get clicks for this society's links
            const { count: clicks } = await supabase
              .from('affiliate_clicks')
              .select('*', { count: 'exact', head: true })
              .in('link_id', 
                (await supabase
                  .from('affiliate_links')
                  .select('id')
                  .eq('society_id', society.id)
                ).data?.map(link => link.id) || []
              );

            // Get revenue and tickets for this society's links
            const { data: orders } = await supabase
              .from('orders')
              .select(`
                total_amount,
                order_tickets (quantity)
              `)
              .in('affiliate_link_id', 
                (await supabase
                  .from('affiliate_links')
                  .select('id')
                  .eq('society_id', society.id)
                ).data?.map(link => link.id) || []
              )
              .eq('status', 'completed');

            const revenue = (orders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
            const ticketsSold = (orders || []).reduce((sum, order) => {
              const orderTickets = order.order_tickets || [];
              return sum + orderTickets.reduce((ticketSum: number, ticket: any) => ticketSum + (ticket.quantity || 0), 0);
            }, 0);

            performanceData.push({
              society: {
                id: society.id,
                name: society.name,
                code: society.code,
                contactName: society.contact_name,
                contactEmail: society.contact_email,
                contactPhone: society.contact_phone,
                university: society.university,
                societyType: society.society_type,
                commissionRate: society.commission_rate,
                isActive: society.is_active,
                createdAt: society.created_at,
                updatedAt: society.updated_at,
              },
              clicks: clicks || 0,
              ticketsSold,
              revenue,
            });
          }

          return performanceData;
        } catch (error) {
          console.error('Error fetching society performance:', error);
          toast.error('Failed to load society performance data');
          return [];
        }
      },

      trackAffiliateClick: async (linkId: string, sessionId?: string) => {
        try {
          const { error } = await supabase
            .from('affiliate_clicks')
            .insert({
              link_id: linkId,
              session_id: sessionId || null,
              clicked_at: new Date().toISOString(),
            });

          if (error) throw error;
        } catch (error) {
          console.error('Error tracking affiliate click:', error);
          // Don't show toast for tracking errors as they shouldn't interrupt user experience
        }
      },
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
