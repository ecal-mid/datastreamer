import React from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { METRIC_INFO, MetricKey } from '../engine/metricInfo';

interface InfoButtonProps {
  metric: MetricKey;
  className?: string;
  size?: number;
}

/** Small "i" button that opens a dialog explaining how a measure is computed. */
export const InfoButton: React.FC<InfoButtonProps> = ({ metric, className = '', size = 12 }) => {
  const info = METRIC_INFO[metric];
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`How is "${info.title}" computed?`}
        aria-label={`How is ${info.title} computed?`}
        className={`inline-flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0 ${className}`}
      >
        <Info style={{ width: size, height: size }} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{info.title}</DialogTitle>
            <DialogDescription>{info.summary}</DialogDescription>
          </DialogHeader>

          {info.formula && (
            <pre className="bg-secondary/60 border border-border rounded-md p-2.5 text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-foreground">
              {info.formula}
            </pre>
          )}

          <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
            {info.details.map((d, i) => <li key={i}>{d}</li>)}
          </ul>

          {info.sections?.map((sec) => (
            <div key={sec.heading} className="space-y-1.5">
              <h4 className="text-xs font-mono font-semibold text-foreground">{sec.heading}</h4>
              <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
                {sec.body.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}

          {info.note && (
            <p className="text-[11px] text-amber-400/90 border-t border-border pt-2">{info.note}</p>
          )}
          {info.source && (
            <p className="text-[10px] font-mono text-muted-foreground/70">Source: {info.source}</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
