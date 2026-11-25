import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Search,
  Heart,
  Wind,
  Brain,
  Zap,
  Sparkles,
  Link2,
  Palette,
  Layers,
  AlertTriangle,
  Smile,
  Activity,
  Flame,
  Moon,
  Clock,
  ArrowRight,
  ShieldAlert,
  Eye,
  Radio,
  CheckCircle2,
  SlidersHorizontal,
  AlertCircle,
  Code2,
  Copy,
  Check,
  Terminal,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'glossary' | 'connections' | 'archetypes' | 'recipes'>('glossary');
  const [recipeSubTab, setRecipeSubTab] = useState<'figma' | 'web'>('figma');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedPrompt(id);
      setTimeout(() => setCopiedPrompt(null), 2000);
    }
  };

  const filteredGlossary = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return GLOSSARY_ITEMS;
    return GLOSSARY_ITEMS.filter(
      item =>
        item.term.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.simpleExplanation.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-secondary/30 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span>SimData Biometrics & Interaction Guide</span>
                  <Badge variant="cyan" className="text-[10px] font-mono px-1.5 py-0">v1.2.0</Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Clear explanations of biometric terms, calculations, sensor artifacts, and Figma prototyping recipes.
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Search bar for quick lookups */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any term (e.g., 'artifact', 'blink', 'clench', 'stress', 'EDA', 'respiration')..."
              className="w-full bg-secondary/60 border border-border/80 rounded-md pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-border/60 bg-secondary/10 shrink-0">
            <TabsList className="w-full justify-start bg-secondary/40 font-mono text-xs">
              <TabsTrigger value="glossary" className="gap-1.5 text-xs">
                <Brain className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Terms & Dictionary</span>
              </TabsTrigger>
              <TabsTrigger value="connections" className="gap-1.5 text-xs">
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. How Signals Connect</span>
              </TabsTrigger>
              <TabsTrigger value="archetypes" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>3. States & Scenarios</span>
              </TabsTrigger>
              <TabsTrigger value="recipes" className="gap-1.5 text-xs">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Prototyping Recipes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Terms & Dictionary */}
          <TabsContent value="glossary" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            {filteredGlossary.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                No terms matching &quot;{searchQuery}&quot;. Try searching for &quot;artifact&quot;, &quot;blink&quot;, &quot;clench&quot;, &quot;alpha&quot;, &quot;bpm&quot;, or &quot;stress&quot;.
              </div>
            ) : (
              filteredGlossary.map((item) => (
                <Card key={item.term} className="bg-secondary/25 border-border/80 p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <h3 className="font-bold text-sm text-foreground">{item.term}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono py-0 text-muted-foreground">
                        {item.tag}
                      </Badge>
                    </div>
                    {item.figmaVar && (
                      <Badge variant="cyan" className="font-mono text-[10px] py-0">
                        Figma: {item.figmaVar}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-foreground/90 leading-relaxed">
                    {item.simpleExplanation}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono">
                    <div className="bg-card/50 p-2 rounded border border-border/30">
                      <span className="text-emerald-400 font-semibold">Low Value:</span> {item.lowMeaning}
                    </div>
                    <div className="bg-card/50 p-2 rounded border border-border/30">
                      <span className="text-amber-400 font-semibold">High Value:</span> {item.highMeaning}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Tab 2: How Signals Connect (Physiological Coupling & Artifacts) */}
          <TabsContent value="connections" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 mt-0">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Your body functions as an interconnected physiological system. When your breathing changes, your pulse responds within seconds. When cognitive demand increases, your skin sweat and brain rhythms shift simultaneously. SimData models these connections and differentiates genuine bodily shifts from physical sensor noise:
            </div>

            {/* Coupling 1: Breathing -> Heart (RSA) */}
            <Card className="bg-secondary/25 border-cyan-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <Wind className="w-4 h-4" />
                <span>Chain Reaction 1: Breath & Heart Coupling (RSA)</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                When you inhale, your heart rate increases. When you exhale, your heart rate decreases. This natural respiratory modulation is called <strong>Respiratory Sinus Arrhythmia (RSA)</strong>.
              </p>
              <div className="bg-card/60 p-3 rounded-lg border border-border/60 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-cyan-300">
                  <span>Inhalation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Thoracic pressure shifts &rarr; Vagus nerve activity decreases &rarr; <strong>Heart rate increases (BPM &uarr;)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>Exhalation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Thoracic pressure resets &rarr; Vagus nerve activity increases &rarr; <strong>Heart rate decreases (BPM &darr;)</strong></span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                <strong>Why it matters:</strong> A rigid, unvarying heart rate reflects autonomic exhaustion or high stress. A flexible heart rate that rises and falls with breathing indicates healthy autonomic regulation.
              </p>
            </Card>

            {/* Coupling 2: Stress Chain Reaction */}
            <Card className="bg-secondary/25 border-amber-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Flame className="w-4 h-4" />
                <span>Chain Reaction 2: The Mental Stress Response</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                When cognitive workload spikes, deadlines approach, or unexpected errors occur, the sympathetic branch of the autonomic nervous system activates:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-amber-400 font-bold block mb-1">1. Brainwaves</span>
                  Calm <strong>Alpha</strong> decreases (0.15), while analytical <strong>Beta</strong> increases (0.85) as processing demand climbs.
                </div>
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-red-400 font-bold block mb-1">2. Heart & Respiration</span>
                  Heart rate accelerates (95+ BPM) and breathing turns rapid, shallow, and irregular.
                </div>
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-orange-400 font-bold block mb-1">3. Skin Conductance</span>
                  Palm sweat glands activate, creating immediate <strong>Phasic EDA spikes</strong> and elevated baseline skin conductance.
                </div>
              </div>
            </Card>

            {/* Coupling 3: Resonance & Coherence */}
            <Card className="bg-secondary/25 border-emerald-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <Activity className="w-4 h-4" />
                <span>Chain Reaction 3: Resonant Breathing & Coherence</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                When you pace your breathing to approximately <strong>6 breaths per minute</strong> (0.10 Hz), blood pressure oscillations (Mayer waves) and respiratory cycles synchronize into a rhythmic pattern called <strong>Resonant Coherence</strong>.
              </p>
              <div className="bg-card/60 p-3 rounded-lg border border-border/60 text-xs font-mono text-emerald-300">
                Coherence Score reaches <strong>0.85 – 0.95</strong>. Alpha brainwaves increase, skin conductance stabilizes, and the Calm Index reaches its highest level.
              </div>
            </Card>

            {/* Coupling 4: Real Stress vs. Sensor Artifacts */}
            <Card className="bg-secondary/25 border-purple-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-purple-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Chain Reaction 4: Distinguishing Real Stress from Physical Sensor Artifacts</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                A central challenge in biofeedback interface design is distinguishing between genuine psychological states and physical sensor noise. Physical movements produce large electrical deflections that can easily fool simplistic threshold algorithms:
              </p>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-emerald-400 font-bold block mb-0.5">Genuine Physiological Stress:</span>
                  <span className="text-foreground/90">
                    Coordinated across multiple bodily systems: Heart rate accelerates, breathing quickens, skin sweat spikes (Phasic EDA), and Alpha brainwaves drop. All sensors change in physiological harmony.
                  </span>
                </div>

                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-amber-400 font-bold block mb-0.5">Jaw Clenching or Chewing (EMG Noise):</span>
                  <span className="text-foreground/90">
                    Generates huge high-frequency electrical bursts (20 – 100+ Hz) that overwhelm EEG brainwave sensors. However, heart rate, respiration, and skin sweat remain completely normal.
                  </span>
                </div>

                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-cyan-400 font-bold block mb-0.5">Eye Blinks & Rapid Eye Movements (EOG Spikes):</span>
                  <span className="text-foreground/90">
                    The eyeball electrical potential creates a brief 200 ms spike on forehead electrodes. It is localized strictly to frontal sensors and disappears immediately.
                  </span>
                </div>

                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-orange-400 font-bold block mb-0.5">Optical Sensor Movement & Ambient Light Leakage (PPG Artifacts):</span>
                  <span className="text-foreground/90">
                    When a smartwatch, ring, or earclip shifts on the skin during hand gestures, ambient room light leaks into the optical photodiode. This causes sudden baseline drift and erratic pulse readings that do not reflect actual heart activity. SimData simulates this optical interference and sets <strong className="text-primary font-bold">bio_artifact = true</strong>.
                  </span>
                </div>

                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-red-400 font-bold block mb-0.5">Loose Sensor or Hardware Detachment:</span>
                  <span className="text-foreground/90">
                    Contact resistance jumps to maximum or optical seal is broken, causing the signal to flatline to zero or pick up 50/60 Hz powerline hum. SimData flags this condition by setting <strong className="text-primary font-bold">bio_artifact = true</strong>.
                  </span>
                </div>
              </div>

              <div className="bg-card/60 p-3 rounded-lg border border-border/60 text-xs font-mono text-muted-foreground">
                <strong className="text-primary">Interaction Design Rule:</strong> When <code className="text-foreground">bio_artifact</code> is true, the interface should never tell the user they are stressed or dock points. Instead, display a subtle sensor adjustment alert or gently pause active feedback until contact is restored.
              </div>
            </Card>
          </TabsContent>

          {/* Tab 3: States & Scenarios Matrix */}
          <TabsContent value="archetypes" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            <div className="text-xs text-muted-foreground leading-relaxed">
              SimData groups continuous biometric streams into distinct human states. You can trigger these states in the <strong>Presets</strong> tab, stream them from pre-recorded datasets, or chain them together in <strong>Scenario Playlists</strong>:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Baseline */}
              <Card className="bg-secondary/25 border-border/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                    <Smile className="w-4 h-4 text-primary" />
                    <span>Baseline / Neutral</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">Resting</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Normal resting state during quiet reading or seated office work.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~70 BPM</strong> (steady)</div>
                  <div>• Breathing: <strong className="text-foreground">~10 breaths/min</strong></div>
                  <div>• Brain: Moderate <strong className="text-cyan-400">Alpha 0.50</strong> & <strong className="text-amber-400">Beta 0.35</strong></div>
                  <div>• Coherence: <strong className="text-emerald-400">0.50</strong> (balanced)</div>
                  <div>• Artifact: <strong className="text-emerald-400">false (clean)</strong></div>
                </div>
              </Card>

              {/* Meditation / Flow */}
              <Card className="bg-secondary/25 border-cyan-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Deep Meditation / Flow</span>
                  </div>
                  <Badge variant="cyan" className="text-[10px] font-mono">Focus / Calm</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  High mental absorption, focused mindfulness, or relaxed creative flow.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~60 BPM</strong> (slow, peaceful)</div>
                  <div>• Breathing: <strong className="text-foreground">6 breaths/min</strong> (resonant pace)</div>
                  <div>• Brain: High <strong className="text-cyan-400">Alpha 0.85</strong> & <strong className="text-purple-400">SMR 0.70</strong></div>
                  <div>• Coherence: Peak <strong className="text-emerald-400">0.85+</strong> (synchronized)</div>
                  <div>• Artifact: <strong className="text-emerald-400">false (clean)</strong></div>
                </div>
              </Card>

              {/* Cognitive Stress */}
              <Card className="bg-secondary/25 border-amber-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-amber-400">
                    <Flame className="w-4 h-4" />
                    <span>Cognitive Stress / Overload</span>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-mono">High Demand</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Prolonged analytical strain, multitasking pressure, or high task difficulty.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-red-400">~98 BPM</strong> (elevated pulse)</div>
                  <div>• Breathing: <strong className="text-foreground">18 breaths/min</strong> (rapid, shallow)</div>
                  <div>• Brain: High <strong className="text-amber-400">Beta 0.85</strong>, low Alpha (0.15)</div>
                  <div>• Skin: Frequent <strong className="text-orange-400">sweat spikes</strong></div>
                  <div>• Artifact: <strong className="text-emerald-400">false (clean)</strong></div>
                </div>
              </Card>

              {/* Drowsiness */}
              <Card className="bg-secondary/25 border-purple-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-purple-400">
                    <Moon className="w-4 h-4" />
                    <span>Drowsiness / Hypnagogia</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono">Fatigue</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mental fatigue, daydreaming, drifting off, or pre-sleep transition.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~54 BPM</strong> (deep resting)</div>
                  <div>• Breathing: <strong className="text-foreground">Slow, irregular</strong></div>
                  <div>• Brain: High <strong className="text-purple-400">Theta 0.80</strong> & <strong className="text-indigo-400">Delta 0.65</strong></div>
                  <div>• Skin: Very low sweat baseline (<strong className="text-muted-foreground">2.1 µS</strong>)</div>
                  <div>• Artifact: <strong className="text-emerald-400">false (clean)</strong></div>
                </div>
              </Card>

              {/* Acute Stress Trigger */}
              <Card className="bg-secondary/25 border-red-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Acute Stress Trigger / Startle</span>
                  </div>
                  <Badge variant="destructive" className="text-[10px] font-mono">Sudden Shock</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Immediate physiological reaction to an unexpected error modal, alarm, or critical failure.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: Rapid jump to <strong className="text-red-400">105+ BPM</strong> in seconds</div>
                  <div>• Skin: Sharp <strong className="text-orange-400">Phasic EDA surge (2.5 µS)</strong></div>
                  <div>• Brain: Immediate drop in Alpha; Beta climbs to <strong className="text-amber-400">0.90</strong></div>
                  <div>• Coherence: Collapses below <strong className="text-red-400">0.20</strong></div>
                  <div>• Available in: <code className="text-primary text-[10px]">acute_stress_trigger.json</code></div>
                </div>
              </Card>

              {/* Sensor Detached / Hardware Artifact */}
              <Card className="bg-secondary/25 border-amber-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Sensor Detached / Hardware Artifact</span>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-mono">Hardware Noise</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Sensor slips off, electrode loses contact with skin, or severe motion artifact occurs.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Artifact Flag: <strong className="text-red-400 font-bold">bio_artifact = true</strong></div>
                  <div>• Heart: Pulse readout drops to <strong className="text-foreground">0 BPM</strong> or freezes</div>
                  <div>• Brain: Flatline or 50/60 Hz electrical interference</div>
                  <div>• Skin: Circuit disconnect (drops to <strong className="text-foreground">0.0 µS</strong>)</div>
                  <div>• Available in: <code className="text-primary text-[10px]">sensor_artifact_dropout.json</code></div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Prototyping Recipes (Figma & Web Vibe Coding) */}
          <TabsContent value="recipes" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            {/* Sub-mode Segmented Switcher: Figma Variables vs Web & Vibe Coding */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/80">
              <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg border border-border/70 text-xs font-mono">
                <button
                  onClick={() => setRecipeSubTab('figma')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    recipeSubTab === 'figma'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Figma Variables (No-Code)</span>
                </button>
                <button
                  onClick={() => setRecipeSubTab('web')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                    recipeSubTab === 'web'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Web & Vibe Coding (Prompts & JS)</span>
                </button>
              </div>

              <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
                {recipeSubTab === 'figma' ? 'Native Figma BioData variables' : 'Live WebSocket ws://127.0.0.1:8081 (30 Hz)'}
              </div>
            </div>

            {recipeSubTab === 'figma' ? (
              <div className="space-y-3.5 pt-1">
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Step-by-step instructions for connecting SimData&apos;s native Figma variables (<code className="text-primary font-mono">BioData</code> collection) to prototype components:
                </div>

                {/* Recipe 1: Adaptive Component Variants */}
                <Card className="bg-secondary/25 border-purple-500/30 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                    <Layers className="w-4 h-4" />
                    <span>Recipe 1: Switch UI Layouts Automatically with `bio_state`</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Allow your interface to change layouts or switch color modes when the user moves between cognitive states:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                    <li>Create a Figma Component with a Variant property named <strong className="text-foreground">&quot;State&quot;</strong>.</li>
                    <li>Name the variants: <strong className="text-foreground">&quot;Baseline / Neutral&quot;</strong>, <strong className="text-foreground">&quot;Deep Meditation / Flow&quot;</strong>, and <strong className="text-foreground">&quot;Cognitive Stress&quot;</strong>.</li>
                    <li>In the right design sidebar, bind the component variant directly to the string variable <strong className="text-primary">bio_state</strong>.</li>
                    <li>In SimData, change presets or run a scenario playlist. Your Figma prototype will switch variants on canvas in real time.</li>
                  </ol>
                </Card>

                {/* Recipe 2: The Breathing Pacer */}
                <Card className="bg-secondary/25 border-cyan-500/30 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                    <Wind className="w-4 h-4" />
                    <span>Recipe 2: Dynamic Breathing Pacer with `bio_respiration`</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Create a visual breathing indicator that expands during inhalation and contracts during exhalation:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                    <li>Draw an Ellipse or Frame (e.g. 120 &times; 120 px) in Figma.</li>
                    <li>Bind its <strong>Width</strong> and <strong>Height</strong> to <strong className="text-primary">bio_respiration</strong> (or bind it to <strong>Layer Opacity</strong> or <strong>Corner Radius</strong>).</li>
                    <li>Watch the circle expand and contract smoothly in sync with SimData&apos;s live 30 Hz stream.</li>
                  </ol>
                </Card>

                {/* Recipe 3: Sensor Disconnect Alert & Graceful Degradation */}
                <Card className="bg-secondary/25 border-amber-500/30 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Recipe 3: Sensor Disconnect Alert & Graceful Degradation with `bio_artifact`</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Design a graceful error state that notifies the user when sensor contact is lost without misinterpreting the disconnection as emotional stress:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                    <li>Design an Alert Toast or Top Banner: <strong className="text-foreground">&quot;Sensor Contact Lost — Adjust Headband&quot;</strong>.</li>
                    <li>In Figma&apos;s right design panel under <strong>Layer</strong>, bind the visibility (eye icon) to the Boolean variable <strong className="text-primary">bio_artifact</strong>. The banner only appears when an artifact occurs.</li>
                    <li>Bind the opacity of your main visualization: when <strong className="text-primary">bio_artifact</strong> is true, reduce opacity to 40% so the user knows biofeedback is temporarily paused.</li>
                    <li>Run the pre-bundled scenario playlist <strong className="text-foreground">&quot;UX Testing: Stress Trigger & Sensor Dropout&quot;</strong> in SimData to verify the alert banner and recovery behavior.</li>
                  </ol>
                </Card>

                {/* Recipe 4: Dynamic Stress Interventions */}
                <Card className="bg-secondary/25 border-red-500/30 p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                    <Heart className="w-4 h-4" />
                    <span>Recipe 4: Responding to Acute Stress Triggers with `bio_phasic` & `bio_bpm`</span>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    Build an adaptive UI intervention that responds immediately to an acute user startle or cognitive error:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                    <li>Design a supportive calm-down modal or helpful guidance prompt.</li>
                    <li>Bind its display property or variant to <strong className="text-primary">bio_state</strong> when equal to <strong className="text-foreground">&quot;Acute Stress Trigger&quot;</strong>.</li>
                    <li>Optionally bind a numeric text field to <strong className="text-red-400">bio_bpm</strong> to show heart rate acceleration in real time.</li>
                    <li>Select and play <strong className="text-foreground">acute_stress_trigger.json</strong> in the Dataset tab to test your prototype&apos;s reaction and calm-down recovery.</li>
                  </ol>
                </Card>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                {/* Intro & Live WebSocket Stream Reference */}
                <Card className="bg-secondary/30 border-cyan-500/30 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                      <Terminal className="w-4 h-4" />
                      <span>Live WebSocket Stream & Telemetry Schema</span>
                    </div>
                    <Badge variant="cyan" className="font-mono text-[10px]">
                      ws://127.0.0.1:8081
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed">
                    SimData broadcasts continuous JSON packets at <strong>30 Hz</strong> across local WebSocket port <strong>8081</strong> (fallback: <strong>8080</strong>). Any frontend stack (React, Vue, Svelte, vanilla HTML/JS, p5.js, Three.js) can subscribe with zero external libraries.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    <div className="bg-card/70 p-2.5 rounded border border-border/50 space-y-1">
                      <strong className="text-emerald-400 block mb-1">Breathing & Cardiac:</strong>
                      <div>• <code className="text-primary">biometrics.respiration.value</code> (0.0 – 1.0)</div>
                      <div>• <code className="text-primary">biometrics.respiration.phase</code> (&quot;inhale&quot;|&quot;exhale&quot;)</div>
                      <div>• <code className="text-red-400">biometrics.hrv.bpm</code> (Heart Rate, 50 – 130)</div>
                      <div>• <code className="text-emerald-400">biometrics.hrv.coherence</code> (Harmony, 0.0 – 1.0)</div>
                      <div>• <code className="text-muted-foreground">biometrics.hrv.rmssd</code> (HRV variance in ms)</div>
                    </div>

                    <div className="bg-card/70 p-2.5 rounded border border-border/50 space-y-1">
                      <strong className="text-amber-400 block mb-1">Skin & States:</strong>
                      <div>• <code className="text-amber-400">biometrics.eda.tonic</code> (Skin baseline µS)</div>
                      <div>• <code className="text-orange-400">biometrics.eda.phasic</code> (Reaction spike µS)</div>
                      <div>• <code className="text-purple-400">biometrics.eeg.alpha / beta</code> (0.0 – 1.0)</div>
                      <div>• <code className="text-cyan-400">states.calm_index</code> (Calm score, 0.0 – 1.0)</div>
                      <div>• <code className="text-foreground">states.state_name</code> (Human state label)</div>
                      <div>• <code className="text-red-400">states.artifact_flag</code> (boolean noise)</div>
                    </div>
                  </div>
                </Card>

                {/* Vibe Coding Prompts List with Copy Buttons */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold font-mono uppercase text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Copy-Paste Vibe Coding Prompts (Cursor / Claude / Copilot / ChatGPT)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-muted-foreground">Click to copy prompt</span>
                  </div>

                  {VIBE_PROMPTS.map((p) => {
                    const isCopied = copiedPrompt === p.id;
                    return (
                      <Card key={p.id} className="bg-secondary/25 border-border/70 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{p.icon}</span>
                            <span className="font-bold text-xs text-foreground">{p.title}</span>
                            <Badge variant="outline" className="text-[9px] font-mono py-0">{p.tag}</Badge>
                          </div>
                          <Button
                            size="xs"
                            variant={isCopied ? "secondary" : "outline"}
                            onClick={() => handleCopy(p.prompt, p.id)}
                            className={`h-6 px-2 text-[10px] font-mono gap-1 cursor-pointer ${
                              isCopied ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/15' : ''
                            }`}
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-primary" />}
                            <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {p.description}
                        </p>

                        <pre className="bg-card/80 p-2.5 rounded border border-border/50 text-[11px] font-mono text-muted-foreground/90 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-36 overflow-y-auto">
                          {p.prompt}
                        </pre>
                      </Card>
                    );
                  })}
                </div>

                {/* Minimal Vanilla JS Starter Code */}
                <Card className="bg-secondary/25 border-border/70 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                      <Code2 className="w-4 h-4 text-emerald-400" />
                      <span>20-Line Vanilla JS Starter Snippet (Zero Dependencies)</span>
                    </div>
                    <Button
                      size="xs"
                      variant={copiedPrompt === 'vanilla-js' ? "secondary" : "outline"}
                      onClick={() => handleCopy(VANILLA_JS_SNIPPET, 'vanilla-js')}
                      className={`h-6 px-2 text-[10px] font-mono gap-1 cursor-pointer ${
                        copiedPrompt === 'vanilla-js' ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/15' : ''
                      }`}
                    >
                      {copiedPrompt === 'vanilla-js' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-primary" />}
                      <span>{copiedPrompt === 'vanilla-js' ? 'Copied Snippet!' : 'Copy Code'}</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connects to SimData and maps biometrics directly to CSS Custom Properties (<code className="text-primary font-mono">--resp</code>, <code className="text-red-400 font-mono">--bpm</code>, <code className="text-emerald-400 font-mono">--coherence</code>) so your CSS animations react smoothly:
                  </p>
                  <pre className="bg-card/80 p-2.5 rounded border border-border/50 text-[11px] font-mono text-muted-foreground/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {VANILLA_JS_SNIPPET}
                  </pre>
                </Card>

                {/* Best Practices & Prototyping Rules */}
                <Card className="bg-secondary/25 border-amber-500/30 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Four Golden Rules for Biofeedback Vibe Coding</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-foreground/90 font-mono list-disc list-inside">
                    <li>
                      <strong className="text-amber-300">1. Smooth 30 Hz updates:</strong> Never animate raw numbers directly. Use CSS <code className="text-primary">transition: transform 0.2s ease-out</code> or linear interpolation (<code className="text-primary">current += (target - current) * 0.1</code>) inside <code className="text-primary">requestAnimationFrame</code>.
                    </li>
                    <li>
                      <strong className="text-amber-300">2. Respect `artifact_flag`:</strong> When <code className="text-red-400">artifact_flag === true</code>, freeze active timers or gently blur the canvas. Never tell the user they are stressed during physical motion.
                    </li>
                    <li>
                      <strong className="text-amber-300">3. Map normalized ranges (0.0 to 1.0):</strong> Use <code className="text-emerald-400">biometrics.respiration.value</code> to drive scale (e.g. <code className="text-primary">scale(0.85 + resp * 0.3)</code>) and <code className="text-emerald-400">biometrics.hrv.coherence</code> to drive color hue.
                    </li>
                    <li>
                      <strong className="text-amber-300">4. Test with Scenario Playlists:</strong> Use SimData&apos;s pre-bundled <strong className="text-foreground">&quot;UX Testing: Stress Trigger & Sensor Dropout&quot;</strong> playlist to verify how your prototype gracefully recovers from errors and startles.
                    </li>
                  </ul>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-secondary/30 flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-muted-foreground hidden sm:block">
            Designed for interaction design education & creative neurofeedback prototyping.
          </div>
          <Button variant="default" size="sm" onClick={onClose} className="font-mono text-xs">
            Close Guide
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Biometric glossary data without metaphors or dense medical jargon
const GLOSSARY_ITEMS = [
  {
    term: 'EDA & GSR (Electrodermal Activity / Galvanic Skin Response)',
    icon: '⚡',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'EDA and GSR are two terms for the same physiological measurement: the electrical conductance of the skin. When emotional arousal, cognitive workload, or stress increases, the sympathetic nervous system activates microscopic sweat glands on the palms and fingers. Because sweat contains water and dissolved electrolytes, the skin conducts electricity more easily as moisture increases. It provides a direct measure of emotional arousal that cannot be consciously faked.',
    lowMeaning: '1 – 3 µS (Deep physical relaxation, calm resting state, or drowsiness; dry skin).',
    highMeaning: '8 – 20+ µS (High emotional arousal, acute stress, excitement, or cognitive overload).'
  },
  {
    term: 'Tonic EDA (Skin Conductance Level / SCL)',
    icon: '💧',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'The gradual, baseline level of skin conductance. It changes slowly over minutes or hours, reflecting continuous alertness, background workload, ambient room temperature, or chronic tension.',
    lowMeaning: '2 – 4 µS (Resting baseline, passive relaxation, or low vigilance).',
    highMeaning: '8 – 15+ µS (Sustained mental strain, prolonged stress, or high vigilance).'
  },
  {
    term: 'Phasic EDA (Skin Conductance Response / SCR)',
    icon: '📈',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'Fast, momentary peaks in skin conductance that appear 1 to 3 seconds after a specific stimulus, such as an error alert, an unexpected sound, or a difficult task. These responses typically return toward baseline over 5 to 10 seconds.',
    lowMeaning: '0.0 µS (No sudden reactions; stable, calm state without startle).',
    highMeaning: '0.5 – 3.0+ µS (Immediate emotional reaction, startle, or acute frustration).'
  },
  {
    term: 'Heart Rate (BPM)',
    icon: '💓',
    tag: 'Heart & Rhythm',
    figmaVar: 'bio_bpm',
    simpleExplanation: 'The number of times the heart beats per minute. Heart rate increases during physical activity, cognitive stress, or emotional startle, and decreases during rest, calm breathing, and physical recovery.',
    lowMeaning: '50 – 65 BPM (Deep rest, calm meditation, or athletic resting pulse).',
    highMeaning: '90 – 130+ BPM (Physical exertion, sudden startle, panic, or mental strain).'
  },
  {
    term: 'PPG & BVP (Photoplethysmography / Blood Volume Pulse)',
    icon: '🔴',
    tag: 'Heart & Optical Sensing',
    figmaVar: 'bio_bpm',
    simpleExplanation: 'PPG is the optical sensing technology used in almost all consumer wearables and biofeedback monitors (Apple Watch, Oura Ring, Whoop, Garmin, Empatica E4, and earlobe/finger clips). An LED shines green or infrared light into the skin, and a photodetector measures light absorption changes as blood surges through capillary microvascular beds with every heartbeat. This generates a continuous volumetric waveform (Blood Volume Pulse) from which Heart Rate (BPM) and HRV are calculated. Because PPG requires only single-point skin contact, it is the standard cardiac sensor in interaction design.',
    lowMeaning: 'Lower pulse rate (50 – 65 BPM); calm resting baseline or deep meditation.',
    highMeaning: 'Elevated pulse rate (90 – 130+ BPM); physical activity, sudden startle, or high cognitive demand.'
  },
  {
    term: 'ECG vs. PPG (Electrical vs. Optical Cardiac Sensing)',
    icon: '⚡',
    tag: 'Heart & Sensor Modalities',
    figmaVar: null,
    simpleExplanation: 'ECG (Electrocardiography) measures electrical voltage across the heart muscle using multi-point electrodes (such as a Polar H10 chest strap or two-handed contact), producing sharp P-Q-R-S-T electrical spikes. PPG (Photoplethysmography) measures optical blood volume changes beneath the skin using light sensors, producing a smooth rolling wave. While clinical ECG offers millisecond electrical precision, PPG allows passive, single-point wearable integration. However, optical PPG is significantly more vulnerable to motion artifacts: when a user moves their hand or loosens the watch, ambient light leaks into the sensor, causing wild noise that SimData flags with bio_artifact.',
    lowMeaning: 'PPG: Single-contact optical sensing ideal for wearable UX and everyday prototypes.',
    highMeaning: 'ECG: Multi-contact electrical sensing ideal for clinical and athletic chest-strap monitoring.'
  },
  {
    term: 'Heart Rate Variability (RMSSD)',
    icon: '📊',
    tag: 'Heart & Rhythm',
    figmaVar: 'bio_coherence',
    simpleExplanation: 'The variation in time intervals between consecutive heartbeats, measured in milliseconds. A healthy autonomic nervous system adjusts the time between beats continuously. Higher variability indicates autonomic flexibility and strong stress recovery capacity.',
    lowMeaning: 'Below 25 ms (Physical exhaustion, chronic stress, or autonomic fatigue).',
    highMeaning: 'Above 55 ms (High vitality, calm nervous system, and strong recovery capacity).'
  },
  {
    term: 'Cardiorespiratory Harmony (Coherence Score)',
    icon: '✨',
    tag: 'Heart & Breath',
    figmaVar: 'bio_coherence',
    simpleExplanation: 'A calculated index from 0.0 to 1.0 indicating how closely the heart rate oscillations synchronize with the breathing cycle. When breathing at a steady rate of approximately 6 breaths per minute, heart rate oscillations synchronize with inhalation and exhalation, maximizing coherence.',
    lowMeaning: '0.1 – 0.3 (Irregular or rapid breathing desynchronized from heart rate).',
    highMeaning: '0.8 – 1.0 (Harmonic synchronization between breathing and pulse; deep calm).'
  },
  {
    term: 'Breathing Phase & Depth (Respiration)',
    icon: '🌬️',
    tag: 'Breathing',
    figmaVar: 'bio_respiration',
    simpleExplanation: 'The continuous cycle of inhalation and exhalation, normalized between 0.0 and 1.0. 0.0 represents the end of an exhalation with empty lungs, while 1.0 represents the peak of an inhalation with full lungs.',
    lowMeaning: '0.0 (End of exhalation, lungs empty).',
    highMeaning: '1.0 (Peak of inhalation, lungs expanded).'
  },
  {
    term: 'Alpha Brainwaves (8 – 12 Hz)',
    icon: '🧘',
    tag: 'Brainwaves',
    figmaVar: 'bio_alpha',
    simpleExplanation: 'Electrical brain rhythms associated with relaxed, effortless alertness. Alpha waves increase during calm mindfulness, resting wakefulness with eyes relaxed, or effortless creative concentration.',
    lowMeaning: 'Below 0.25 (Active analytical strain, problem-solving, or sensory overload).',
    highMeaning: 'Above 0.70 (Calm mindfulness, relaxed concentration, or mental ease).'
  },
  {
    term: 'Beta Brainwaves (15 – 30 Hz)',
    icon: '🧠',
    tag: 'Brainwaves',
    figmaVar: 'bio_beta',
    simpleExplanation: 'Fast brain rhythms produced during active analytical thinking, focused problem-solving, decision-making, and high mental effort.',
    lowMeaning: 'Below 0.20 (Relaxed awareness, meditation, or daydreaming).',
    highMeaning: 'Above 0.75 (Intense analytical concentration, cognitive strain, or anxiety).'
  },
  {
    term: 'Theta Brainwaves (4 – 8 Hz)',
    icon: '🌙',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'Slow brain rhythms that occur during deep daydreaming, creative visualization, and the drowsy transition preceding sleep (hypnagogia).',
    lowMeaning: 'Below 0.20 (Fully alert and awake).',
    highMeaning: 'Above 0.65 (Drowsiness, twilight sleep transition, or deep reverie).'
  },
  {
    term: 'Delta Brainwaves (0.5 – 4 Hz)',
    icon: '💤',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'The slowest brain oscillations, dominant during deep, dreamless restorative sleep. In healthy waking individuals, delta levels remain low.',
    lowMeaning: 'Below 0.20 (Normal waking state).',
    highMeaning: 'Above 0.60 (Deep restorative sleep or extreme drowsiness).'
  },
  {
    term: 'SMR Rhythm (12 – 15 Hz)',
    icon: '🐈',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'Sensorimotor Rhythm recorded over the motor cortex. It reflects physical stillness paired with focused mental attention—the capacity to remain calm and attentive without physical restlessness.',
    lowMeaning: 'Below 0.25 (Physical restlessness, fidgeting, or distraction).',
    highMeaning: 'Above 0.60 (Calm physical stillness with steady mental attention).'
  },
  {
    term: 'Cognitive State Name',
    icon: '🏷️',
    tag: 'Affective State',
    figmaVar: 'bio_state',
    simpleExplanation: 'A text label representing the current physiological state (for example, "Baseline / Neutral", "Deep Meditation / Flow", "Cognitive Stress", or "Acute Stress Trigger"). In Figma prototypes, binding this string variable allows components and layouts to switch automatically.',
    lowMeaning: 'Used in design prototypes to switch UI modes.',
    highMeaning: 'Enables contextual, adaptive user experience testing.'
  },
  {
    term: 'Sensor Artifacts (Overview)',
    icon: '⚠️',
    tag: 'Noise Simulation',
    figmaVar: 'bio_artifact',
    simpleExplanation: 'In biosignal recording, an "artifact" is electrical or physical interference that enters the recording from outside the physiological process being measured. Body movement, facial muscle tension, eye movements, and loose sensors all create electrical signals that can corrupt biosignals. SimData flags these disruptions with bio_artifact = true so prototypes can handle error states gracefully.',
    lowMeaning: 'Clean, reliable biometric signal without interference.',
    highMeaning: 'Artifact detected; trigger error states or pause active feedback.'
  },
  {
    term: 'Eye Blink & Saccade Artifacts (EOG)',
    icon: '👁️',
    tag: 'Noise Simulation',
    figmaVar: 'bio_artifact',
    simpleExplanation: 'The human eyeball functions as an electrical dipole with a positive cornea in front and a negative retina in back. When eyelids slide over the cornea during a blink, or when eyes dart rapidly (saccades), an electrical spike of 50 to 100+ microvolts passes across forehead EEG electrodes. This transient 200 to 400 millisecond spike can mask true frontal brain activity.',
    lowMeaning: 'Eyes relaxed, steady gaze; clean frontal EEG recordings.',
    highMeaning: 'Rapid blinking or eye movements causing large wave deflections.'
  },
  {
    term: 'Muscle Tension & Jaw Clench Artifacts (EMG)',
    icon: '⚡',
    tag: 'Noise Simulation',
    figmaVar: 'bio_artifact',
    simpleExplanation: 'When facial, jaw, neck, or scalp muscles contract—such as when clenching teeth, chewing, or frowning—contracting muscle fibers produce intense electrical bursts (Electromyography). Because muscle signals can be 100 times larger in amplitude than microvolt brainwaves, jaw clenches generate high-frequency noise (20 to 100+ Hz) that can easily be mistaken for extreme beta or gamma brainwaves.',
    lowMeaning: 'Relaxed facial and jaw muscles; genuine neural readings.',
    highMeaning: 'Clenched jaw or facial tension causing high-frequency noise.'
  },
  {
    term: 'Electrode Detachment & Contact Loss',
    icon: '🔌',
    tag: 'Hardware Status',
    figmaVar: 'bio_artifact',
    simpleExplanation: 'Occurs when a dry EEG electrode lifts away from the scalp, an adhesive ECG patch peels from the skin, or a wrist pulse sensor shifts. When electrical contact is lost, sensor impedance jumps to maximum. This produces flatlined signals, zero BPM readings, or 50/60 Hz electrical grid noise from nearby wall wiring.',
    lowMeaning: 'Snug sensor fit with proper electrical impedance.',
    highMeaning: 'Sensor loose or disconnected; flatline or invalid reading.'
  },
  {
    term: 'Acute Stress Trigger (Startle Response)',
    icon: '💥',
    tag: 'Affective State',
    figmaVar: 'bio_state',
    simpleExplanation: 'An immediate full-body stress response provoked by an unexpected alarm, countdown buzzer, critical error dialog, or sudden failure. Within 1 to 3 seconds, sympathetic activation causes an immediate Phasic EDA sweat surge (1.5 to 3.0+ µS) and heart rate acceleration (+15 to 25 BPM), while Alpha brainwaves drop. Unlike a physical artifact, this is a genuine biological reaction across multiple sensors.',
    lowMeaning: 'Predictable, uninterrupted workflow; steady recovery.',
    highMeaning: 'Sudden task error or startle event producing an immediate multi-signal surge.'
  }
];

// Curated vibe coding prompts for creative AI tools (Cursor, Claude, Copilot, ChatGPT, v0)
const VIBE_PROMPTS = [
  {
    id: 'master-setup',
    title: 'Prompt 1: Master Project Starter & WebSocket Setup',
    icon: '⚡',
    tag: 'Project Setup',
    description: 'Use this as your initial prompt in Cursor, Claude, ChatGPT, or Copilot when starting a new prototype.',
    prompt: `I am building a web-based biofeedback prototype. I want to connect to a local biometric simulator (SimData) running on my machine.
SimData broadcasts live 30 Hz JSON telemetry over WebSocket at ws://127.0.0.1:8081 (fallback: ws://127.0.0.1:8080).

Here is the exact JSON telemetry schema received at 30 Hz:
{
  "biometrics": {
    "respiration": { "value": 0.52, "phase": "inhale" }, // value: 0.0 to 1.0 (empty to full lungs)
    "hrv": { "bpm": 72.4, "rmssd": 45.2, "coherence": 0.82 }, // coherence: 0.0 to 1.0 (breath-heart harmony)
    "eda": { "tonic": 4.5, "phasic": 0.12 }, // skin conductance in µS (tonic baseline + phasic response spikes)
    "eeg": { "alpha": 0.65, "beta": 0.28, "theta": 0.35 } // normalized brainwave bands: 0.0 to 1.0
  },
  "states": {
    "calm_index": 0.74, // 0.0 to 1.0
    "focus_index": 0.62, // 0.0 to 1.0
    "state_name": "Deep Meditation / Flow", // Human state label
    "artifact_flag": false // boolean: true if physical movement, blink, or sensor detached
  }
}

Please write a robust WebSocket connection with:
1. Automatic reconnection every 2 seconds if the connection drops.
2. Smooth interpolation (lerp: current += (target - current) * 0.1) inside requestAnimationFrame so 30 Hz data produces fluid 60/120 fps visuals.
3. Clean state management exposing respiration, bpm, coherence, calm_index, state_name, and artifact_flag.`
  },
  {
    id: 'visualizer',
    title: 'Prompt 2: Organic Breathing & Heartbeat Visualizer (Canvas / p5.js / Three.js)',
    icon: '🌊',
    tag: 'Generative Visuals',
    description: 'Prompts the AI to generate a fluid particle orb or SVG shape reactive to breath and heartbeat.',
    prompt: `Build an organic, responsive particle visualizer using [HTML5 Canvas / p5.js / Three.js] driven by live SimData telemetry:
1. Breathing Expansion: The overall particle structure must breathe with biometrics.respiration.value (0.0 = fully contracted, 1.0 = fully expanded).
2. Heart Pulse: On every heartbeat (calculated from biometrics.hrv.bpm), send a gentle radial shockwave ripple through the particles.
3. Coherence Harmony: When biometrics.hrv.coherence is high (> 0.75), particles should move in smooth, harmonic concentric paths with a calm emerald/cyan gradient. When coherence is low (< 0.4), particles become more turbulent and shift toward warm amber.
4. Error Handling: When states.artifact_flag is true, do NOT change the calm colors; instead, gently blur the canvas and show a minimal "Sensor adjusting" status pill.`
  },
  {
    id: 'adaptive-ui',
    title: 'Prompt 3: Adaptive Bio-Responsive UI & Reading Workspace',
    icon: '📖',
    tag: 'Adaptive UI',
    description: 'Prompts the AI to build an adaptive reader or dashboard that adjusts contrast, density, and guidance to cognitive strain.',
    prompt: `Design an adaptive, bio-responsive reading / workspace web interface that dynamically adjusts its layout to the user's cognitive state:
1. Calm State: When states.calm_index > 0.70, soften the background contrast, increase line-height and letter-spacing for an effortless reading experience.
2. Cognitive Strain: When states.state_name === "Cognitive Stress" or biometrics.eda.phasic spikes (> 1.5 µS), gently dim secondary sidebar panels and highlight only the active task to reduce visual overload.
3. Acute Error Intervention: If states.state_name === "Acute Stress Trigger", smoothly slide in a supportive, non-blocking 60-second breathing pacer bar at the bottom of the screen.
4. Sensor Disconnect: If states.artifact_flag === true, display a subtle top notification: "Sensor contact loose. Adjust headband to resume live tracking."`
  },
  {
    id: 'artifact-resilience',
    title: 'Prompt 4: UX Resilience & Artifact Safety Layer',
    icon: '🛡️',
    tag: 'Error Resilience',
    description: 'Ensures the AI implements the golden biofeedback UX rule: never mistake physical noise for emotional stress.',
    prompt: `I need an error-resilience and signal-filtering layer for my biofeedback web prototype.
In biofeedback UX, a critical pitfall is mistaking physical motion artifacts (e.g., jaw clenches, eye blinks, or loose sensors) for psychological stress.

Please implement the following UX logic:
1. When states.artifact_flag becomes true:
   - Immediately pause active scoring or progress countdowns.
   - Reduce visualization opacity to 50% or apply a soft 4px blur to indicate paused tracking.
   - Display an unobtrusive toast: "Sensor contact loose. Adjust device to continue."
   - Under no circumstances trigger "Take a deep breath, you are stressed!" interventions during an artifact.
2. When states.artifact_flag returns to false:
   - Smoothly fade opacity back to 100% over 1.5 seconds without sudden jump cuts.
   - Resume active scoring seamlessly.`
  }
];

// Minimal zero-dependency 30Hz SimData listener driving CSS Custom Properties
const VANILLA_JS_SNIPPET = `// index.html or main.js - Zero-dependency 30Hz SimData listener
const ws = new WebSocket('ws://127.0.0.1:8081');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const { bpm, coherence } = data.biometrics.hrv;
  const { value: resp, phase } = data.biometrics.respiration;
  const { calm_index, state_name, artifact_flag } = data.states;

  // Drive CSS Custom Properties for zero-overhead, fluid CSS transitions!
  document.documentElement.style.setProperty('--resp', resp);
  document.documentElement.style.setProperty('--bpm', bpm);
  document.documentElement.style.setProperty('--coherence', coherence);
  document.documentElement.style.setProperty('--calm', calm_index);

  // Update DOM labels
  const pill = document.getElementById('state-pill');
  if (pill) pill.textContent = state_name;

  // Toggle artifact error class
  document.body.classList.toggle('sensor-artifact', artifact_flag);
};

// Automatic reconnect if SimData restarts
ws.onerror = () => setTimeout(() => location.reload(), 2000);`;

