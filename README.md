# Motion Canvas

An interactive constellation experience built with Next.js 14 and TypeScript.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/motion-canvas](http://localhost:3000/motion-canvas) in your browser.

## Project Structure

```
lib/constellation/
  ├── config.ts          # Adjustable constants
  ├── types.ts           # TypeScript type definitions
  ├── node.ts            # Node class (simulation)
  ├── connection.ts      # Connection class (simulation)
  ├── simulation.ts      # Simulation logica
  ├── renderer.ts        # Canvas rendering
  ├── interaction.ts     # Cursor/touch handling
  └── constellation.ts   # Main system orchestrator

app/
  ├── layout.tsx         # Root layout
  ├── globals.css        # Global styles
  └── motion-canvas/
      ├── page.tsx       # Route component
      └── page.module.css # Component styles
```

## Adjusting Constants

All adjustable parameters are in `lib/constellation/config.ts`:

- `NODE_COUNT`: Number of nodes (default: 25)
- `CURSOR_INFLUENCE_RADIUS`: How close cursor needs to be to activate nodes
- `NODE_CONNECTION_RADIUS`: Maximum distance for connections
- `MAX_CONNECTIONS_PER_NODE`: Limit connections per node
- `WOW_PULSE_DURATION`: Duration of triangle detection pulse

## Build

```bash
npm run build
npm start
```

