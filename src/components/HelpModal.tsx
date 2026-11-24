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
  ArrowRight
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
  const [searchQuery, setSearchQuery] = useState('');

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
                  Clear explanations of all biometric terms, calculations, and Figma prototyping tips.
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
              placeholder="Search any term (e.g., 'breathing', 'RSA', 'alpha', 'stress', 'sweat')..."
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
                <span>4. Figma Design Recipes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Terms & Dictionary */}
          <TabsContent value="glossary" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            {filteredGlossary.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground font-mono text-xs">
                No terms matching &quot;{searchQuery}&quot;. Try searching for &quot;alpha&quot;, &quot;bpm&quot;, &quot;coherence&quot;, or &quot;stress&quot;.
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

          {/* Tab 2: How Signals Connect (Physiological Coupling) */}
          <TabsContent value="connections" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 mt-0">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Your body is a single closed-loop ecosystem. When you change how you breathe, your heart responds within seconds. When you experience mental stress, your skin sweat and brainwaves instantly shift. SimData models these <strong>chain reactions</strong> in real time:
            </div>

            {/* Coupling 1: Breathing -> Heart (RSA) */}
            <Card className="bg-secondary/25 border-cyan-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-400">
                <Wind className="w-4 h-4" />
                <span>Chain Reaction 1: The Breath & Heart Dance (RSA)</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Ever notice your pulse accelerate when you take a big deep breath in, and gently slow down when you exhale? That natural rhythm is called <strong>Respiratory Sinus Arrhythmia (RSA)</strong>.
              </p>
              <div className="bg-card/60 p-3 rounded-lg border border-border/60 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-cyan-300">
                  <span>🌬️ Inhale</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Lungs expand &rarr; Vagus nerve releases brake &rarr; <strong>Heart accelerates (BPM &uarr;)</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <span>💨 Exhale</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Lungs deflate &rarr; Vagus nerve applies gentle brake &rarr; <strong>Heart decelerates (BPM &darr;)</strong></span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                <strong>Why it matters:</strong> A rigid, mechanical pulse is a sign of extreme fatigue or distress. A lively, wave-like pulse that matches your breath indicates a healthy, flexible nervous system.
              </p>
            </Card>

            {/* Coupling 2: Stress Chain Reaction */}
            <Card className="bg-secondary/25 border-amber-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
                <Flame className="w-4 h-4" />
                <span>Chain Reaction 2: The Mental Stress Surge</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                When you encounter a difficult deadline, unexpected danger, or cognitive overload, your &quot;fight-or-flight&quot; (sympathetic) nervous system takes the steering wheel:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-amber-400 font-bold block mb-1">1. Brainwaves</span>
                  Calm <strong>Alpha</strong> collapses (0.15), while busy <strong>Beta</strong> surges (0.85) as your brain scans for solutions.
                </div>
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-red-400 font-bold block mb-1">2. Heart & Breath</span>
                  Heart rate accelerates (95+ BPM) and breathing turns shallow, rapid, and disjointed.
                </div>
                <div className="bg-card/50 p-2.5 rounded border border-border/40">
                  <span className="text-orange-400 font-bold block mb-1">3. Skin Sweat</span>
                  Microscopic sweat glands on palms activate, causing sharp <strong>Phasic EDA spikes</strong> and elevated tonic sweat.
                </div>
              </div>
            </Card>

            {/* Coupling 3: Resonance & Coherence */}
            <Card className="bg-secondary/25 border-emerald-500/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
                <Activity className="w-4 h-4" />
                <span>Chain Reaction 3: Deep Resonance & Coherence</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                When you deliberately slow down your breathing to about <strong>6 breaths per minute</strong> (0.10 Hz), your blood pressure waves, breathing rhythm, and heart rate lock into a beautiful, harmonic standing wave called <strong>Resonant Coherence</strong>.
              </p>
              <div className="bg-card/60 p-3 rounded-lg border border-border/60 text-xs font-mono text-emerald-300">
                Coherence Score climbs to <strong>0.85 – 0.95</strong>. Alpha brainwaves flourish, skin sweat dries out, and your Calm Index hits maximum.
              </div>
            </Card>
          </TabsContent>

          {/* Tab 3: States & Archetypes Matrix */}
          <TabsContent value="archetypes" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            <div className="text-xs text-muted-foreground leading-relaxed">
              SimData groups complex biometric numbers into recognizable human states. You can switch between these with 1 click in the <strong>Presets</strong> tab, or chain them together in <strong>Scenario Playlists</strong>:
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
                  Your regular, everyday resting state while reading or relaxed at a desk.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~70 BPM</strong> (balanced)</div>
                  <div>• Breathing: <strong className="text-foreground">~10 breaths/min</strong></div>
                  <div>• Brain: Moderate <strong className="text-cyan-400">Alpha 0.50</strong> & <strong className="text-amber-400">Beta 0.35</strong></div>
                  <div>• Coherence: <strong className="text-emerald-400">0.50</strong> (steady)</div>
                </div>
              </Card>

              {/* Meditation / Flow */}
              <Card className="bg-secondary/25 border-cyan-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Deep Meditation / Flow</span>
                  </div>
                  <Badge variant="cyan" className="text-[10px] font-mono">Zen / Focus</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Complete mental absorption, mindfulness, or calm creative flow without stress.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~60 BPM</strong> (slow, peaceful)</div>
                  <div>• Breathing: <strong className="text-foreground">6 breaths/min</strong> (resonant)</div>
                  <div>• Brain: High <strong className="text-cyan-400">Alpha 0.85</strong> & <strong className="text-purple-400">SMR 0.70</strong></div>
                  <div>• Coherence: Peak <strong className="text-emerald-400">0.85+</strong> (harmonic)</div>
                </div>
              </Card>

              {/* Cognitive Stress */}
              <Card className="bg-secondary/25 border-amber-500/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-amber-400">
                    <Flame className="w-4 h-4" />
                    <span>Cognitive Stress / Overload</span>
                  </div>
                  <Badge variant="warning" className="text-[10px] font-mono">Pressure</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Intense mental effort, anxiety, multitasking under pressure, or sensory overload.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-red-400">~98 BPM</strong> (racing pulse)</div>
                  <div>• Breathing: <strong className="text-foreground">18 breaths/min</strong> (shallow)</div>
                  <div>• Brain: Surging <strong className="text-amber-400">Beta 0.85</strong>, low Alpha</div>
                  <div>• Skin: Frequent <strong className="text-orange-400">sweat spikes</strong></div>
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
                  Extreme tiredness, daydreaming, nodding off, or twilight sleep transition.
                </p>
                <div className="bg-card/50 p-2 rounded text-[11px] font-mono space-y-1 text-muted-foreground">
                  <div>• Heart: <strong className="text-foreground">~54 BPM</strong> (deep resting)</div>
                  <div>• Breathing: <strong className="text-foreground">Slow & shallow</strong></div>
                  <div>• Brain: High <strong className="text-purple-400">Theta 0.80</strong> & <strong className="text-indigo-400">Delta 0.65</strong></div>
                  <div>• Skin: Collapsing sweat (<strong className="text-muted-foreground">2.1 uS</strong>)</div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Figma Design Recipes */}
          <TabsContent value="recipes" className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 mt-0">
            <div className="text-xs text-muted-foreground leading-relaxed">
              Step-by-step recipes for connecting SimData&apos;s 8 native Figma variables (<code className="text-primary font-mono">BioData</code> collection) directly to UI elements on your Figma canvas:
            </div>

            {/* Recipe 1: Adaptive Component Variants */}
            <Card className="bg-secondary/25 border-purple-500/30 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-400">
                <Layers className="w-4 h-4" />
                <span>Recipe 1: Swap UI Layouts Automatically with `bio_state`</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Want your interface to smoothly transition from a friendly dashboard into an emergency calm-down modal when the user gets stressed?
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                <li>Create a Figma Component with a Variant property named <strong className="text-foreground">&quot;State&quot;</strong>.</li>
                <li>Name the variants: <strong className="text-foreground">&quot;Baseline&quot;</strong>, <strong className="text-foreground">&quot;Deep Flow&quot;</strong>, and <strong className="text-foreground">&quot;Cognitive Stress&quot;</strong>.</li>
                <li>In the right design sidebar, bind the component variant directly to the string variable <strong className="text-primary">bio_state</strong>.</li>
                <li>In SimData, click <strong className="text-amber-400">Cognitive Stress</strong> or play a scenario playlist. Your Figma prototype will switch variants on the canvas in real time!</li>
              </ol>
            </Card>

            {/* Recipe 2: The Breathing Circle */}
            <Card className="bg-secondary/25 border-cyan-500/30 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-cyan-400">
                <Wind className="w-4 h-4" />
                <span>Recipe 2: The Organic Breathing Bubble</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Create a soothing breath-pacer circle that expands on inhalation and contracts on exhalation:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs font-mono text-muted-foreground bg-card/60 p-3 rounded border border-border/50">
                <li>Draw an Ellipse or Frame (e.g. 100 &times; 100 px) with a soft gradient.</li>
                <li>Bind its <strong>Width</strong> and <strong>Height</strong> to <strong className="text-primary">bio_respiration</strong> (or bind it to <strong>Corner Radius</strong> / <strong>Layer Opacity</strong>).</li>
                <li>Watch the circle breathe in sync with SimData&apos;s live 30 Hz stream!</li>
              </ol>
            </Card>

            {/* Recipe 3: Heart Rate & Warning Alert */}
            <Card className="bg-secondary/25 border-emerald-500/30 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                <Heart className="w-4 h-4" />
                <span>Recipe 3: Live Pulse Counter & Artifact Alert Banner</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                Bind live biometric text and display a warning banner if the sensor falls off:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-card/60 p-2.5 rounded border border-border/50">
                  <strong className="text-foreground block mb-1">Live BPM Text:</strong>
                  Create a text layer (e.g. &quot;72&quot;) and bind its content to <strong className="text-red-400">bio_bpm</strong>. It updates 10 times per second!
                </div>
                <div className="bg-card/60 p-2.5 rounded border border-border/50">
                  <strong className="text-foreground block mb-1">Artifact Alert:</strong>
                  Create a &quot;Headset Detached&quot; alert banner. Bind its <strong>Layer Visibility</strong> (Eye icon) to the Boolean variable <strong className="text-amber-400">bio_artifact</strong>.
                </div>
              </div>
            </Card>
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

// Clear biometric glossary data without metaphors or dense medical jargon
const GLOSSARY_ITEMS = [
  {
    term: 'EDA & GSR (Electrodermal Activity / Galvanic Skin Response)',
    icon: '⚡',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'EDA and GSR are two names for the same physiological measurement: the electrical conductance of your skin. When you experience stress, emotional arousal, or mental effort, your involuntary nervous system activates microscopic sweat glands on your palms and fingers. Because sweat contains salt and water, skin conducts electricity more easily as moisture rises. It is one of the most reliable and direct markers of emotional arousal because it cannot be consciously controlled or faked.',
    lowMeaning: '1 – 3 µS (Deep physical relaxation, calm resting state, or drowsiness; dry skin).',
    highMeaning: '8 – 20+ µS (High emotional arousal, acute stress, excitement, or cognitive overload).'
  },
  {
    term: 'Tonic EDA (Skin Conductance Level / SCL)',
    icon: '💧',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'The slow-moving baseline level of skin conductance. It rises or falls gradually over minutes or hours, reflecting your background state of alertness, sustained workload, ambient room temperature, or chronic tension.',
    lowMeaning: '2 – 4 µS (Resting baseline, passive relaxation, or low vigilance).',
    highMeaning: '8 – 15+ µS (Sustained mental strain, prolonged stress, or high vigilance).'
  },
  {
    term: 'Phasic EDA (Skin Conductance Response / SCR)',
    icon: '📈',
    tag: 'Skin & Arousal',
    figmaVar: null,
    simpleExplanation: 'Fast, temporary peaks in skin conductance that appear 1 to 3 seconds after an immediate event—such as an unexpected alert, an interface error, a difficult question, or a sudden sound. These responses fade away over 5 to 10 seconds.',
    lowMeaning: '0.0 µS (No sudden reactions; steady, calm state without startle).',
    highMeaning: '0.5 – 2.0+ µS (Immediate emotional reaction, startle, or acute frustration).'
  },
  {
    term: 'Heart Rate (BPM)',
    icon: '💓',
    tag: 'Heart & Rhythm',
    figmaVar: 'bio_bpm',
    simpleExplanation: 'The number of times your heart contracts and pumps blood per minute (Beats Per Minute). Heart rate speeds up during physical movement, stress, or excitement, and slows down during rest, calm breathing, and recovery.',
    lowMeaning: '50 – 65 BPM (Deep rest, calm meditation, or athletic resting pulse).',
    highMeaning: '90 – 130+ BPM (Physical exertion, panic, sudden shock, or mental strain).'
  },
  {
    term: 'Heart Rate Variability (RMSSD)',
    icon: '📊',
    tag: 'Heart & Rhythm',
    figmaVar: 'bio_coherence',
    simpleExplanation: 'The millisecond variation in time between consecutive heartbeats (calculated as the Root Mean Square of Successive Differences). A healthy heart naturally speeds up slightly during inhalation and slows down during exhalation. Higher variability indicates a flexible, resilient nervous system capable of recovering quickly from stress.',
    lowMeaning: 'Below 25 ms (Physical exhaustion, chronic stress, or nervous system fatigue).',
    highMeaning: 'Above 55 ms (High vitality, calm nervous system, and strong recovery capacity).'
  },
  {
    term: 'Cardiorespiratory Harmony (Coherence Score)',
    icon: '✨',
    tag: 'Heart & Breath',
    figmaVar: 'bio_coherence',
    simpleExplanation: 'A calculated score from 0.0 to 1.0 showing how synchronized your heart rate rhythm is with your breathing cycle. When breathing at a relaxed, steady rate of about 6 breaths per minute, heart rate oscillations lock in unison with respiration, maximizing coherence.',
    lowMeaning: '0.1 – 0.3 (Irregular, shallow, or anxious breathing disconnected from pulse).',
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
    simpleExplanation: 'Electrical brain activity associated with calm, effortless alertness. Alpha waves increase when you are relaxed, mindful, or in a creative flow state without mental strain, especially with eyes relaxed.',
    lowMeaning: 'Below 0.25 (Mental tension, active problem-solving, or sensory overload).',
    highMeaning: 'Above 0.70 (Calm mindfulness, relaxed concentration, or mental ease).'
  },
  {
    term: 'Beta Brainwaves (15 – 30 Hz)',
    icon: '🧠',
    tag: 'Brainwaves',
    figmaVar: 'bio_beta',
    simpleExplanation: 'Fast brain rhythms produced during active analytical thinking, problem-solving, decision-making, and high cognitive workload.',
    lowMeaning: 'Below 0.20 (Relaxed awareness, meditation, or daydreaming).',
    highMeaning: 'Above 0.75 (Intense concentration, multitasking strain, or anxiety).'
  },
  {
    term: 'Theta Brainwaves (4 – 8 Hz)',
    icon: '🌙',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'Slow brain rhythms that occur during deep daydreaming, creative visualization, and the drowsy transition right before falling asleep (hypnagogia).',
    lowMeaning: 'Below 0.20 (Fully awake and alert).',
    highMeaning: 'Above 0.65 (Drowsiness, twilight sleep transition, or deep reverie).'
  },
  {
    term: 'Delta Brainwaves (0.5 – 4 Hz)',
    icon: '💤',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'The slowest brain oscillations, dominant during deep, dreamless restorative sleep. In healthy awake individuals, delta levels remain low.',
    lowMeaning: 'Below 0.20 (Normal waking state).',
    highMeaning: 'Above 0.60 (Profound sleep or deep physical recovery).'
  },
  {
    term: 'SMR Rhythm (12 – 15 Hz)',
    icon: '🐈',
    tag: 'Brainwaves',
    figmaVar: null,
    simpleExplanation: 'Sensorimotor Rhythm recorded over the motor cortex. It reflects physical stillness combined with attentive mental readiness—the ability to remain calm and focused without physical fidgeting.',
    lowMeaning: 'Physical restlessness, fidgeting, or distraction.',
    highMeaning: 'Calm physical stillness with focused attention.'
  },
  {
    term: 'Cognitive State Name',
    icon: '🏷️',
    tag: 'Affective State',
    figmaVar: 'bio_state',
    simpleExplanation: 'A real-time label identifying the user\'s current physiological state (for example, "Baseline / Neutral", "Deep Meditation / Flow", or "Cognitive Stress"). In Figma prototypes, binding this string variable allows interfaces to automatically adapt components and screens.',
    lowMeaning: 'Used in design prototypes to switch UI modes.',
    highMeaning: 'Enables contextual, adaptive user experience testing.'
  },
  {
    term: 'Sensor Artifacts (Blink / Clench / Detach)',
    icon: '⚠️',
    tag: 'Noise Simulation',
    figmaVar: 'bio_artifact',
    simpleExplanation: 'Real physiological sensors detect electrical noise from eye blinks, jaw clenching, and loose electrodes. SimData simulates these realistic distortions so designers can build and test error states, such as "Sensor Reconnection" notifications.',
    lowMeaning: 'Clean, noise-free biometric signal.',
    highMeaning: 'Artifact detected; use to trigger warning banners or pause recording.'
  }
];
