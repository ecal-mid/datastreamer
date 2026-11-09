import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { SimDataTelemetry } from '../engine/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card } from './ui/card';

interface PayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: SimDataTelemetry;
}

export const PayloadModal: React.FC<PayloadModalProps> = ({ isOpen, onClose, telemetry }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'json' | 'osc'>('json');

  const jsonString = JSON.stringify(telemetry, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const oscTree = [
    { address: '/bio/eeg/alpha', type: 'float', val: telemetry.biometrics.eeg.alpha.toFixed(2), desc: 'Alpha power (8-12Hz)' },
    { address: '/bio/eeg/beta', type: 'float', val: telemetry.biometrics.eeg.beta.toFixed(2), desc: 'Beta power (15-30Hz)' },
    { address: '/bio/eeg/theta', type: 'float', val: telemetry.biometrics.eeg.theta.toFixed(2), desc: 'Theta power (4-8Hz)' },
    { address: '/bio/eeg/smr', type: 'float', val: telemetry.biometrics.eeg.smr.toFixed(2), desc: 'SMR power (12-15Hz)' },
    { address: '/bio/hrv/bpm', type: 'float', val: telemetry.biometrics.hrv.bpm.toFixed(1), desc: 'Heart rate in BPM' },
    { address: '/bio/hrv/coherence', type: 'float', val: telemetry.biometrics.hrv.coherence.toFixed(2), desc: 'HRV coherence score' },
    { address: '/bio/respiration', type: 'float', val: ((telemetry.biometrics.respiration.value * 2) - 1).toFixed(2), desc: 'Normalized -1.0 to 1.0' },
    { address: '/bio/eda/phasic', type: 'float', val: telemetry.biometrics.eda.phasic.toFixed(2), desc: 'Phasic burst amplitude' },
    { address: '/bio/state/calm', type: 'float', val: telemetry.states.calm_index.toFixed(2), desc: 'Calm index (0.0 - 1.0)' },
    { address: '/bio/artifact', type: 'int', val: telemetry.states.artifact_flag ? '1' : '0', desc: 'Artifact detection flag' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">SimData Live Telemetry Payloads</DialogTitle>
              <DialogDescription className="text-xs">
                WebSocket JSON (:8080) & Open Sound Control UDP (:9000)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'json' | 'osc')} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="json" className="font-mono text-xs">
              WebSocket JSON Payload (:8080)
            </TabsTrigger>
            <TabsTrigger value="osc" className="font-mono text-xs">
              OSC Address Tree (:9000)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="flex-1 overflow-auto mt-2">
            <Card className="bg-secondary/40 p-3 border-border font-mono text-xs text-emerald-400/90 whitespace-pre overflow-auto max-h-[350px]">
              {jsonString}
            </Card>
          </TabsContent>

          <TabsContent value="osc" className="flex-1 overflow-auto mt-2">
            <Card className="bg-secondary/40 p-3 border-border font-mono text-xs overflow-auto max-h-[350px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground">
                    <th className="pb-1.5 font-semibold">OSC Address</th>
                    <th className="pb-1.5 font-semibold">Type</th>
                    <th className="pb-1.5 font-semibold">Value</th>
                    <th className="pb-1.5 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {oscTree.map((row) => (
                    <tr key={row.address} className="hover:bg-secondary/30">
                      <td className="py-1 text-primary font-semibold">{row.address}</td>
                      <td className="py-1 text-muted-foreground">[{row.type}]</td>
                      <td className="py-1 text-foreground font-bold">{row.val}</td>
                      <td className="py-1 text-muted-foreground text-[11px]">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-2">
          <span className="text-[11px] text-muted-foreground font-mono">Continuous 30Hz broadcast</span>
          <div className="flex gap-2">
            {activeTab === 'json' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="gap-1.5 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy JSON'}</span>
              </Button>
            )}
            <Button variant="default" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
