import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStory } from '@/hooks/bbHooks';
import { Button } from '@/components/ui/button';
import Reveal from '@/components/bb/Reveal';
import Enso from '@/components/bb/Enso';

const MARATHI: Record<string, string> = { Mix: 'मळणे', Proof: 'फुगणे', Boil: 'उकळणे', Bake: 'भाजणे', Serve: 'वाढणे' };

export default function StoryPage() {
  const { data, isLoading, isError } = useStory();
  const lineRef = useRef<HTMLOListElement | null>(null);
  const [fill, setFill] = useState(1);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = lineRef.current; if (!el) return;
        const r = el.getBoundingClientRect();
        const p = (window.innerHeight * 0.6 - r.top) / Math.max(1, r.height);
        setFill(Math.min(1, Math.max(0, p)));
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [data]);

  return (
    <div>
      <section className="dark bb-espresso relative overflow-hidden">
        <Enso draw className="absolute -right-24 -top-16 h-80 w-80 text-[hsl(var(--butter)/0.5)] sm:h-[28rem] sm:w-[28rem]" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <p className="bb-kicker text-[hsl(var(--butter))]">Our story</p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl leading-tight sm:text-6xl">Told the way a bagel is made</h1>
          <p className="mt-5 max-w-xl text-lg text-[hsl(var(--crema)/0.85)]">Mix, proof, boil, bake, serve. Five steps from a small room in Model Colony to the bistro you know.</p>
        </div>
      </section>
      <div className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        {isLoading && <p className="text-muted-foreground">Turning the pages…</p>}
        {isError && <p>We couldn't load the story right now. <Link to="/" className="underline">Back home</Link>.</p>}
        {data && (
          <ol ref={lineRef} className="relative border-l border-border pl-8 sm:pl-12">
            <span aria-hidden="true" className="bb-timeline-fill absolute -left-px top-0 h-full w-[3px] bg-[hsl(var(--butter))]" style={{ transform: `scaleY(${fill})` }} />
            {data.map(c => (
              <Reveal as="li" key={c.id} className="relative pb-14 last:pb-0">
                <span aria-hidden="true" className="absolute -left-[2.6rem] top-1 h-5 w-5 rounded-full border-[3px] border-[hsl(var(--butter))] bg-background sm:-left-[3.6rem]" />
                <p className="bb-kicker text-muted-foreground">
                  {String(c.ordinal).padStart(2, '0')} · {c.step}
                  {MARATHI[c.step] && <span lang="mr" className="font-display ml-2 text-sm normal-case tracking-normal">{MARATHI[c.step]}</span>}
                  {c.marker && <span className="ml-2">· {c.marker}</span>}
                </p>
                <h2 className="font-display mt-2 text-3xl leading-tight">{c.title}</h2>
                <p className="mt-3 text-lg">{c.body}</p>
              </Reveal>
            ))}
          </ol>
        )}
        <div className="mt-14 flex flex-wrap gap-3">
          <Button asChild className="bb-tap"><Link to="/menu">Taste the story</Link></Button>
          <Button asChild variant="outline" className="bb-tap"><Link to="/visit">Visit us</Link></Button>
        </div>
      </div>
    </div>
  );
}
