import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/productHooks';
import { Button } from '@/components/ui/button';
import { formatINR, STAGE_LABEL, WORKFLOW_STEPS } from '@/lib/bb';
import StepHead from '@/components/bb/StepHead';
import Reveal from '@/components/bb/Reveal';
import FavouriteButton from '@/components/bb/FavouriteButton';

export default function CakesPage() {
  const { data, isLoading, isError } = useProducts({ category: 'Bakehouse' });
  const cakes = (data ?? []).filter(p => p.active);
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <StepHead n="04" step="Bake" marathi="भाजणे" title="Whole cakes, baked to order"
        lead="New York cheesecake, the burnt-top Basque, and celebration cakes from our bakehouse. Order at least a day ahead and pick up from Model Colony." />
      <p className="mt-6 rounded-sm border border-border bg-card p-4 text-sm">
        Cakes have their own bake schedule, so they check out separately from café orders. Finish one, then the other.
        Need it eggless or with a message? <Link to="/support" className="underline">Tell us here</Link> after ordering, or call +91 96074 04669.
      </p>
      {isLoading && <p className="mt-10 text-muted-foreground">Checking the bakehouse…</p>}
      {isError && <p className="mt-10">We couldn't load the cakes. Please refresh or <Link to="/support" className="underline">ask us</Link>.</p>}
      {!isLoading && !isError && cakes.length === 0 && <p className="mt-10 text-muted-foreground">No whole cakes listed right now. Ask us about one.</p>}
      <ul className="mt-10 grid gap-x-10 gap-y-2 md:grid-cols-3">
        {cakes.map((p, i) => (
          <Reveal as="li" key={p.id} delay={i * 80} className="border-t-2 border-foreground pt-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-2xl leading-tight"><Link to={`/products/${p.slug}`} className="underline-offset-4 hover:underline">{p.name}</Link></h2>
              <FavouriteButton productId={p.id} name={p.name} />
            </div>
            <p className="mt-2 text-muted-foreground">{p.description}</p>
            <p className="mt-3 text-sm">
              {p.variants.length
                ? p.variants.map(v => `${v.label} ${formatINR(Number(v.price ?? p.price))}`).join(' · ')
                : formatINR(Number(p.price))}
            </p>
            <Button asChild className="bb-tap mt-4"><Link to={`/products/${p.slug}`}>Choose size</Link></Button>
          </Reveal>
        ))}
      </ul>
      <section className="mt-16" aria-labelledby="cake-journey">
        <h2 id="cake-journey" className="font-display text-2xl">What happens after you order</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {WORKFLOW_STEPS['bb-bakehouse'].map((s, i) => (
            <li key={s} className="border-t border-border pt-3">
              <span className="font-display text-xl text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
              <p className="font-semibold">{STAGE_LABEL[s]}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">You can cancel for a full refund until the cake goes in the oven, and for half once it's baking. Follow each step from <Link to="/my-brews#orders" className="underline">My account</Link>.</p>
      </section>
    </div>
  );
}
