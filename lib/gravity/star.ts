import { GravityConfig } from './config'

export interface TrailPoint {
  x: number
  y: number
  time: number
}

export class Star {
  x: number
  y: number
  vx: number // velocity x
  vy: number // velocity y
  mass: number
  age: number // Time since creation
  trail: TrailPoint[] = []
  creationTime: number
  isMerging: boolean = false
  private _radiusScale: number // Visual scale for radius calculation
  private _radiusPower: number // Power for radius calculation

  // Velocity Verlet integrator: vxHalf/vyHalf are the persistent state variables
  // They represent velocity at half-steps: v(t + dt/2)
  // vx/vy are synced for external access but NOT used during integration
  vxHalf: number = 0
  vyHalf: number = 0

  constructor(x: number, y: number, mass: number, vx: number = 0, vy: number = 0, radiusScale: number = 1.2, radiusPower: number = 0.5) {
    this.x = x
    this.y = y
    this.vx = vx
    this.vy = vy
    // Initialize half-step velocity for Velocity Verlet
    // At creation, we assume v_half = v (will be corrected on first integration step)
    this.vxHalf = vx
    this.vyHalf = vy
    this.mass = mass
    this._radiusScale = radiusScale
    this._radiusPower = radiusPower
    this.age = 0
    this.creationTime = performance.now() / 1000
  }

  // Radius is derived from mass: radius = (mass^radiusPower * radiusScale) / 2
  // radiusPower = 0.5 for 2D (area ∝ r²), 0.333 for 3D (volume ∝ r³)
  // Final radius is half of the calculated value
  get radius(): number {
    return (Math.pow(this.mass, this._radiusPower) * this._radiusScale) / 2
  }

  /**
   * Velocity Verlet integrator (first half-step)
   * v(t+dt/2) = v(t) + a(t) * dt/2
   * x(t+dt) = x(t) + v(t+dt/2) * dt
   * 
   * This is symplectic and conserves energy for Hamiltonian systems.
   * vxHalf/vyHalf are the persistent state variables (never synced to vx/vy during integration).
   */
  updateVelocityVerletFirstHalf(dt: number, ax: number, ay: number, width: number, height: number, config: GravityConfig): void {
    // KICK 1: v(t+dt/2) = v(t) + a(t) * dt/2
    this.vxHalf += ax * (dt / 2)
    this.vyHalf += ay * (dt / 2)
    
    // DRIFT: x(t+dt) = x(t) + v(t+dt/2) * dt
    this.x += this.vxHalf * dt
    this.y += this.vyHalf * dt
    
    // Apply non-physical effects (gameplay features, NOT part of Hamiltonian)
    // DISABLED in ORBIT_PLAYGROUND mode for physics validation
    if (config.velocityDamping > 0 && config.physicsMode !== 'ORBIT_PLAYGROUND') {
      this.vxHalf *= (1 - config.velocityDamping)
      this.vyHalf *= (1 - config.velocityDamping)
    }
    
    // Speed clamping: DISABLED in ORBIT_PLAYGROUND mode (breaks energy conservation)
    // Only enabled in CHAOS mode as a gameplay safety measure
    if (config.physicsMode !== 'ORBIT_PLAYGROUND') {
      const currentSpeed = Math.sqrt(this.vxHalf * this.vxHalf + this.vyHalf * this.vyHalf)
      if (currentSpeed > 1000) {
        const scale = 1000 / currentSpeed
        this.vxHalf *= scale
        this.vyHalf *= scale
      }
    }
    
    // Periodic boundary conditions (torus topology - NOT Newtonian free space)
    // WARNING: This breaks energy conservation and orbital stability
    // For physics validation, disable wrapping (enableBoundaryWrapping = false)
    if (config.enableBoundaryWrapping) {
      while (this.x < 0) this.x += width
      while (this.x >= width) this.x -= width
      while (this.y < 0) this.y += height
      while (this.y >= height) this.y -= height
    }
    
    // Update age
    this.age += dt
    
    // Update trail for fast-moving stars (visual only, doesn't affect physics)
    const speed = Math.sqrt(this.vxHalf * this.vxHalf + this.vyHalf * this.vyHalf)
    if (speed > 10) {
      const now = performance.now() / 1000
      this.trail.push({ x: this.x, y: this.y, time: now })
      
      // Remove old trail points
      const cutoff = now - config.starTrailFadeTime
      this.trail = this.trail.filter(point => point.time > cutoff)
      
      // Limit trail length
      if (this.trail.length > config.starTrailLength) {
        this.trail = this.trail.slice(-config.starTrailLength)
      }
    } else {
      // Clear trail if moving slowly
      this.trail = []
    }
    
    // DO NOT sync vx/vy here - vxHalf/vyHalf are the persistent state
    // vx/vy are only synced at the end of the full step for external access
  }

  /**
   * Velocity Verlet integrator (second half-step)
   * v(t+dt) = v(t+dt/2) + a(t+dt) * dt/2
   * 
   * Completes the Velocity Verlet step. After this, vxHalf/vyHalf represent v(t+dt).
   */
  updateVelocityVerletSecondHalf(dt: number, ax: number, ay: number, config?: GravityConfig): void {
    // KICK 2: v(t+dt) = v(t+dt/2) + a(t+dt) * dt/2
    this.vxHalf += ax * (dt / 2)
    this.vyHalf += ay * (dt / 2)
    
    // Speed clamping: DISABLED in ORBIT_PLAYGROUND mode (breaks energy conservation)
    if (config && config.physicsMode !== 'ORBIT_PLAYGROUND') {
      const finalSpeed = Math.sqrt(this.vxHalf * this.vxHalf + this.vyHalf * this.vyHalf)
      if (finalSpeed > 1000) {
        const scale = 1000 / finalSpeed
        this.vxHalf *= scale
        this.vyHalf *= scale
      }
    }
    
    // Sync full velocity for external access (display, energy calculations, etc.)
    // This is the ONLY place we sync vx/vy from vxHalf/vyHalf
    this.vx = this.vxHalf
    this.vy = this.vyHalf
  }

  distanceTo(other: Star, width?: number, height?: number, enableWrapping?: boolean): number {
    let dx = this.x - other.x
    let dy = this.y - other.y
    
    // Use minimum-image convention if wrapping is enabled
    if (enableWrapping && width !== undefined && height !== undefined) {
      if (dx > width / 2) dx -= width
      else if (dx < -width / 2) dx += width
      if (dy > height / 2) dy -= height
      else if (dy < -height / 2) dy += height
    }
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  distanceToPoint(x: number, y: number, width?: number, height?: number, enableWrapping?: boolean): number {
    let dx = this.x - x
    let dy = this.y - y
    
    // Use minimum-image convention if wrapping is enabled
    if (enableWrapping && width !== undefined && height !== undefined) {
      if (dx > width / 2) dx -= width
      else if (dx < -width / 2) dx += width
      if (dy > height / 2) dy -= height
      else if (dy < -height / 2) dy += height
    }
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Inelastic merge: combines two stars into one
   * 
   * This is a NON-HAMILTONIAN, gameplay/visual feature.
   * Energy is NOT conserved (inelastic collision).
   * Momentum IS conserved.
   * 
   * For physics validation, disable merging (enableMerging = false).
   * 
   * @param other - Star to merge with
   * @param width - Boundary width (for wrapping)
   * @param height - Boundary height (for wrapping)
   * @param enableWrapping - Whether boundary wrapping is enabled
   * @returns New merged star
   */
  mergeWith(other: Star, width?: number, height?: number, enableWrapping?: boolean): Star {
    // Combine masses (conservation of mass)
    const totalMass = this.mass + other.mass
    
    // Center of mass position - compute in unwrapped local frame first
    // This ensures correct COM calculation even when stars are on opposite sides of wrapped boundaries
    let otherX = other.x
    let otherY = other.y
    
    if (enableWrapping && width !== undefined && height !== undefined) {
      // Unwrap other star's position relative to this star using minimum-image convention
      // This finds the shortest distance across boundaries
      let dx = other.x - this.x
      let dy = other.y - this.y
      
      // Apply minimum-image convention
      if (dx > width / 2) dx -= width
      else if (dx < -width / 2) dx += width
      if (dy > height / 2) dy -= height
      else if (dy < -height / 2) dy += height
      
      // Compute unwrapped position of other star in local frame
      otherX = this.x + dx
      otherY = this.y + dy
      
      // Compute center of mass in unwrapped frame
      const totalMassInv = 1 / totalMass
      let comX = (this.x * this.mass + otherX * other.mass) * totalMassInv
      let comY = (this.y * this.mass + otherY * other.mass) * totalMassInv
      
      // Wrap the result back into bounds
      while (comX < 0) comX += width
      while (comX >= width) comX -= width
      while (comY < 0) comY += height
      while (comY >= height) comY -= height
      
      // Use wrapped COM position
      const newX = comX
      const newY = comY
      
      // Conservation of momentum (use synced velocities)
      const newVx = (this.vx * this.mass + other.vx * other.mass) * totalMassInv
      const newVy = (this.vy * this.mass + other.vy * other.mass) * totalMassInv
      
      // Radius automatically follows from mass^radiusPower * radiusScale
      const radiusScale = this.mass >= other.mass ? this._radiusScale : other._radiusScale
      const radiusPower = this.mass >= other.mass ? this._radiusPower : other._radiusPower
      
      return new Star(newX, newY, totalMass, newVx, newVy, radiusScale, radiusPower)
    }
    
    // No wrapping: simple COM calculation in unwrapped frame
    const totalMassInv = 1 / totalMass
    const newX = (this.x * this.mass + otherX * other.mass) * totalMassInv
    const newY = (this.y * this.mass + otherY * other.mass) * totalMassInv
    
    // Conservation of momentum
    const newVx = (this.vx * this.mass + other.vx * other.mass) * totalMassInv
    const newVy = (this.vy * this.mass + other.vy * other.mass) * totalMassInv
    
    // Radius automatically follows from mass^radiusPower * radiusScale
    const radiusScale = this.mass >= other.mass ? this._radiusScale : other._radiusScale
    const radiusPower = this.mass >= other.mass ? this._radiusPower : other._radiusPower
    
    return new Star(newX, newY, totalMass, newVx, newVy, radiusScale, radiusPower)
  }
}
