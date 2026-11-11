import { Link } from 'react-router-dom';
import { Coffee, MapPin, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/productHooks';
import { useDishNotes, useWaysToEarn, useIdeas } from '@/hooks/bbHooks';
import { BRAND, formatINR, IDEA_STATUS_LABEL } from '@/lib/bb';
import Enso from '@/components/bb/Enso';
import BakeBoard from '@/components/bb/BakeBoard';
import WelcomeStrip from '@/components/bb/WelcomeStrip';
import StepHead from '@/components/bb/StepHead';
import Reveal from '@/components/bb/Reveal';
import DietMark from '@/components/bb/DietMark';
import Hanko from '@/components/bb/Hanko';

function Signatures() {
  const { data: products } = useProducts({});
  const { data: notes } = useDishNotes();
  const sig = (notes ?? []).filter(n => n.signature).map(n => ({ n, p: products?.find(p => p.id === n.productId) }))
    .filter(x => x.p && x.p.active && x.p.category !== 'Bakehouse').slice(0, 5);
  if (!sig.length) return <p className="mt-8 text-muted-foreground">The signatures are being plated. <Link to="/menu" className="underline">See the full menu</Link>.</p>;
  return (
    <ol className="mt-10 grid gap-x-10 sm:grid-cols-2">
      {sig.map(({ n, p }, i) => (
        <Reveal as="li" key={n.id} delay={i * 80} className="flex gap-5 border-t border-border py-6">
          <span className="font-display text-4xl leading-none text-muted-foreground" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
          <div className="min-w-0">
            <DietMark diet={n.diet} />
            <h3 className="mt-1 text-xl font-semibold"><Link to={`/products/${p!.slug}`} className="underline-offset-4 hover:underline">{p!.name}</Link></h3>
            <p className="text-muted-foreground">{p!.description}</p>
            <p className="mt-1 font-display text-lg">{formatINR(Number(p!.price))}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

function LabTeaser() {
  const { data } = useIdeas();
  const acted = (data ?? []).filter(i => i.status === 'DONE' || i.status === 'PLANNED').slice(0, 3);
  const top = acted.length ? acted : (data ?? []).slice(0, 3);
  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <p className="text-lg">
          Got a bagel you wish we made? A brew we should pour? Drop it in the Schmear Lab. Other regulars can +1 it,
          and the team marks what goes on the board.
        </p>
        <Button asChild className="bb-tap mt-6"><Link to="/schmear-lab">Suggest an idea</Link></Button>
      </div>
      <ul className="space-y-3" aria-label={acted.length ? 'Ideas we acted on' : 'Ideas in the Lab'}>
        {top.length === 0 && <li className="text-muted-foreground">No ideas yet. Yours could be the first on the board.</li>}
        {top.map(i => (
          <li key={i.id} className="flex items-start justify-between gap-3 border-b border-border pb-3">
            <span><span className="font-semibold">{i.title}</span><span className="block text-sm text-muted-foreground">from {i.authorName ?? 'a guest'}</span></span>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs">{IDEA_STATUS_LABEL[i.status]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EarnTeaser() {
  const { data } = useWaysToEarn();
  const top = (data ?? []).slice(0, 4);
  return (
    <ul className="mt-8 flex flex-wrap gap-6">
      {top.map(r => (
        <li key={r.eventType} className="flex items-center gap-3">
          <Hanko label={`+${Math.round(r.coins)}`} sub="coins" />
          <span className="max-w-[12rem] font-semibold leading-snug">{r.title}</span>
        </li>
      ))}
    </ul>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero: espresso ground, split poster. Wordmark left, the ensō ring drawn around today's bake board right */}
      <section className="dark bb-espresso bb-grain relative overflow-hidden" aria-labelledby="hero-title">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-14 pt-12 md:grid-cols-[1fr_1.05fr] md:items-center md:pb-20 md:pt-16">
          <div>
            <p className="bb-kicker text-[hsl(var(--butter))]">Model Colony · Pune · since 2018</p>
            <h1 id="hero-title" className="font-display mt-4 text-5xl leading-[1.02] sm:text-7xl">
              Butter<br />Brews
              <span lang="mr" className="mt-3 block text-2xl text-[hsl(var(--crema)/0.7)] sm:text-3xl">बटर ब्रूज़</span>
            </h1>
            <p className="bb-hero-in mt-6 max-w-md text-lg text-[hsl(var(--crema)/0.9)]">
              Bagels from our own bakehouse, all-day breakfasts and 100% Arabica coffee, in a quiet lane of Model Colony.
              Come as you are; stay as long as the coffee lasts.
            </p>
            <div className="bb-hero-in mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bb-tap bg-[hsl(var(--butter))] text-[hsl(var(--espresso))] hover:bg-[hsl(41_80%_68%)]"><Link to="/menu">Order a bagel</Link></Button>
              <Button asChild size="lg" variant="outline" className="bb-tap border-[hsl(var(--crema)/0.6)] bg-transparent text-[hsl(var(--crema))] hover:bg-[hsl(var(--crema)/0.1)] hover:text-[hsl(var(--crema))]"><Link to="/book">Book a table</Link></Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[34rem]">
            <Enso className="absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)] text-[hsl(var(--butter))] opacity-90 sm:-inset-10 sm:h-[calc(100%+5rem)] sm:w-[calc(100%+5rem)]" />
            <div className="relative px-8 py-12 sm:px-14 sm:py-16">
              <BakeBoard compact />
            </div>
          </div>
        </div>
        <div className="border-t border-[hsl(var(--crema)/0.15)]">
          <div className="mx-auto max-w-6xl px-4 py-6"><WelcomeStrip /></div>
        </div>
      </section>

      {/* 01 Mix: who we are */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
          <Reveal><StepHead n="01" step="Mix" marathi="मळणे" title="Two friends, one small room, a lot of dough" /></Reveal>
          <Reveal className="space-y-4 text-lg md:pt-16">
            <p>Harsh Agarwal and Umang opened Butter Brews in the by-lanes of Model Colony in 2018. A minimal room, a few tables outside, and a promise to bake the bread themselves.</p>
            <p>The bagel sandwiches became the reason people came back: the Nepali-inspired Chicken Gurkha, the mushroom veggie, the tomato basil cottage cheese. <Link to="/story" className="underline underline-offset-4">Read the whole story</Link>.</p>
          </Reveal>
        </div>
      </section>

      {/* 02 Proof: what we make */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <StepHead n="02" step="Proof" marathi="फुगणे" title="What regulars order first" lead="Our signatures, straight from the menu board." />
          <Signatures />
          <Button asChild variant="outline" className="bb-tap mt-8"><Link to="/menu">The full menu</Link></Button>
        </div>
      </section>

      {/* 03 Boil: why people return */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <StepHead n="03" step="Boil" marathi="उकळणे" title="Why people come back" />
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            { t: 'Coffee first', d: "House espresso is 100% Arabica, with manual brews from rotating guest roasters. And yes, the Vietnamese iced coffee." },
            { t: 'Breakfast, whenever', d: 'Scrambled eggs on a bagel, pancakes, tartines. Breakfast runs all day because mornings do not always start at 9.' },
            { t: 'A lane to slow down in', d: 'A calm room inside, open-air tables outside, and nobody hurrying you out.' },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 90} className="border-t-2 border-foreground pt-4">
              <h3 className="text-xl font-semibold">{x.t}</h3>
              <p className="mt-2 text-muted-foreground">{x.d}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Schmear Lab + rewards */}
      <section className="border-y border-border bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="font-display text-3xl sm:text-5xl">The Schmear Lab</h2>
          <LabTeaser />
          <div className="mt-14">
            <h2 className="font-display text-2xl sm:text-3xl">Coins for taking part</h2>
            <EarnTeaser />
            <Link to="/rewards" className="mt-6 inline-block underline underline-offset-4">All the ways to earn and spend</Link>
          </div>
        </div>
      </section>

      {/* 04 Bake / 05 Serve: order or visit */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-12 md:grid-cols-2">
          <Reveal>
            <StepHead n="04" step="Bake" marathi="भाजणे" title="Cakes for the occasion" />
            <p className="mt-4 text-lg">Whole New York and Basque cheesecakes and celebration cakes, baked to order a day ahead. Pickup from Model Colony.</p>
            <Button asChild className="bb-tap mt-6"><Link to="/cakes">Order a cake</Link></Button>
          </Reveal>
          <Reveal>
            <StepHead n="05" step="Serve" marathi="वाढणे" title="Come and sit" />
            <ul className="mt-5 space-y-3 text-lg">
              <li className="flex gap-3"><MapPin className="mt-1 shrink-0" size={20} aria-hidden="true" /><a href={BRAND.maps} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">{BRAND.address}</a></li>
              <li className="flex gap-3"><Coffee className="mt-1 shrink-0" size={20} aria-hidden="true" />{BRAND.hours}</li>
              <li className="flex gap-3"><Phone className="mt-1 shrink-0" size={20} aria-hidden="true" /><a href={BRAND.phoneHref} className="underline-offset-4 hover:underline">{BRAND.phone}</a></li>
              <li className="flex gap-3"><MessageCircle className="mt-1 shrink-0" size={20} aria-hidden="true" /><a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">WhatsApp us</a></li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bb-tap"><Link to="/book">Book a table</Link></Button>
              <Button asChild variant="outline" className="bb-tap"><Link to="/visit">Directions & hours</Link></Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
