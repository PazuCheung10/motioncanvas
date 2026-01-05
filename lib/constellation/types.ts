export interface Point {
  x: number
  y: number
}

export interface NodeState {
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
}

export interface ConnectionState {
  nodeA: Node
  nodeB: Node
  strength: number
  maxStrength: number
  age: number
  isDecaying: boolean
}

