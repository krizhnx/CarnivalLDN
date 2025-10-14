import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, CheckCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import { Event, TicketTier, Order } from '../types';
import { /* trackPageView, */ trackBeginCheckout, trackPurchase } from '../lib/googleAnalytics';
// import { formatPrice } from '../lib/stripe';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51OyBk9IgkIAGwv6wTnbqfLaivBQ0wYCltGf0gS4yeEZpxkD1f5jKEwarmr294R0LXNEzEMNxHuCKLRpMH8DYgaWD00g8BPRDAG');

interface CheckoutProps {
  event: Event;
  onClose: () => void;
  onSuccess: (order: Order) => void;
}

interface TicketSelection {
  tierId: string;
  tier: TicketTier;
  quantity: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
}

const CheckoutForm = ({ event, onClose: _onClose, onSuccess }: CheckoutProps) => {
  // Custom styles for better form appearance on all devices
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="date"]::-webkit-calendar-picker-indicator {
        background: transparent;
        bottom: 0;
        color: transparent;
        cursor: pointer;
        height: auto;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        width: auto;
        opacity: 0;
      }

      /* Ensure date picker opens on mobile */
      input[type="date"] {
        position: relative;
      }

      /* Make the entire input clickable for date picker */
      input[type="date"]::-webkit-calendar-picker-indicator:hover {
        opacity: 0.1;
      }

      input[type="date"]::-webkit-datetime-edit {
        color: #374151;
      }

      input[type="date"]::-webkit-datetime-edit-fields-wrapper {
        padding: 0;
      }

      input[type="date"]::-webkit-datetime-edit-text {
        color: #9CA3AF;
        padding: 0 0.2em;
      }

      input[type="date"]::-webkit-datetime-edit-month-field,
      input[type="date"]::-webkit-datetime-edit-day-field,
      input[type="date"]::-webkit-datetime-edit-year-field {
        color: #374151;
        padding: 0 0.2em;
      }

      input[type="date"]::-webkit-inner-spin-button {
        display: none;
      }

      input[type="date"]::-webkit-clear-button {
        display: none;
      }

      /* iOS specific fixes */
      input, select {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        border-radius: 8px;
        font-size: 16px;
      }

      /* Ensure consistent height on iOS */
      input, select {
        min-height: 48px;
        line-height: 1.5;
      }

      /* Fix iOS select dropdown styling */
      select {
        background-image: none;
      }

      /* Ensure text inputs don't zoom on iOS */
      input[type="text"], input[type="email"], input[type="tel"] {
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const stripe = useStripe();
  const elements = useElements();
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'male',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canMakePayment, setCanMakePayment] = useState(false);
  // const [currentStep, setCurrentStep] = useState<'tickets' | 'customer' | 'payment' | 'processing'>('tickets');
  // const [progress, setProgress] = useState(0);

  // Initialize ticket selections with all tiers so sold-out/disabled still display
  useEffect(() => {
    console.log('Event ticket tiers:', event.ticketTiers);
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      // Ensure tiers are sorted by price in ascending order
      const sortedTiers = [...event.ticketTiers].sort((a, b) => a.price - b.price);
      const initialSelections = sortedTiers.map(tier => ({
        tierId: tier.id,
        tier,
        quantity: 0,
      }));
      setTicketSelections(initialSelections);
    }
  }, [event]);

  const getTotalAmount = () => {
    const subtotal = ticketSelections.reduce((total, selection) => {
      return total + (selection.tier.price * selection.quantity);
    }, 0);

    // Add £1.50 fixed fee (in pence: 150)
    const fee = 150;
    return subtotal + fee;
  };

  // Check if any tickets are actually selected
  const hasSelectedTickets = ticketSelections.some(selection => selection.quantity > 0);

  // Create stable payment request using useMemo
  const paymentRequest = useMemo(() => {
    if (!stripe || !hasSelectedTickets || getTotalAmount() <= 0) return null;

    const totalAmount = getTotalAmount();
    console.log('🍎 Creating Apple Pay request:', {
      hasSelectedTickets,
      totalAmount,
      ticketSelections: ticketSelections.filter(s => s.quantity > 0)
    });

    const pr = stripe.paymentRequest({
      country: 'GB',
      currency: 'gbp',
      total: {
        label: `${event.title} Tickets`,
        amount: totalAmount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Set up payment method handler
    pr.on('paymentmethod', async (ev) => {
        // Create payment intent
        try {
          const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId: event.id,
              tickets: ticketSelections.filter(s => s.quantity > 0),
              customerInfo: {
                ...customerInfo,
                name: ev.payerName || customerInfo.name,
                email: ev.payerEmail || customerInfo.email,
                phone: ev.payerPhone || customerInfo.phone,
              },
              totalAmount: getTotalAmount(),
              affiliateLinkId: sessionStorage.getItem('affiliate_link_id'),
              isApplePay: true, // Flag to indicate this is an Apple Pay transaction
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create payment intent');
          }

          const { clientSecret } = await response.json();

          // Confirm payment with Apple Pay
          const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (confirmError) {
            ev.complete('fail');
            setError(confirmError.message || 'Payment failed');
            return;
          }

          ev.complete('success');

          if (paymentIntent.status === 'succeeded') {
            // Create order record
            const orderResponse = await fetch('/api/confirm-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: paymentIntent.id,
                eventId: event.id,
                tickets: ticketSelections.filter(s => s.quantity > 0),
                customerInfo: {
                  ...customerInfo,
                  name: ev.payerName || customerInfo.name,
                  email: ev.payerEmail || customerInfo.email,
                  phone: ev.payerPhone || customerInfo.phone,
                },
                totalAmount: getTotalAmount(),
                affiliateLinkId: sessionStorage.getItem('affiliate_link_id'),
              }),
            });

            if (orderResponse.ok) {
              const orderData = await orderResponse.json();

              const order = {
                id: orderData.order?.id || `order_${Date.now()}`,
                eventId: event.id,
                userId: ev.payerEmail || customerInfo.email,
                stripePaymentIntentId: orderData.paymentIntentId,
                status: 'completed' as const,
                totalAmount: getTotalAmount(),
                currency: 'gbp',
                tickets: ticketSelections.filter(s => s.quantity > 0).map(selection => ({
                  id: `ticket_${Date.now()}_${selection.tierId}`,
                  orderId: orderData.order?.id || `order_${Date.now()}`,
                  ticketTierId: selection.tierId,
                  quantity: selection.quantity,
                  unitPrice: selection.tier.price,
                  totalPrice: selection.tier.price * selection.quantity,
                })),
                customerEmail: ev.payerEmail || customerInfo.email,
                customerName: ev.payerName || customerInfo.name,
                customerPhone: ev.payerPhone || customerInfo.phone,
                customerDateOfBirth: customerInfo.dateOfBirth,
                customerGender: customerInfo.gender || undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              // Track successful purchase for analytics
              const selectedTickets = ticketSelections.filter(s => s.quantity > 0);
              const totalValue = getTotalAmount();
              const items = selectedTickets.map(selection => ({
                tier: selection.tier.name,
                price: selection.tier.price,
                quantity: selection.quantity
              }));

              trackPurchase(order.id, event.id, event.title, totalValue, items);

              onSuccess(order);
            }
          }
        } catch (err) {
          ev.complete('fail');
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      });

    return pr;
  }, [stripe, getTotalAmount(), event.id, ticketSelections, customerInfo, hasSelectedTickets]);

  // Check Apple Pay availability
  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.canMakePayment().then((result) => {
        console.log('🍎 Apple Pay availability check:', result);
        console.log('🔍 Device info:', {
          userAgent: navigator.userAgent,
          isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
          isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
          isMac: /Mac/.test(navigator.userAgent),
          domain: window.location.hostname,
          protocol: window.location.protocol,
          isHTTPS: window.location.protocol === 'https:'
        });

        // Check specifically for Apple Pay availability
        const isApplePayAvailable = result && result.applePay === true;

        if (isApplePayAvailable) {
          console.log('✅ Apple Pay is available');
          setCanMakePayment(true);
        } else {
          console.log('❌ Apple Pay is NOT available');
          console.log('📋 Requirements check:');
          console.log('- Safari browser:', /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent));
          console.log('- HTTPS:', window.location.protocol === 'https:');
          console.log('- Domain registered:', 'Check Stripe dashboard');
          console.log('- Cards in wallet:', 'User must have cards in Apple Wallet');
          setCanMakePayment(false);
        }
      }).catch((error) => {
        console.error('❌ Error checking Apple Pay:', error);
        setCanMakePayment(false);
      });
    } else {
      setCanMakePayment(false);
    }
  }, [paymentRequest]);

  // Debug logging
  useEffect(() => {
    console.log('Rendering Apple Pay section:', { canMakePayment, hasPaymentRequest: !!paymentRequest });
  }, [canMakePayment, paymentRequest]);

  const updateTicketQuantity = (tierId: string, quantity: number) => {
    setTicketSelections(prev =>
      prev.map(selection =>
        selection.tierId === tierId
          ? { ...selection, quantity: Math.max(0, quantity) }
          : selection
      )
    );
  };

  // Check if event has any free tickets available
  const hasFreeTickets = () => {
    return event.ticketTiers?.some(tier => tier.price === 0 && tier.isActive !== false);
  };

  // Check if all selected tickets are free
  const isAllFreeTickets = () => {
    const selectedTickets = ticketSelections.filter(s => s.quantity > 0);
    return selectedTickets.length > 0 && selectedTickets.every(s => s.tier.price === 0);
  };

  const getTotalTickets = () => {
    return ticketSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (getTotalTickets() === 0) {
      setError('Please select at least one ticket.');
      return;
    }

    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!customerInfo.name?.trim()) validationErrors.push('Name is required');
    if (!customerInfo.email?.trim()) validationErrors.push('Email is required');
    if (!customerInfo.phone?.trim()) validationErrors.push('Phone number is required');
    if (!customerInfo.dateOfBirth || customerInfo.dateOfBirth.trim() === '') {
      validationErrors.push('Date of birth is required');
    }
    if (!customerInfo.gender) validationErrors.push('Gender is required');

    // Age validation - must be 18 or older
    if (customerInfo.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(customerInfo.dateOfBirth);

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        validationErrors.push('Please enter a valid date of birth');
      } else {
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          validationErrors.push('You must be 18 years or older to purchase tickets');
        }
      }
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    // Log the customer info being sent for debugging
    console.log('Sending customer info:', customerInfo);

    setIsProcessing(true);
    setError(null);

    // Track checkout begin for analytics
    const selectedTickets = ticketSelections.filter(s => s.quantity > 0);
    const totalValue = getTotalAmount();
    const items = selectedTickets.map(selection => ({
      tier: selection.tier.name,
      price: selection.tier.price,
      quantity: selection.quantity
    }));

    trackBeginCheckout(event.id, event.title, totalValue, items);

    try {
      const totalAmount = getTotalAmount();
      const isFreeEvent = totalAmount === 0;

      if (isFreeEvent) {
        // Handle free event - no payment required
        const response = await fetch('/api/create-free-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id,
            tickets: ticketSelections.filter(s => s.quantity > 0),
            customerInfo,
            totalAmount: 0,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create free order');
        }

        const orderData = await response.json();

        // Create a proper order object with the correct structure
        const order = {
          id: orderData.order?.id || `order_${Date.now()}`,
          eventId: event.id,
          userId: customerInfo.email,
          stripePaymentIntentId: null, // No payment for free events
          status: 'completed' as const,
          totalAmount: 0,
          currency: 'gbp',
          tickets: ticketSelections.filter(s => s.quantity > 0).map(selection => ({
            id: `ticket_${Date.now()}_${selection.tierId}`,
            orderId: orderData.order?.id || `order_${Date.now()}`,
            ticketTierId: selection.tierId,
            quantity: selection.quantity,
            unitPrice: 0,
            totalPrice: 0,
          })),
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerDateOfBirth: customerInfo.dateOfBirth,
          customerGender: customerInfo.gender || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Track successful order for analytics
        const selectedTickets = ticketSelections.filter(s => s.quantity > 0);
        const items = selectedTickets.map(selection => ({
          tier: selection.tier.name,
          price: 0,
          quantity: selection.quantity
        }));

        trackPurchase(order.id, event.id, event.title, 0, items);

        onSuccess(order);
      } else {
        // Handle paid event - require Stripe
        if (!stripe || !elements) {
          setError('Stripe has not loaded yet. Please try again.');
          return;
        }

        // Create payment intent
        const requestBody = {
          eventId: event.id,
          tickets: ticketSelections.filter(s => s.quantity > 0),
          customerInfo,
          totalAmount: getTotalAmount(),
          affiliateLinkId: sessionStorage.getItem('affiliate_link_id'), // Include affiliate link ID
        };

        console.log('🚀 Creating payment intent with data:', requestBody);
        console.log('📅 Date of birth value:', customerInfo.dateOfBirth, 'Type:', typeof customerInfo.dateOfBirth);

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Payment intent creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create payment intent');
        }

        const { clientSecret } = await response.json();

        // Confirm payment
        const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
            },
          },
        });

        if (paymentError) {
          setError(paymentError.message || 'Payment failed');
          return;
        }

        if (paymentIntent.status === 'succeeded') {
          // Create order record
          const orderResponse = await fetch('/api/confirm-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id,
              eventId: event.id,
              tickets: ticketSelections.filter(s => s.quantity > 0),
              customerInfo,
              totalAmount: getTotalAmount(),
              affiliateLinkId: sessionStorage.getItem('affiliate_link_id'), // Include affiliate link ID
            }),
          });

          if (orderResponse.ok) {
            const orderData = await orderResponse.json();

            // Create a proper order object with the correct structure
            const order = {
              id: orderData.order?.id || `order_${Date.now()}`,
              eventId: event.id,
              userId: customerInfo.email,
              stripePaymentIntentId: orderData.paymentIntentId,
              status: 'completed' as const,
              totalAmount: getTotalAmount(),
              currency: 'gbp',
              tickets: ticketSelections.filter(s => s.quantity > 0).map(selection => ({
                id: `ticket_${Date.now()}_${selection.tierId}`,
                orderId: orderData.order?.id || `order_${Date.now()}`,
                ticketTierId: selection.tierId,
                quantity: selection.quantity,
                unitPrice: selection.tier.price,
                totalPrice: selection.tier.price * selection.quantity,
              })),
              customerEmail: customerInfo.email,
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
              customerDateOfBirth: customerInfo.dateOfBirth,
              customerGender: customerInfo.gender || undefined,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            // Track successful purchase for analytics
            const selectedTickets = ticketSelections.filter(s => s.quantity > 0);
            const totalValue = getTotalAmount();
            const items = selectedTickets.map(selection => ({
              tier: selection.tier.name,
              price: selection.tier.price,
              quantity: selection.quantity
            }));

            trackPurchase(order.id, event.id, event.title, totalValue, items);

            onSuccess(order);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const purchasableTiers = (event.ticketTiers || []).filter(t => t.isActive !== false && t.capacity > t.soldCount);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {isAllFreeTickets() ? 'Step 1 of 2' : 'Step 1 of 3'}
          </span>
          <span className="text-sm text-gray-500">Select Tickets</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            initial={{ width: 0 }}
            animate={{ width: isAllFreeTickets() ? "50%" : "33%" }}
          />
        </div>
      </div>

      {/* Ticket Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Tickets</h3>
        {purchasableTiers.length === 0 && (
          <div className="mb-4 text-sm text-red-600">This event is sold out.</div>
        )}
        <div className="space-y-4">
          {(event.ticketTiers || []).sort((a, b) => a.price - b.price).map((tier) => {
            const selection = ticketSelections.find(s => s.tierId === tier.id) || { tier, quantity: 0 } as any;
            const remaining = tier.capacity - tier.soldCount;
            const isSoldOut = remaining <= 0 || tier.isActive === false;
            return (
              <div key={tier.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{tier.name}</h4>
                    <p className="text-sm text-gray-600">{tier.description}</p>
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="mt-2">
                        {tier.benefits.map((benefit, index) => (
                          <div key={index} className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    {isSoldOut ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Sold out</span>
                    ) : (
                      <>
                        <div className="text-lg font-semibold text-gray-900">£{(tier.price / 100).toFixed(2)}</div>
                        {tier.originalPrice && tier.originalPrice > tier.price && (
                          <div className="text-sm text-gray-400 line-through">£{(tier.originalPrice / 100).toFixed(2)}</div>
                        )}

                      </>
                    )}
                  </div>
                </div>
                {isSoldOut ? (
                  <div className="text-sm text-gray-500">This tier is currently unavailable.</div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateTicketQuantity(tier.id, (selection.quantity || 0) - 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{selection.quantity || 0}</span>
                      <button
                        type="button"
                        onClick={() => updateTicketQuantity(tier.id, (selection.quantity || 0) + 1)}
                        disabled={(selection.quantity || 0) >= remaining}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      £{(((tier.price) * (selection.quantity || 0)) / 100).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              placeholder="e.g. John Smith"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className="w-full h-12 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              placeholder="e.g. john.smith@email.com"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              className="w-full h-12 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g. 07123456789"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className="w-full h-12 px-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth * <span className="text-red-500">(Required)</span>
            </label>
            <div className="relative">
              <input
                id="dateOfBirth"
                type="date"
                value={customerInfo.dateOfBirth}
                onChange={(e) => setCustomerInfo({ ...customerInfo, dateOfBirth: e.target.value })}
                placeholder="Select date of birth"
                className={`w-full h-12 px-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer hover:border-blue-400 transition-colors shadow-sm ${
                  !customerInfo.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">You must be 18 years or older to purchase tickets</p>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender *
            </label>
            <div className="relative">
              <select
                id="gender"
                value={customerInfo.gender}
                onChange={(e) => setCustomerInfo({ ...customerInfo, gender: e.target.value as CustomerInfo['gender'] })}
                className="w-full h-12 px-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer hover:border-blue-400 transition-colors"
                style={{
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment - Only show for paid events */}
      {getTotalAmount() > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>

          {/* Apple Pay Button */}
          {canMakePayment && paymentRequest && (
            <div className="mb-4">
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      theme: 'dark',
                      height: '48px',
                    },
                  },
                }}
              />
              <div className="text-center text-sm text-gray-500 mt-2">
                or pay with card below
              </div>
            </div>
          )}

          {/* Card Payment */}
          <div className="border rounded-lg p-4">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Free Event Notice - Only show if event has free tickets and user has selected free tickets */}
      {hasFreeTickets() && isAllFreeTickets() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Free Event</h4>
              <p className="text-sm text-green-700">No payment required. Your tickets will be sent to your email after confirmation.</p>
            </div>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2">
          {ticketSelections
            .filter(s => s.quantity > 0)
            .map((selection) => (
              <div key={selection.tierId} className="flex justify-between text-sm">
                <span>{selection.quantity}x {selection.tier.name}</span>
                <span>£{((selection.tier.price * selection.quantity) / 100).toFixed(2)}</span>
              </div>
            ))}
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>£{((ticketSelections.reduce((total, selection) => total + (selection.tier.price * selection.quantity), 0)) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Processing Fee</span>
              <span>£1.50</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>£{(getTotalAmount() / 100).toFixed(2)}</span>
            </div>
          </div>
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
        disabled={isProcessing || getTotalTickets() === 0 || (getTotalAmount() > 0 && (!stripe || !elements))}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="ml-2">
              {isAllFreeTickets() ? 'Processing Order...' : 'Processing Payment...'}
            </span>
          </>
        ) : (
          <>
            {isAllFreeTickets() ? (
              <>
                <CheckCircle className="h-5 w-5" />
                <span className="ml-2">Get Free Tickets</span>
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                <span className="ml-2">Pay £{(getTotalAmount() / 100).toFixed(2)}</span>
              </>
            )}
          </>
        )}
      </button>

      {/* Loading Overlay */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-gray-700">
              {isAllFreeTickets() ? 'Processing your order...' : 'Processing your payment...'}
            </p>
            <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
          </div>
        </motion.div>
      )}

      {/* Security Notice - Only show for paid events */}
      {getTotalAmount() > 0 && (
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            Secure payment powered by Stripe
          </div>
        </div>
      )}
    </form>
  );
};

const Checkout = ({ event, onClose, onSuccess }: CheckoutProps) => {
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
              <h2 className="text-2xl font-bold text-gray-900">Buy Tickets</h2>
              <p className="text-gray-600">{event.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm
              event={event}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </Elements>
        </div>
      </motion.div>
    </div>
  );
};

export default Checkout;
