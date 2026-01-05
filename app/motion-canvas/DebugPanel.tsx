'use client'

import { useState, useEffect } from 'react'
import { RuntimeConfig } from '@/lib/constellation/config'
import styles from './DebugPanel.module.css'

interface DebugPanelProps {
  config: RuntimeConfig
  onConfigChange: (config: RuntimeConfig) => void
  system: any // ConstellationSystem
}

export default function DebugPanel({ config, onConfigChange, system }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<RuntimeConfig>({ ...config })

  useEffect(() => {
    setLocalConfig({ ...config })
  }, [config])

  const updateConfig = (key: keyof RuntimeConfig, value: number | boolean) => {
    const newConfig = { ...localConfig, [key]: value }
    setLocalConfig(newConfig)
    onConfigChange(newConfig)
  }

  return (
    <div className={styles.panelContainer}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '▼' : '▲'} Debug
      </button>
      
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.section}>
            <h3>Nodes</h3>
            <label>
              Count: {localConfig.nodeCount}
              <input
                type="range"
                min="10"
                max="50"
                value={localConfig.nodeCount}
                onChange={(e) => updateConfig('nodeCount', parseInt(e.target.value))}
              />
            </label>
            <label>
              Drift Speed: {localConfig.nodeDriftSpeed.toFixed(2)}
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={localConfig.nodeDriftSpeed}
                onChange={(e) => updateConfig('nodeDriftSpeed', parseFloat(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>Cursor</h3>
            <label>
              Influence Radius: {localConfig.cursorInfluenceRadius}
              <input
                type="range"
                min="50"
                max="200"
                value={localConfig.cursorInfluenceRadius}
                onChange={(e) => updateConfig('cursorInfluenceRadius', parseInt(e.target.value))}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={localConfig.showCometCursor}
                onChange={(e) => updateConfig('showCometCursor', e.target.checked)}
              />
              Show Comet Cursor
            </label>
            <label>
              <input
                type="checkbox"
                checked={localConfig.showNativeCursor}
                onChange={(e) => updateConfig('showNativeCursor', e.target.checked)}
              />
              Show Native Cursor
            </label>
            <label>
              Tether Count: {localConfig.tetherCount}
              <input
                type="range"
                min="1"
                max="5"
                value={localConfig.tetherCount}
                onChange={(e) => updateConfig('tetherCount', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>Connections</h3>
            <label>
              Connection Radius: {localConfig.nodeConnectionRadius}
              <input
                type="range"
                min="50"
                max="200"
                value={localConfig.nodeConnectionRadius}
                onChange={(e) => updateConfig('nodeConnectionRadius', parseInt(e.target.value))}
              />
            </label>
            <label>
              Max per Node: {localConfig.maxConnectionsPerNode}
              <input
                type="range"
                min="1"
                max="5"
                value={localConfig.maxConnectionsPerNode}
                onChange={(e) => updateConfig('maxConnectionsPerNode', parseInt(e.target.value))}
              />
            </label>
            <label>
              Max Total Edges: {localConfig.maxTotalEdges}
              <input
                type="range"
                min="20"
                max="100"
                value={localConfig.maxTotalEdges}
                onChange={(e) => updateConfig('maxTotalEdges', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>Memory</h3>
            <label>
              Energy Decay (s): {localConfig.energyDecaySeconds.toFixed(1)}
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={localConfig.energyDecaySeconds}
                onChange={(e) => updateConfig('energyDecaySeconds', parseFloat(e.target.value))}
              />
            </label>
            <label>
              Trail Length: {localConfig.trailLength}
              <input
                type="range"
                min="0"
                max="50"
                value={localConfig.trailLength}
                onChange={(e) => updateConfig('trailLength', parseInt(e.target.value))}
              />
            </label>
          </div>

          <div className={styles.section}>
            <h3>Physics</h3>
            <label>
              Cursor Repulsion: {localConfig.cursorRepulsionStrength.toFixed(2)}
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={localConfig.cursorRepulsionStrength}
                onChange={(e) => updateConfig('cursorRepulsionStrength', parseFloat(e.target.value))}
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

