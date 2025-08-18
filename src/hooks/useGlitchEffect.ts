import { useEffect, useRef, useState } from 'react'

export const useGlitchEffect = () => {
  const glitchRef = useRef<HTMLHeadingElement>(null)
  const [isGlitching, setIsGlitching] = useState(false)
  const [glitchType, setGlitchType] = useState<'upper' | 'lower' | 'full'>('full')
  
  // Random glitch effect with varied types
  useEffect(() => {
    const triggerRandomGlitch = () => {
      if (glitchRef.current) {
        // Randomly choose glitch type: upper half, lower half, or full text
        const types: ('upper' | 'lower' | 'full')[] = ['upper', 'lower', 'full']
        const randomType = types[Math.floor(Math.random() * types.length)]
        setGlitchType(randomType)
        
        setIsGlitching(true)

        // Remove the glitch class after the animation duration (0.2s)
        setTimeout(() => {
          setIsGlitching(false)
        }, 200)

        // Schedule next glitch at random interval between 0.1-0.6 seconds for more frequent glitches
        const nextGlitchDelay = Math.random() * 500 + 100
        setTimeout(triggerRandomGlitch, nextGlitchDelay)
      }
    }

    // Start the first glitch after a short delay
    const initialDelay = setTimeout(() => {
      triggerRandomGlitch()
    }, 100) // 2 second initial delay to let the page load

    return () => {
      clearTimeout(initialDelay)
    }
  }, [])

  return {
    glitchRef,
    isGlitching,
    glitchType
  }
}
