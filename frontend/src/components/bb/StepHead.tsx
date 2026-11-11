import { cn } from '@/lib/utils';

/** Numbered chapter heading, named after a step in making a bagel, with its Marathi word as a quiet accent. */
export default function StepHead({ n, step, marathi, title, lead, className, id }:
  { n: string; step: string; marathi?: string; title: string; lead?: string; className?: string; id?: string }) {
  return (
    <header className={cn('max-w-2xl', className)}>
      <p className="bb-kicker flex items-center gap-3 text-muted-foreground">
        <span className="font-display text-2xl leading-none tracking-normal text-[hsl(36_80%_27%)] dark:text-[hsl(var(--butter))]">{n}</span>
        <span>{step}</span>
        {marathi && <span lang="mr" className="font-display text-base normal-case tracking-normal">{marathi}</span>}
      </p>
      <h2 id={id} className="font-display mt-3 text-3xl leading-tight sm:text-5xl">{title}</h2>
      {lead && <p className="mt-4 text-lg text-muted-foreground">{lead}</p>}
    </header>
  );
}
