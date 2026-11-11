import { cn } from '@/lib/utils';

/**
 * The ensō: one brush stroke that never quite closes. Here it is also the bagel ring. Drawn once (700ms) on load;
 * static with reduced motion. Decorative only.
 */
export default function Enso({ className, draw = true, strokeWidth = 26 }: { className?: string; draw?: boolean; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 400 400" className={cn('pointer-events-none', className)} aria-hidden="true" focusable="false">
      <defs>
        <filter id="bb-brush" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" />
        </filter>
      </defs>
      <path
        d="M 312 96 C 258 40 150 38 92 98 C 30 162 42 270 112 322 C 186 378 300 352 342 270 C 368 218 360 158 330 120"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        filter="url(#bb-brush)"
        className={draw ? 'bb-enso-stroke' : undefined}
        style={{ ['--len' as string]: 1400 }}
      />
      <path d="M 330 120 C 338 108 344 100 350 96" fill="none" stroke="currentColor" strokeWidth={strokeWidth * 0.35}
        strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
