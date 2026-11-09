import React, { useState, useEffect } from 'react';
import { PresetArchetype, ManualOverrides } from '../engine/types';
import { PRESETS } from '../engine/BioEngine';
import { Sparkles, Sliders, CheckCircle2, Flame, Moon, Compass } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Progress } from './ui/progress';

interface PresetsTabProps {
  activePreset: PresetArchetype;
  onSelectPreset: (preset: PresetArchetype) => void;
  overrides: ManualOverrides;
  onUpdateOverrides: (overrides: Partial<ManualOverrides>) => void;
}

const PRESET_ICONS: Record<PresetArchetype, React.ReactNode> = {
  baseline: <Compass className="w-4 h-4 text-emerald-400" />,
  meditation: <Sparkles className="w-4 h-4 text-primary" />,
  stress: <Flame className="w-4 h-4 text-amber-400" />,
  drowsiness: <Moon className="w-4 h-4 text-purple-400" />,
};

export const PresetsTab: React.FC<PresetsTabProps> = ({
  activePreset,
  onSelectPreset,
  overrides,
  onUpdateOverrides,
}) => {
  const [transitionProgress, setTransitionProgress] = useState<number>(100);

  const handleSelect = (preset: PresetArchetype) => {
    onSelectPreset(preset);
    setTransitionProgress(0);
  };

  useEffect(() => {
    if (transitionProgress < 100) {
      const interval = setInterval(() => {
        setTransitionProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (100 / (3 * 30)); // 3 seconds at 30 ticks/s
        });
      }, 33);
      return () => clearInterval(interval);
    }
  }, [transitionProgress]);

  const currentValues = overrides.values;

  return (
    <div className="space-y-4">
      {/* 3-second smooth transition progress */}
      {transitionProgress < 100 && (
        <Card className="bg-primary/5 border-primary/30 p-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-primary mb-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>Interpolating to <strong>{PRESETS[activePreset].name}</strong> (3s smooth transition)...</span>
            </div>
            <span className="font-bold">{Math.round(transitionProgress)}%</span>
          </div>
          <Progress value={transitionProgress} className="h-1" indicatorClassName="bg-primary" />
        </Card>
      )}

      {/* Preset cards grid */}
      <div>
        <div className="text-xs font-mono uppercase text-muted-foreground mb-2 flex items-center justify-between">
          <span>One-Click Scenario Archetypes</span>
          <span className="text-[11px] text-muted-foreground/80">3-Second Smooth Interpolation</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {(Object.keys(PRESETS) as PresetArchetype[]).map((key) => {
            const preset = PRESETS[key];
            const isSelected = activePreset === key;

            return (
              <Card
                key={key}
                onClick={() => handleSelect(key)}
                className={`cursor-pointer text-left p-3 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary/50 bg-primary/5 shadow-[0_0_12px_#06b6d418]'
                    : 'bg-card/60 hover:bg-secondary/40 hover:border-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {PRESET_ICONS[key]}
                      <span className="font-bold text-xs text-foreground">{preset.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mb-2">
                    {preset.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60 grid grid-cols-3 gap-1 text-[10px] font-mono text-muted-foreground">
                  <div>BPM: <strong className="text-foreground">{preset.targetBpm}</strong></div>
                  <div>Alpha: <strong className="text-foreground">{preset.alpha}</strong></div>
                  <div>Coh: <strong className="text-foreground">{preset.coherence}</strong></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Parametric RSA & Generator Controls using shadcn Card & Slider */}
      <Card className="bg-card/60 border-border p-3.5">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase text-foreground font-semibold">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>Generative Coupling Controls (RSA & Base Parameters)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Base BPM */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Base Heart Rate</span>
              <Badge variant="cyan" className="font-mono">{currentValues.bpm} BPM</Badge>
            </div>
            <Slider
              min={45}
              max={120}
              step={1}
              value={[currentValues.bpm]}
              onValueChange={([val]) => {
                onUpdateOverrides({
                  enabled: { bpm: true },
                  values: { ...currentValues, bpm: val }
                });
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>45 BPM (Brady)</span>
              <span>120 BPM (Tachy)</span>
            </div>
          </div>

          {/* Respiration Frequency */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Respiration Frequency</span>
              <Badge variant="success" className="font-mono">
                {currentValues.respRate.toFixed(2)} Hz ({(currentValues.respRate * 60).toFixed(0)} br/min)
              </Badge>
            </div>
            <Slider
              min={0.05}
              max={0.40}
              step={0.01}
              value={[currentValues.respRate]}
              onValueChange={([val]) => {
                onUpdateOverrides({
                  enabled: { respRate: true },
                  values: { ...currentValues, respRate: val }
                });
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.05 Hz (Deep)</span>
              <span>0.1 Hz (Resonant)</span>
              <span>0.4 Hz (Rapid)</span>
            </div>
          </div>

          {/* Coherence Target */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">Target Coherence</span>
              <Badge variant="secondary" className="font-mono text-purple-400">
                {currentValues.coherence.toFixed(2)}
              </Badge>
            </div>
            <Slider
              min={0.0}
              max={1.0}
              step={0.02}
              value={[currentValues.coherence]}
              onValueChange={([val]) => {
                onUpdateOverrides({
                  enabled: { coherence: true },
                  values: { ...currentValues, coherence: val }
                });
              }}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0.0 (Chaotic)</span>
              <span>1.0 (Synchronous)</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
