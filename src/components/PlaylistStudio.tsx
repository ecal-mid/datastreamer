import React, { useState, useRef, useEffect } from 'react';
import {
  PlaylistScenario,
  PlaylistStep,
  PlaylistPlaybackState,
  TransitionType,
} from '../engine/types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Download,
  UploadCloud,
  FolderOpen,
  Sparkles,
  Repeat,
  Shuffle,
  Clock,
  Layers,
  CheckCircle2,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';

interface PlaylistStudioProps {
  playlists: PlaylistScenario[];
  activePlaylist: PlaylistScenario | null;
  playlistPlaybackState?: PlaylistPlaybackState | null;
  availableDatasets: string[];
  isPaused: boolean;
  onSelectPlaylist: (playlist: PlaylistScenario) => void;
  onSavePlaylist: (playlist: PlaylistScenario) => Promise<boolean>;
  onTogglePlayPause: () => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
  onSeekStep?: (index: number) => void;
  onOpenFolder?: () => void;
  isDesktop?: boolean;
}

const DURATION_OPTIONS = [
  { label: '10 sec', value: 10 },
  { label: '15 sec', value: 15 },
  { label: '30 sec', value: 30 },
  { label: '45 sec', value: 45 },
  { label: '60 sec (1m)', value: 60 },
  { label: '90 sec (1.5m)', value: 90 },
  { label: '120 sec (2m)', value: 120 },
  { label: '180 sec (3m)', value: 180 },
  { label: '300 sec (5m)', value: 300 },
];

export const PlaylistStudio: React.FC<PlaylistStudioProps> = ({
  playlists,
  activePlaylist,
  playlistPlaybackState,
  availableDatasets,
  isPaused,
  onSelectPlaylist,
  onSavePlaylist,
  onTogglePlayPause,
  onNextStep,
  onPrevStep,
  onSeekStep,
  onOpenFolder,
  isDesktop = false,
}) => {
  // Working draft of the scenario being viewed/edited
  const [draft, setDraft] = useState<PlaylistScenario>(() => {
    if (activePlaylist) return JSON.parse(JSON.stringify(activePlaylist));
    if (playlists.length > 0) return JSON.parse(JSON.stringify(playlists[0]));
    return {
      id: 'custom_scenario',
      name: 'Custom Sequence',
      description: 'Custom multi-stage biometric timeline',
      loop: true,
      transitionType: 'smooth',
      transitionDuration: 3.0,
      steps: [
        {
          id: 'step_1',
          name: 'Stage 1',
          recordingFile: availableDatasets[0] || 'meditation_deep_flow.json',
          durationSeconds: 30,
        },
      ],
    };
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft when activePlaylist changes from outside
  useEffect(() => {
    if (activePlaylist && activePlaylist.id !== draft.id) {
      setDraft(JSON.parse(JSON.stringify(activePlaylist)));
    }
  }, [activePlaylist?.id]);

  // Calculate total scenario duration
  const totalDurationSeconds = draft.steps.reduce(
    (acc, step) => acc + (step.durationSeconds || 30),
    0
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectScenario = (id: string) => {
    const found = playlists.find((p) => p.id === id);
    if (found) {
      const cloned = JSON.parse(JSON.stringify(found));
      setDraft(cloned);
      onSelectPlaylist(cloned);
    }
  };

  const handleCreateNew = () => {
    const newId = `scenario_${Date.now()}`;
    const newScenario: PlaylistScenario = {
      id: newId,
      name: 'New Custom Scenario',
      description: 'User composed sequence of biometric states',
      loop: true,
      transitionType: 'smooth',
      transitionDuration: 3.0,
      steps: [
        {
          id: `step_${Date.now()}_1`,
          name: 'Stage 1 - Rest',
          recordingFile: availableDatasets[0] || 'meditation_deep_flow.json',
          durationSeconds: 30,
        },
        {
          id: `step_${Date.now()}_2`,
          name: 'Stage 2 - Active',
          recordingFile: availableDatasets[1] || availableDatasets[0] || 'cognitive_stress_overload.json',
          durationSeconds: 45,
        },
      ],
    };
    setDraft(newScenario);
    onSelectPlaylist(newScenario);
  };

  const handleAddStep = () => {
    const nextNum = draft.steps.length + 1;
    const defaultFile =
      availableDatasets[Math.min(nextNum - 1, availableDatasets.length - 1)] ||
      availableDatasets[0] ||
      'meditation_deep_flow.json';

    const newStep: PlaylistStep = {
      id: `step_${Date.now()}_${nextNum}`,
      name: `Stage ${nextNum}`,
      recordingFile: defaultFile,
      durationSeconds: 30,
    };

    const updated = {
      ...draft,
      steps: [...draft.steps, newStep],
    };
    setDraft(updated);
    onSelectPlaylist(updated);
  };

  const handleUpdateStep = (index: number, patch: Partial<PlaylistStep>) => {
    const updatedSteps = [...draft.steps];
    updatedSteps[index] = { ...updatedSteps[index], ...patch };
    const updated = { ...draft, steps: updatedSteps };
    setDraft(updated);
    onSelectPlaylist(updated);
  };

  const handleRemoveStep = (index: number) => {
    if (draft.steps.length <= 1) return;
    const updatedSteps = draft.steps.filter((_, i) => i !== index);
    const updated = { ...draft, steps: updatedSteps };
    setDraft(updated);
    onSelectPlaylist(updated);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= draft.steps.length) return;
    const updatedSteps = [...draft.steps];
    const temp = updatedSteps[index];
    updatedSteps[index] = updatedSteps[target];
    updatedSteps[target] = temp;
    const updated = { ...draft, steps: updatedSteps };
    setDraft(updated);
    onSelectPlaylist(updated);
  };

  const handleSave = async () => {
    const ok = await onSavePlaylist(draft);
    if (ok) {
      setSaveStatus('✓ Saved!');
      setTimeout(() => setSaveStatus(null), 2500);
    }
  };

  const handleExportJson = () => {
    const str = JSON.stringify(draft, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.id || 'simdata_scenario'}.playlist.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content) as PlaylistScenario;
          if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            setDraft(parsed);
            onSelectPlaylist(parsed);
            await onSavePlaylist(parsed);
            setSaveStatus(`✓ Loaded "${parsed.name}"`);
            setTimeout(() => setSaveStatus(null), 3000);
          }
        } catch (err) {
          alert('Failed to parse playlist JSON file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  // Is this specific draft scenario currently running on the server?
  const isCurrentlyPlaying =
    Boolean(playlistPlaybackState?.isActive) &&
    playlistPlaybackState?.playlistId === draft.id;

  const currentStepIdx = playlistPlaybackState?.currentStepIndex ?? 0;
  const stepElapsed = playlistPlaybackState?.stepElapsedSeconds ?? 0;
  const stepDuration = playlistPlaybackState?.stepDurationSeconds ?? (draft.steps[currentStepIdx]?.durationSeconds || 30);
  const stepPct = Math.min(100, Math.max(0, Math.round((stepElapsed / Math.max(1, stepDuration)) * 100)));

  const playlistElapsed = playlistPlaybackState?.playlistElapsedSeconds ?? 0;
  const totalPlaylistSec = playlistPlaybackState?.totalPlaylistSeconds ?? totalDurationSeconds;
  const playlistPct = Math.min(100, Math.max(0, Math.round((playlistElapsed / Math.max(1, totalPlaylistSec)) * 100)));

  return (
    <div className="space-y-4">
      {/* Top Header: Scenario Selector & Action Bar */}
      <Card className="bg-card/70 border-border p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Active Scenario Selector Dropdown */}
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-mono uppercase text-muted-foreground font-semibold shrink-0">
              Active Scenario:
            </span>
            <select
              value={draft.id}
              onChange={(e) => handleSelectScenario(e.target.value)}
              className="bg-secondary/70 border border-border text-foreground rounded px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary max-w-[280px] truncate"
            >
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.steps.length} stages)
                </option>
              ))}
              {!playlists.some((p) => p.id === draft.id) && (
                <option value={draft.id}>{draft.name} (Custom)</option>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              onClick={handleCreateNew}
              className="gap-1 font-mono text-[11px]"
              title="Create new scenario"
            >
              <Plus className="w-3 h-3 text-primary" />
              <span>New</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleSave}
              className="gap-1 font-mono text-[11px]"
              title="Save current scenario to library"
            >
              <Save className="w-3 h-3 text-emerald-400" />
              <span>{saveStatus || 'Save'}</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={handleExportJson}
              className="gap-1 font-mono text-[11px]"
              title="Download scenario as portable .playlist.json"
            >
              <Download className="w-3 h-3 text-muted-foreground" />
              <span>Export</span>
            </Button>

            <Button
              variant="outline"
              size="xs"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1 font-mono text-[11px]"
              title="Import .playlist.json file"
            >
              <UploadCloud className="w-3 h-3 text-muted-foreground" />
              <span>Import</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            {isDesktop && onOpenFolder && (
              <Button
                variant="outline"
                size="xs"
                onClick={onOpenFolder}
                className="gap-1 font-mono text-[11px]"
                title="Open playlists folder in Finder"
              >
                <FolderOpen className="w-3 h-3 text-primary" />
                <span>Folder</span>
              </Button>
            )}
          </div>
        </div>

        {/* Scenario Metadata & Global Settings Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-border/60 text-xs">
          {/* Scenario Name & Description */}
          <div className="sm:col-span-1 space-y-1">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Scenario Name..."
              className="w-full bg-secondary/50 border border-border/80 rounded px-2 py-1 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="Scenario Description / Interaction Context..."
              className="w-full bg-secondary/30 border border-border/60 rounded px-2 py-0.5 text-[11px] text-muted-foreground focus:outline-none"
            />
          </div>

          {/* Loop & Transition Controls */}
          <div className="flex items-center justify-between sm:justify-center gap-4 bg-secondary/20 p-2 rounded border border-border/50">
            <div className="flex items-center gap-2">
              <Switch
                checked={draft.loop}
                onCheckedChange={(checked) => {
                  const updated = { ...draft, loop: checked };
                  setDraft(updated);
                  onSelectPlaylist(updated);
                }}
              />
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <Repeat className="w-3 h-3 text-primary" />
                <span>Loop Playlist</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="text-muted-foreground">Blend:</span>
              <select
                value={draft.transitionType === 'cut' ? 'cut' : `${draft.transitionDuration || 3.0}`}
                onChange={(e) => {
                  const val = e.target.value;
                  const updated: PlaylistScenario =
                    val === 'cut'
                      ? { ...draft, transitionType: 'cut', transitionDuration: 0 }
                      : { ...draft, transitionType: 'smooth', transitionDuration: parseFloat(val) };
                  setDraft(updated);
                  onSelectPlaylist(updated);
                }}
                className="bg-secondary/70 border border-border rounded px-1.5 py-0.5 text-[10px] text-foreground font-mono"
              >
                <option value="2">2s Crossfade</option>
                <option value="3">3s Crossfade</option>
                <option value="5">5s Crossfade</option>
                <option value="cut">Instant Cut</option>
              </select>
            </div>
          </div>

          {/* Total Duration & Load / Run Button */}
          <div className="flex items-center justify-between sm:justify-end gap-3 bg-secondary/20 p-2 rounded border border-border/50">
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>Total: <strong className="text-foreground">{formatTime(totalDurationSeconds)}</strong></span>
            </div>

            <Button
              size="xs"
              variant={isCurrentlyPlaying ? 'secondary' : 'default'}
              onClick={() => {
                onSelectPlaylist(draft);
                if (isPaused) onTogglePlayPause();
              }}
              className="gap-1.5 font-mono text-xs"
            >
              {isCurrentlyPlaying && !isPaused ? (
                <>
                  <Pause className="w-3 h-3" />
                  <span>Streaming</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Play Scenario</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Playback Transport HUD (Active when this scenario is running) */}
      {isCurrentlyPlaying && (
        <Card className="bg-primary/5 border-primary/40 p-3 space-y-2.5 shadow-[0_0_12px_#06b6d412]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" className="font-mono text-[9px] px-2 py-0.5">
                ● LIVE SCENARIO
              </Badge>
              <span className="text-xs font-mono font-bold text-foreground">
                Stage {currentStepIdx + 1} of {draft.steps.length}:{' '}
                <span className="text-primary">
                  {draft.steps[currentStepIdx]?.name || draft.steps[currentStepIdx]?.recordingFile}
                </span>
              </span>
              {playlistPlaybackState?.isTransitioning && (
                <Badge variant="warning" className="text-[9px] animate-pulse font-mono">
                  Blending Stage Transition...
                </Badge>
              )}
            </div>

            {/* Stage Skipping Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                onClick={onPrevStep}
                className="h-6 px-2 text-[10px] font-mono gap-1"
                title="Jump to previous stage immediately"
              >
                <SkipBack className="w-3 h-3" />
                <span>Prev</span>
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={onNextStep}
                className="h-6 px-2 text-[10px] font-mono gap-1"
                title="Jump to next stage immediately"
              >
                <span>Next</span>
                <SkipForward className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Dual Progress Bars: Current Stage & Overall Journey */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Current Stage Countdown */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>Stage Progress</span>
                <span className="text-foreground font-bold">
                  {formatTime(stepElapsed)} / {formatTime(stepDuration)}
                </span>
              </div>
              <Progress
                value={stepPct}
                className="h-1.5"
                indicatorClassName="bg-primary shadow-[0_0_8px_#06b6d444]"
              />
            </div>

            {/* Overall Playlist Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                <span>Total Journey Progress</span>
                <span className="text-foreground font-bold">
                  {formatTime(playlistElapsed)} / {formatTime(totalPlaylistSec)}
                </span>
              </div>
              <Progress
                value={playlistPct}
                className="h-1.5"
                indicatorClassName="bg-purple-400 shadow-[0_0_8px_#a855f744]"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Visual Scenario Timeline (Step Cards List) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono uppercase text-muted-foreground font-semibold px-1">
          <span>Sequence Stages ({draft.steps.length})</span>
          <Button
            size="xs"
            variant="outline"
            onClick={handleAddStep}
            className="gap-1 font-mono text-[11px] h-6"
          >
            <Plus className="w-3 h-3 text-primary" />
            <span>Add Stage</span>
          </Button>
        </div>

        <div className="space-y-1.5">
          {draft.steps.map((step, idx) => {
            const isStepActive = isCurrentlyPlaying && currentStepIdx === idx;
            const isJson = step.recordingFile.endsWith('.json');
            const isMuse = step.recordingFile.includes('muse');
            const isWesad = step.recordingFile.includes('wesad');

            return (
              <React.Fragment key={step.id || idx}>
                {/* Step Card */}
                <div
                  className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-2.5 rounded-lg border transition-all ${
                    isStepActive
                      ? 'bg-primary/10 border-primary shadow-[0_0_10px_#06b6d418]'
                      : 'bg-secondary/30 hover:bg-secondary/40 border-border/80'
                  }`}
                >
                  {/* Left: Step Index & Title Input */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Badge
                      variant={isStepActive ? 'cyan' : 'secondary'}
                      className="font-mono text-xs px-2 shrink-0"
                    >
                      #{idx + 1}
                    </Badge>

                    {isStepActive && (
                      <Badge variant="cyan" className="text-[9px] font-mono bg-primary/20 text-primary animate-pulse shrink-0">
                        ACTIVE
                      </Badge>
                    )}

                    <input
                      type="text"
                      value={step.name || ''}
                      onChange={(e) => handleUpdateStep(idx, { name: e.target.value })}
                      placeholder={`Stage ${idx + 1}`}
                      className="bg-transparent border-b border-border/60 focus:border-primary px-1 py-0.5 text-xs font-semibold text-foreground focus:outline-none min-w-[120px] max-w-[200px]"
                    />
                  </div>

                  {/* Middle: Recording File Selector */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <select
                      value={step.recordingFile}
                      onChange={(e) => handleUpdateStep(idx, { recordingFile: e.target.value })}
                      className="bg-secondary/70 border border-border rounded px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[220px] truncate"
                    >
                      {availableDatasets.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>

                    <Badge
                      variant={isMuse ? 'cyan' : isWesad ? 'cyan' : isJson ? 'warning' : 'success'}
                      className={`text-[9px] font-mono shrink-0 ${
                        isMuse ? 'bg-purple-500/20 text-purple-300' : isWesad ? 'bg-red-500/20 text-red-300' : ''
                      }`}
                    >
                      {isMuse ? 'MUSE' : isWesad ? 'WESAD' : isJson ? 'JSON' : 'CSV'}
                    </Badge>
                  </div>

                  {/* Right: Duration Selector & Reorder / Delete Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <select
                        value={step.durationSeconds}
                        onChange={(e) =>
                          handleUpdateStep(idx, { durationSeconds: parseInt(e.target.value, 10) })
                        }
                        className="bg-secondary/70 border border-border rounded px-1.5 py-1 text-xs font-mono text-foreground focus:outline-none"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Move Up / Move Down */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                        title="Move stage up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === draft.steps.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer"
                        title="Move stage down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Delete Stage */}
                    <button
                      onClick={() => handleRemoveStep(idx)}
                      disabled={draft.steps.length <= 1}
                      className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-20 cursor-pointer"
                      title="Remove stage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Transition connector between steps */}
                {idx < draft.steps.length - 1 && (
                  <div className="flex items-center justify-center py-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground/60 flex items-center gap-1 bg-secondary/30 px-2 py-0.5 rounded-full border border-border/40">
                      <span>↓</span>
                      <span>
                        {draft.transitionType === 'smooth'
                          ? `~${draft.transitionDuration || 3}s smooth crossfade`
                          : 'instant cut'}
                      </span>
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Add Stage Big Button */}
        <button
          onClick={handleAddStep}
          className="w-full py-2 border border-dashed border-border/80 hover:border-primary/60 rounded-lg text-xs font-mono text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-all bg-secondary/10 hover:bg-secondary/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>Add Next Stage to Scenario</span>
        </button>
      </div>
    </div>
  );
};
