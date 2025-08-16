import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Lock, CheckCircle, Loader2 } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Event, TicketTier, Order } from '../types';
import { formatPrice } from '../lib/stripe';

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

const CheckoutForm = ({ event, onClose, onSuccess }: CheckoutProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'tickets' | 'customer' | 'payment' | 'processing'>('tickets');
  const [progress, setProgress] = useState(0);

  // Initialize ticket selections with all tiers so sold-out/disabled still display
  useEffect(() => {
    console.log('Event ticket tiers:', event.ticketTiers);
    if (event.ticketTiers && event.ticketTiers.length > 0) {
      const initialSelections = event.ticketTiers.map(tier => ({
        tierId: tier.id,
        tier,
        quantity: 0,
      }));
      setTicketSelections(initialSelections);
    }
  }, [event]);

  const updateTicketQuantity = (tierId: string, quantity: number) => {
    setTicketSelections(prev => 
      prev.map(selection => 
        selection.tierId === tierId 
          ? { ...selection, quantity: Math.max(0, quantity) }
          : selection
      )
    );
  };

  const getTotalAmount = () => {
    return ticketSelections.reduce((total, selection) => {
      return total + (selection.tier.price * selection.quantity);
    }, 0);
  };

  const getTotalTickets = () => {
    return ticketSelections.reduce((total, selection) => total + selection.quantity, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    if (getTotalTickets() === 0) {
      setError('Please select at least one ticket.');
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      setError('Please fill in your name and email.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          tickets: ticketSelections.filter(s => s.quantity > 0),
          customerInfo,
          totalAmount: getTotalAmount(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
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
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          onSuccess(order);
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
      {/* Ticket Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Tickets</h3>
        {purchasableTiers.length === 0 && (
          <div className="mb-4 text-sm text-red-600">This event is sold out.</div>
        )}
        <div className="space-y-4">
          {(event.ticketTiers || []).map((tier) => {
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
                        <div className="text-sm text-gray-500">{remaining} available</div>
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
          <input
            type="text"
            placeholder="Full Name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Payment */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>
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
        disabled={!stripe || isProcessing || getTotalTickets() === 0}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="ml-2">Processing Payment...</span>
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" />
            <span className="ml-2">Pay £{(getTotalAmount() / 100).toFixed(2)}</span>
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
            <p className="text-lg font-semibold text-gray-700">Processing your payment...</p>
            <p className="text-sm text-gray-500 mt-2">Please don't close this window</p>
          </div>
        </motion.div>
      )}

      <div className="text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          Secure payment powered by Stripe
        </div>
      </div>
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
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step 1 of 3</span>
              <span className="text-sm text-gray-500">Select Tickets</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                initial={{ width: 0 }}
                animate={{ width: "33%" }}
              />
            </div>
          </div>
          
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
