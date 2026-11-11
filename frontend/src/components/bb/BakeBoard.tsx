import { Link } from 'react-router-dom';
import { useBakeBoard } from '@/hooks/bbHooks';
import { BAKE_STATUS_LABEL, formatINR } from '@/lib/bb';
import { cn } from '@/lib/utils';

/** The live "Out of the oven" board: today's bakehouse batches, as the bakers post them. */
export default function BakeBoard({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError } = useBakeBoard();
  const dateLabel = data ? new Date(data.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  return (
    <div className="bb-board relative rounded-sm border border-[hsl(var(--crema)/0.25)] bg-[hsl(var(--espresso))] p-5 shadow-2xl sm:p-6" aria-live="polite">
      <p className="bb-kicker text-[hsl(var(--butter))]">Out of the oven</p>
      <p className="mt-1 text-sm text-[hsl(var(--crema)/0.8)]">
        {data ? (data.today ? `Today, ${dateLabel}` : `Last bake: ${dateLabel}. Today's board goes up with the first batch.`) : 'Today'}
      </p>
      {isLoading && <ul className="mt-4 space-y-3" aria-hidden="true">{[0, 1, 2].map(i => <li key={i} className="h-6 rounded bg-[hsl(var(--crema)/0.1)]" />)}</ul>}
      {isError && <p className="mt-4 text-sm">The board is resting. Call us on +91 96074 04669 to ask what's fresh.</p>}
      {data && data.drops.length === 0 && <p className="mt-4 text-sm">The bakers haven't posted yet. The first bagels come out in the morning.</p>}
      {data && data.drops.length > 0 && (
        <ul className="mt-4 divide-y divide-[hsl(var(--crema)/0.15)]">
          {data.drops.slice(0, compact ? 4 : 12).map(d => (
            <li key={d.id} className="flex items-baseline gap-3 py-2.5">
              <span className="w-12 shrink-0 font-mono text-sm tabular-nums text-[hsl(var(--crema)/0.75)]">{d.outAt ?? '—'}</span>
              <span className="min-w-0 flex-1">
                {d.productSlug
                  ? <Link to={`/products/${d.productSlug}`} className="font-semibold underline-offset-4 hover:underline">{d.name}</Link>
                  : <span className="font-semibold">{d.name}</span>}
                {d.note && <span className="block text-xs text-[hsl(var(--crema)/0.7)]">{d.note}</span>}
              </span>
              {d.price != null && <span className="hidden text-sm sm:inline">{formatINR(d.price)}</span>}
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
                d.status === 'OUT_NOW' && 'bg-[hsl(var(--butter))] text-[hsl(var(--espresso))]',
                d.status === 'IN_THE_OVEN' && 'border border-[hsl(var(--crema)/0.5)]',
                d.status === 'SOLD_OUT' && 'text-[hsl(var(--crema)/0.6)] line-through')}>
                {BAKE_STATUS_LABEL[d.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
