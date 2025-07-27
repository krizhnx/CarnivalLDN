import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
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
import { useAppStore } from './store'

function HomePage() {
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
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/carnivalldn" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
                <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/admin/carnivalldn" element={<Login />} />
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
    </Router>
  )
}

export default App
