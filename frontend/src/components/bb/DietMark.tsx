import type { Diet } from '@/lib/bb';
import { DIET_LABEL } from '@/lib/bb';

/** Indian food marking: square outline + dot. Green veg / vegan, red non-veg, amber for egg. */
export default function DietMark({ diet }: { diet: Diet }) {
  const color = diet === 'NON_VEG' ? 'hsl(var(--nonveg))' : diet === 'EGG' ? 'hsl(32 85% 38%)' : 'hsl(var(--veg))';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" title={DIET_LABEL[diet]}>
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center border-2" style={{ borderColor: color }} aria-hidden="true">
        {diet === 'NON_VEG'
          ? <span className="block h-0 w-0 border-x-[3.5px] border-b-[6px] border-x-transparent" style={{ borderBottomColor: color }} />
          : <span className="block h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      </span>
      <span className="sr-only sm:not-sr-only">{DIET_LABEL[diet]}</span>
    </span>
  );
}
