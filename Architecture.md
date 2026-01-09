# Architecture

## Overview

Orbit Lab is an interactive gravity simulation playground built with Next.js and TypeScript. The architecture is designed around a clear separation of concerns between the React UI layer and a pure physics simulation engine, enabling real-time exploration of gravitational dynamics.

## System Architecture

The application follows a **layered architecture** with clear boundaries:

```
┌─────────────────────────────────────────┐
│         React UI Layer                   │
│  (OrbitLabPage, DebugPanel, etc.)      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      GravitySystem (Orchestrator)       │
│  - Coordinates simulation, rendering,   │
│    and interaction                      │
└─────┬───────────┬───────────┬───────────┘
      │           │           │
┌─────▼─────┐ ┌───▼────┐ ┌─────▼─────┐
│Simulation │ │Renderer│ │Interaction│
│  Engine   │ │  Layer │ │  Handler  │
└───────────┘ └─────────┘ └───────────┘
```

## Core Components

### 1. React UI Layer (`app/orbit-lab/`)

**OrbitLabPage.tsx** - Main page component
- Manages universe state and configuration
- Handles universe switching (TV channel model - each universe maintains independent state)
- Coordinates between UI components and the physics system
- Manages localStorage persistence for saved universes

**GravityDebugPanel.tsx** - Live parameter adjustment
- Exposes physics parameters for real-time tweaking
- Displays simulation statistics
- Handles save/load operations

**UniverseSelectionMenu.tsx** - Universe browser
- Displays preset and saved universes
- Handles universe selection and loading

**UniverseBrowser.tsx** - Universe management
- Lists available universes
- Handles save/delete operations

### 2. Physics Engine (`lib/gravity/`)

#### GravitySystem (`gravity.ts`)
The main orchestrator that coordinates all subsystems:
- **Responsibilities:**
  - Initializes and manages the simulation loop
  - Coordinates between simulation, renderer, and interaction handlers
  - Handles window resize events
  - Manages animation frame lifecycle
- **Key Methods:**
  - `updateConfig()` - Updates configuration across all subsystems
  - `loadUniverse()` - Loads a new universe configuration
  - `clearAllStars()` - Clears all stars from simulation

#### GravitySimulation (`simulation.ts`)
The core physics engine implementing N-body gravitational dynamics:
- **Integration Method:** Velocity Verlet with fixed timestep (0.01s)
  - Chosen for energy stability and simplicity
  - Fixed timestep prevents energy drift
- **Key Features:**
  - Pairwise gravitational forces with Plummer softening
  - Configurable potential energy degree (power law)
  - Torus boundary wrapping (optional)
  - Star merging (inelastic collisions)
  - Energy tracking and diagnostics
  - Star creation with orbital guidance
- **Physics Modes:**
  - `ORBIT_PLAYGROUND`: Energy-conserving, zero damping
  - `N_BODY_CHAOS`: Chaotic dynamics with optional damping
- **Star Creation:**
  - Mass grows with hold duration (eased curve)
  - Launch velocity from flick gesture (exponential compression)
  - Optional angular guidance toward orbital direction
  - Mass resistance (heavier stars launch slower)

#### Star (`star.ts`)
Represents a single celestial body:
- **Properties:**
  - Position (x, y)
  - Velocity (vx, vy) and half-step velocity (vxHalf, vyHalf) for Verlet
  - Mass
  - Age and creation time
  - Trail history for rendering
- **Key Methods:**
  - `updateVelocityVerletFirstHalf()` - First pass of Verlet integration
  - `updateVelocityVerletSecondHalf()` - Second pass of Verlet integration
  - `mergeWith()` - Inelastic collision (conserves momentum, loses energy)
  - `distanceTo()` - Distance calculation with optional torus wrapping

#### GravityRenderer (`renderer.ts`)
Handles all canvas rendering:
- **Rendering Features:**
  - Star glow effects (mass-based)
  - Star trails (for fast-moving stars)
  - Creation ripples
  - Comet cursor (desktop only)
  - Responsive scaling based on viewport
- **Performance:**
  - Efficient canvas operations
  - Trail length limiting
  - Opacity-based fade effects

#### GravityInteraction (`interaction.ts`)
Handles user input:
- **Input Methods:**
  - Mouse (pointer events)
  - Touch (mobile support)
- **Gestures:**
  - Click and drag to create stars
  - Hold to increase mass
  - Flick gesture for launch velocity
- **Features:**
  - Prevents default browser behaviors
  - Tracks cursor position globally

### 3. Configuration (`config.ts`)

**GravityConfig** - Comprehensive configuration interface:
- **Physics Parameters:**
  - `gravityConstant` - Gravitational constant
  - `velocityDamping` - Energy loss per frame
  - `softeningEpsPx` - Plummer softening parameter
  - `potentialEnergyDegree` - Power law for potential (default: 2 = inverse square)
- **Visual Parameters:**
  - `radiusScale` / `radiusPower` - Mass-to-radius relationship
  - `starTrailLength` - Trail history length
  - `glowRadiusMultiplier` - Glow effect intensity
- **Interaction Parameters:**
  - `flickWindowMs` - Gesture recognition window
  - `flickS0` / `flickVmax` - Velocity compression parameters
  - `angularGuidanceStrength` - Orbital direction guidance
  - `holdToMaxSeconds` - Mass growth duration
- **System Parameters:**
  - `maxStars` - Maximum star count
  - `enableMerging` - Star collision behavior
  - `enableBoundaryWrapping` - Torus mode

### 4. Universe Management (`universe-presets.ts`, `starfield.ts`)

**Universe Presets:**
- Procedural generation with deterministic seeds
- Cluster-based spatial distribution
- Configurable star counts and mass distributions
- Preset configurations for different physics behaviors

**Starfield Generation:**
- Gaussian distribution for random star placement
- Center-of-mass estimation for orbital velocities

## Data Flow

### Simulation Loop

```
1. User Input (Interaction)
   ↓
2. Update Creation State (Simulation)
   ↓
3. Physics Step (Simulation)
   - Compute forces
   - Update positions/velocities
   - Handle collisions
   ↓
4. Render Frame (Renderer)
   - Clear canvas
   - Draw trails
   - Draw stars
   - Draw effects
   ↓
5. Request Next Frame (GravitySystem)
```

### Configuration Updates

```
User adjusts parameter (DebugPanel)
   ↓
handleConfigChange() (OrbitLabPage)
   ↓
setConfig() (React state)
   ↓
useEffect() triggers
   ↓
systemRef.current.updateConfig() (GravitySystem)
   ↓
Updates propagate to:
  - Simulation.updateConfig()
  - Renderer.updateConfig()
```

### Universe Loading

```
User selects universe (UniverseSelectionMenu)
   ↓
handleLoadUniverse() (OrbitLabPage)
   ↓
Generate/load universe data
   ↓
systemRef.current.loadUniverse() (GravitySystem)
   ↓
simulation.loadUniverse() (GravitySimulation)
   ↓
Stars created with orbital velocities
   ↓
State saved to universeStatesRef (TV channel model)
```

## Key Design Decisions

### 1. Fixed Timestep Integration
- **Why:** Energy conservation and stability
- **Trade-off:** Slightly more computation, but predictable behavior
- **Implementation:** Time accumulator with 0.01s fixed steps

### 2. Velocity Verlet Integration
- **Why:** Symplectic, energy-conserving, simple to implement
- **Alternative considered:** RK4 (more accurate but more complex)
- **Trade-off:** Slightly less accurate than RK4, but sufficient for interactive simulation

### 3. Plummer Softening
- **Why:** Prevents numerical singularities when stars get very close
- **Trade-off:** Slightly non-physical at close distances, but prevents crashes

### 4. Inelastic Merging
- **Why:** Better user experience (stars don't bounce unrealistically)
- **Trade-off:** Breaks energy conservation, but explicitly tracked in diagnostics

### 5. Torus Boundary Wrapping
- **Why:** Prevents stars from escaping view, creates interesting dynamics
- **Trade-off:** Breaks energy conservation (wrapping changes potential energy)

### 6. TV Channel Universe Model
- **Why:** Each universe maintains independent state when switching
- **Implementation:** `universeStatesRef` Map stores state per universe key
- **Benefit:** Users can switch between universes without losing progress

### 7. Procedural Universe Generation
- **Why:** Deterministic, seed-based generation allows reproducible universes
- **Implementation:** Mulberry32 PRNG with string hashing for seeds
- **Benefit:** Each universe key generates the same initial state

### 8. Exponential Velocity Compression
- **Why:** Makes small flicks responsive while preventing extreme launches
- **Formula:** `v = vmax * (1 - exp(-rawSpeed / s0))`
- **Benefit:** Better control feel, prevents runaway stars

## Technology Stack

### Frontend Framework
- **Next.js 14** - React framework with App Router
- **React 18** - UI component library
- **TypeScript** - Type-safe development

### Rendering
- **Canvas API** - High-performance 2D rendering
- **requestAnimationFrame** - Smooth animation loop

### State Management
- **React Hooks** - Component state (`useState`, `useRef`, `useEffect`)
- **LocalStorage** - Universe persistence
- **URL Parameters** - Configuration sharing

### Build Tools
- **Next.js Build System** - Production builds
- **TypeScript Compiler** - Type checking

## File Structure

```
OrbitLab/
├── app/
│   ├── orbit-lab/              # Main application UI
│   │   ├── OrbitLabPage.tsx   # Main page component
│   │   ├── GravityDebugPanel.tsx
│   │   ├── UniverseBrowser.tsx
│   │   └── UniverseSelectionMenu.tsx
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home route
│   └── globals.css            # Global styles
│
├── lib/
│   ├── gravity/               # Gravity simulation core
│   │   ├── gravity.ts         # Main orchestrator
│   │   ├── simulation.ts      # Physics engine
│   │   ├── star.ts            # Star entity
│   │   ├── renderer.ts        # Canvas rendering
│   │   ├── interaction.ts     # Input handling
│   │   ├── config.ts          # Configuration
│   │   ├── universe-presets.ts # Universe generation
│   │   ├── starfield.ts       # Star field utilities
│   │   └── thumbnail-universe.ts # Thumbnail generation
│   │
│   └── constellation/         # Legacy constellation system
│       └── ...                 # (Not actively used)
│
└── package.json
```

## Integration Patterns

### Component-to-System Communication

**Pattern:** Direct reference via `useRef`
```typescript
const systemRef = useRef<GravitySystem | null>(null)
systemRef.current = new GravitySystem(canvasRef.current, config)
```

**Benefits:**
- Direct access without prop drilling
- Efficient updates (no re-renders)
- Clear ownership model

### Configuration Propagation

**Pattern:** Config object passed down, updated via `updateConfig()`
```typescript
systemRef.current.updateConfig(newConfig)
// Internally updates simulation and renderer
```

**Benefits:**
- Single source of truth
- Synchronized updates across subsystems
- Easy to persist/restore

### Universe State Management

**Pattern:** Map-based storage with universe keys
```typescript
universeStatesRef.current.set(universeKey, starStates)
```

**Benefits:**
- Independent state per universe
- Efficient switching
- Auto-save on interval

### Event Handling

**Pattern:** Event listeners attached to canvas, callbacks to simulation
```typescript
canvas.addEventListener('pointerdown', (e) => {
  simulation.startCreation(x, y)
})
```

**Benefits:**
- Separation of input handling from physics
- Easy to add new input methods
- Clean abstraction

## Performance Considerations

### Simulation Performance
- **O(n²) complexity** for N-body forces
- **Optimizations:**
  - Fixed timestep reduces computation
  - Star count limits (`maxStars`)
  - Efficient force calculations

### Rendering Performance
- **Canvas operations** are batched per frame
- **Trail limiting** prevents memory growth
- **Responsive scaling** maintains performance on different screen sizes

### Memory Management
- **Trail arrays** are limited and filtered
- **Universe states** stored efficiently (only essential data)
- **Event listeners** properly cleaned up on destroy

## Extension Points

### Adding New Physics Modes
1. Add enum value to `PhysicsMode` in `config.ts`
2. Implement mode-specific logic in `GravitySimulation.updateConfig()`
3. Add UI controls in `GravityDebugPanel.tsx`

### Adding New Visual Effects
1. Add effect data to `GravitySimulation`
2. Update effect in `step()` or separate update method
3. Render in `GravityRenderer.render()`

### Adding New Input Methods
1. Add event listener in `GravityInteraction.setupEventListeners()`
2. Call appropriate `GravitySimulation` methods
3. Update cursor tracking if needed

### Custom Universe Generators
1. Create generator function in `universe-presets.ts`
2. Return `{ width, height, stars: [...] }` format
3. Add to preset list in `UniverseSelectionMenu`

## Testing Considerations

### Unit Testing
- **Star class** - Physics calculations, merging logic
- **Vector operations** - Distance, wrapping, orbital calculations
- **Configuration** - Default values, validation

### Integration Testing
- **Simulation loop** - Energy conservation, stability
- **Universe loading** - State restoration, persistence
- **Input handling** - Gesture recognition, star creation

### Performance Testing
- **Frame rate** - Maintain 60fps with max stars
- **Memory usage** - No leaks over extended sessions
- **Large universes** - Behavior with many stars

## Future Architecture Considerations

### Potential Improvements
1. **Spatial partitioning** - Reduce O(n²) to O(n log n) for large systems
2. **Web Workers** - Offload physics to background thread
3. **WebGL renderer** - GPU-accelerated rendering for many stars
4. **State management library** - If complexity grows (Redux/Zustand)
5. **Modular physics** - Plugin system for different force laws

### Scalability
- Current architecture supports up to ~60 stars smoothly
- For larger systems, consider:
  - Barnes-Hut tree for force calculations
  - Level-of-detail rendering
  - Adaptive timestep based on system energy

---

*This architecture prioritizes clarity, debuggability, and real-time interactivity over perfect physical accuracy, aligning with the project's goal of exploring how simulation parameters affect emergent behavior.*
