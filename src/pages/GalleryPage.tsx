import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import Gallery from '../components/Gallery'
import SEO from '../components/SEO'
import { initGA, trackPageView } from '../lib/googleAnalytics'

const GalleryPage = () => {
  useEffect(() => {
    initGA()
    trackPageView('/gallery', 'Carnival LDN - Gallery')
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SEO
        title="Gallery"
        description="Explore our event gallery showcasing Carnival LDN's most memorable moments."
        keywords="Carnival LDN gallery, event photos, London events gallery"
      />
      <Navbar />
      <Gallery />
    </div>
  )
}

export default GalleryPage
