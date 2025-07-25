import { motion } from 'framer-motion'

const ParticleBackground = () => {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    size: Math.random() * 200 + 50,
    duration: Math.random() * 25 + 20,
    delay: Math.random() * 10,
    x: Math.random() * 100,
    y: Math.random() * 100,
  }))

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-5"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle,
              ${particle.id % 3 === 0 ? 'rgb(107, 114, 128)' :
                particle.id % 3 === 1 ? 'rgb(75, 85, 99)' :
                'rgb(156, 163, 175)'
              } 0%, transparent 70%)`,
          }}
          animate={{
            x: [0, 50, -25, 0],
            y: [0, -50, 25, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Clean overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-white opacity-90" />
    </div>
  )
}

export default ParticleBackground
