import React, { useState } from 'react';
import { Copy, Check, Layers } from 'lucide-react';
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

interface FigmaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FigmaModal: React.FC<FigmaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('figma-plugin/manifest.json');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">SimData Figma Companion Plugin</DialogTitle>
              <DialogDescription className="text-xs">
                Zero-config real-time variable bridge for Figma (10 Hz throttled)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3.5 text-xs">
          <Card className="bg-secondary/40 p-3.5 space-y-2 border-border/80">
            <div className="font-semibold text-foreground">How to load into Figma in 30 seconds:</div>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground font-mono text-[11px]">
              <li>Open any document in Figma Desktop.</li>
              <li>Go to: <strong>Plugins &gt; Development &gt; Import plugin from manifest...</strong></li>
              <li>Select <span className="text-primary font-bold">figma-plugin/manifest.json</span> in this repository.</li>
              <li>Run the plugin and click <strong>&quot;Setup Bio Variables&quot;</strong>.</li>
            </ol>
          </Card>

          <div>
            <div className="text-[11px] font-mono text-muted-foreground mb-1">Manifest Path</div>
            <div className="flex items-center justify-between p-2 rounded-md bg-secondary/30 border border-border font-mono text-xs text-foreground">
              <span className="truncate">datastreamer/figma-plugin/manifest.json</span>
              <Button
                variant="outline"
                size="xs"
                onClick={handleCopy}
                className="gap-1 font-mono text-primary hover:text-primary"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </div>

          {/* Direct Download ZIP button */}
          <div className="flex items-center justify-between p-3 rounded-md bg-secondary/20 border border-border">
            <div>
              <div className="font-semibold text-foreground text-xs">Ready-to-install ZIP Archive</div>
              <div className="text-[10px] text-muted-foreground">Contains manifest.json, ui.html, and code.js</div>
            </div>
            <a
              href="/api/download-figma-plugin"
              download="simdata-figma-plugin.zip"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-mono font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none bg-primary text-primary-foreground hover:bg-primary/90 h-7 rounded px-3 text-[11px] gap-1.5 shadow-sm"
            >
              <Layers className="w-3 h-3" />
              <span>Download ZIP</span>
            </a>
          </div>

          <Card className="bg-secondary/40 p-3 border-border/80 text-[11px] space-y-1.5">
            <div className="font-semibold text-foreground">Auto-Provisioned in &quot;BioData&quot; Collection:</div>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-muted-foreground">
              <div><strong className="text-cyan-400">bio_alpha</strong>: 0.0 - 1.0 (Float)</div>
              <div><strong className="text-amber-400">bio_beta</strong>: 0.0 - 1.0 (Float)</div>
              <div><strong className="text-emerald-400">bio_coherence</strong>: 0.0 - 1.0 (Float)</div>
              <div><strong className="text-red-400">bio_bpm</strong>: 45 - 130 (Float)</div>
              <div><strong className="text-cyan-400">bio_respiration</strong>: 0.0 - 1.0 (Float)</div>
              <div><strong className="text-red-400">bio_artifact</strong>: Boolean Flag</div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="default" size="sm" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
