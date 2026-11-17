import React, { useEffect, useRef, useState } from 'react';
import { SimDataTelemetry } from '../engine/types';
import { Heart, Wind, ShieldAlert, Zap, Brain, Layers } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

interface OscilloscopeProps {
  telemetry: SimDataTelemetry;
  isPaused?: boolean;
  speed?: number;
}

type ChannelView = 'all' | 'resp' | 'ecg' | 'eeg';

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ telemetry, isPaused = false, speed = 1.0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Channel Display Mode
  const [channelView, setChannelView] = useState<ChannelView>('all');
  const channelViewRef = useRef<ChannelView>('all');
  channelViewRef.current = channelView;

  // Buffer histories for traces
  const respHistory = useRef<number[]>(new Array(180).fill(0.5));
  const ecgHistory = useRef<number[]>(new Array(180).fill(0.5));
  const eegHistory = useRef<number[]>(new Array(180).fill(0.5));
  const edaHistory = useRef<number[]>(new Array(180).fill(0.5));

  // Phase trackers
  const ecgPhase = useRef<number>(0);
  const eegPhase = useRef<number>(0);

  useEffect(() => {
    // If stream is paused, freeze trace advancement
    if (isPaused) return;

    // 1. Update Respiration history
    const respVal = telemetry.biometrics.respiration.value;
    respHistory.current.push(respVal);
    if (respHistory.current.length > 200) respHistory.current.shift();

    // 2. Synthesize ECG cardiac beat shape corresponding to current BPM
    const bpm = telemetry.biometrics.hrv.bpm;
    const beatsPerSec = bpm / 60;
    ecgPhase.current = (ecgPhase.current + (beatsPerSec * (1 / 30) * speed)) % 1.0;

    let ecgPoint = 0.5;
    const p = ecgPhase.current;

    // P-Q-R-S-T wave model
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
      ecgPoint += (Math.random() - 0.5) * 0.25;
    }

    ecgHistory.current.push(ecgPoint);
    if (ecgHistory.current.length > 200) ecgHistory.current.shift();

    // 3. Synthesize Composite EEG Brainwave trace
    const eegData = telemetry.biometrics?.eeg || ({} as any);
    const alpha = typeof eegData.alpha === 'number' ? eegData.alpha : 0.5;
    const beta = typeof eegData.beta === 'number' ? eegData.beta : 0.25;
    const theta = typeof eegData.theta === 'number' ? eegData.theta : 0.35;
    const delta = typeof eegData.delta === 'number' ? eegData.delta : 0.25;
    const gamma = typeof eegData.gamma === 'number' ? eegData.gamma : 0.1;
    const smr = typeof eegData.smr === 'number' ? eegData.smr : 0.45;

    const dt = (1 / 30) * speed;
    eegPhase.current = (eegPhase.current + dt) % 1000.0;
    const t = eegPhase.current;

    // Real-time composite brain rhythm (Alpha 10Hz, Beta 18Hz, Theta 6Hz, Gamma 35Hz, Delta 2Hz)
    let eegPoint = 0.5;
    eegPoint += Math.sin(2 * Math.PI * 10 * t) * (alpha * 0.24);
    eegPoint += Math.sin(2 * Math.PI * 18 * t) * (beta * 0.14);
    eegPoint += Math.sin(2 * Math.PI * 5.5 * t) * (theta * 0.18);
    eegPoint += Math.sin(2 * Math.PI * 13.5 * t) * (smr * 0.10);
    eegPoint += Math.sin(2 * Math.PI * 34 * t) * (gamma * 0.06);
    eegPoint += Math.sin(2 * Math.PI * 2 * t) * (delta * 0.14);
    eegPoint += (Math.random() - 0.5) * 0.04; // Micro neural noise

    // High-amplitude artifact surge (e.g. eye blink / EMG clench)
    if (telemetry.states?.artifact_flag) {
      eegPoint += Math.sin(t * 35) * 0.35 + (Math.random() - 0.5) * 0.25;
    }

    // Protect against NaN
    if (isNaN(eegPoint)) eegPoint = 0.5;
    eegPoint = Math.max(0.05, Math.min(0.95, eegPoint));
    eegHistory.current.push(eegPoint);
    if (eegHistory.current.length > 200) eegHistory.current.shift();

    // 4. Update EDA history
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
      const mode = channelViewRef.current;

      // Dark medical oscilloscope background
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope grid lines
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

      // Helper to draw a single channel trace within a vertical band [topY, topY + chH]
      const drawChannelTrace = (
        buf: number[],
        topY: number,
        chH: number,
        strokeColor: string,
        glowColor: string,
        lineWidth: number
      ) => {
        if (buf.length < 2) return;
        ctx.strokeStyle = strokeColor;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 6;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();

        const dx = width / (buf.length - 1);
        for (let i = 0; i < buf.length; i++) {
          const rawVal = buf[i];
          const val = typeof rawVal === 'number' && !isNaN(rawVal) ? rawVal : 0.5;
          const y = topY + chH - 8 - val * (chH - 16);
          const x = i * dx;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      if (mode === 'all') {
        // 3 Channels Stacked (Respiration, ECG, Brainwaves)
        const chH = height / 3;

        // Channel Dividers
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, chH);
        ctx.lineTo(width, chH);
        ctx.moveTo(0, chH * 2);
        ctx.lineTo(width, chH * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // CH1: Respiration (Emerald)
        drawChannelTrace(respHistory.current, 0, chH, '#10b981', '#10b981aa', 2.2);

        // CH2: ECG Cardiac (Red)
        drawChannelTrace(ecgHistory.current, chH, chH, '#ef4444', '#ef4444aa', 2.0);

        // CH3: EEG Brainwaves (Purple / Violet)
        drawChannelTrace(eegHistory.current, chH * 2, chH, '#c084fc', '#c084fcaa', 1.8);

        // Channel Labels
        ctx.font = '10px monospace';
        ctx.fillStyle = '#10b981cc';
        ctx.fillText('CH1: RESPIRATION (SINUSOIDAL + RSA)', 12, 16);

        ctx.fillStyle = '#ef4444cc';
        ctx.fillText('CH2: ECG CARDIAC VECTOR (COUPLED BPM)', 12, chH + 16);

        ctx.fillStyle = '#c084fccc';
        ctx.fillText('CH3: EEG BRAINWAVE RHYTHMS (ALPHA/BETA/THETA)', 12, chH * 2 + 16);
      } else if (mode === 'resp') {
        // Solo Respiration
        drawChannelTrace(respHistory.current, 0, height, '#10b981', '#10b981aa', 2.5);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#10b981cc';
        ctx.fillText('CH1: RESPIRATION WAVEFORM (SOLO)', 12, 20);
      } else if (mode === 'ecg') {
        // Solo ECG
        drawChannelTrace(ecgHistory.current, 0, height, '#ef4444', '#ef4444aa', 2.2);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#ef4444cc';
        ctx.fillText('CH2: ECG CARDIAC VECTOR (SOLO)', 12, 20);
      } else if (mode === 'eeg') {
        // Solo EEG
        drawChannelTrace(eegHistory.current, 0, height, '#c084fc', '#c084fcaa', 2.0);
        ctx.font = '11px monospace';
        ctx.fillStyle = '#c084fccc';
        ctx.fillText('CH3: EEG BRAINWAVE COMPOSITE RHYTHM (SOLO 0.5–50Hz)', 12, 20);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  const { hrv, respiration, eda, eeg } = telemetry.biometrics;
  const { calm_index, focus_index, artifact_flag } = telemetry.states;

  // Determine dominant brain rhythm name
  const dominantRhythm =
    eeg.alpha >= eeg.beta && eeg.alpha >= eeg.theta
      ? 'Alpha (Flow)'
      : eeg.beta > eeg.alpha && eeg.beta > eeg.theta
      ? 'Beta (Alert)'
      : eeg.theta > eeg.alpha
      ? 'Theta (Meditative)'
      : 'Synchronized';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
      {/* 2D Canvas Oscilloscope Card */}
      <Card className="lg:col-span-3 bg-card/60 border-border p-3 relative flex flex-col justify-between overflow-hidden shadow-inner">
        {/* Top Control Bar: Channel Switcher & Live Status Badges */}
        <div className="absolute top-2 right-3 z-10 flex flex-wrap items-center gap-1.5">
          {/* Channel Filter Selector */}
          <div className="flex items-center gap-0.5 bg-secondary/80 p-0.5 rounded border border-border/80 text-[10px] font-mono">
            <button
              onClick={() => setChannelView('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                channelView === 'all'
                  ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Show all 3 channels (Respiration, ECG, Brainwaves)"
            >
              3-CH ALL
            </button>
            <button
              onClick={() => setChannelView('resp')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                channelView === 'resp'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Solo Respiration channel"
            >
              RESP
            </button>
            <button
              onClick={() => setChannelView('ecg')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                channelView === 'ecg'
                  ? 'bg-red-500/25 text-red-300 border border-red-500/50 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Solo ECG Cardiac channel"
            >
              ECG
            </button>
            <button
              onClick={() => setChannelView('eeg')}
              className={`px-1.5 py-0.5 rounded transition-all ${
                channelView === 'eeg'
                  ? 'bg-purple-500/25 text-purple-300 border border-purple-500/50 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Solo EEG Brainwave channel"
            >
              EEG
            </button>
          </div>

          {isPaused && (
            <Badge variant="secondary" className="gap-1 font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
              <span>PAUSED</span>
            </Badge>
          )}
          {!isPaused && speed > 1 && (
            <Badge variant="cyan" className="gap-1 font-mono text-[10px]">
              <span>{speed}x</span>
            </Badge>
          )}
          {artifact_flag && (
            <Badge variant="destructive" className="gap-1 animate-pulse font-mono text-[10px]">
              <ShieldAlert className="w-3 h-3" />
              <span>ARTIFACT</span>
            </Badge>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={650}
          height={240}
          className="w-full h-[240px] rounded border border-border/40 block"
        />

        {/* Live Telemetry Channel Indicators */}
        <div className="flex flex-wrap items-center justify-between mt-2 pt-2 border-t border-border/40 text-xs font-mono text-muted-foreground gap-2">
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Respiration indicator */}
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Wind className="w-3.5 h-3.5" />
              <span>Resp: <strong className="text-foreground uppercase">{respiration.phase}</strong> ({respiration.value.toFixed(2)})</span>
            </div>

            {/* Cardiac indicator */}
            <div className="flex items-center gap-1.5 text-red-400">
              <Heart className="w-3.5 h-3.5" />
              <span>BPM: <strong className="text-foreground">{hrv.bpm.toFixed(1)}</strong></span>
            </div>

            {/* Brainwaves indicator */}
            <div className="flex items-center gap-1.5 text-purple-400">
              <Brain className="w-3.5 h-3.5" />
              <span>EEG: <strong className="text-foreground">{dominantRhythm}</strong> (α: {eeg.alpha.toFixed(2)})</span>
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground/80 font-mono">
            30Hz Medical Ticker
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
