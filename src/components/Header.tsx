import React from 'react';
import {
  Radio,
  Cpu,
  Send,
  Layers,
  Code2,
  Download,
  Play,
  Pause,
  HelpCircle
} from 'lucide-react';
import { OperatingMode } from '../engine/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface HeaderProps {
  wsConnected: boolean;
  wsClientsCount: number;
  wsPort?: number;
  oscTarget: string;
  oscPackets?: number;
  fps: number;
  mode: OperatingMode;
  isPaused?: boolean;
  speed?: number;
  onTogglePlayPause?: () => void;
  onSetSpeed?: (speed: number) => void;
  onExportCsv?: () => void;
  onOpenFigmaModal: () => void;
  onOpenPayloadModal: () => void;
  onOpenHelpModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  wsConnected,
  wsClientsCount,
  wsPort = 8081,
  oscTarget,
  fps,
  mode,
  isPaused = false,
  speed = 1.0,
  onTogglePlayPause,
  onSetSpeed,
  onExportCsv,
  onOpenFigmaModal,
  onOpenPayloadModal,
  onOpenHelpModal,
}) => {
  return (
    <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm px-4 flex items-center justify-between select-none sticky top-0 z-40 gap-2 shrink-0">
      {/* Brand & Player Transport Controls (Play/Pause, 1x/2x/4x, Mode) placed at the left */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground text-sm select-none">
          <span className="text-primary font-mono text-base">⚡</span>
          <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-extrabold tracking-tight">SimData</span>
          <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-border/80 text-muted-foreground font-normal">
            v1.2.0
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 bg-secondary/30 border border-border/80 px-2 py-1 rounded-lg shadow-sm">
          {onTogglePlayPause && (
            <Button
              variant={isPaused ? 'secondary' : 'default'}
              size="sm"
              onClick={onTogglePlayPause}
              className={`h-7 px-3 gap-1.5 font-mono text-xs transition-all ${
                isPaused
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_#10b98150]'
              }`}
              title={isPaused ? 'Resume live simulation stream' : 'Pause live simulation stream'}
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold tracking-wide">PAUSED</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span className="font-semibold tracking-wide">LIVE</span>
                </>
              )}
            </Button>
          )}

          <div className="h-4 w-[1px] bg-border mx-0.5" />

          {/* Speed Multiplier Options */}
          <div className="flex items-center gap-1">
            {[1.0, 2.0, 4.0].map((s) => {
              const isActive = Math.abs(speed - s) < 0.01;
              return (
                <Button
                  key={s}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onSetSpeed && onSetSpeed(s)}
                  className={`h-7 px-2 text-[11px] font-mono tracking-tight transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-[0_0_8px_#06b6d440]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70'
                  }`}
                  title={`Simulate at ${s}x speed`}
                >
                  {s}x
                </Button>
              );
            })}
          </div>
        </div>

        <Badge variant="secondary" className="uppercase text-[9px] tracking-wider font-mono">
          {mode}
        </Badge>
      </div>

      {/* Badges & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* WebSocket Status Badge */}
        <Badge
          variant={wsConnected ? 'success' : 'destructive'}
          className="hidden md:flex items-center gap-1.5 py-1 px-2.5 font-mono text-[11px]"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
            }`}
          />
          <Radio className="w-3 h-3" />
          <span>WS :{wsPort}</span>
          <span className="opacity-70">({wsClientsCount})</span>
        </Badge>

        {/* OSC UDP Status Badge */}
        <Badge variant="cyan" className="hidden lg:flex items-center gap-1.5 py-1 px-2.5 font-mono text-[11px]" title="Broadcasting Open Sound Control UDP packets to 127.0.0.1:9000">
          <Send className="w-3 h-3 text-primary" />
          <span>OSC :9000</span>
        </Badge>

        {/* Engine FPS Badge */}
        <Badge variant="secondary" className="hidden sm:flex items-center gap-1.5 py-1 px-2 font-mono text-[11px] text-muted-foreground">
          <Cpu className="w-3 h-3 text-purple-400" />
          <span>{fps} Hz</span>
        </Badge>

        <div className="h-4 w-[1px] bg-border mx-1 hidden sm:block" />

        {/* Export Session CSV */}
        {onExportCsv && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCsv}
            className="gap-1.5 font-mono hidden sm:flex"
            title="Export session recording as CSV"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden md:inline">CSV</span>
          </Button>
        )}

        {onOpenHelpModal && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHelpModal}
            className="gap-1.5 font-mono text-xs text-primary border-primary/40 hover:bg-primary/10"
            title="Biometrics & Design Reference Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Guide</span>
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenPayloadModal}
          className="gap-1.5 font-mono"
        >
          <Code2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Payload</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onOpenFigmaModal}
          className="gap-1.5 font-mono"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Figma Plugin</span>
        </Button>
      </div>
    </header>
  );
};
