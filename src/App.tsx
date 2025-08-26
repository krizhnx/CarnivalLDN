import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'
import { initGA, trackPageView } from './lib/googleAnalytics'
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
import ScannerPage from './pages/ScannerPage'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import GalleryPage from './pages/GalleryPage'
import NotFound from './components/NotFound'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsOfService from './components/TermsOfService'
import CookiePolicy from './components/CookiePolicy'
import SEO from './components/SEO'
import { useAppStore } from './store/supabaseStore'

function HomePage() {
  const { getEvents, subscribeToEvents } = useAppStore()

  useEffect(() => {
    // Initialize Google Analytics
    initGA()

    // Track page view
    trackPageView('/', 'Carnival LDN - Home')

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
      <SEO
        title="Home"
        description="Carnival LDN - London's premier professional events company. From club nights to corporate events, Bollywood parties to Diwali celebrations. Creating unforgettable experiences since 2014."
        keywords="Carnival LDN, London events, nightlife London, club nights London, Bollywood parties London, Diwali celebrations London, New Year parties London, corporate events London, private parties London, event planning London, London nightlife, London party planning"
      />
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
    <HelmetProvider>
      <Router>
      <Routes>
                       <Route path="/" element={<HomePage />} />
               <Route path="/events" element={<EventsPage />} />
               <Route path="/gallery" element={<GalleryPage />} />
               <Route path="/admin" element={<Login />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/scanner"
          element={<ScannerPage />}
        />
        <Route
          path="/analytics"
          element={<AnalyticsDashboard />}
        />

        {/* Legal Pages */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />

        {/* Catch-all route for 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
      <Analytics />
      <SpeedInsights />
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
    </HelmetProvider>
  )
}

export default App
