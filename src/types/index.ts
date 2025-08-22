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
  // Add scan information
  scans?: TicketScan[];
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

// NEW TYPES FOR TICKET SCANNING
export interface TicketScan {
  id: string;
  orderId: string;
  ticketTierId: string;
  customerEmail: string;
  eventId: string;
  scanType: 'entry' | 'exit';
  scannedAt: Date;
  scannedBy?: string;
  location?: string;
  notes?: string;
}

export interface TicketValidationResult {
  isValid: boolean;
  message: string;
  orderStatus: string;
  eventDate: string;
  customerName: string;
  customerEmail: string;
  eventId?: string;
  eventTitle?: string;
  ticketTierName?: string;
}

export interface QRCodeData {
  orderId: string;
  ticketTierId: string;
  quantity: number;
  customer: string;
}

// New interface for ticket search results
export interface TicketSearchResult {
  orderId: string;
  customerName: string;
  customerEmail: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  ticketTierName: string;
  quantity: number;
  totalPrice: number;
  orderStatus: string;
  orderDate: Date;
  scans: TicketScan[];
  lastScanTime?: Date;
  scanStatus: 'not_scanned' | 'scanned_in' | 'scanned_out' | 'scanned_both';
}

// Guestlist functionality
export interface Guestlist {
  id: string;
  eventId: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  totalTickets: number;
  notes?: string;
  qrCodeData: string;
  remainingScans: number;
  createdAt: Date;
  createdBy: string;
}

export interface GuestlistScan {
  id: string;
  guestlistId: string;
  eventId: string;
  scanType: 'entry' | 'exit';
  scannedAt: Date;
  scannedBy?: string;
  location?: string;
  notes?: string;
}

export interface GuestlistFormData {
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  totalTickets: number;
  notes?: string;
}

export interface GuestlistQRData {
  type: 'guestlist';
  guestlistId: string;
  eventId: string;
  totalTickets: number;
  leadEmail: string;
  leadName: string;
}
