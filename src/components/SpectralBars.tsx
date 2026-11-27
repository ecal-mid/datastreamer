import React, { useState } from 'react';
import { EegBands } from '../engine/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { InfoButton } from './InfoButton';

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
  const [viewMode, setViewMode] = useState<'compact' | 'vertical'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('simdata_spectral_view');
      if (saved === 'compact' || saved === 'vertical') return saved;
    }
    return 'compact';
  });

  const handleToggleMode = (mode: 'compact' | 'vertical') => {
    setViewMode(mode);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('simdata_spectral_view', mode);
      }
    } catch (e) {}
  };

  return (
    <Card className="bg-card/60 border-border p-2.5 sm:p-3">
      {/* Top Header Bar with View Switcher */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
            EEG Spectral Band Power (0.0 – 1.0)
          </span>
          <InfoButton metric="eegBands" />
          <Badge variant="secondary" className="font-mono text-[9px] py-0 px-1.5 h-4 hidden sm:inline-flex">
            1D Drift
          </Badge>
        </div>

        {/* Mode Toggle: Compact Horizontal vs Vertical Equalizer */}
        <div className="flex items-center gap-0.5 bg-secondary/60 p-0.5 rounded border border-border/70 text-[10px] font-mono">
          <button
            onClick={() => handleToggleMode('compact')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              viewMode === 'compact'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Compact horizontal meters (low profile)"
          >
            Compact
          </button>
          <button
            onClick={() => handleToggleMode('vertical')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              viewMode === 'vertical'
                ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Vertical spectrum equalizer bars"
          >
            Bars
          </button>
        </div>
      </div>

      {viewMode === 'compact' ? (
        /* Ultra-Compact Horizontal Meters (Height ~36px) */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {BANDS.map((band) => {
            const val = eeg[band.key] ?? 0;
            const pct = Math.min(100, Math.max(2, Math.round(val * 100)));

            return (
              <div
                key={band.key}
                className="bg-secondary/35 border border-border/70 rounded-md px-2.5 py-1.5 flex flex-col justify-between gap-1 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${band.color} ${band.glow} shrink-0`} />
                    <span className="font-semibold text-foreground text-xs truncate">{band.name}</span>
                    <span className="text-[10px] text-muted-foreground/70 font-mono hidden xl:inline">{band.range}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground shrink-0 ml-1">
                    {val.toFixed(2)}
                  </span>
                </div>

                {/* Sleek horizontal level bar */}
                <div className="w-full bg-secondary/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${band.color} ${band.glow} transition-all duration-75`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Low-Profile Vertical Equalizer Bars (Height ~70px) */
        <div className="grid grid-cols-6 gap-2">
          {BANDS.map((band) => {
            const val = eeg[band.key] ?? 0;
            const pct = Math.min(100, Math.max(2, Math.round(val * 100)));

            return (
              <div
                key={band.key}
                className="bg-secondary/35 border border-border/70 rounded-md p-2 flex flex-col justify-between"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-bold text-foreground">{band.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono hidden sm:inline">{band.range}</span>
                </div>

                {/* Vertical level bar: h-10 (40px) instead of former h-16 (64px) */}
                <div className="w-full bg-secondary/80 rounded h-10 relative flex items-end p-0.5 overflow-hidden">
                  <div
                    className={`w-full rounded-sm ${band.color} ${band.glow} transition-all duration-75`}
                    style={{ height: `${pct}%` }}
                  />
                </div>

                <div className="mt-1 text-center font-mono text-[11px] font-bold text-foreground">
                  {val.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
