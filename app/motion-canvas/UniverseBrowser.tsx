'use client'

import { useState, useEffect, useRef } from 'react'
import { GravityConfig, PhysicsMode } from '@/lib/gravity/config'
import { UNIVERSE_PRESETS, randomizeUniverse } from '@/lib/gravity/universe-presets'
import { GravitySimulation } from '@/lib/gravity/simulation'
// @ts-ignore - JSON import
import initialUniverseData from '@/initial-universe.json'
const initialUniverse = initialUniverseData as { width: number; height: number; stars: Array<{ x: number; y: number; mass: number }> }
import styles from './UniverseBrowser.module.css'

interface UniverseBrowserProps {
  onLoadUniverse: (config: GravityConfig) => void
  currentConfig: GravityConfig
}

export default function UniverseBrowser({ onLoadUniverse, currentConfig }: UniverseBrowserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const previewRefs = useRef<Array<HTMLCanvasElement | null>>([])
  const simulationRefs = useRef<Array<GravitySimulation | null>>([])
  const animationFrameRefs = useRef<Array<number | null>>([])

  // Initialize independent simulations for each universe
  useEffect(() => {
    if (isOpen) {
      previewRefs.current = []
      simulationRefs.current = []
      animationFrameRefs.current = []
      
      UNIVERSE_PRESETS.forEach((preset, index) => {
        // Create config
        const config: GravityConfig = {
          ...currentConfig,
          ...preset.config
        }
        
        // Create independent simulation for this universe
        const sim = new GravitySimulation(160, 120, config)
        simulationRefs.current[index] = sim
        
        // Initialize universe
        const initUniverse = () => {
          sim.loadUniverse({
            width: 160,
            height: 120,
            stars: initialUniverse.stars.map(s => ({
              x: s.x * (160 / initialUniverse.width),
              y: s.y * (120 / initialUniverse.height),
              mass: s.mass
            }))
          })
        }
        initUniverse()
      })
    }
    
    // Cleanup on unmount or close
    return () => {
      animationFrameRefs.current.forEach((frameId) => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId)
        }
      })
    }
  }, [isOpen, currentConfig])
  
  // Animation loop for each universe
  useEffect(() => {
    if (!isOpen) return
    
    const animate = () => {
      UNIVERSE_PRESETS.forEach((preset, index) => {
        const canvas = previewRefs.current[index]
        const sim = simulationRefs.current[index]
        
        if (canvas && sim) {
          sim.update(1/60)
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Draw
            ctx.fillStyle = '#0a0a0a'
            ctx.fillRect(0, 0, 160, 120)
            
            ctx.fillStyle = '#ffffff'
            for (const star of sim.stars) {
              ctx.beginPath()
              ctx.arc(star.x, star.y, Math.max(1, star.radius * (120 / initialUniverse.height)), 0, Math.PI * 2)
              ctx.fill()
            }
            
            if (sim.centralSun) {
              ctx.fillStyle = '#ffff00'
              ctx.beginPath()
              ctx.arc(sim.centralSun.x, sim.centralSun.y, Math.max(2, sim.centralSun.radius * (120 / initialUniverse.height)), 0, Math.PI * 2)
              ctx.fill()
            }
          }
        }
      })
      
      requestAnimationFrame(animate)
    }
    
    const frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [isOpen])
  
  // Reset a specific universe
  const handleResetUniverse = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    const sim = simulationRefs.current[index]
    if (sim) {
      // Reload initial universe
      sim.loadUniverse({
        width: 160,
        height: 120,
        stars: initialUniverse.stars.map(s => ({
          x: s.x * (160 / initialUniverse.width),
          y: s.y * (120 / initialUniverse.height),
          mass: s.mass
        }))
      })
    }
  }

  const handleLoadPreset = (presetIndex: number) => {
    const preset = UNIVERSE_PRESETS[presetIndex]
    const config: GravityConfig = {
      ...currentConfig,
      ...preset.config
    }
    onLoadUniverse(config)
    setSelectedPreset(presetIndex)
  }

  const handleRandomize = () => {
    const randomConfig = randomizeUniverse()
    const config: GravityConfig = {
      ...currentConfig,
      ...randomConfig
    }
    onLoadUniverse(config)
    setSelectedPreset(null)
  }

  return (
    <>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '▼' : '▶'} Universe Browser
      </button>
      
      {isOpen && (
        <div className={styles.browser}>
          <div className={styles.header}>
            <h3>Universe Gallery</h3>
            <button onClick={handleRandomize} className={styles.randomButton}>
              Randomize
            </button>
          </div>
          
          <div className={styles.grid}>
            {UNIVERSE_PRESETS.map((preset, index) => (
              <div
                key={index}
                className={`${styles.card} ${selectedPreset === index ? styles.selected : ''}`}
                onClick={() => handleLoadPreset(index)}
              >
                <div className={styles.preview}>
                  <canvas
                    ref={(el) => {
                      if (el) {
                        previewRefs.current[index] = el
                      }
                    }}
                    width={160}
                    height={120}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div className={styles.cardInfo}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4>{preset.name}</h4>
                    <button
                      onClick={(e) => handleResetUniverse(index, e)}
                      className={styles.resetButton}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        backgroundColor: '#333',
                        color: '#fff',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <p>{preset.description}</p>
                  <div className={styles.badges}>
                    <span className={styles.badge}>
                      {preset.config.physicsMode === PhysicsMode.ORBIT_PLAYGROUND ? 'Orbit' : 'N-Body'}
                    </span>
                    {preset.config.satellitesAttractEachOther && (
                      <span className={styles.badge}>Sat-Sat</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

