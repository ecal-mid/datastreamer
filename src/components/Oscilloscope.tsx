import React, { useEffect, useRef } from 'react';
import { SimDataTelemetry } from '../engine/types';
import { Heart, Wind, ShieldAlert, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface OscilloscopeProps {
  telemetry: SimDataTelemetry;
  isPaused?: boolean;
  speed?: number;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ telemetry, isPaused = false, speed = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Buffer histories for traces
  const respHistory = useRef<number[]>(new Array(180).fill(0.5));
  const ecgHistory = useRef<number[]>(new Array(180).fill(0.5));
  const edaHistory = useRef<number[]>(new Array(180).fill(0.5));

  // ECG phase tracker
  const ecgPhase = useRef<number>(0);

  useEffect(() => {
    // If stream is paused, freeze trace advancement
    if (isPaused) return;

    // 1. Update histories with incoming telemetry
    const respVal = telemetry.biometrics.respiration.value;
    respHistory.current.push(respVal);
    if (respHistory.current.length > 200) respHistory.current.shift();

    // 2. Synthesize ECG beat shape corresponding to current BPM
    const bpm = telemetry.biometrics.hrv.bpm;
    const beatsPerSec = bpm / 60;
    ecgPhase.current = (ecgPhase.current + (beatsPerSec * (1 / 30) * speed)) % 1.0;

    let ecgPoint = 0.5;
    const p = ecgPhase.current;

    // Realistic P-Q-R-S-T wave model
    if (p > 0.10 && p < 0.20) {
      ecgPoint += Math.sin((p - 0.10) * 10 * Math.PI) * 0.10;
    } else if (p >= 0.20 && p < 0.23) {
      ecgPoint -= ((p - 0.20) / 0.03) * 0.12;
    } else if (p >= 0.23 && p < 0.27) {
      const rProgress = (p - 0.23) / 0.04;
      ecgPoint += Math.sin(rProgress * Math.PI) * 0.45;
    } else if (p >= 0.27 && p < 0.30) {
      ecgPoint -= (1 - (p - 0.27) / 0.03) * 0.18;
    } else if (p > 0.40 && p < 0.55) {
      ecgPoint += Math.sin((p - 0.40) * (1 / 0.15) * Math.PI) * 0.15;
    }

    if (telemetry.states.artifact_flag) {
      ecgPoint += (Math.random() - 0.5) * 0.3;
    }

    ecgHistory.current.push(ecgPoint);
    if (ecgHistory.current.length > 200) ecgHistory.current.shift();

    // 3. Update EDA history
    const edaNormalized = Math.min(1.0, (telemetry.biometrics.eda.tonic + telemetry.biometrics.eda.phasic * 4) / 16.0);
    edaHistory.current.push(edaNormalized);
    if (edaHistory.current.length > 200) edaHistory.current.shift();
  }, [telemetry, isPaused, speed]);

  // Render loop on canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Dark medical oscilloscope background
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = '#121826';
      ctx.lineWidth = 1;
      const stepX = 25;
      const stepY = 25;

      ctx.beginPath();
      for (let x = 0; x < width; x += stepX) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += stepY) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Divider line for 2 main oscilloscope channels
      const midY = height / 2;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top Trace: Respiration Waveform (Emerald)
      const respBuf = respHistory.current;
      if (respBuf.length > 1) {
        ctx.strokeStyle = '#10b981';
        ctx.shadowColor = '#10b981aa';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        const dx = width / (respBuf.length - 1);
        for (let i = 0; i < respBuf.length; i++) {
          const val = respBuf[i];
          const y = midY - 15 - val * (midY - 30);
          const x = i * dx;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Bottom Trace: ECG Heart Rhythm (Red)
      const ecgBuf = ecgHistory.current;
      if (ecgBuf.length > 1) {
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#ef4444aa';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const dx = width / (ecgBuf.length - 1);
        for (let i = 0; i < ecgBuf.length; i++) {
          const val = ecgBuf[i];
          const y = height - 15 - val * (midY - 30);
          const x = i * dx;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Channel Labels overlay
      ctx.font = '10px monospace';
      ctx.fillStyle = '#10b981cc';
      ctx.fillText('CH1: RESPIRATION (SINUSOIDAL + RSA)', 12, 18);

      ctx.fillStyle = '#ef4444cc';
      ctx.fillText('CH2: ECG CARDIAC VECTOR (COUPLED BPM)', 12, midY + 18);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const { hrv, respiration, eda } = telemetry.biometrics;
  const { calm_index, focus_index, artifact_flag } = telemetry.states;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
      {/* 2D Canvas Oscilloscope Card */}
      <Card className="lg:col-span-3 bg-card/60 border-border p-3 relative flex flex-col justify-between overflow-hidden shadow-inner">
        <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
          {isPaused && (
            <Badge variant="secondary" className="gap-1 font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
              <span>STREAM PAUSED</span>
            </Badge>
          )}
          {!isPaused && speed > 1 && (
            <Badge variant="cyan" className="gap-1 font-mono text-[10px]">
              <span>{speed}x SPEED</span>
            </Badge>
          )}
          {artifact_flag && (
            <Badge variant="destructive" className="gap-1.5 animate-pulse font-mono text-[10px]">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SENSOR ARTIFACT ACTIVE</span>
            </Badge>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={650}
          height={210}
          className="w-full h-[210px] rounded border border-border/40 block"
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Wind className="w-3.5 h-3.5" />
              <span>Phase: <strong className="text-foreground uppercase">{respiration.phase}</strong> ({respiration.value.toFixed(2)})</span>
            </div>
            <div className="flex items-center gap-1.5 text-red-400">
              <Heart className="w-3.5 h-3.5" />
              <span>BPM: <strong className="text-foreground">{hrv.bpm.toFixed(1)}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>RMSSD: <strong className="text-foreground">{hrv.rmssd.toFixed(1)}ms</strong></span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground/80">
            Window: 6.0s (30Hz Ticker)
          </div>
        </div>
      </Card>

      {/* Real-time Telemetry Readout Cards using shadcn Card */}
      <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
        {/* Coherence Score Card */}
        <Card className="bg-card/60 border-border p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono uppercase tracking-wide">Coherence</span>
            <Badge
              variant={hrv.coherence >= 0.7 ? 'success' : hrv.coherence >= 0.4 ? 'warning' : 'destructive'}
              className="text-[9px] px-1.5 py-0"
            >
              {hrv.coherence >= 0.7 ? 'HIGH' : hrv.coherence >= 0.4 ? 'BALANCED' : 'LOW'}
            </Badge>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-extrabold text-foreground">
              {hrv.coherence.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground font-mono">0.0 - 1.0</span>
          </div>
          <Progress
            value={Math.round(hrv.coherence * 100)}
            className="h-1.5"
            indicatorClassName="bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400"
          />
        </Card>

        {/* EDA (GSR) Conductance Card */}
        <Card className="bg-card/60 border-border p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span className="font-mono uppercase tracking-wide">EDA / GSR</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">µS Conductance</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <div className="text-xl font-mono font-bold text-foreground">
              {eda.tonic.toFixed(2)} <span className="text-xs text-muted-foreground font-normal">tonic</span>
            </div>
            <div className="text-xs font-mono text-amber-400">
              +{eda.phasic.toFixed(2)} <span className="text-[10px] text-muted-foreground">phasic</span>
            </div>
          </div>
          <Progress
            value={Math.min(100, Math.round((eda.tonic / 15) * 100))}
            className="h-1.5"
            indicatorClassName="bg-amber-400"
          />
        </Card>

        {/* Calm & Focus Dual Indices Card */}
        <Card className="bg-card/60 border-border p-2.5 flex flex-col justify-between">
          <div className="text-xs font-mono uppercase text-muted-foreground mb-1.5">
            Cognitive Indices
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-primary">Calm Index</span>
                <span className="text-foreground font-bold">{calm_index.toFixed(2)}</span>
              </div>
              <Progress
                value={Math.round(calm_index * 100)}
                className="h-1.5"
                indicatorClassName="bg-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-mono mb-1">
                <span className="text-purple-400">Focus Index</span>
                <span className="text-foreground font-bold">{focus_index.toFixed(2)}</span>
              </div>
              <Progress
                value={Math.round(focus_index * 100)}
                className="h-1.5"
                indicatorClassName="bg-purple-400"
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
