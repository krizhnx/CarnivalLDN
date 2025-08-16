import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Events from './components/Events'
import About from './components/About'
import Contact from './components/Contact'
import Footer from './components/Footer'
import ParticleBackground from './components/ParticleBackground'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import EventsPage from './components/EventsPage'
import { useAppStore } from './store/supabaseStore'

function HomePage() {
  const { events, getEvents, subscribeToEvents } = useAppStore()

  useEffect(() => {
    // Load events on mount
    getEvents()
    
    // Subscribe to real-time updates
    const subscription = subscribeToEvents()
    
    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [getEvents, subscribeToEvents])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      <Navbar />
      <Hero />
      <Events />
      <About />
      <Contact />
      <Footer />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/admin" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Analytics />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  )
}

export default App
