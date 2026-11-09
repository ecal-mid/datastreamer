import React from 'react';
import { EegBands } from '../engine/types';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface SpectralBarsProps {
  eeg: EegBands;
}

interface BandDef {
  key: keyof EegBands;
  name: string;
  range: string;
  color: string;
  glow: string;
}

const BANDS: BandDef[] = [
  { key: 'delta', name: 'Delta', range: '0.5–4 Hz', color: 'bg-slate-400', glow: 'shadow-[0_0_8px_#94a3b833]' },
  { key: 'theta', name: 'Theta', range: '4–8 Hz',   color: 'bg-blue-400',  glow: 'shadow-[0_0_8px_#3b82f633]' },
  { key: 'alpha', name: 'Alpha', range: '8–12 Hz',  color: 'bg-purple-400',glow: 'shadow-[0_0_8px_#a855f733]' },
  { key: 'smr',   name: 'SMR',   range: '12–15 Hz', color: 'bg-cyan-400',  glow: 'shadow-[0_0_8px_#06b6d433]' },
  { key: 'beta',  name: 'Beta',  range: '15–30 Hz', color: 'bg-amber-400', glow: 'shadow-[0_0_8px_#f59e0b33]' },
  { key: 'gamma', name: 'Gamma', range: '30–50 Hz', color: 'bg-pink-400',  glow: 'shadow-[0_0_8px_#ec489933]' },
];

export const SpectralBars: React.FC<SpectralBarsProps> = ({ eeg }) => {
  return (
    <Card className="bg-card/60 border-border p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold">
          EEG Spectral Band Power (Normalized 0.0 – 1.0)
        </span>
        <Badge variant="secondary" className="font-mono text-[9px]">
          1D Perlin Organic Drift
        </Badge>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {BANDS.map((band) => {
          const val = eeg[band.key] ?? 0;
          const pct = Math.min(100, Math.max(2, Math.round(val * 100)));

          return (
            <div
              key={band.key}
              className="bg-secondary/40 border border-border/70 rounded p-2 flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-bold text-foreground">{band.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">{band.range}</span>
              </div>

              {/* Vertical level bar */}
              <div className="w-full bg-secondary/80 rounded h-16 relative flex items-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-sm ${band.color} ${band.glow} transition-all duration-75`}
                  style={{ height: `${pct}%` }}
                />
              </div>

              <div className="mt-1.5 text-center font-mono text-xs font-bold text-foreground">
                {val.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
