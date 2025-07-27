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
