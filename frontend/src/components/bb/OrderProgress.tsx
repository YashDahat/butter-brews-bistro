import { STAGE_LABEL, WORKFLOW_STEPS } from '@/lib/bb';
import { cn } from '@/lib/utils';

/** Stage-by-stage progress for an order or booking, straight from its workflow stage. */
export default function OrderProgress({ workflowCode, stageCode }: { workflowCode: string; stageCode: string | null | undefined }) {
  const steps = WORKFLOW_STEPS[workflowCode];
  if (!steps || !stageCode) return null;
  if (stageCode === 'CANCELLED') return <p className="text-sm font-medium text-destructive">Cancelled</p>;
  const at = Math.max(0, steps.indexOf(stageCode));
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1" aria-current={i === at ? 'step' : undefined}>
          <span className={cn('rounded-full px-2 py-0.5 transition-colors duration-500',
            i < at && 'bg-secondary text-secondary-foreground',
            i === at && 'bg-primary font-semibold text-primary-foreground',
            i > at && 'border border-border text-muted-foreground')}>
            {STAGE_LABEL[s] ?? s}
          </span>
          {i < steps.length - 1 && <span aria-hidden="true" className="text-muted-foreground">·</span>}
        </li>
      ))}
    </ol>
  );
}
