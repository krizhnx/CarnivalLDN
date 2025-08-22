// Google Analytics 4 Service for Carnival LDN
// Replace 'GA_MEASUREMENT_ID' with your actual Google Analytics Measurement ID

export const GA_MEASUREMENT_ID = 'G-GW81WH5WJ0'; // Your actual Google Analytics 4 Measurement ID

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
      custom_map: {
        'custom_parameter_1': 'event_category',
        'custom_parameter_2': 'event_label'
      }
    });
  }
};

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title || document.title,
      page_location: window.location.origin + url
    });
  }
};

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
};

// E-commerce tracking
export const trackTicketView = (eventId: string, eventTitle: string, ticketTier?: string) => {
  trackEvent('view_item', 'tickets', `${eventTitle}${ticketTier ? ` - ${ticketTier}` : ''}`, 1);
  
  // Enhanced e-commerce tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'view_item', {
      currency: 'GBP',
      value: 0, // Will be updated when price is known
      items: [{
        item_id: eventId,
        item_name: eventTitle,
        item_category: 'Event Tickets',
        item_variant: ticketTier || 'General',
        currency: 'GBP',
        quantity: 1
      }]
    });
  }
};

export const trackAddToCart = (
  eventId: string,
  eventTitle: string,
  ticketTier: string,
  price: number,
  quantity: number
) => {
  trackEvent('add_to_cart', 'tickets', `${eventTitle} - ${ticketTier}`, quantity);
  
  // Enhanced e-commerce tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'GBP',
      value: price * quantity,
      items: [{
        item_id: eventId,
        item_name: eventTitle,
        item_category: 'Event Tickets',
        item_variant: ticketTier,
        price: price / 100, // Convert from pence to pounds
        currency: 'GBP',
        quantity: quantity
      }]
    });
  }
};

export const trackBeginCheckout = (
  eventId: string,
  eventTitle: string,
  totalValue: number,
  items: Array<{tier: string, price: number, quantity: number}>
) => {
  trackEvent('begin_checkout', 'checkout', eventTitle, totalValue);
  
  // Enhanced e-commerce tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'GBP',
      value: totalValue / 100,
      items: items.map(item => ({
        item_id: eventId,
        item_name: eventTitle,
        item_category: 'Event Tickets',
        item_variant: item.tier,
        price: item.price / 100,
        currency: 'GBP',
        quantity: item.quantity
      }))
    });
  }
};

export const trackPurchase = (
  orderId: string,
  eventId: string,
  eventTitle: string,
  totalValue: number,
  items: Array<{tier: string, price: number, quantity: number}>
) => {
  trackEvent('purchase', 'checkout', eventTitle, totalValue);
  
  // Enhanced e-commerce tracking
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      currency: 'GBP',
      value: totalValue / 100,
      tax: 0,
      shipping: 0,
      items: items.map(item => ({
        item_id: eventId,
        item_name: eventTitle,
        item_category: 'Event Tickets',
        item_variant: item.tier,
        price: item.price / 100,
        currency: 'GBP',
        quantity: item.quantity
      }))
    });
  }
};

// User interaction tracking
export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('click', 'button', `${buttonName} - ${location}`);
};

export const trackFormInteraction = (formName: string, action: 'start' | 'complete' | 'abandon') => {
  trackEvent(action, 'form', formName);
};

export const trackVideoInteraction = (videoName: string, action: 'play' | 'pause' | 'complete') => {
  trackEvent(action, 'video', videoName);
};

export const trackScrollDepth = (depth: number, page: string) => {
  if (depth % 25 === 0) { // Track at 25%, 50%, 75%, 100%
    trackEvent('scroll', 'engagement', `${page} - ${depth}%`);
  }
};

// User properties and demographics
export const setUserProperties = (properties: {
  user_type?: 'new' | 'returning';
  location?: string;
  device_type?: 'mobile' | 'desktop' | 'tablet';
  event_interest?: string[];
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      custom_map: {
        'user_type': 'user_type',
        'location': 'location',
        'device_type': 'device_type',
        'event_interest': 'event_interest'
      },
      user_type: properties.user_type,
      location: properties.location,
      device_type: properties.device_type,
      event_interest: properties.event_interest
    });
  }
};

// Enhanced e-commerce tracking for abandoned carts
export const trackCartAbandonment = (
  eventId: string,
  eventTitle: string,
  totalValue: number,
  items: Array<{tier: string, price: number, quantity: number}>
) => {
  trackEvent('cart_abandonment', 'ecommerce', eventTitle, totalValue);
  
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cart_abandonment', {
      currency: 'GBP',
      value: totalValue / 100,
      items: items.map(item => ({
        item_id: eventId,
        item_name: eventTitle,
        item_category: 'Event Tickets',
        item_variant: item.tier,
        price: item.price / 100,
        currency: 'GBP',
        quantity: item.quantity
      }))
    });
  }
};

// Performance tracking
export const trackPageLoadTime = (loadTime: number, page: string) => {
  trackEvent('page_load_time', 'performance', page, Math.round(loadTime));
};

// Error tracking
export const trackError = (errorMessage: string, errorCode?: string, page?: string) => {
  trackEvent('error', 'system', `${errorMessage}${errorCode ? ` - ${errorCode}` : ''}${page ? ` on ${page}` : ''}`);
};

// Export all tracking functions
export default {
  initGA,
  trackPageView,
  trackEvent,
  trackTicketView,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackButtonClick,
  trackFormInteraction,
  trackVideoInteraction,
  trackScrollDepth,
  setUserProperties,
  trackCartAbandonment,
  trackPageLoadTime,
  trackError
};
