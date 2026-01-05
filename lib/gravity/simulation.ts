import { GravityConfig } from './config'
import { Star } from './star'

// Vector math helpers for angular momentum guidance
interface Vector2 {
  x: number
  y: number
}

function dot(v1: Vector2, v2: Vector2): number {
  return v1.x * v2.x + v1.y * v2.y
}

function length(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y)
}

function normalize(v: Vector2): Vector2 {
  const len = length(v)
  if (len === 0) return { x: 0, y: 0 }
  return { x: v.x / len, y: v.y / len }
}

function scale(v: Vector2, s: number): Vector2 {
  return { x: v.x * s, y: v.y * s }
}

function subtract(v1: Vector2, v2: Vector2): Vector2 {
  return { x: v1.x - v2.x, y: v1.y - v2.y }
}

function add(v1: Vector2, v2: Vector2): Vector2 {
  return { x: v1.x + v2.x, y: v1.y + v2.y }
}

// Find orbital center (nearest massive star or center of mass)
function findOrbitalCenter(
  position: Vector2,
  stars: Star[],
  searchRadius: number
): { center: Vector2; totalMass: number } | null {
  let nearestStar: Star | null = null
  let nearestDistance = Infinity
  
  // Find nearest massive star
  for (const star of stars) {
    const dx = star.x - position.x
    const dy = star.y - position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < searchRadius && distance < nearestDistance) {
      nearestStar = star
      nearestDistance = distance
    }
  }
  
  if (!nearestStar) return null
  
  // Check if there are other stars nearby to compute center of mass
  const nearbyStars: Star[] = [nearestStar]
  for (const star of stars) {
    if (star === nearestStar) continue
    const dx = star.x - position.x
    const dy = star.y - position.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < searchRadius) {
      nearbyStars.push(star)
    }
  }
  
  // Compute center of mass
  let totalMass = 0
  let weightedX = 0
  let weightedY = 0
  
  for (const star of nearbyStars) {
    totalMass += star.mass
    weightedX += star.x * star.mass
    weightedY += star.y * star.mass
  }
  
  if (totalMass === 0) return null
  
  return {
    center: { x: weightedX / totalMass, y: weightedY / totalMass },
    totalMass
  }
}

// Decompose velocity into radial and tangential components
function decomposeVelocity(
  position: Vector2,
  center: Vector2,
  velocity: Vector2
): { radial: Vector2; tangential: Vector2 } {
  // Vector from center to position
  const r = subtract(position, center)
  const rLen = length(r)
  
  if (rLen === 0) {
    // If at center, no decomposition possible
    return { radial: { x: 0, y: 0 }, tangential: velocity }
  }
  
  const rUnit = normalize(r)
  
  // Radial component (parallel to r)
  const radialMagnitude = dot(velocity, rUnit)
  const radial = scale(rUnit, radialMagnitude)
  
  // Tangential component (perpendicular to r)
  const tangential = subtract(velocity, radial)
  
  return { radial, tangential }
}

// Speed compressor: maps raw speed to compressed output
function compressSpeed(rawSpeed: number, s0: number, vmax: number): number {
  return vmax * (1 - Math.exp(-rawSpeed / s0))
}

export interface CreationRipple {
  x: number
  y: number
  time: number
  maxRadius: number
  duration: number
}

export class GravitySimulation {
  stars: Star[] = []
  config: GravityConfig
  width: number
  height: number
  
  // Star creation state
  isCreating: boolean = false
  creationX: number = 0
  creationY: number = 0
  creationStartTime: number = 0
  cursorHistory: Array<{ x: number; y: number; time: number }> = []
  
  // Visual effects
  ripples: CreationRipple[] = []
  
  // Debug stats
  debugStats: {
    holdDragSpeed: number
    releaseFlickSpeed: number
    compressedSpeed: number
    finalLaunchSpeed: number
    estimatedVCirc: number
    estimatedVEsc: number
  } | null = null

  constructor(width: number, height: number, config: GravityConfig) {
    this.width = width
    this.height = height
    this.config = config
  }

  updateConfig(config: GravityConfig): void {
    this.config = config
  }

  resize(width: number, height: number): void {
    this.width = width
    this.height = height
  }

  startCreation(x: number, y: number): void {
    if (this.stars.length >= this.config.maxStars) return
    
    this.isCreating = true
    this.creationX = x
    this.creationY = y
    this.creationStartTime = performance.now() / 1000
    this.cursorHistory = [{ x, y, time: this.creationStartTime }]
    this.debugStats = null
  }

  updateCreation(x: number, y: number): void {
    if (!this.isCreating) return
    
    const now = performance.now() / 1000
    this.creationX = x
    this.creationY = y
    
    // Track cursor movement for launch velocity
    this.cursorHistory.push({ x, y, time: now })
    
    // Keep only history within flick window
    const flickWindowSeconds = this.config.flickWindowMs / 1000
    const cutoff = now - flickWindowSeconds
    this.cursorHistory = this.cursorHistory.filter(point => point.time > cutoff)
    
    // Calculate hold drag speed (for debug)
    if (this.cursorHistory.length >= 2) {
      const recent = this.cursorHistory
      let totalDx = 0
      let totalDy = 0
      let totalDt = 0
      
      for (let i = 1; i < recent.length; i++) {
        const dt = recent[i].time - recent[i - 1].time
        if (dt > 0) {
          totalDx += (recent[i].x - recent[i - 1].x) / dt
          totalDy += (recent[i].y - recent[i - 1].y) / dt
          totalDt += dt
        }
      }
      
      if (totalDt > 0) {
        const avgVx = totalDx / (recent.length - 1)
        const avgVy = totalDy / (recent.length - 1)
        const holdDragSpeed = Math.sqrt(avgVx * avgVx + avgVy * avgVy)
        
        // Update debug stats
        if (this.debugStats) {
          this.debugStats.holdDragSpeed = holdDragSpeed
        }
      }
    }
  }

  finishCreation(): Star | null {
    if (!this.isCreating) return null
    
    const now = performance.now() / 1000
    const holdDuration = now - this.creationStartTime
    
    // Calculate mass based on hold time (mass is the primary property)
    // Use eased growth: t = clamp(holdDuration / holdToMaxSeconds, 0..1)
    const t = Math.min(1, holdDuration / this.config.holdToMaxSeconds)
    // Use sqrt easing for smoother feel
    const eased = Math.sqrt(t)
    const mass = this.config.minMass + (this.config.maxMass - this.config.minMass) * eased
    
    // Radius will be automatically calculated as mass^radiusPower * radiusScale
    
    // Calculate launch velocity from FLICK (last flickWindowMs before release)
    let vx = 0
    let vy = 0
    let releaseFlickSpeed = 0
    
    if (this.cursorHistory.length >= 2) {
      // Use only the flick window (last N milliseconds)
      const flickWindowSeconds = this.config.flickWindowMs / 1000
      const flickCutoff = now - flickWindowSeconds
      const flickHistory = this.cursorHistory.filter(point => point.time > flickCutoff)
      
      if (flickHistory.length >= 2) {
        let totalDx = 0
        let totalDy = 0
        let totalDt = 0
        
        for (let i = 1; i < flickHistory.length; i++) {
          const dt = flickHistory[i].time - flickHistory[i - 1].time
          if (dt > 0) {
            totalDx += (flickHistory[i].x - flickHistory[i - 1].x) / dt
            totalDy += (flickHistory[i].y - flickHistory[i - 1].y) / dt
            totalDt += dt
          }
        }
        
        if (totalDt > 0) {
          const rawVx = (totalDx / (flickHistory.length - 1))
          const rawVy = (totalDy / (flickHistory.length - 1))
          const rawSpeed = Math.sqrt(rawVx * rawVx + rawVy * rawVy)
          
          releaseFlickSpeed = rawSpeed
          
          // Apply speed compressor
          const compressedSpeed = compressSpeed(rawSpeed, this.config.flickS0, this.config.flickVmax)
          
          // Direction
          const direction = rawSpeed > 0 ? { x: rawVx / rawSpeed, y: rawVy / rawSpeed } : { x: 0, y: 0 }
          
          // Apply launch strength
          vx = direction.x * compressedSpeed * this.config.launchStrength
          vy = direction.y * compressedSpeed * this.config.launchStrength
        }
      }
    }
    
    // Apply mass resistance (larger stars launch slower)
    const massResistance = 1 - (mass / this.config.maxMass) * this.config.massResistanceFactor
    vx *= massResistance
    vy *= massResistance
    
    // Apply Angular Momentum Guidance (LAUNCH ASSIST ONLY)
    if (this.config.angularGuidanceStrength > 0 && this.stars.length > 0) {
      const position = { x: this.creationX, y: this.creationY }
      const velocity = { x: vx, y: vy }
      
      // Find orbital center
      const orbitalCenter = findOrbitalCenter(
        position,
        this.stars,
        this.config.orbitalCenterSearchRadius
      )
      
      if (orbitalCenter) {
        const r = subtract(position, orbitalCenter.center)
        const rLen = length(r)
        
        if (rLen > 0) {
          // Decompose velocity
          const { radial, tangential } = decomposeVelocity(position, orbitalCenter.center, velocity)
          
          // Clamp excessive radial component
          const radialClamped = scale(radial, 1 - this.config.radialClampFactor)
          
          // Calculate desired tangential speed for circular orbit
          const vCirc = Math.sqrt((this.config.gravityConstant * orbitalCenter.totalMass) / rLen)
          const vEsc = Math.sqrt(2 * (this.config.gravityConstant * orbitalCenter.totalMass) / rLen)
          
          // Gently bias tangential toward v_circ
          const currentTangentialSpeed = length(tangential)
          const guidanceFactor = this.config.angularGuidanceStrength
          const targetTangentialSpeed = currentTangentialSpeed + (vCirc - currentTangentialSpeed) * guidanceFactor
          
          // Preserve tangential direction
          let tangentialUnit = normalize(tangential)
          if (length(tangentialUnit) === 0) {
            const rUnit = normalize(r)
            tangentialUnit = { x: -rUnit.y, y: rUnit.x } // Perpendicular
          }
          
          const tangentialGuided = scale(tangentialUnit, targetTangentialSpeed)
          
          // Combine: clamped radial + guided tangential
          const finalVelocity = add(radialClamped, tangentialGuided)
          
          vx = finalVelocity.x
          vy = finalVelocity.y
          
          // Update debug stats
          if (this.debugStats) {
            this.debugStats.estimatedVCirc = vCirc
            this.debugStats.estimatedVEsc = vEsc
          }
        }
      }
    }
    
    // Calculate FINAL launch speed AFTER all modifications (this is the actual speed the star gets)
    const finalLaunchSpeed = Math.sqrt(vx * vx + vy * vy)
    
    // Create star (radius is derived from mass automatically)
    const star = new Star(
      this.creationX,
      this.creationY,
      mass,
      vx,
      vy,
      this.config.radiusScale,
      this.config.radiusPower
    )
    this.stars.push(star)
    
    // Create ripple effect
    this.ripples.push({
      x: this.creationX,
      y: this.creationY,
      time: now,
      maxRadius: this.config.creationRippleMaxRadius,
      duration: this.config.creationRippleDuration
    })
    
    // Calculate compressed speed for debug display
    let compressedSpeed = 0
    if (releaseFlickSpeed > 0) {
      compressedSpeed = compressSpeed(releaseFlickSpeed, this.config.flickS0, this.config.flickVmax)
    }
    
    // Update debug stats
    this.debugStats = {
      holdDragSpeed: this.debugStats?.holdDragSpeed || 0,
      releaseFlickSpeed,
      compressedSpeed,
      finalLaunchSpeed,
      estimatedVCirc: this.debugStats?.estimatedVCirc || 0,
      estimatedVEsc: this.debugStats?.estimatedVEsc || 0
    }
    
    // Reset creation state
    this.isCreating = false
    this.cursorHistory = []
    
    return star
  }

  cancelCreation(): void {
    this.isCreating = false
    this.cursorHistory = []
    this.debugStats = null
  }

  update(deltaTime: number): void {
    // Clamp deltaTime to prevent spikes
    const dt = Math.min(deltaTime, 0.1) // Max 100ms per frame
    
    // Update ripples
    const now = performance.now() / 1000
    this.ripples = this.ripples.filter(ripple => {
      const age = now - ripple.time
      return age < ripple.duration
    })
    
    // LEAPFROG INTEGRATOR: Two-pass update
    // Pass 1: Compute accelerations and apply first kick + drift
    const accelerations: Array<{ ax: number; ay: number }> = []
    
    for (let i = 0; i < this.stars.length; i++) {
      const starA = this.stars[i]
      let ax = 0
      let ay = 0
      
      // Compute gravitational forces from all other stars
      for (let j = 0; j < this.stars.length; j++) {
        if (i === j) continue
        
        const starB = this.stars[j]
        
        // Calculate distance vector
        const dx = starB.x - starA.x
        const dy = starB.y - starA.y
        
        // Plummer softening: r² = dx² + dy² + eps²
        const r2 = dx * dx + dy * dy + this.config.softeningEpsPx * this.config.softeningEpsPx
        const invR = 1 / Math.sqrt(r2)
        const invR3 = invR * invR * invR
        
        // Force: F = G * m1 * m2 * invR³ * (dx, dy)
        const forceMagnitude = this.config.gravityConstant * starA.mass * starB.mass * invR3
        
        // Force direction (unit vector from A to B)
        const fx = dx * forceMagnitude
        const fy = dy * forceMagnitude
        
        // Clamp force magnitude if configured
        const forceLen = Math.sqrt(fx * fx + fy * fy)
        if (this.config.maxForceMagnitude > 0 && forceLen > this.config.maxForceMagnitude) {
          const scale = this.config.maxForceMagnitude / forceLen
          ax += (fx / starA.mass) * scale
          ay += (fy / starA.mass) * scale
        } else {
          // Acceleration = F / m
          ax += fx / starA.mass
          ay += fy / starA.mass
        }
      }
      
      accelerations.push({ ax, ay })
      
      // Apply first kick + drift
      starA.updateLeapfrog(dt, ax, ay, this.width, this.height, this.config)
    }
    
    // Pass 2: Recompute accelerations at new positions and apply second kick
    for (let i = 0; i < this.stars.length; i++) {
      const starA = this.stars[i]
      let ax = 0
      let ay = 0
      
      // Recompute forces at new positions
      for (let j = 0; j < this.stars.length; j++) {
        if (i === j) continue
        
        const starB = this.stars[j]
        
        const dx = starB.x - starA.x
        const dy = starB.y - starA.y
        
        const r2 = dx * dx + dy * dy + this.config.softeningEpsPx * this.config.softeningEpsPx
        const invR = 1 / Math.sqrt(r2)
        const invR3 = invR * invR * invR
        
        const forceMagnitude = this.config.gravityConstant * starA.mass * starB.mass * invR3
        
        const fx = dx * forceMagnitude
        const fy = dy * forceMagnitude
        
        const forceLen = Math.sqrt(fx * fx + fy * fy)
        if (this.config.maxForceMagnitude > 0 && forceLen > this.config.maxForceMagnitude) {
          const scale = this.config.maxForceMagnitude / forceLen
          ax += (fx / starA.mass) * scale
          ay += (fy / starA.mass) * scale
        } else {
          ax += fx / starA.mass
          ay += fy / starA.mass
        }
      }
      
      // Complete leapfrog with second kick
      starA.completeLeapfrog(dt, ax, ay)
    }
    
    // Handle merging
    if (this.config.enableMerging) {
      const toRemove: Set<number> = new Set()
      const toAdd: Star[] = []
      
      for (let i = 0; i < this.stars.length; i++) {
        if (toRemove.has(i)) continue
        
        for (let j = i + 1; j < this.stars.length; j++) {
          if (toRemove.has(j)) continue
          
          const distance = this.stars[i].distanceTo(this.stars[j])
          // Merge when smaller star is inside larger star: distance < r2 - r1 (where r2 > r1)
          const r1 = Math.min(this.stars[i].radius, this.stars[j].radius)
          const r2 = Math.max(this.stars[i].radius, this.stars[j].radius)
          const mergeDistance = r2 - r1
          if (distance < mergeDistance) {
            // Merge stars
            const mergedStar = this.stars[i].mergeWith(this.stars[j])
            toRemove.add(i)
            toRemove.add(j)
            toAdd.push(mergedStar)
            break // Only merge one pair at a time per star
          }
        }
      }
      
      // Remove merged stars (in reverse order to maintain indices)
      const sortedIndices = Array.from(toRemove).sort((a, b) => b - a)
      for (const index of sortedIndices) {
        this.stars.splice(index, 1)
      }
      
      // Add merged stars
      this.stars.push(...toAdd)
    }
  }

  getCreationState(): { x: number; y: number; radius: number } | null {
    if (!this.isCreating) return null
    
    const now = performance.now() / 1000
    const holdDuration = now - this.creationStartTime
    
    // Calculate mass based on hold time
    const t = Math.min(1, holdDuration / this.config.holdToMaxSeconds)
    const eased = Math.sqrt(t)
    const mass = this.config.minMass + (this.config.maxMass - this.config.minMass) * eased
    
    // Radius is derived from mass
    const radius = Math.pow(mass, this.config.radiusPower) * this.config.radiusScale
    
    return {
      x: this.creationX,
      y: this.creationY,
      radius
    }
  }
  
  getDebugStats() {
    return this.debugStats
  }
}
