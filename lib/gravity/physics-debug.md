# Gravity Physics Implementation

## Force Calculation

The gravitational force between two stars is:
```
F = G * m1 * m2 / r²
```

Where:
- G = gravityConstant (currently 5000, scaled for pixel units)
- m1, m2 = masses of the two stars (1-10)
- r = distance between stars in pixels

## Acceleration

For star A:
```
a_A = F / m_A = (G * m_A * m_B / r²) / m_A = G * m_B / r²
```

**This means:**
- A more massive star B will accelerate star A MORE
- The acceleration on star A depends on star B's mass, not star A's mass
- This is physically correct! More massive objects create stronger gravitational fields

## Example Calculation

For two stars with:
- Star A: mass = 5, at position (100, 100)
- Star B: mass = 10, at position (200, 100)
- Distance: 100 pixels
- G = 5000

Force magnitude:
```
F = 5000 * 5 * 10 / (100²) = 250000 / 10000 = 25
```

Acceleration on Star A:
```
a_A = 25 / 5 = 5 pixels/second²
```

Acceleration on Star B:
```
a_B = 25 / 10 = 2.5 pixels/second²
```

Over 0.016 seconds (60fps):
- Star A velocity change: 5 * 0.016 = 0.08 pixels/frame
- Star B velocity change: 2.5 * 0.016 = 0.04 pixels/frame

## Why It Might Seem Weak

1. **Initial velocities are too high**: Launch velocities might be 100-500 pixels/second
2. **Gravity needs time**: Orbits form over many frames, not instantly
3. **Distance matters**: Force drops as 1/r², so distant stars have very weak attraction

## Verification

To verify massive stars have more attraction:
1. Create a small star (mass ~1)
2. Create a large star nearby (mass ~10)
3. The small star should accelerate toward the large star faster
4. The large star will also move, but slower (due to its larger mass)

This is correct physics!

