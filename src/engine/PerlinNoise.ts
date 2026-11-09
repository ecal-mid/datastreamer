/**
 * Simplex / Perlin 1D & 2D organic noise generator.
 * Provides smooth, physiologically plausible drift for EEG bands and EDA tonic baseline.
 */
export class OrganicNoise {
  private perm: Uint8Array;

  constructor(seed: number = 42) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Shuffle with seeded LCG
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) >>> 0;
      const j = s % (i + 1);
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number): number {
    const h = hash & 15;
    const grad = 1.0 + (h & 7); // Gradient value 1.0 - 8.0
    return (h & 8) ? -grad * x : grad * x;
  }

  /**
   * 1D Perlin Noise, returning values roughly between -1 and 1
   */
  public noise1D(x: number): number {
    const X = Math.floor(x) & 255;
    x -= Math.floor(x);
    const u = this.fade(x);
    const g0 = this.grad(this.perm[X], x);
    const g1 = this.grad(this.perm[X + 1], x - 1);
    return this.lerp(u, g0, g1) * 0.25;
  }

  /**
   * Fractal Brownian Motion (fBm) with multiple octaves
   */
  public fbm1D(x: number, octaves: number = 3, lacunarity: number = 2.0, gain: number = 0.5): number {
    let total = 0;
    let amplitude = 1.0;
    let frequency = 1.0;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      total += this.noise1D(x * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return total / maxValue;
  }
}

