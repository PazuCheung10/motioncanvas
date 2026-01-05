import { CONFIG } from './config'

export class Node {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  baseOpacity: number
  currentOpacity: number
  isActive: boolean
  activeTime: number
  pulseIntensity: number
  pulseTime: number
  energy: number // Energy-based activation memory

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * CONFIG.nodeDriftSpeed
    this.vy = (Math.random() - 0.5) * CONFIG.nodeDriftSpeed
    this.size = CONFIG.nodeSizeMin + Math.random() * (CONFIG.nodeSizeMax - CONFIG.nodeSizeMin)
    this.baseOpacity = CONFIG.nodeBaseOpacity
    this.currentOpacity = this.baseOpacity
    this.isActive = false
    this.activeTime = 0
    this.pulseIntensity = 1.0
    this.pulseTime = 0
    this.energy = 0
  }

  update(deltaTime: number, width: number, height: number, cursorX: number, cursorY: number, config: typeof CONFIG): void {
    // Energy decay
    const energyDecayRate = 1.0 / config.energyDecaySeconds
    this.energy = Math.max(0, this.energy - energyDecayRate * deltaTime)
    
    // Update active state based on energy (not just immediate distance)
    this.isActive = this.energy > 0.1

    // Drift movement
    this.x += this.vx * deltaTime
    this.y += this.vy * deltaTime

    // Optional: subtle repulsion from cursor
    if (config.cursorRepulsionStrength > 0) {
      const dx = this.x - cursorX
      const dy = this.y - cursorY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0 && dist < config.cursorInfluenceRadius * 1.5) {
        const repulsion = config.cursorRepulsionStrength * (1 - dist / (config.cursorInfluenceRadius * 1.5))
        this.vx += (dx / dist) * repulsion * deltaTime
        this.vy += (dy / dist) * repulsion * deltaTime
      }
    }

    // Boundary wrap
    if (this.x < 0) this.x = width
    if (this.x > width) this.x = 0
    if (this.y < 0) this.y = height
    if (this.y > height) this.y = 0

    // Add slight variance to drift
    this.vx += (Math.random() - 0.5) * config.nodeDriftVariance * deltaTime
    this.vy += (Math.random() - 0.5) * config.nodeDriftVariance * deltaTime

    // Clamp velocity
    const maxVel = config.nodeDriftSpeed * 1.5
    this.vx = Math.max(-maxVel, Math.min(maxVel, this.vx))
    this.vy = Math.max(-maxVel, Math.min(maxVel, this.vy))

    // Update active time
    if (this.isActive) {
      this.activeTime += deltaTime
    } else {
      this.activeTime = Math.max(0, this.activeTime - deltaTime * 2)
    }

    // Update opacity based on energy (smooth transition)
    const energyOpacity = this.energy * config.nodeActiveOpacity + (1 - this.energy) * config.nodeBaseOpacity
    this.currentOpacity += (energyOpacity - this.currentOpacity) * 0.15

    // Update pulse (for wow moment)
    if (this.pulseTime > 0) {
      this.pulseTime -= deltaTime
      const pulseProgress = this.pulseTime / config.wowPulseDuration
      this.pulseIntensity = 1.0 + (config.wowGlowIntensity - 1.0) * Math.sin(pulseProgress * Math.PI)
    } else {
      this.pulseIntensity = 1.0
    }
  }

  addEnergy(amount: number, config: typeof CONFIG): void {
    this.energy = Math.min(config.energyMax, this.energy + amount * config.energyGainRate * 0.016) // ~60fps normalization
  }

  distanceTo(x: number, y: number): number {
    const dx = this.x - x
    const dy = this.y - y
    return Math.sqrt(dx * dx + dy * dy)
  }

  distanceToNode(node: Node): number {
    return this.distanceTo(node.x, node.y)
  }
}

