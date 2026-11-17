import React, { useRef, useState } from 'react';
import { DatasetPlaybackState } from '../engine/types';
import {
  FileText,
  HardDrive,
  Download,
  UploadCloud,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Brain,
  HeartPulse,
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface DatasetTabProps {
  playbackState?: DatasetPlaybackState;
  availableDatasets: string[];
  selectedDataset: string;
  onSelectDataset: (name: string) => void;
  onTogglePlay?: () => void;
  onToggleLoop?: () => void;
  onSeek?: (progress: number) => void;
  onSetSpeed?: (speed: number) => void;
  onDownloadDataset?: (name: string) => void;
  onUploadDataset?: (file: File) => Promise<{ success: boolean; frameCount?: number; format?: string; message?: string; error?: string }>;
  onDownloadTemplate?: () => void;
  onDownloadSample?: (sampleName: string) => void;
  onOpenFolder?: () => void;
  isDesktop?: boolean;
}

export const DatasetTab: React.FC<DatasetTabProps> = ({
  playbackState,
  availableDatasets,
  selectedDataset,
  onSelectDataset,
  onDownloadDataset,
  onUploadDataset,
  onDownloadTemplate,
  onDownloadSample,
  onOpenFolder,
  isDesktop = false,
}) => {
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
          message: res.message || `Loaded "${file.name}" successfully (${res.frameCount} frames). Saved to library.`
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
            const isImportedMuse = name.includes('muse');
            const isImportedWesad = name.includes('wesad');

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
                  {isImportedMuse ? (
                    <Brain className="w-4 h-4 shrink-0 text-purple-400" />
                  ) : isImportedWesad ? (
                    <HeartPulse className="w-4 h-4 shrink-0 text-red-400" />
                  ) : (
                    <FileText className={`w-4 h-4 shrink-0 ${isJson ? 'text-amber-400' : 'text-emerald-400'}`} />
                  )}
                  <span className="text-xs font-mono truncate text-foreground" title={name}>
                    {name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {isSelected && (
                    <Badge variant="cyan" className="text-[9px] bg-primary/20 text-primary border-primary/40 font-mono">
                      PLAYING
                    </Badge>
                  )}

                  {isImportedMuse ? (
                    <Badge variant="cyan" className="text-[9px] bg-purple-500/20 text-purple-300 border-purple-500/40">
                      MUSE
                    </Badge>
                  ) : isImportedWesad ? (
                    <Badge variant="cyan" className="text-[9px] bg-red-500/20 text-red-300 border-red-500/40">
                      WESAD
                    </Badge>
                  ) : (
                    <Badge variant={isJson ? 'warning' : 'success'} className="text-[9px]">
                      {isJson ? 'JSON' : 'CSV'}
                    </Badge>
                  )}

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

      {/* Universal Biometric Importer & Dropzone */}
      {onUploadDataset && (
        <Card className="bg-card/50 border-border p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-foreground font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Universal Biometric Importer & Dropzone</span>
            </div>

            {/* Supported Format Badges */}
            <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
              <Badge variant="secondary" className="gap-1 bg-purple-500/15 text-purple-300 border border-purple-500/30">
                <Brain className="w-3 h-3" />
                <span>Muse / Mind Monitor</span>
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-red-500/15 text-red-300 border border-red-500/30">
                <HeartPulse className="w-3 h-3" />
                <span>WESAD / Empatica E4</span>
              </Badge>
              <Badge variant="secondary" className="gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <FileSpreadsheet className="w-3 h-3" />
                <span>SimData CSV / JSON</span>
              </Badge>
            </div>
          </div>

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
              <span className="font-semibold text-foreground">Drop any recording: SimData, Muse (Mind Monitor), or WESAD</span>
              <span className="text-muted-foreground/80">or click to browse</span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/70">
              Auto-detects format, converts to 30 Hz standardized telemetry, starts live streaming, and saves to library
            </div>
          </div>

          {/* Sample Download Links for Quick Testing */}
          {onDownloadSample && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40 text-[11px] font-mono text-muted-foreground">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
                Test with open datasets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDownloadSample('sample_mind_monitor_muse.csv')}
                  className="flex items-center gap-1 text-purple-400 hover:text-purple-300 hover:underline"
                  title="Download sample Muse 4-channel EEG recording"
                >
                  <Brain className="w-3 h-3" />
                  <span>Sample Muse CSV</span>
                </button>
                <span className="opacity-40">•</span>
                <button
                  type="button"
                  onClick={() => onDownloadSample('sample_wesad_empatica.csv')}
                  className="flex items-center gap-1 text-red-400 hover:text-red-300 hover:underline"
                  title="Download sample WESAD ECG & Respiration recording"
                >
                  <HeartPulse className="w-3 h-3" />
                  <span>Sample WESAD CSV</span>
                </button>
              </div>
            </div>
          )}
        </Card>
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
    </div>
  );
};
