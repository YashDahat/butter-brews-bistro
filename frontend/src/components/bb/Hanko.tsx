import { cn } from '@/lib/utils';

/** A round hanko-style stamp (the ring motif again). Used for earned coins and finished checklist steps. */
export default function Hanko({ label, sub, className, animate = false, tone = 'butter' }:
  { label: string; sub?: string; className?: string; animate?: boolean; tone?: 'butter' | 'cocoa' }) {
  return (
    <span
      className={cn(
        'inline-flex h-14 w-14 shrink-0 -rotate-[8deg] flex-col items-center justify-center rounded-full border-[3px] text-center leading-none',
        tone === 'butter' ? 'border-[hsl(var(--butter))] text-[hsl(36_80%_25%)] dark:text-[hsl(var(--butter))]'
                          : 'border-[hsl(var(--cocoa))] text-[hsl(var(--cocoa))] dark:border-[hsl(var(--crema))] dark:text-[hsl(var(--crema))]',
        animate && 'bb-stamp-in', className)}
      aria-hidden="true"
    >
      <span className="font-display text-base">{label}</span>
      {sub && <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest">{sub}</span>}
    </span>
  );
}
