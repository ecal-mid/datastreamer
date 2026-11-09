import React from 'react';
import { ArtifactType } from '../engine/types';
import { Eye, Zap, Unplug, ShieldCheck, Sparkle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface ArtifactsBarProps {
  activeArtifact: ArtifactType;
  onTriggerArtifact: (type: ArtifactType) => void;
  onTriggerEdaSpike: () => void;
}

export const ArtifactsBar: React.FC<ArtifactsBarProps> = ({
  activeArtifact,
  onTriggerArtifact,
  onTriggerEdaSpike,
}) => {
  return (
    <Card className="bg-card/60 border-border p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground font-semibold">
          <span>Instant Artifact Injection & Stress Triggers</span>
          {activeArtifact !== 'none' && (
            <Badge variant="destructive" className="animate-pulse font-mono text-[9px]">
              ACTIVE: {activeArtifact.toUpperCase()}
            </Badge>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground font-mono">Simulates real-world sensor noise</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {/* Blink Spike */}
        <Button
          variant={activeArtifact === 'blink' ? 'warning' : 'outline'}
          size="sm"
          onClick={() => onTriggerArtifact('blink')}
          className="gap-2 font-mono"
        >
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>Blink Spike (200ms)</span>
        </Button>

        {/* Jaw Clench / EMG */}
        <Button
          variant={activeArtifact === 'clench' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onTriggerArtifact('clench')}
          className="gap-2 font-mono"
        >
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span>Jaw Clench / EMG</span>
        </Button>

        {/* Sensor Detach */}
        <Button
          variant={activeArtifact === 'detach' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => onTriggerArtifact(activeArtifact === 'detach' ? 'none' : 'detach')}
          className="gap-2 font-mono"
        >
          <Unplug className="w-3.5 h-3.5 text-red-400" />
          <span>{activeArtifact === 'detach' ? 'Reconnect Sensor' : 'Sensor Detach'}</span>
        </Button>

        {/* Trigger EDA Phasic Spike */}
        <Button
          variant="outline"
          size="sm"
          onClick={onTriggerEdaSpike}
          className="gap-2 font-mono"
        >
          <Sparkle className="w-3.5 h-3.5 text-primary" />
          <span>Trigger EDA Spike</span>
        </Button>

        {/* Normalize Signals */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTriggerArtifact('none')}
          className="gap-2 font-mono text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/40"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Normalize Signals</span>
        </Button>
      </div>
    </Card>
  );
};
