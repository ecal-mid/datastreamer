import React, { useState, useEffect, useRef } from 'react';
import { BioEngine } from './engine/BioEngine';
import { DatasetPlayer } from './engine/DatasetPlayer';
import { BioSonification } from './engine/BioSonification';
import { importBiometricCsv } from './engine/converters';
import {
  SimDataTelemetry,
  OperatingMode,
  PresetArchetype,
  ArtifactType,
  ManualOverrides,
  DatasetPlaybackState,
  PlaylistScenario,
  PlaylistPlaybackState,
} from './engine/types';

import { Header } from './components/Header';
import { Oscilloscope } from './components/Oscilloscope';
import { SpectralBars } from './components/SpectralBars';
import { PresetsTab } from './components/PresetsTab';
import { PuppeteerTab } from './components/PuppeteerTab';
import { DatasetTab } from './components/DatasetTab';
import { ArtifactsBar } from './components/ArtifactsBar';
import { FigmaModal } from './components/FigmaModal';
import { PayloadModal } from './components/PayloadModal';
import { HelpModal } from './components/HelpModal';
import { Card } from './components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Sparkles, Sliders, HardDrive } from 'lucide-react';

const INITIAL_TELEMETRY: SimDataTelemetry = {
  timestamp: Date.now(),
  mode: 'generative',
  biometrics: {
    eeg: { alpha: 0.5, beta: 0.3, theta: 0.35, smr: 0.45, gamma: 0.1, delta: 0.25 },
    hrv: { bpm: 70.0, rmssd: 50.0, coherence: 0.5 },
    respiration: { phase: 'inhale', value: 0.5 },
    eda: { tonic: 5.0, phasic: 0.0 }
  },
  states: {
    state_name: 'Baseline / Neutral',
    stage_name: 'Generative Live',
    calm_index: 0.55,
    focus_index: 0.50,
    artifact_flag: false
  }
};

function getTargetHost(): string {
  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;
    if (port && port !== '5173') {
      return `${window.location.hostname}:${port}`;
    }
  }
  return '127.0.0.1:8081';
}

function getWsUrl(): string {
  const host = getTargetHost();
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${host}`;
}

function getHttpBaseUrl(): string {
  const host = getTargetHost();
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  return `${protocol}//${host}`;
}

export const App: React.FC = () => {
  // Engines
  const localEngine = useRef<BioEngine>(new BioEngine());
  const datasetPlayer = useRef<DatasetPlayer>(new DatasetPlayer());
  const sonification = useRef<BioSonification>(new BioSonification());

  // App States
  const [telemetry, setTelemetry] = useState<SimDataTelemetry>(INITIAL_TELEMETRY);
  const [activeTab, setActiveTab] = useState<'presets' | 'puppeteer' | 'playback'>('presets');
  const activeTabRef = useRef<'presets' | 'puppeteer' | 'playback'>('presets');

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);
  const [activePreset, setActivePreset] = useState<PresetArchetype>('baseline');
  const [activeArtifact, setActiveArtifact] = useState<ArtifactType>('none');
  const [overrides, setOverrides] = useState<ManualOverrides>(localEngine.current.getOverrides());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  // Main Streamer Transport Controls State
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);

  // Network Bridge States
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [wsClientsCount, setWsClientsCount] = useState<number>(0);
  const [wsPort, setWsPort] = useState<number>(8081);
  const [oscPackets, setOscPackets] = useState<number>(0);
  const socketRef = useRef<WebSocket | null>(null);

  // Buffer recent frames for live CSV export
  const sessionHistory = useRef<SimDataTelemetry[]>([]);

  // Local cache for in-memory / uploaded dataset contents
  const localFileCache = useRef<Map<string, string>>(new Map());

  // Playback States
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([
    'meditation_deep_flow.json',
    'cognitive_stress_overload.json',
    'respiratory_coherence_training.csv',
    'drowsiness_hypnagogia.csv'
  ]);
  const [selectedDataset, setSelectedDataset] = useState<string>('meditation_deep_flow.json');
  const [playbackState, setPlaybackState] = useState<DatasetPlaybackState>(datasetPlayer.current.getState());

  // Playlist / Scenario States
  const [playlists, setPlaylists] = useState<PlaylistScenario[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<PlaylistScenario | null>(null);
  const [playlistState, setPlaylistState] = useState<PlaylistPlaybackState | null>(null);

  // Modals
  const [figmaModalOpen, setFigmaModalOpen] = useState<boolean>(false);
  const [payloadModalOpen, setPayloadModalOpen] = useState<boolean>(false);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);

  const sendControlMessage = (msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  // Connect to backend WebSocket
  useEffect(() => {
    let reconnectTimeout: any;

    const connectWs = () => {
      try {
        const ws = new WebSocket(getWsUrl());
        socketRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'SIMDATA_INIT' || data.type === 'SIMBIO_INIT') {
              setWsConnected(true);
              if (data.ports?.ws) setWsPort(data.ports.ws);
              if (typeof data.isPaused === 'boolean') {
                setIsPaused(data.isPaused);
                localEngine.current.setPaused(data.isPaused);
              }
              if (typeof data.speed === 'number') {
                setSimSpeed(data.speed);
                localEngine.current.setSpeed(data.speed);
                datasetPlayer.current.setSpeed(data.speed);
              }
            } else if (data.type === 'CONTROL_STATE') {
              if (typeof data.isPaused === 'boolean') {
                setIsPaused(data.isPaused);
                localEngine.current.setPaused(data.isPaused);
              }
              if (typeof data.speed === 'number') {
                setSimSpeed(data.speed);
                localEngine.current.setSpeed(data.speed);
                datasetPlayer.current.setSpeed(data.speed);
              }
            } else if (data.biometrics) {
              setTelemetry(data);
              if (data.playlist_state) {
                setPlaylistState(data.playlist_state);
              }
              setOscPackets((prev) => prev + 10);

              sessionHistory.current.push(data);
              if (sessionHistory.current.length > 900) sessionHistory.current.shift();

              // Update audio sonification (only when not paused)
              if (sonification.current.getIsEnabled() && !isPaused) {
                sonification.current.update(
                  data.biometrics.hrv.bpm,
                  data.biometrics.respiration.value,
                  data.biometrics.respiration.phase,
                  0.5
                );
              }
            }
          } catch (e) {}
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 2000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };
      } catch (e) {
        setWsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 2000);
      }
    };

    connectWs();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  // Poll server status endpoint
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${getHttpBaseUrl()}/status`);
        if (res.ok) {
          const json = await res.json();
          setWsClientsCount(json.clientsCount || 0);
          if (json.wsPort) setWsPort(json.wsPort);
          if (json.oscPacketCount) setOscPackets(json.oscPacketCount);
          if (typeof json.isPaused === 'boolean') {
            setIsPaused(json.isPaused);
            localEngine.current.setPaused(json.isPaused);
          }
          if (typeof json.speed === 'number') {
            setSimSpeed(json.speed);
            localEngine.current.setSpeed(json.speed);
            datasetPlayer.current.setSpeed(json.speed);
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(fetchStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  // Load available datasets from server and initialize default
  useEffect(() => {
    const fetchAvailableDatasets = async () => {
      try {
        const res = await fetch(`${getHttpBaseUrl()}/api/recordings`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.files) && json.files.length > 0) {
            setAvailableDatasets((prev) => Array.from(new Set([...prev, ...json.files])));
          }
        }
      } catch (e) {}
    };

    const loadDefaultDataset = async () => {
      try {
        const res = await fetch(`${getHttpBaseUrl()}/api/recordings/meditation_deep_flow.json`);
        if (res.ok) {
          const data = await res.json();
          datasetPlayer.current.loadJson('meditation_deep_flow.json', data);
          setPlaybackState(datasetPlayer.current.getState());
        }
      } catch (e) {}
    };

    const fetchPlaylists = async () => {
      try {
        const res = await fetch(`${getHttpBaseUrl()}/api/playlists`);
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.playlists) && json.playlists.length > 0) {
            setPlaylists(json.playlists);
            setActivePlaylist(json.playlists[0]);
          }
        }
      } catch (e) {}
    };

    fetchAvailableDatasets();
    fetchPlaylists();
    loadDefaultDataset();
  }, []);

  // 30 Hz local simulation loop (only ticks locally when offline / !wsConnected)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!wsConnected) {
        if (activeTab === 'playback') {
          const frame = datasetPlayer.current.tick();
          if (frame) {
            setTelemetry(frame);
            setPlaybackState(datasetPlayer.current.getState());
            sessionHistory.current.push(frame);
            if (sessionHistory.current.length > 900) sessionHistory.current.shift();

            if (sonification.current.getIsEnabled() && !isPaused) {
              sonification.current.update(
                frame.biometrics.hrv.bpm,
                frame.biometrics.respiration.value,
                frame.biometrics.respiration.phase,
                0.5
              );
            }
          }
        } else {
          const frame = localEngine.current.tick(1 / 30);
          setTelemetry(frame);
          sessionHistory.current.push(frame);
          if (sessionHistory.current.length > 900) sessionHistory.current.shift();

          if (sonification.current.getIsEnabled() && !isPaused) {
            sonification.current.update(
              frame.biometrics.hrv.bpm,
              frame.biometrics.respiration.value,
              frame.biometrics.respiration.phase,
              0.5
            );
          }
        }
      }
    }, 1000 / 30);

    return () => clearInterval(timer);
  }, [activeTab, wsConnected, isPaused]);

  const handleTabChange = (tab: 'presets' | 'puppeteer' | 'playback') => {
    setActiveTab(tab);
    activeTabRef.current = tab;
    const mode: OperatingMode = tab === 'playback' ? 'playback' : tab === 'presets' ? 'preset' : 'generative';
    localEngine.current.setMode(mode);
    sendControlMessage({ type: 'SET_MODE', mode });

    if (tab === 'playback') {
      sendControlMessage({ type: 'SET_DATASET', name: selectedDataset });
      if (!isPaused) {
        datasetPlayer.current.play();
      }
    }
  };

  const handleSelectPreset = (preset: PresetArchetype) => {
    setActivePreset(preset);
    localEngine.current.setPreset(preset);
    sendControlMessage({ type: 'SET_PRESET', preset });
  };

  const handleUpdateOverrides = (newOverrides: Partial<ManualOverrides>) => {
    localEngine.current.setOverrides(newOverrides);
    const updated = localEngine.current.getOverrides();
    setOverrides({ ...updated });
    sendControlMessage({ type: 'SET_OVERRIDES', overrides: newOverrides });
  };

  const handleResetOverrides = () => {
    const cleared: ManualOverrides = {
      enabled: {},
      values: { ...overrides.values }
    };
    localEngine.current.setOverrides({ enabled: {} });
    setOverrides(cleared);
    sendControlMessage({ type: 'SET_OVERRIDES', overrides: { enabled: {} } });
  };

  const handleTriggerArtifact = (type: ArtifactType) => {
    setActiveArtifact(type);
    localEngine.current.triggerArtifact(type);
    sendControlMessage({ type: 'TRIGGER_ARTIFACT', artifact: type });

    if (type === 'blink') {
      setTimeout(() => setActiveArtifact('none'), 200);
    } else if (type === 'clench') {
      setTimeout(() => setActiveArtifact('none'), 1500);
    }
  };

  const handleTriggerEdaSpike = () => {
    localEngine.current.triggerPhasicSpike();
  };

  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    sonification.current.setEnabled(next);
  };

  const handleExportCsv = () => {
    const frames = sessionHistory.current;
    if (frames.length === 0) return;

    const lines = [
      'timestamp,bpm,rmssd,coherence,respiration_phase,respiration_value,alpha,beta,theta,smr,gamma,delta,tonic_eda,phasic_eda,calm_index,focus_index,artifact'
    ];

    for (const f of frames) {
      lines.push([
        f.timestamp,
        f.biometrics.hrv.bpm,
        f.biometrics.hrv.rmssd,
        f.biometrics.hrv.coherence,
        f.biometrics.respiration.phase,
        f.biometrics.respiration.value,
        f.biometrics.eeg.alpha,
        f.biometrics.eeg.beta,
        f.biometrics.eeg.theta,
        f.biometrics.eeg.smr,
        f.biometrics.eeg.gamma,
        f.biometrics.eeg.delta,
        f.biometrics.eda.tonic,
        f.biometrics.eda.phasic,
        f.states.calm_index,
        f.states.focus_index,
        f.states.artifact_flag ? 1 : 0
      ].join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `simdata_session_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dataset Transport Handlers
  const handleSelectDataset = async (name: string) => {
    setSelectedDataset(name);

    if (isPaused) {
      setIsPaused(false);
      localEngine.current.setPaused(false);
      sendControlMessage({ type: 'SET_PAUSED', paused: false });
    }
    datasetPlayer.current.play();

    // If file is cached in memory, load immediately and send to server
    if (localFileCache.current.has(name)) {
      const cached = localFileCache.current.get(name)!;
      if (name.endsWith('.json')) {
        datasetPlayer.current.loadJson(name, cached);
      } else {
        datasetPlayer.current.loadCsv(name, cached);
      }
      datasetPlayer.current.play();
      setPlaybackState(datasetPlayer.current.getState());
      sendControlMessage({ type: 'SET_DATASET', name, content: cached });
      return;
    }

    sendControlMessage({ type: 'SET_DATASET', name });

    try {
      const res = await fetch(`${getHttpBaseUrl()}/api/recordings/${name}`);
      if (res.ok) {
        if (name.endsWith('.json')) {
          const json = await res.json();
          datasetPlayer.current.loadJson(name, json);
        } else {
          const csvText = await res.text();
          datasetPlayer.current.loadCsv(name, csvText);
        }
        datasetPlayer.current.play();
        setPlaybackState(datasetPlayer.current.getState());
      }
    } catch (e) {}
  };

  const handleTogglePlay = () => {
    datasetPlayer.current.togglePlay();
    const st = datasetPlayer.current.getState();
    setPlaybackState(st);
    setIsPaused(!st.isPlaying);
    localEngine.current.setPaused(!st.isPlaying);
    sendControlMessage({ type: 'SET_PAUSED', paused: !st.isPlaying });
  };

  const handleTogglePlayPause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    localEngine.current.setPaused(nextPaused);
    if (activeTab === 'playback') {
      if (nextPaused) {
        datasetPlayer.current.pause();
      } else {
        datasetPlayer.current.play();
      }
      setPlaybackState(datasetPlayer.current.getState());
    }
    sendControlMessage({ type: 'SET_PAUSED', paused: nextPaused });
  };

  const handleToggleLoop = () => {
    datasetPlayer.current.toggleLoop();
    setPlaybackState(datasetPlayer.current.getState());
  };

  const handleSeek = (progress: number) => {
    datasetPlayer.current.seekNormalized(progress);
    setPlaybackState(datasetPlayer.current.getState());
    const cur = datasetPlayer.current.getCurrentFrame();
    if (cur) {
      setTelemetry(cur);
      sendControlMessage({ type: 'PLAYBACK_FRAME', frame: cur });
    }
  };

  const handleDownloadDataset = (name: string) => {
    if (localFileCache.current.has(name)) {
      const content = localFileCache.current.get(name)!;
      const blob = new Blob([content], {
        type: name.endsWith('.json') ? 'application/json' : 'text/csv'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const url = `${getHttpBaseUrl()}/api/recordings/${name}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
  };

  const handleDownloadTemplate = () => {
    const url = `${getHttpBaseUrl()}/api/recordings/template.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.download = 'simdata_template.csv';
    link.click();
  };

  const handleDownloadSample = (sampleName: string) => {
    const url = `${getHttpBaseUrl()}/api/samples/${sampleName}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = sampleName;
    link.click();
  };

  const handleOpenRecordingsFolder = () => {
    if (typeof window !== 'undefined' && (window as any).simDataDesktop?.openRecordingsFolder) {
      (window as any).simDataDesktop.openRecordingsFolder();
    }
  };

  const handleOpenPlaylistsFolder = () => {
    if (typeof window !== 'undefined' && (window as any).simDataDesktop?.openPlaylistsFolder) {
      (window as any).simDataDesktop.openPlaylistsFolder();
    }
  };

  const handleSelectPlaylist = (playlist: PlaylistScenario) => {
    setActivePlaylist(playlist);
    if (isPaused) {
      setIsPaused(false);
      localEngine.current.setPaused(false);
      sendControlMessage({ type: 'SET_PAUSED', paused: false });
    }
    sendControlMessage({ type: 'SET_MODE', mode: 'playlist' });
    sendControlMessage({ type: 'SET_PLAYLIST', playlist });
  };

  const handleSavePlaylist = async (playlist: PlaylistScenario): Promise<boolean> => {
    try {
      const res = await fetch(`${getHttpBaseUrl()}/api/playlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlist }),
      });
      if (res.ok) {
        setPlaylists((prev) => {
          const idx = prev.findIndex((p) => p.id === playlist.id);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = playlist;
            return updated;
          }
          return [playlist, ...prev];
        });
        return true;
      }
    } catch (e) {}
    return false;
  };

  const handleNextPlaylistStep = () => {
    sendControlMessage({ type: 'PLAYLIST_NEXT' });
  };

  const handlePrevPlaylistStep = () => {
    sendControlMessage({ type: 'PLAYLIST_PREV' });
  };

  const handleSeekPlaylistStep = (stepIndex: number) => {
    sendControlMessage({ type: 'PLAYLIST_SEEK', stepIndex });
  };

  const handleUploadDataset = async (
    file: File
  ): Promise<{ success: boolean; frameCount?: number; format?: string; message?: string; error?: string }> => {
    try {
      const text = await file.text();
      let res: { success: boolean; frameCount: number; error?: string };
      let saveFilename = file.name;
      let saveContent = text;
      let detectedFormat = 'simdata';
      let statusMessage = '';

      if (file.name.endsWith('.json')) {
        res = datasetPlayer.current.loadJson(file.name, text);
        if (!res.success) {
          return { success: false, error: res.error || 'Failed to parse JSON file' };
        }
        statusMessage = `Loaded JSON dataset "${file.name}" (${res.frameCount} frames).`;
      } else if (file.name.endsWith('.csv')) {
        // Universal Biometric CSV Converter (auto-detects SimData, Muse / Mind Monitor, and WESAD)
        const conversion = importBiometricCsv(text, file.name);
        if (!conversion.success) {
          return { success: false, error: conversion.error || 'Failed to parse CSV dataset' };
        }

        detectedFormat = conversion.format;
        statusMessage = conversion.message || `Loaded CSV dataset (${conversion.frameCount} frames).`;

        if (conversion.format === 'muse' || conversion.format === 'wesad') {
          saveFilename = file.name.startsWith('imported_') ? file.name : `imported_${conversion.format}_${file.name}`;
          saveContent = conversion.csv;
        }

        res = datasetPlayer.current.loadCsv(saveFilename, saveContent);
        if (!res.success) {
          return { success: false, error: res.error || 'Failed to load converted dataset' };
        }
      } else {
        return { success: false, error: 'Only .csv or .json files are supported' };
      }

      // Update state in memory immediately
      setSelectedDataset(saveFilename);
      datasetPlayer.current.play();
      setIsPaused(false);
      localEngine.current.setPaused(false);
      setPlaybackState(datasetPlayer.current.getState());
      localFileCache.current.set(saveFilename, saveContent);
      setAvailableDatasets((prev) => (prev.includes(saveFilename) ? prev : [saveFilename, ...prev]));

      // Tell backend server to unpause and load this dataset
      sendControlMessage({ type: 'SET_PAUSED', paused: false });
      sendControlMessage({ type: 'SET_DATASET', name: saveFilename, content: saveContent });

      // Persist to backend server so it stays across restarts
      try {
        const postRes = await fetch(`${getHttpBaseUrl()}/api/recordings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: saveFilename, content: saveContent })
        });
        if (postRes.ok) {
          const json = await postRes.json();
          if (Array.isArray(json.files)) {
            setAvailableDatasets((prev) => Array.from(new Set([saveFilename, ...json.files, ...prev])));
          }
        }
      } catch (err) {
        console.warn('[SimData] Could not persist uploaded recording to server disk:', err);
      }

      return {
        success: true,
        frameCount: res.frameCount,
        format: detectedFormat,
        message: statusMessage
      };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error processing file' };
    }
  };

  const handleSetSpeed = (speed: number) => {
    setSimSpeed(speed);
    localEngine.current.setSpeed(speed);
    datasetPlayer.current.setSpeed(speed);
    setPlaybackState(datasetPlayer.current.getState());
    sendControlMessage({ type: 'SET_SPEED', speed });
  };

  return (
    <div className="h-screen h-[100dvh] bg-background text-foreground flex flex-col font-sans selection:bg-primary/30 overflow-hidden">
      {/* Top Header */}
      <Header
        wsConnected={wsConnected}
        wsClientsCount={wsClientsCount}
        wsPort={wsPort}
        oscTarget="127.0.0.1:9000"
        oscPackets={oscPackets}
        fps={30}
        mode={telemetry.mode}
        isPaused={isPaused}
        speed={simSpeed}
        onTogglePlayPause={handleTogglePlayPause}
        onSetSpeed={handleSetSpeed}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onExportCsv={handleExportCsv}
        onOpenFigmaModal={() => setFigmaModalOpen(true)}
        onOpenPayloadModal={() => setPayloadModalOpen(true)}
        onOpenHelpModal={() => setHelpModalOpen(true)}
      />

      {/* Main Workspace Body - Scrollable Container */}
      <main className="flex-1 min-h-0 max-w-[1400px] w-full mx-auto p-3 sm:p-4 pb-20 space-y-3.5 overflow-y-auto overscroll-contain">
        {/* Top Half: Oscilloscope & Telemetry */}
        <Oscilloscope telemetry={telemetry} isPaused={isPaused} speed={simSpeed} />

        {/* Spectral Band Power Bars */}
        <SpectralBars eeg={telemetry.biometrics.eeg} />

        {/* Middle Section: Operating Mode Selector Tabs using shadcn Tabs */}
        <Card className="bg-card/60 border-border p-3.5">
          <Tabs value={activeTab} onValueChange={(val) => handleTabChange(val as any)}>
            <div className="flex items-center justify-between border-b border-border/80 pb-2.5 mb-3.5">
              <TabsList className="bg-secondary/40">
                <TabsTrigger value="presets" className="gap-1.5 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Generative Presets</span>
                </TabsTrigger>

                <TabsTrigger value="puppeteer" className="gap-1.5 font-mono">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  <span>Manual Puppeteer</span>
                </TabsTrigger>

                <TabsTrigger value="playback" className="gap-1.5 font-mono">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dataset Playback</span>
                </TabsTrigger>
              </TabsList>

              <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
                Active Mode: <strong className="text-primary uppercase">{activeTab}</strong>
              </div>
            </div>

            <TabsContent value="presets" className="mt-0">
              <PresetsTab
                activePreset={activePreset}
                onSelectPreset={handleSelectPreset}
                overrides={overrides}
                onUpdateOverrides={handleUpdateOverrides}
              />
            </TabsContent>

            <TabsContent value="puppeteer" className="mt-0">
              <PuppeteerTab
                overrides={overrides}
                onUpdateOverrides={handleUpdateOverrides}
                onResetOverrides={handleResetOverrides}
              />
            </TabsContent>

            <TabsContent value="playback" className="mt-0">
              <DatasetTab
                availableDatasets={availableDatasets}
                selectedDataset={selectedDataset}
                onSelectDataset={handleSelectDataset}
                onDownloadDataset={handleDownloadDataset}
                onUploadDataset={handleUploadDataset}
                onDownloadTemplate={handleDownloadTemplate}
                onDownloadSample={handleDownloadSample}
                onOpenFolder={handleOpenRecordingsFolder}
                isDesktop={typeof window !== 'undefined' && Boolean((window as any).simDataDesktop?.isElectron)}
                playlists={playlists}
                activePlaylist={activePlaylist}
                playlistPlaybackState={playlistState}
                isPaused={isPaused}
                onSelectPlaylist={handleSelectPlaylist}
                onSavePlaylist={handleSavePlaylist}
                onNextPlaylistStep={handleNextPlaylistStep}
                onPrevPlaylistStep={handlePrevPlaylistStep}
                onSeekPlaylistStep={handleSeekPlaylistStep}
                onOpenPlaylistsFolder={handleOpenPlaylistsFolder}
                onTogglePlay={handleTogglePlayPause}
              />
            </TabsContent>
          </Tabs>
        </Card>

        {/* Bottom Section: Artifact Triggers */}
        <ArtifactsBar
          activeArtifact={activeArtifact}
          onTriggerArtifact={handleTriggerArtifact}
          onTriggerEdaSpike={handleTriggerEdaSpike}
        />
      </main>

      {/* Modals */}
      <FigmaModal
        isOpen={figmaModalOpen}
        onClose={() => setFigmaModalOpen(false)}
      />
      <PayloadModal
        isOpen={payloadModalOpen}
        onClose={() => setPayloadModalOpen(false)}
        telemetry={telemetry}
      />
      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};
export default App;
