import React from 'react';
import { DatasetPlaybackState } from '../engine/types';
import { Play, Pause, Repeat, FastForward, FileText, HardDrive } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';

interface DatasetTabProps {
  playbackState: DatasetPlaybackState;
  availableDatasets: string[];
  selectedDataset: string;
  onSelectDataset: (name: string) => void;
  onTogglePlay: () => void;
  onToggleLoop: () => void;
  onSeek: (progress: number) => void;
  onSetSpeed: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 1.0, 2.0, 4.0];

export const DatasetTab: React.FC<DatasetTabProps> = ({
  playbackState,
  availableDatasets,
  selectedDataset,
  onSelectDataset,
  onTogglePlay,
  onToggleLoop,
  onSeek,
  onSetSpeed,
}) => {
  const { isPlaying, isLooping, speed, currentIndex, totalFrames, durationSeconds } = playbackState;

  const currentSec = totalFrames > 0 ? (currentIndex / 30).toFixed(1) : '0.0';
  const progressPercent = totalFrames > 0 ? (currentIndex / totalFrames) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground font-semibold">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>Dataset Playback Engine (assets/recordings/)</span>
        </div>
        <Badge variant="secondary" className="font-mono text-[10px]">
          30 Hz Frame Stepper
        </Badge>
      </div>

      {/* Dataset Selection Bar */}
      <Card className="bg-card/60 border-border p-3.5">
        <div className="text-[11px] font-mono uppercase text-muted-foreground mb-2">
          Select Pre-bundled Recording
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {availableDatasets.map((name) => {
            const isSelected = selectedDataset === name;
            const isJson = name.endsWith('.json');

            return (
              <Card
                key={name}
                onClick={() => onSelectDataset(name)}
                className={`cursor-pointer flex items-center justify-between p-2.5 transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-[0_0_8px_#06b6d418]'
                    : 'bg-secondary/30 hover:bg-secondary/50 border-border/80'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className={`w-4 h-4 shrink-0 ${isJson ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-xs font-mono truncate text-foreground">{name}</span>
                </div>
                <Badge variant={isJson ? 'warning' : 'success'} className="shrink-0 text-[9px]">
                  {isJson ? 'JSON' : 'CSV'}
                </Badge>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Transport Controls & Timeline Scrubber using shadcn */}
      <Card className="bg-card/60 border-border p-4 space-y-4">
        {/* Timeline Scrubber */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Playback Timeline</span>
            <span className="text-foreground font-semibold">
              {currentSec}s / {durationSeconds}s ({currentIndex} / {totalFrames} frames)
            </span>
          </div>

          <Slider
            min={0}
            max={totalFrames > 0 ? totalFrames - 1 : 1}
            step={1}
            value={[currentIndex]}
            onValueChange={([val]) => {
              if (totalFrames > 0) onSeek(val / (totalFrames - 1));
            }}
            trackClassName="h-2.5"
          />
        </div>

        {/* Transport Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            {/* Play / Pause */}
            <Button
              variant={isPlaying ? 'destructive' : 'default'}
              size="sm"
              onClick={onTogglePlay}
              className="gap-2 font-mono font-semibold"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </Button>

            {/* Loop toggle */}
            <Button
              variant={isLooping ? 'telemetry' : 'outline'}
              size="sm"
              onClick={onToggleLoop}
              className="gap-1.5 font-mono"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>LOOP: {isLooping ? 'ON' : 'OFF'}</span>
            </Button>
          </div>

          {/* Speed Multipliers */}
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-md border border-border text-xs font-mono">
            <span className="text-[10px] text-muted-foreground px-2 flex items-center gap-1">
              <FastForward className="w-3 h-3" /> SPEED:
            </span>
            {SPEED_OPTIONS.map((s) => (
              <Button
                key={s}
                variant={speed === s ? 'default' : 'ghost'}
                size="xs"
                onClick={() => onSetSpeed(s)}
                className="font-mono px-2"
              >
                {s}x
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
