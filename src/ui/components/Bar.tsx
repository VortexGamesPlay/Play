import type { CSSProperties } from 'react';

export function Bar({ value, fill, size, label }: { value: number; fill?: string; size?: 'thin' | 'thick'; label?: string }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`bar ${size ?? ''}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <i style={{ width: `${pct}%`, ...(fill ? ({ ['--fill' as string]: fill } as CSSProperties) : {}) }} />
    </div>
  );
}
