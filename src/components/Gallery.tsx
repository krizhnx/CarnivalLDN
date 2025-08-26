import { motion } from 'framer-motion'
import { useGlitchEffect } from '../hooks/useGlitchEffect'
import Footer from './Footer'

const galleryImages = [
  {
    id: '1',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201990/_DSC8186-min_jzvcgg.jpg',
    alt: 'Event photography - DSC8186'
  },
  {
    id: '2',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201990/_DSC8702-Edit_1_-min_mk9qdi.jpg',
    alt: 'Event photography - DSC8702'
  },
  {
    id: '3',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201989/_DSC8327-Edit-min_ogv4qm.jpg',
    alt: 'Event photography - DSC8327'
  },
  {
    id: '4',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201988/_DSC8059-min_xoupnm.jpg',
    alt: 'Event photography - DSC8059'
  },
  {
    id: '5',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201987/_DSC7965-Edit-min_k5uqwc.jpg',
    alt: 'Event photography - DSC7965'
  },
  {
    id: '6',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201457/IMG_6073_1_bpf2ic.jpg',
    alt: 'Event photography - IMG_6073'
  },
  {
    id: '7',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201228/IMG_6075_v67xz7.jpg',
    alt: 'Event photography - IMG_6075'
  },
  {
    id: '8',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201228/IMG_6070_1_w5mhof.jpg',
    alt: 'Event photography - IMG_6070'
  },
  {
    id: '9',
    src: 'https://res.cloudinary.com/dg9reru4s/image/upload/v1756201227/DSC02821_uw11th.jpg',
    alt: 'Event photography - DSC02821'
  }
]

const Gallery = () => {
  // Glitch effect for title
  const { glitchRef, isGlitching, glitchType } = useGlitchEffect();

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="pt-40 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h1
            ref={glitchRef}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className={`text-5xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 pb-1 glitch-text ${isGlitching ? `glitch-active glitch-${glitchType}` : ''}`}
            data-text="GALLERY"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}
          >
            GALLERY
          </motion.h1>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-lg cursor-pointer"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Gallery
