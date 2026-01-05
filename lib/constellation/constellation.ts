import { CONFIG, RuntimeConfig } from './config'
import { Simulation } from './simulation'
import { Renderer } from './renderer'
import { Interaction } from './interaction'

export class ConstellationSystem {
  private canvas: HTMLCanvasElement
  public simulation: Simulation
  public renderer: Renderer
  private interaction: Interaction
  private animationFrameId: number | null = null
  private lastTime: number = performance.now()
  private isRunning: boolean = false
  private config: RuntimeConfig

  constructor(canvas: HTMLCanvasElement, config: RuntimeConfig = CONFIG) {
    this.canvas = canvas
    this.config = { ...config }
    
    // Initialize components
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.simulation = new Simulation(width, height, this.config)
    this.renderer = new Renderer(canvas, this.config)
    this.renderer.resize(width, height)
    this.renderer.updateConfig(this.config)
    this.interaction = new Interaction(canvas, this.simulation)
    
    // Handle resize
    this.handleResize()
    window.addEventListener('resize', () => this.handleResize())
    
    // Start animation loop
    this.start()
  }

  updateConfig(config: RuntimeConfig): void {
    this.config = { ...config }
    this.simulation.updateConfig(this.config)
    this.renderer.updateConfig(this.config)
  }

  getConfig(): RuntimeConfig {
    return { ...this.config }
  }

  private handleResize(): void {
    const width = window.innerWidth
    const height = window.innerHeight
    this.renderer.resize(width, height)
    this.simulation.resize(width, height)
  }

  private start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.lastTime = performance.now()
    this.animate()
  }

  private animate = (): void => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1) // Cap at 100ms
    this.lastTime = currentTime

    // Update simulation
    this.simulation.update(deltaTime, this.canvas.width, this.canvas.height)
    this.simulation.checkWowMoment()

    // Render
    this.renderer.render(this.simulation)

    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  destroy(): void {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    this.interaction.destroy()
    window.removeEventListener('resize', () => this.handleResize())
  }
}

