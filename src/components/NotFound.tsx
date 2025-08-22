import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { trackPageView } from '../lib/googleAnalytics'

const NotFound = () => {
  useEffect(() => {
    // Track 404 page view
    trackPageView('/404', 'Carnival LDN - Page Not Found')
  }, [])

  return (
    <div className="h-screen md:min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden pt-0 md:pt-0">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="text-center relative z-10 max-w-2xl mx-auto -mt-16 md:mt-0">
        {/* Carnival Logo */}
        <div className="mb-8 md:mb-12 flex justify-center">
          <img
            src="/carnival-logo-w.svg"
            alt="Carnival LDN Logo"
            className="w-16 h-16 md:w-24 md:h-24 object-contain"
          />
        </div>
        
        {/* 404 Number */}
        <div className="text-6xl md:text-9xl font-bold text-white/30 mb-6 md:mb-8 select-none font-mono">
          404
        </div>
        
        {/* Main Message */}
        <h1 className="text-2xl md:text-5xl font-bold text-white mb-4 md:mb-6 tracking-tight">
          Page Not Found
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-xl text-gray-400 mb-8 md:mb-10 max-w-md mx-auto leading-relaxed px-4">
          The page you're looking for seems to have wandered off to join the carnival elsewhere.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-3 md:gap-4 justify-center items-center px-4">
          <Link
            to="/"
            className="w-full max-w-xs md:max-w-none px-8 py-3 md:py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-white text-center"
          >
            Go Home
          </Link>
          
          <Link
            to="/events"
            className="w-full max-w-xs md:max-w-none px-8 py-3 md:py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transform hover:scale-105 transition-all duration-200 text-center"
          >
            Browse Events
          </Link>
        </div>
        

      </div>
    </div>
  )
}

export default NotFound
