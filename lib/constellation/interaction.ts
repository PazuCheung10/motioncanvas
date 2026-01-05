import { Simulation } from './simulation'

export class Interaction {
  private canvas: HTMLCanvasElement
  private simulation: Simulation
  private cursorX: number = 0
  private cursorY: number = 0

  constructor(canvas: HTMLCanvasElement, simulation: Simulation) {
    this.canvas = canvas
    this.simulation = simulation
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // ✅ 使用 pointermove 取代 mousemove（更通用、更穩）
    this.canvas.addEventListener('pointermove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.cursorX = e.clientX - rect.left
      this.cursorY = e.clientY - rect.top
      this.simulation.setCursor(this.cursorX, this.cursorY)
    })

    // Mouse movement (保留作為備用)
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      this.cursorX = e.clientX - rect.left
      this.cursorY = e.clientY - rect.top
      this.simulation.setCursor(this.cursorX, this.cursorY)
    })

    // Touch movement
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0]
      if (touch) {
        this.cursorX = touch.clientX - rect.left
        this.cursorY = touch.clientY - rect.top
        this.simulation.setCursor(this.cursorX, this.cursorY)
      }
    }, { passive: false })

    // Handle touch start to ensure cursor is set
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const rect = this.canvas.getBoundingClientRect()
      const touch = e.touches[0]
      if (touch) {
        this.cursorX = touch.clientX - rect.left
        this.cursorY = touch.clientY - rect.top
        this.simulation.setCursor(this.cursorX, this.cursorY)
      }
    }, { passive: false })
  }

  destroy(): void {
    // Event listeners will be cleaned up when canvas is removed
    // In a more complex app, you might want to explicitly remove them
  }
}

