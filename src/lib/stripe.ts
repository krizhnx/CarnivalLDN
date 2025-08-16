import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key
export const stripePublishableKey = 'pk_test_51OyBk9IgkIAGwv6wTnbqfLaivBQ0wYCltGf0gS4yeEZpxkD1f5jKEwarmr294R0LXNEzEMNxHuCKLRpMH8DYgaWD00g8BPRDAG';

// Initialize Stripe
export const stripePromise = loadStripe(stripePublishableKey);

// API endpoints
export const API_ENDPOINTS = {
  CREATE_PAYMENT_INTENT: '/api/create-payment-intent',
  CONFIRM_PAYMENT: '/api/confirm-payment',
  GET_ORDERS: '/api/orders',
};

// Currency formatting
export const formatPrice = (amount: number, currency: string = 'GBP') => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Convert from pence to pounds
};

// Convert price string to number (pence)
export const parsePrice = (price: string): number => {
  const numericPrice = parseFloat(price.replace(/[£,]/g, ''));
  return Math.round(numericPrice * 100); // Convert to pence
};
