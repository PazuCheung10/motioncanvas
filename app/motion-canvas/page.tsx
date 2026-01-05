'use client'

import { useEffect, useRef, useState } from 'react'
import { GravitySystem } from '@/lib/gravity/gravity'
import { GRAVITY_CONFIG, GravityConfig } from '@/lib/gravity/config'
import GravityDebugPanel from './GravityDebugPanel'
import styles from './page.module.css'

export default function MotionCanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const systemRef = useRef<GravitySystem | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const [config, setConfig] = useState<GravityConfig>(GRAVITY_CONFIG)
  const [starCount, setStarCount] = useState(0)
  const [debugStats, setDebugStats] = useState<{
    holdDragSpeed: number
    releaseFlickSpeed: number
    compressedSpeed: number
    finalLaunchSpeed: number
    estimatedVCirc: number
    estimatedVEsc: number
  } | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize gravity system
    systemRef.current = new GravitySystem(canvasRef.current, config)

    // Update star count and debug stats periodically
    const lastStatsTimeRef = { current: 0 }
    const countInterval = setInterval(() => {
      if (systemRef.current) {
        setStarCount(systemRef.current.simulation.stars.length)
        const stats = systemRef.current.simulation.getDebugStats()
        if (stats) {
          const now = Date.now()
          // Only update stats if they're new (avoid unnecessary re-renders)
          if (now - lastStatsTimeRef.current > 50) { // Throttle to max 20fps for stats
            setDebugStats(stats)
            lastStatsTimeRef.current = now
            // Clear stats after 3 seconds
            setTimeout(() => setDebugStats(null), 3000)
          }
        }
      }
    }, 100)

    // Fade title after delay
    const timer = setTimeout(() => {
      if (titleRef.current) {
        titleRef.current.classList.add(styles.fadeOut)
      }
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearInterval(countInterval)
      if (systemRef.current) {
        systemRef.current.destroy()
      }
    }
  }, []) // Only initialize once

  // Update config when it changes
  useEffect(() => {
    if (systemRef.current) {
      systemRef.current.updateConfig(config)
    }
  }, [config])

  const handleConfigChange = (newConfig: GravityConfig) => {
    setConfig(newConfig)
  }

  return (
    <div className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={titleRef} className={styles.title}>
        Gravity Stars
      </div>
      <GravityDebugPanel
        config={config}
        onConfigChange={handleConfigChange}
        starCount={starCount}
        debugStats={debugStats}
      />
    </div>
  )
}

