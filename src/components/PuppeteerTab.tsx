import React from 'react';
import { ManualOverrides, EegBands } from '../engine/types';
import { Sliders, RotateCcw, Lock, Unlock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';

interface PuppeteerTabProps {
  overrides: ManualOverrides;
  onUpdateOverrides: (overrides: Partial<ManualOverrides>) => void;
  onResetOverrides: () => void;
}

export const PuppeteerTab: React.FC<PuppeteerTabProps> = ({
  overrides,
  onUpdateOverrides,
  onResetOverrides,
}) => {
  const { enabled, values } = overrides;

  const toggleOverride = (key: keyof ManualOverrides['enabled']) => {
    onUpdateOverrides({
      enabled: {
        ...enabled,
        [key]: !enabled[key],
      }
    });
  };

  const handleSlider = (key: keyof ManualOverrides['values'], val: number) => {
    onUpdateOverrides({
      enabled: {
        ...enabled,
        [key]: true,
      },
      values: {
        ...values,
        [key]: val,
      }
    });
  };

  const eegControls: Array<{ key: keyof EegBands; label: string; color: string }> = [
    { key: 'alpha', label: 'Alpha (8–12 Hz)', color: 'text-purple-400' },
    { key: 'beta', label: 'Beta (15–30 Hz)', color: 'text-amber-400' },
    { key: 'theta', label: 'Theta (4–8 Hz)', color: 'text-blue-400' },
    { key: 'smr', label: 'SMR (12–15 Hz)', color: 'text-cyan-400' },
    { key: 'gamma', label: 'Gamma (30–50 Hz)', color: 'text-pink-400' },
    { key: 'delta', label: 'Delta (0.5–4 Hz)', color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground font-semibold">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>Manual Parameter Overrides (Real-time Puppeteer)</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetOverrides}
          className="gap-1.5 font-mono text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Release All Overrides</span>
        </Button>
      </div>

      {/* EEG Band Power Sliders */}
      <Card className="bg-card/60 border-border p-3.5">
        <div className="text-[11px] font-mono uppercase text-muted-foreground mb-3">
          EEG Spectral Powers (0.0 – 1.0)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {eegControls.map((ctrl) => {
            const isLocked = Boolean(enabled[ctrl.key]);
            const val = values[ctrl.key];

            return (
              <div
                key={ctrl.key}
                className="bg-secondary/30 border border-border/80 rounded-lg p-2.5 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className={`font-semibold ${ctrl.color}`}>{ctrl.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">{val.toFixed(2)}</span>
                    <Button
                      variant={isLocked ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => toggleOverride(ctrl.key)}
                      className="h-6 w-6"
                      title={isLocked ? 'Override active: click to release' : 'Click to lock override'}
                    >
                      {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <Slider
                  min={0.0}
                  max={1.0}
                  step={0.02}
                  value={[val]}
                  onValueChange={([newVal]) => handleSlider(ctrl.key, newVal)}
                />
              </div>
            );
          })}
        </div>
      </Card>

      {/* Autonomic & EDA Sliders */}
      <Card className="bg-card/60 border-border p-3.5">
        <div className="text-[11px] font-mono uppercase text-muted-foreground mb-3">
          Autonomic & EDA Conductance
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* BPM */}
          <div className="bg-secondary/30 border border-border/80 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-red-400 font-semibold">Heart Rate</span>
              <Button
                variant={enabled.bpm ? 'destructive' : 'ghost'}
                size="icon"
                onClick={() => toggleOverride('bpm')}
                className="h-6 w-6"
              >
                {enabled.bpm ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">{values.bpm} BPM</div>
            <Slider
              min={45}
              max={130}
              step={1}
              value={[values.bpm]}
              onValueChange={([val]) => handleSlider('bpm', val)}
            />
          </div>

          {/* Respiration */}
          <div className="bg-secondary/30 border border-border/80 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-emerald-400 font-semibold">Resp Rate</span>
              <Button
                variant={enabled.respRate ? 'default' : 'ghost'}
                size="icon"
                onClick={() => toggleOverride('respRate')}
                className="h-6 w-6"
              >
                {enabled.respRate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">{values.respRate.toFixed(2)} Hz</div>
            <Slider
              min={0.05}
              max={0.40}
              step={0.01}
              value={[values.respRate]}
              onValueChange={([val]) => handleSlider('respRate', val)}
            />
          </div>

          {/* Coherence */}
          <div className="bg-secondary/30 border border-border/80 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-purple-400 font-semibold">Coherence</span>
              <Button
                variant={enabled.coherence ? 'default' : 'ghost'}
                size="icon"
                onClick={() => toggleOverride('coherence')}
                className="h-6 w-6"
              >
                {enabled.coherence ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">{values.coherence.toFixed(2)}</div>
            <Slider
              min={0.0}
              max={1.0}
              step={0.02}
              value={[values.coherence]}
              onValueChange={([val]) => handleSlider('coherence', val)}
            />
          </div>

          {/* Tonic EDA */}
          <div className="bg-secondary/30 border border-border/80 rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-amber-400 font-semibold">Tonic EDA</span>
              <Button
                variant={enabled.tonicEda ? 'default' : 'ghost'}
                size="icon"
                onClick={() => toggleOverride('tonicEda')}
                className="h-6 w-6"
              >
                {enabled.tonicEda ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-muted-foreground" />}
              </Button>
            </div>
            <div className="text-sm font-mono font-bold text-foreground">{values.tonicEda.toFixed(1)} µS</div>
            <Slider
              min={1.0}
              max={20.0}
              step={0.2}
              value={[values.tonicEda]}
              onValueChange={([val]) => handleSlider('tonicEda', val)}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
