export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  image: string;
  description: string;
  capacity: string;
  rating: string;
  tags: string[];
  gradient: string;
  bookingUrl: string;
  createdAt: Date;
  updatedAt: Date;
  ticketTiers: TicketTier[];
  isArchived?: boolean;
}

export interface TicketTier {
  id: string;
  eventId: string; // Link to the event
  name: string; // e.g., "Early Bird", "VIP", "Student"
  price: number; // in pence/cents
  originalPrice?: number; // for showing discounts
  capacity: number;
  soldCount: number;
  availableFrom: Date;
  availableUntil: Date;
  description?: string;
  benefits?: string[]; // e.g., ["VIP seating", "Free drinks"]
  isActive: boolean;
}

export interface Order {
  id: string;
  eventId: string;
  userId: string;
  stripePaymentIntentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  totalAmount: number;
  currency: string;
  tickets: OrderTicket[];
  customerEmail: string;
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderTicket {
  id: string;
  orderId: string;
  ticketTierId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface EventFormData {
  title: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  description: string;
  capacity: string;
  tags: string;
  gradient: string;
  image: string;
  bookingUrl: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}
