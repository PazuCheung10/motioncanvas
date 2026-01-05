// ============================================================================
// CONSTANTS (Adjustable)
// ============================================================================

export interface RuntimeConfig {
  // Node settings
  nodeCount: number
  nodeSizeMin: number
  nodeSizeMax: number
  nodeGlowRadius: number
  nodeBaseOpacity: number
  nodeActiveOpacity: number
  
  // Connection settings
  cursorInfluenceRadius: number
  nodeConnectionRadius: number
  maxConnectionsPerNode: number
  maxTotalEdges: number
  lineWidth: number
  lineOpacityMin: number
  lineOpacityMax: number
  
  // Physics
  nodeDriftSpeed: number
  nodeDriftVariance: number
  connectionDecayRate: number
  connectionDistanceDecay: number
  
  // Energy / Memory system
  energyDecaySeconds: number
  energyGainRate: number
  energyMax: number
  
  // Cursor / Comet
  showCometCursor: boolean
  showNativeCursor: boolean
  cometHeadSize: number
  cometHeadGlow: number
  cometTailLength: number
  cometTailOpacity: number
  
  // Trail memory
  trailLength: number
  trailFadeTime: number
  trailTailOpacity: number
  
  // Tether
  tetherCount: number
  tetherOpacity: number
  
  // Node repulsion (optional)
  cursorRepulsionStrength: number
  
  // Wow moment (triangle/loop detection)
  wowPulseDuration: number
  wowGlowIntensity: number
  
  // Title fade
  titleFadeDelay: number
}

export const CONFIG: RuntimeConfig = {
  // Node settings
  nodeCount: 25,
  nodeSizeMin: 2,
  nodeSizeMax: 4,
  nodeGlowRadius: 8,
  nodeBaseOpacity: 0.3,
  nodeActiveOpacity: 0.8,
  
  // Connection settings
  cursorInfluenceRadius: 120,
  nodeConnectionRadius: 100,
  maxConnectionsPerNode: 3,
  maxTotalEdges: 50, // Cap total edges to prevent clutter
  lineWidth: 0.75,
  lineOpacityMin: 0.1,
  lineOpacityMax: 0.6,
  
  // Physics
  nodeDriftSpeed: 0.2,
  nodeDriftVariance: 0.1,
  connectionDecayRate: 0.02,
  connectionDistanceDecay: 0.5,
  
  // Energy / Memory system
  energyDecaySeconds: 1.2, // How long nodes stay active after cursor leaves
  energyGainRate: 2.0, // How fast energy builds up
  energyMax: 1.0,
  
  // Cursor / Comet
  showCometCursor: true,
  showNativeCursor: true,
  cometHeadSize: 3,
  cometHeadGlow: 12,
  cometTailLength: 20,
  cometTailOpacity: 0.4,
  
  // Trail memory
  trailLength: 30, // Number of trail points
  trailFadeTime: 1.0, // Seconds for trail to fade
  trailTailOpacity: 0.4, // Opacity of trail tail
  
  // Tether
  tetherCount: 2, // Number of nodes cursor directly connects to
  tetherOpacity: 0.8,
  
  // Node repulsion (optional)
  cursorRepulsionStrength: 0.0, // 0 = disabled, 0.1-0.5 = subtle repulsion
  
  // Wow moment (triangle/loop detection)
  wowPulseDuration: 450,
  wowGlowIntensity: 1.5,
  
  // Title fade
  titleFadeDelay: 3000,
}

