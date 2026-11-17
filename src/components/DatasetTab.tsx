import React, { useRef, useState } from 'react';
import { DatasetPlaybackState } from '../engine/types';
import {
  Play,
  Pause,
  Repeat,
  FastForward,
  FileText,
  HardDrive,
  Download,
  UploadCloud,
  FolderOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from './ui/card';
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
  onDownloadDataset?: (name: string) => void;
  onUploadDataset?: (file: File) => Promise<{ success: boolean; frameCount?: number; error?: string }>;
  onDownloadTemplate?: () => void;
  onOpenFolder?: () => void;
  isDesktop?: boolean;
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
  onDownloadDataset,
  onUploadDataset,
  onDownloadTemplate,
  onOpenFolder,
  isDesktop = false,
}) => {
  const { isPlaying, isLooping, speed, currentIndex, totalFrames, durationSeconds } = playbackState;

  const currentSec = totalFrames > 0 ? (currentIndex / 30).toFixed(1) : '0.0';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
      setUploadStatus({
        type: 'error',
        message: 'Invalid file format. Please upload a .csv or .json file.'
      });
      return;
    }

    if (onUploadDataset) {
      setUploadStatus(null);
      const res = await onUploadDataset(file);
      if (res.success) {
        setUploadStatus({
          type: 'success',
          message: `Loaded "${file.name}" successfully (${res.frameCount} frames). Saved to library.`
        });
      } else {
        setUploadStatus({
          type: 'error',
          message: res.error || 'Failed to parse dataset file.'
        });
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-foreground font-semibold">
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>Dataset Playback Engine (assets/recordings/)</span>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadTemplate && (
            <Button
              variant="outline"
              size="xs"
              onClick={onDownloadTemplate}
              className="gap-1.5 font-mono text-[11px]"
              title="Download standardized blank CSV template with all 17 biometric columns"
            >
              <Download className="w-3 h-3 text-muted-foreground" />
              <span>Blank CSV Template</span>
            </Button>
          )}

          {isDesktop && onOpenFolder && (
            <Button
              variant="outline"
              size="xs"
              onClick={onOpenFolder}
              className="gap-1.5 font-mono text-[11px]"
              title="Open the local assets/recordings directory in macOS Finder"
            >
              <FolderOpen className="w-3 h-3 text-primary" />
              <span>Open Folder</span>
            </Button>
          )}

          <Badge variant="secondary" className="font-mono text-[10px]">
            30 Hz Frame Stepper
          </Badge>
        </div>
      </div>

      {/* Dataset Selection Bar with Direct Download Buttons */}
      <Card className="bg-card/60 border-border p-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-[11px] font-mono uppercase text-muted-foreground">
          <span>Active Recordings Library ({availableDatasets.length})</span>
          <span className="text-[10px] lowercase text-muted-foreground/70">click to select & play</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {availableDatasets.map((name) => {
            const isSelected = selectedDataset === name;
            const isJson = name.endsWith('.json');

            return (
              <div
                key={name}
                onClick={() => onSelectDataset(name)}
                className={`cursor-pointer flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary shadow-[0_0_8px_#06b6d418]'
                    : 'bg-secondary/30 hover:bg-secondary/50 border-border/80'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden min-w-0 pr-2">
                  <FileText className={`w-4 h-4 shrink-0 ${isJson ? 'text-amber-400' : 'text-emerald-400'}`} />
                  <span className="text-xs font-mono truncate text-foreground" title={name}>
                    {name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={isJson ? 'warning' : 'success'} className="text-[9px]">
                    {isJson ? 'JSON' : 'CSV'}
                  </Badge>

                  {onDownloadDataset && (
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadDataset(name);
                      }}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                      title={`Download raw ${name} to your computer`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Drag & Drop Upload Zone */}
      {onUploadDataset && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded-lg p-3.5 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            isDragging
              ? 'border-primary bg-primary/10 scale-[1.01]'
              : 'border-border/80 hover:border-primary/50 hover:bg-secondary/30 bg-card/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".csv,.json"
            className="hidden"
          />
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <UploadCloud className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">Drop custom .csv or .json recording here</span>
            <span className="text-muted-foreground/80">or click to browse</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground/70">
            Automatically parses 30 Hz telemetry, loads into player, and persists to library
          </div>
        </div>
      )}

      {/* Upload Feedback Alert */}
      {uploadStatus && (
        <div
          className={`text-xs font-mono p-2.5 rounded-lg flex items-center justify-between border ${
            uploadStatus.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
            )}
            <span>{uploadStatus.message}</span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-2"
          >
            ✕
          </button>
        </div>
      )}

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
