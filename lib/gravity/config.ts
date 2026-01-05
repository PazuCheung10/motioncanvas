// ============================================================================
// GRAVITY STARS CONFIGURATION
// ============================================================================

// ============================================================================
// CORE PHYSICS PARAMETERS (Exposed for easy tuning)
// ============================================================================

export const LAUNCH_STRENGTH = 1.0 // Multiplier for launch velocity (try: 0.3-2.0) - 1.0 means compressed speed is final speed
export const MASS_RESISTANCE_FACTOR = 0.3 // How much mass resists acceleration (0-1, higher = larger stars launch slower)
export const GRAVITY_CONSTANT = 5000 // Gravitational constant (scaled for pixel units, try: 10000-40000)
export const MAX_STAR_SIZE = 12 // DEPRECATED: kept for backward compatibility
export const RADIUS_SCALE = 1.2 // Visual scale: radius = mass^radiusPower * radiusScale
export const RADIUS_POWER = 0.5 // Power for radius: 0.5 = sqrt (2D area), 0.333 = cbrt (3D volume)

// Energy conservation (default: no damping)
export const VELOCITY_DAMPING = 0 // Set to 0 for stable orbits (or 1e-6 for tiny decay)

// Gravity softening (Plummer softening)
export const SOFTENING_EPS_PX = 3 // Softening parameter in pixels (prevents near-distance explosions)
export const MAX_FORCE_MAGNITUDE = 1000 // Optional: clamp force magnitude to prevent insane impulses

// Launch velocity (flick measurement)
export const FLICK_WINDOW_MS = 70 // Time window to measure flick speed (milliseconds before release)
export const FLICK_S0 = 400 // Speed compressor scale parameter (pixels/second) - increased for higher speeds
export const FLICK_VMAX = 1600 // Maximum compressed speed (pixels/second) - allows natural interaction speeds

// Mass growth
export const HOLD_TO_MAX_SECONDS = 1.5 // Time to hold to reach max mass (seconds)
export const MIN_MASS = 1
export const MAX_MASS = 10

// Angular Momentum Guidance (LAUNCH ASSIST ONLY)
export const ANGULAR_GUIDANCE_STRENGTH = 0.6 // How strongly to guide toward orbital motion at launch (0-1)
export const RADIAL_CLAMP_FACTOR = 0.5 // How much to clamp excessive radial velocity at launch (0-1)
export const ORBITAL_CENTER_SEARCH_RADIUS = 300 // How far to search for orbital center (pixels)

// ============================================================================

export interface GravityConfig {
  // Launch physics
  launchStrength: number
  massResistanceFactor: number
  
  // Gravity physics
  gravityConstant: number
  velocityDamping: number
  
  // Gravity softening
  softeningEpsPx: number
  maxForceMagnitude: number
  
  // Launch velocity (flick)
  flickWindowMs: number
  flickS0: number
  flickVmax: number
  
  // Mass growth
  holdToMaxSeconds: number
  minMass: number
  maxMass: number
  radiusScale: number
  radiusPower: number
  
  // Angular Momentum Guidance (launch assist only)
  angularGuidanceStrength: number
  radialClampFactor: number
  orbitalCenterSearchRadius: number
  
  // Visual
  glowRadiusMultiplier: number
  opacityMultiplier: number
  starTrailLength: number
  starTrailFadeTime: number
  
  // Comet cursor
  cometHeadSize: number
  cometHeadGlow: number
  cometTailLength: number
  cometTailOpacity: number
  cometTailFadeRate: number
  
  // Creation feedback
  creationRippleDuration: number
  creationRippleMaxRadius: number
  
  // Performance
  maxStars: number
  
  // Optional features
  enableMerging: boolean
  enableOrbitTrails: boolean
  orbitTrailFadeTime: number
  
  // DEPRECATED (kept for compatibility)
  maxStarSize: number
  starMinRadius: number
  starGrowthRate: number
  starMinMass: number
  starMaxMass: number
  cursorVelocitySamples: number
  minDistance: number
  starGlowRadius: number
  starBaseOpacity: number
  mergeDistance: number
}

export const GRAVITY_CONFIG: GravityConfig = {
  // Launch physics
  launchStrength: LAUNCH_STRENGTH,
  massResistanceFactor: MASS_RESISTANCE_FACTOR,
  
  // Gravity physics
  gravityConstant: GRAVITY_CONSTANT,
  velocityDamping: VELOCITY_DAMPING,
  
  // Gravity softening
  softeningEpsPx: SOFTENING_EPS_PX,
  maxForceMagnitude: MAX_FORCE_MAGNITUDE,
  
  // Launch velocity (flick)
  flickWindowMs: FLICK_WINDOW_MS,
  flickS0: FLICK_S0,
  flickVmax: FLICK_VMAX,
  
  // Mass growth
  holdToMaxSeconds: HOLD_TO_MAX_SECONDS,
  minMass: MIN_MASS,
  maxMass: MAX_MASS,
  radiusScale: RADIUS_SCALE,
  radiusPower: RADIUS_POWER,
  
  // Angular Momentum Guidance
  angularGuidanceStrength: ANGULAR_GUIDANCE_STRENGTH,
  radialClampFactor: RADIAL_CLAMP_FACTOR,
  orbitalCenterSearchRadius: ORBITAL_CENTER_SEARCH_RADIUS,
  
  // Visual
  glowRadiusMultiplier: 2.5,
  opacityMultiplier: 0.08,
  starTrailLength: 15,
  starTrailFadeTime: 0.5,
  
  // Comet cursor
  cometHeadSize: 4,
  cometHeadGlow: 15,
  cometTailLength: 25,
  cometTailOpacity: 0.6,
  cometTailFadeRate: 0.15,
  
  // Creation feedback
  creationRippleDuration: 0.3,
  creationRippleMaxRadius: 50,
  
  // Performance
  maxStars: 60,
  
  // Optional features
  enableMerging: true,
  enableOrbitTrails: false,
  orbitTrailFadeTime: 1.0,
  
  // DEPRECATED (kept for compatibility)
  maxStarSize: MAX_STAR_SIZE,
  starMinRadius: 3,
  starGrowthRate: 8,
  starMinMass: MIN_MASS,
  starMaxMass: MAX_MASS,
  cursorVelocitySamples: 8,
  minDistance: 5,
  starGlowRadius: 20,
  starBaseOpacity: 0.8,
  mergeDistance: 5,
}
