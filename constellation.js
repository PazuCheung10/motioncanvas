// ============================================================================
// CONSTANTS (Adjustable)
// ============================================================================

const CONFIG = {
    // Node settings
    NODE_COUNT: 25,
    NODE_SIZE_MIN: 2,
    NODE_SIZE_MAX: 4,
    NODE_GLOW_RADIUS: 8,
    NODE_BASE_OPACITY: 0.3,
    NODE_ACTIVE_OPACITY: 0.8,
    
    // Connection settings
    CURSOR_INFLUENCE_RADIUS: 120,
    NODE_CONNECTION_RADIUS: 100,
    MAX_CONNECTIONS_PER_NODE: 3,
    LINE_WIDTH: 0.75,
    LINE_OPACITY_MIN: 0.1,
    LINE_OPACITY_MAX: 0.6,
    
    // Physics
    NODE_DRIFT_SPEED: 0.2,
    NODE_DRIFT_VARIANCE: 0.1,
    CONNECTION_DECAY_RATE: 0.02,
    CONNECTION_DISTANCE_DECAY: 0.5,
    
    // Wow moment (triangle/loop detection)
    WOW_PULSE_DURATION: 450,
    WOW_GLOW_INTENSITY: 1.5,
    
    // Title fade
    TITLE_FADE_DELAY: 3000,
};

// ============================================================================
// NODE CLASS
// ============================================================================

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * CONFIG.NODE_DRIFT_SPEED;
        this.vy = (Math.random() - 0.5) * CONFIG.NODE_DRIFT_SPEED;
        this.size = CONFIG.NODE_SIZE_MIN + Math.random() * (CONFIG.NODE_SIZE_MAX - CONFIG.NODE_SIZE_MIN);
        this.baseOpacity = CONFIG.NODE_BASE_OPACITY;
        this.currentOpacity = this.baseOpacity;
        this.isActive = false;
        this.activeTime = 0;
        this.connections = [];
        this.pulseIntensity = 1.0;
        this.pulseTime = 0;
    }
    
    update(deltaTime, width, height) {
        // Drift movement
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Boundary wrap
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
        
        // Add slight variance to drift
        this.vx += (Math.random() - 0.5) * CONFIG.NODE_DRIFT_VARIANCE * deltaTime;
        this.vy += (Math.random() - 0.5) * CONFIG.NODE_DRIFT_VARIANCE * deltaTime;
        
        // Clamp velocity
        const maxVel = CONFIG.NODE_DRIFT_SPEED * 1.5;
        this.vx = Math.max(-maxVel, Math.min(maxVel, this.vx));
        this.vy = Math.max(-maxVel, Math.min(maxVel, this.vy));
        
        // Update active state
        if (this.isActive) {
            this.activeTime += deltaTime;
        } else {
            this.activeTime = Math.max(0, this.activeTime - deltaTime * 2);
        }
        
        // Update opacity based on active state
        const targetOpacity = this.isActive ? CONFIG.NODE_ACTIVE_OPACITY : CONFIG.NODE_BASE_OPACITY;
        this.currentOpacity += (targetOpacity - this.currentOpacity) * 0.1;
        
        // Update pulse (for wow moment)
        if (this.pulseTime > 0) {
            this.pulseTime -= deltaTime;
            const pulseProgress = this.pulseTime / CONFIG.WOW_PULSE_DURATION;
            this.pulseIntensity = 1.0 + (CONFIG.WOW_GLOW_INTENSITY - 1.0) * Math.sin(pulseProgress * Math.PI);
        } else {
            this.pulseIntensity = 1.0;
        }
    }
    
    distanceTo(x, y) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distanceToNode(node) {
        return this.distanceTo(node.x, node.y);
    }
}

// ============================================================================
// CONNECTION CLASS
// ============================================================================

class Connection {
    constructor(nodeA, nodeB) {
        this.nodeA = nodeA;
        this.nodeB = nodeB;
        this.strength = 1.0;
        this.maxStrength = 1.0;
        this.age = 0;
        this.isDecaying = false;
    }
    
    update(deltaTime, cursorX, cursorY) {
        this.age += deltaTime;
        
        // Calculate distance
        const distance = this.nodeA.distanceToNode(this.nodeB);
        const maxDistance = CONFIG.NODE_CONNECTION_RADIUS;
        
        // Check if either node is still active (within cursor influence)
        const distToCursorA = this.nodeA.distanceTo(cursorX, cursorY);
        const distToCursorB = this.nodeB.distanceTo(cursorX, cursorY);
        const isInInfluence = distToCursorA < CONFIG.CURSOR_INFLUENCE_RADIUS || 
                             distToCursorB < CONFIG.CURSOR_INFLUENCE_RADIUS;
        
        if (!isInInfluence) {
            this.isDecaying = true;
        }
        
        // Update strength
        if (this.isDecaying) {
            this.strength -= CONFIG.CONNECTION_DECAY_RATE * deltaTime;
        } else {
            // Strength based on distance and time active
            const distanceFactor = 1 - (distance / maxDistance);
            const timeFactor = Math.min(1, this.age * 0.01);
            this.maxStrength = distanceFactor * 0.5 + timeFactor * 0.5;
            this.strength = Math.min(1.0, this.strength + (this.maxStrength - this.strength) * 0.1);
        }
        
        // Remove if too weak
        return this.strength > 0.05;
    }
    
    getOpacity() {
        return CONFIG.LINE_OPACITY_MIN + 
               (CONFIG.LINE_OPACITY_MAX - CONFIG.LINE_OPACITY_MIN) * this.strength;
    }
}

// ============================================================================
// CONSTELLATION SYSTEM
// ============================================================================

class Constellation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.cursorX = 0;
        this.cursorY = 0;
        this.lastCursorX = 0;
        this.lastCursorY = 0;
        this.cursorVelocity = 0;
        this.lastTime = performance.now();
        
        this.init();
    }
    
    init() {
        // Resize canvas
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create nodes
        for (let i = 0; i < CONFIG.NODE_COUNT; i++) {
            this.nodes.push(new Node(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height
            ));
        }
        
        // Setup cursor tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.cursorX = e.clientX - rect.left;
            this.cursorY = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            this.cursorX = touch.clientX - rect.left;
            this.cursorY = touch.clientY - rect.top;
        });
        
        // Start animation loop
        this.animate();
        
        // Fade title after delay
        setTimeout(() => {
            const title = document.getElementById('title');
            if (title) title.classList.add('fade-out');
        }, CONFIG.TITLE_FADE_DELAY);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    updateNodes(deltaTime) {
        // Update node states based on cursor proximity
        for (const node of this.nodes) {
            const distToCursor = node.distanceTo(this.cursorX, this.cursorY);
            node.isActive = distToCursor < CONFIG.CURSOR_INFLUENCE_RADIUS;
            node.update(deltaTime, this.canvas.width, this.canvas.height);
        }
    }
    
    updateConnections(deltaTime) {
        // Remove decaying connections
        this.connections = this.connections.filter(conn => 
            conn.update(deltaTime, this.cursorX, this.cursorY)
        );
        
        // Find active nodes
        const activeNodes = this.nodes.filter(node => node.isActive);
        
        // Create new connections between active nodes
        for (let i = 0; i < activeNodes.length; i++) {
            const nodeA = activeNodes[i];
            const nearbyNodes = [];
            
            // Find nearby active nodes
            for (let j = 0; j < activeNodes.length; j++) {
                if (i === j) continue;
                const nodeB = activeNodes[j];
                const distance = nodeA.distanceToNode(nodeB);
                
                if (distance < CONFIG.NODE_CONNECTION_RADIUS) {
                    nearbyNodes.push({ node: nodeB, distance });
                }
            }
            
            // Sort by distance and take top N
            nearbyNodes.sort((a, b) => a.distance - b.distance);
            const topNodes = nearbyNodes.slice(0, CONFIG.MAX_CONNECTIONS_PER_NODE);
            
            // Create connections if they don't exist
            for (const { node: nodeB } of topNodes) {
                const exists = this.connections.some(conn => 
                    (conn.nodeA === nodeA && conn.nodeB === nodeB) ||
                    (conn.nodeA === nodeB && conn.nodeB === nodeA)
                );
                
                if (!exists) {
                    this.connections.push(new Connection(nodeA, nodeB));
                }
            }
        }
    }
    
    checkWowMoment() {
        // Check for triangles or closed loops
        const activeNodes = this.nodes.filter(node => node.isActive);
        if (activeNodes.length < 3) return;
        
        // Build adjacency map
        const adjMap = new Map();
        for (const conn of this.connections) {
            if (conn.nodeA.isActive && conn.nodeB.isActive && !conn.isDecaying) {
                if (!adjMap.has(conn.nodeA)) adjMap.set(conn.nodeA, []);
                if (!adjMap.has(conn.nodeB)) adjMap.set(conn.nodeB, []);
                adjMap.get(conn.nodeA).push(conn.nodeB);
                adjMap.get(conn.nodeB).push(conn.nodeA);
            }
        }
        
        // Check for triangles (3 nodes all connected to each other)
        for (const nodeA of activeNodes) {
            const neighborsA = adjMap.get(nodeA) || [];
            for (const nodeB of neighborsA) {
                const neighborsB = adjMap.get(nodeB) || [];
                for (const nodeC of neighborsB) {
                    if (nodeC !== nodeA && neighborsA.includes(nodeC)) {
                        // Triangle found!
                        this.triggerPulse([nodeA, nodeB, nodeC]);
                        return;
                    }
                }
            }
        }
    }
    
    triggerPulse(nodes) {
        // Only trigger if nodes aren't already pulsing
        if (nodes.some(n => n.pulseTime > 0)) return;
        
        for (const node of nodes) {
            node.pulseTime = CONFIG.WOW_PULSE_DURATION;
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = CONFIG.LINE_WIDTH;
        this.ctx.lineCap = 'round';
        
        for (const conn of this.connections) {
            if (conn.strength > 0.05) {
                this.ctx.globalAlpha = conn.getOpacity();
                this.ctx.beginPath();
                this.ctx.moveTo(conn.nodeA.x, conn.nodeA.y);
                this.ctx.lineTo(conn.nodeB.x, conn.nodeB.y);
                this.ctx.stroke();
            }
        }
        
        // Draw nodes
        for (const node of this.nodes) {
            const size = node.size * node.pulseIntensity;
            const opacity = node.currentOpacity * node.pulseIntensity;
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, CONFIG.NODE_GLOW_RADIUS * node.pulseIntensity
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, CONFIG.NODE_GLOW_RADIUS * node.pulseIntensity, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Node core
            this.ctx.globalAlpha = opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    animate() {
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // Cap at 100ms
        this.lastTime = currentTime;
        
        // Update cursor velocity
        const dx = this.cursorX - this.lastCursorX;
        const dy = this.cursorY - this.lastCursorY;
        this.cursorVelocity = Math.sqrt(dx * dx + dy * dy);
        this.lastCursorX = this.cursorX;
        this.lastCursorY = this.cursorY;
        
        // Update simulation
        this.updateNodes(deltaTime);
        this.updateConnections(deltaTime);
        this.checkWowMoment();
        
        // Render
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }
}

// ============================================================================
// INITIALIZE
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('canvas');
    new Constellation(canvas);
});

