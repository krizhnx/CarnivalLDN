import { motion } from 'framer-motion'
import { cn } from '../lib/utils'
import Footer from './Footer'
import { SectionGlow, SectionHeading, sectionBg } from './ui/section'

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
  return (
    <div className={cn(sectionBg, 'min-h-screen')}>
      <SectionGlow />

      <div className="relative z-10 mx-auto max-w-6xl px-3 pb-16 pt-28 md:px-6 md:pb-24 md:pt-36 lg:px-8">
        <SectionHeading as="h1" title="GALLERY" pill="Moments from our nights out across London" />

        {/* 2-up on phones, 3-up on desktop; first shot spans wide as a hero tile */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (index % 3) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group relative overflow-hidden rounded-2xl bg-surface-2 ring-1 ring-white/10 md:rounded-3xl',
                index === 0 ? 'col-span-2 aspect-[16/10] md:row-span-2 md:aspect-auto' : 'aspect-[4/5]'
              )}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading={index < 3 ? 'eager' : 'lazy'}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Gallery
