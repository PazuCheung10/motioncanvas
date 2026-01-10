'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { GravityConfig, GRAVITY_CONFIG } from '@/lib/gravity/config'
import styles from './GravityDebugPanel.module.css'

interface GravityDebugPanelProps {
  config: GravityConfig
  onConfigChange: (config: GravityConfig) => void
  starCount: number
  onClearStars?: () => void
  onRandomizeStars?: () => void
  onSaveState?: () => void
  energyStats?: {
    kinetic: number
    potential: number
    total: number
    history: number[]
    trend: 'stable' | 'decreasing' | 'increasing'
  } | null
}

export default function GravityDebugPanel({ config, onConfigChange, starCount, onClearStars, onRandomizeStars, onSaveState, energyStats }: GravityDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<GravityConfig>({ ...config })
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    setLocalConfig({ ...config })
  }, [config])

  const updateConfig = (key: keyof GravityConfig, value: number | boolean) => {
    // Clamp gravity constant to valid range and round to nearest 50
    if (key === 'gravityConstant' && typeof value === 'number') {
      value = Math.max(0, Math.min(5000, value))
      value = Math.round(value / 50) * 50 // Round to nearest multiple of 50
    }
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  const handleHelpMouseEnter = (e: React.MouseEvent<HTMLSpanElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top - 8, // above the ?
    })
  }

  const handleHelpMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <div className={styles.panelContainer}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? 'Hide panel' : 'Show panel'}
      >
        {isOpen ? '▼' : '▲'}
      </button>
      
      {isOpen && (
        <div className={styles.panel}>
          {tooltip &&
            createPortal(
              <div
                className={styles.tooltip}
                style={{
                  position: 'fixed',
                  left: tooltip.x,
                  top: tooltip.y,
                  transform: 'translate(-50%, -100%)',
                  zIndex: 9999,
                }}
              >
                {tooltip.text.split('\n').map((line, i) => (
                  <div key={i}>{line.trim()}</div>
                ))}
              </div>,
              document.body
            )}
          <div className={styles.info}>
            <strong>Stars:</strong> {starCount} / {config.maxStars}
          </div>

          {/* Energy Debug Overlay */}
          {energyStats && (
            <div className={styles.debugStats} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '8px', borderRadius: '4px', marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#ffff00' }}>Energy Debug</div>
              <div className={styles.debugStatsContent}>
                <div className={styles.debugStatRow}>
                  <span className={styles.debugStatLabel}>Kinetic (K):</span>
                  <span className={styles.debugStatValue}>{energyStats.kinetic.toFixed(2)}</span>
                </div>
                <div className={styles.debugStatRow}>
                  <span className={styles.debugStatLabel}>Potential (U):</span>
                  <span className={styles.debugStatValue}>{energyStats.potential.toFixed(2)}</span>
                </div>
                <div className={styles.debugStatRow}>
                  <span className={styles.debugStatLabel}>Total (E=K+U):</span>
                  <span className={styles.debugStatValue} style={{ 
                    color: energyStats.trend === 'decreasing' ? '#ff0000' : 
                           energyStats.trend === 'increasing' ? '#00ff00' : '#ffffff'
                  }}>
                    {energyStats.total.toFixed(2)}
                  </span>
                </div>
                {energyStats.history.length > 10 && (
                  <div className={styles.debugStatRow} style={{ fontSize: '0.85em', marginTop: '4px' }}>
                    <span className={styles.debugStatLabel}>Trend:</span>
                    <span className={styles.debugStatValue} style={{
                      color: energyStats.trend === 'decreasing' ? '#ff0000' : 
                             energyStats.trend === 'increasing' ? '#00ff00' : '#ffff00'
                    }}>
                      {energyStats.trend === 'decreasing' ? '↓ DECREASING' : 
                       energyStats.trend === 'increasing' ? '↑ INCREASING' : '→ STABLE'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.section}>
            <h3>Controls</h3>
            <div className={styles.controlsRow}>
              {onSaveState && (
                <button
                  onClick={onSaveState}
                  className={styles.controlButton}
                  style={{
                    backgroundColor: 'rgba(50, 150, 50, 0.3)',
                    color: 'white',
                    border: '1px solid rgba(50, 150, 50, 0.5)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(50, 150, 50, 0.5)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(50, 150, 50, 0.3)'}
                >
                  💾 Save
                </button>
              )}
              {onRandomizeStars && (
                <button
                  onClick={onRandomizeStars}
                  className={styles.controlButton}
                  style={{
                    backgroundColor: 'rgba(120, 80, 255, 0.35)',
                    color: 'white',
                    border: '1px solid rgba(120, 80, 255, 0.6)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(120, 80, 255, 0.55)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(120, 80, 255, 0.35)'}
                >
                  Add Random (10-30)
                </button>
              )}
              {onClearStars && (
                <button
                  onClick={onClearStars}
                  className={styles.controlButton}
                  style={{
                    backgroundColor: '#ff4444',
                    color: 'white'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ff6666'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ff4444'}
                >
                  Clear ({starCount})
                </button>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h3>
              Orbit Factor
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Controls initial orbit shape\n↑ = more elliptical, faster escape\n1.0 = perfect circular orbit")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Orbit Factor: {localConfig.orbitFactor.toFixed(2)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Multiplier for initial orbital velocity (0.7-1.3, 1.0 = circular)
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={localConfig.orbitFactor}
                onChange={(e) => updateConfig('orbitFactor', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Core Physics
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Launch Strength: ↑ = faster launches\nMass Resistance: ↑ = big stars launch slower\nGravity Constant: ↑ = tighter orbits, faster collapse\nPhysics: G in F = G·m1·m2 / r²\nVelocity Damping: ↑ = system cools over time\n0 = true energy conservation\nPotential Energy Degree: Controls how gravity falls with distance\n2.0 = real Newtonian gravity")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Launch Strength: {localConfig.launchStrength.toFixed(2)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                1.0 = compressed speed is final speed (before mass resistance)
              </div>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={localConfig.launchStrength}
                onChange={(e) => updateConfig('launchStrength', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Mass Resistance: {localConfig.massResistanceFactor.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.massResistanceFactor}
                onChange={(e) => updateConfig('massResistanceFactor', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Gravity Constant: {localConfig.gravityConstant}
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={localConfig.gravityConstant}
                onChange={(e) => updateConfig('gravityConstant', parseInt(e.target.value))}
              />
            </label>
            <label>
              Velocity Damping: {localConfig.velocityDamping.toFixed(6)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Set to 0 for energy conservation
              </div>
              <input
                type="range"
                min="0"
                max="0.0001"
                step="0.000001"
                value={localConfig.velocityDamping}
                onChange={(e) => updateConfig('velocityDamping', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Potential Energy Degree: {localConfig.potentialEnergyDegree.toFixed(1)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Power law: U = -G*m1*m2 / r^(degree-1), F = G*m1*m2*(degree-1) / r^degree
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={localConfig.potentialEnergyDegree}
                onChange={(e) => updateConfig('potentialEnergyDegree', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Gravity Softening
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Softening Epsilon: Prevents explosions when stars get too close\n↑ = smoother but less accurate\nMax Force: Clamps extreme accelerations\n0 = disabled (may break energy conservation)")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Softening Epsilon: {localConfig.softeningEpsPx.toFixed(1)} px
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Plummer softening parameter (prevents near-distance explosions)
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={localConfig.softeningEpsPx}
                onChange={(e) => updateConfig('softeningEpsPx', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Max Force: {localConfig.maxForceMagnitude}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Clamp force magnitude (0 = disabled)
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={localConfig.maxForceMagnitude}
                onChange={(e) => updateConfig('maxForceMagnitude', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Launch Velocity
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Window: How long to track cursor movement\n↑ = smoother but slower response\nS0: Speed compression threshold\nVmax: Maximum launch speed cap")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Window: {localConfig.flickWindowMs}ms
              <input
                type="range"
                min="30"
                max="150"
                step="10"
                value={localConfig.flickWindowMs}
                onChange={(e) => updateConfig('flickWindowMs', parseInt(e.target.value))}
              />
            </label>
            <label>
              S0: {localConfig.flickS0}
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={localConfig.flickS0}
                onChange={(e) => updateConfig('flickS0', parseInt(e.target.value))}
              />
            </label>
            <label>
              Vmax: {localConfig.flickVmax}
              <input
                type="range"
                min="200"
                max="1600"
                step="50"
                value={localConfig.flickVmax}
                onChange={(e) => updateConfig('flickVmax', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Mass Growth
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Hold to Max: Time to reach maximum mass\n↑ = slower growth\nMin/Max Mass: Size range for new stars\nRadius Scale: ↑ = bigger stars\nRadius Power: Controls size scaling\n0.5 = 2D area, 0.333 = 3D volume")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Hold to Max: {localConfig.holdToMaxSeconds.toFixed(1)}s
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={localConfig.holdToMaxSeconds}
                onChange={(e) => updateConfig('holdToMaxSeconds', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Min Mass: {localConfig.minMass.toFixed(1)}
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={localConfig.minMass}
                onChange={(e) => updateConfig('minMass', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Max Mass: {localConfig.maxMass.toFixed(1)}
              <input
                type="range"
                min="5"
                max="20"
                step="1"
                value={localConfig.maxMass}
                onChange={(e) => updateConfig('maxMass', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Radius Scale: {localConfig.radiusScale.toFixed(2)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                radius = mass^{localConfig.radiusPower.toFixed(2)} × radiusScale
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={localConfig.radiusScale}
                onChange={(e) => updateConfig('radiusScale', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Radius Power: {localConfig.radiusPower.toFixed(3)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                0.5 = sqrt (2D area), 0.333 = cbrt (3D volume)
              </div>
              <input
                type="range"
                min="0.3"
                max="0.7"
                step="0.01"
                value={localConfig.radiusPower}
                onChange={(e) => updateConfig('radiusPower', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Angular Guidance (Launch Assist Only)
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Guidance Strength: Helps launches form orbits\n↑ = more circular, less radial\n0 = no guidance, 1 = pure tangential\nRadial Clamp: Reduces excessive inward/outward motion\nSearch Radius: How far to look for orbital center")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Guidance Strength: {localConfig.angularGuidanceStrength.toFixed(2)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Only applied at star creation
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.angularGuidanceStrength}
                onChange={(e) => updateConfig('angularGuidanceStrength', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Radial Clamp: {localConfig.radialClampFactor.toFixed(2)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                How much to clamp excessive radial velocity at launch
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localConfig.radialClampFactor}
                onChange={(e) => updateConfig('radialClampFactor', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Search Radius: {localConfig.orbitalCenterSearchRadius}
              <input
                type="range"
                min="100"
                max="600"
                step="50"
                value={localConfig.orbitalCenterSearchRadius}
                onChange={(e) => updateConfig('orbitalCenterSearchRadius', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Visual
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "Glow Radius Multiplier: ↑ = bigger halos around stars\nOpacity Multiplier: ↑ = more visible stars")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              Glow Radius Multiplier: {localConfig.glowRadiusMultiplier.toFixed(3)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Controls glow size: glow = baseGlow + mass^1.2 × multiplier
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={localConfig.glowRadiusMultiplier}
                onChange={(e) => updateConfig('glowRadiusMultiplier', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Opacity Multiplier: {localConfig.opacityMultiplier.toFixed(3)}
              <div className={styles.info} style={{ fontSize: '9px', marginTop: '2px' }}>
                Controls star opacity: opacity = mass × multiplier (clamped 0-1)
              </div>
              <input
                type="range"
                min="0"
                max="0.1"
                step="0.001"
                value={localConfig.opacityMultiplier}
                onChange={(e) => updateConfig('opacityMultiplier', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>
              Merging
              <span 
                className={styles.helpBadge}
                onMouseEnter={(e) => handleHelpMouseEnter(e, "When stars collide, they merge\nMomentum conserved, energy lost\nDisable for pure physics validation")}
                onMouseLeave={handleHelpMouseLeave}
              >
                ?
              </span>
            </h3>
            <label>
              <input
                type="checkbox"
                checked={localConfig.enableMerging}
                onChange={(e) => updateConfig('enableMerging', e.target.checked)}
              />
              Enable Merging (stars merge when smaller star is inside larger star)
            </label>
          </div>

          <div className={styles.section}>
            <button 
              className={styles.resetButton}
              onClick={() => {
                const defaultConfig = { ...GRAVITY_CONFIG }
                onConfigChange(defaultConfig)
              }}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
