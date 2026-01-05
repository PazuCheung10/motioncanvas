import { RuntimeConfig } from './config'
import { Node } from './node'

export class Connection {
  nodeA: Node
  nodeB: Node
  strength: number
  maxStrength: number
  age: number
  isDecaying: boolean
  isTether?: boolean
  tetherTarget?: Node

  constructor(nodeA: Node, nodeB: Node) {
    this.nodeA = nodeA
    this.nodeB = nodeB
    this.strength = 1.0
    this.maxStrength = 1.0
    this.age = 0
    this.isDecaying = false
  }

  update(deltaTime: number, cursorX: number, cursorY: number, config: RuntimeConfig): boolean {
    this.age += deltaTime

    // For tether connections, check cursor position
    if (this.isTether && this.tetherTarget) {
      const distToCursor = this.tetherTarget.distanceTo(cursorX, cursorY)
      const isInInfluence = distToCursor < config.cursorInfluenceRadius && this.tetherTarget.energy > 0.1
      
      this.isDecaying = !isInInfluence
      
      if (this.isDecaying) {
        this.strength -= config.connectionDecayRate * deltaTime * 2 // Tethers decay faster
      } else {
        this.strength = Math.min(1.0, this.strength + (1.0 - this.strength) * 0.3)
      }
      
      return this.strength > 0.05
    }

    // Regular connections: use energy-based activation
    const distance = this.nodeA.distanceToNode(this.nodeB)
    const maxDistance = config.nodeConnectionRadius

    // Check if either node has energy (energy-based, not just immediate distance)
    const isInInfluence = (this.nodeA.energy > 0.1 || this.nodeB.energy > 0.1)

    // ✅ 讓 decaying 可以恢復
    this.isDecaying = !isInInfluence

    // Update strength
    if (this.isDecaying) {
      this.strength -= config.connectionDecayRate * deltaTime
    } else {
      // Strength based on distance and time active
      const distanceFactor = 1 - (distance / maxDistance)
      const timeFactor = Math.min(1, this.age * 0.8)
      this.maxStrength = distanceFactor * 0.6 + timeFactor * 0.4
      this.strength = Math.min(1.0, this.strength + (this.maxStrength - this.strength) * 0.2)
    }

    // Remove if too weak
    return this.strength > 0.05
  }

  getOpacity(config: RuntimeConfig, type?: 'tether' | 'constellation' | 'trail'): number {
    if (type === 'tether') {
      return config.tetherOpacity * this.strength
    }
    return config.lineOpacityMin + 
           (config.lineOpacityMax - config.lineOpacityMin) * this.strength
  }
}

