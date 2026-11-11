import { Link } from 'react-router-dom';
import { useJourney } from '@/hooks/bbHooks';
import { Progress } from '@/components/ui/progress';
import Hanko from './Hanko';

/** "Get started" card: steps a regular takes, each stamped as it's done. */
export default function JourneyChecklist() {
  const { data, isLoading } = useJourney();
  if (isLoading) return <p className="text-muted-foreground">Loading your steps…</p>;
  if (!data) return null;
  const pct = Math.round((data.done / Math.max(1, data.total)) * 100);
  return (
    <section aria-labelledby="get-started" className="rounded-sm border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="get-started" className="font-display text-2xl">Get started</h2>
        <p className="text-sm text-muted-foreground">{data.done} of {data.total} stamped</p>
      </div>
      <Progress value={pct} className="mt-3 h-2" aria-label={`${data.done} of ${data.total} steps done`} />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {data.steps.map(s => (
          <li key={s.key} className="flex items-center gap-3">
            {s.done
              ? <Hanko label="✓" sub="done" animate className="h-11 w-11" />
              : <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border" aria-hidden="true" />}
            <div className="min-w-0">
              {s.done
                ? <p className="font-semibold">{s.title} <span className="sr-only">(done)</span></p>
                : <Link to={s.href} className="font-semibold underline-offset-4 hover:underline">{s.title}</Link>}
              <p className="text-sm text-muted-foreground">{s.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
