import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/productHooks';
import { useBranch } from '@/context/BranchContext';
import { useDishNotes, useWaysToEarn } from '@/hooks/bbHooks';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import DishCard from '@/components/bb/DishCard';
import StepHead from '@/components/bb/StepHead';
import Reveal from '@/components/bb/Reveal';

const ORDER = ['Bagels', 'All-day breakfast', 'Bowls & mains', 'Coffee & coolers', 'Desserts'];

export default function MenuPage() {
  const { selectedBranchId } = useBranch();
  const { data: products, isLoading, isError } = useProducts({ branchId: selectedBranchId ?? undefined });
  const { data: notes } = useDishNotes();
  const { data: earn } = useWaysToEarn();
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const noteBy = useMemo(() => new Map((notes ?? []).map(n => [n.productId, n])), [notes]);
  const reviewCoins = earn?.find(r => r.eventType === 'REVIEW')?.coins;

  const groups = useMemo(() => {
    const list = (products ?? []).filter(p => p.active && p.category !== 'Bakehouse')
      .filter(p => !q || (p.name + ' ' + (p.description ?? '')).toLowerCase().includes(q.toLowerCase()))
      .filter(p => !vegOnly || ['VEG', 'VEGAN'].includes(noteBy.get(p.id)?.diet ?? 'VEG'));
    const byCat = new Map<string, typeof list>();
    list.forEach(p => { const c = p.category ?? 'More'; byCat.set(c, [...(byCat.get(c) ?? []), p]); });
    return [...byCat.entries()].sort((a, b) => {
      const ia = ORDER.indexOf(a[0]); const ib = ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [products, q, vegOnly, noteBy]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <StepHead n="02" step="Proof" marathi="फुगणे" title="The menu"
        lead="Bagels baked in our own bakehouse, all-day breakfasts, warm bowls and 100% Arabica coffee. Order for pickup or delivery, or come sit with us." />
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="menu-search">Search the menu</Label>
          <Input id="menu-search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Bagel, khao suey, cheesecake…" className="mt-1 h-11" />
        </div>
        <div className="flex items-center gap-3 pb-2">
          <Switch id="veg-only" checked={vegOnly} onCheckedChange={setVegOnly} />
          <Label htmlFor="veg-only">Veg only</Label>
        </div>
      </div>
      <nav aria-label="Menu sections" className="mt-6 flex flex-wrap gap-2">
        {groups.map(([c]) => <a key={c} href={`#${c.replace(/\W+/g, '-').toLowerCase()}`} className="bb-tap inline-flex items-center rounded-full border border-border px-4 text-sm hover:bg-muted">{c}</a>)}
        <Link to="/cakes" className="bb-tap inline-flex items-center rounded-full border border-border px-4 text-sm hover:bg-muted">Whole cakes</Link>
      </nav>

      {isLoading && <p className="mt-10 text-muted-foreground">Setting the table…</p>}
      {isError && <p className="mt-10">We couldn't load the menu. Please refresh, or <Link to="/support" className="underline">ask us for help</Link>.</p>}
      {!isLoading && !isError && groups.length === 0 && (
        <p className="mt-10 text-muted-foreground">Nothing matches that. Try another word, or <Link to="/schmear-lab" className="underline">suggest it in the Schmear Lab</Link>.</p>
      )}
      {groups.map(([cat, items]) => (
        <Reveal as="section" key={cat} className="mt-12">
          <h2 id={cat.replace(/\W+/g, '-').toLowerCase()} className="font-display scroll-mt-24 border-b-2 border-foreground pb-2 text-3xl">{cat}</h2>
          <div>{items.map(p => <DishCard key={p.id} p={p} note={noteBy.get(p.id)} reviewCoins={reviewCoins} />)}</div>
        </Reveal>
      ))}
      <p className="mt-10 text-sm text-muted-foreground">
        Allergies or a question about a dish? <Link to="/support" className="underline">Message us</Link> or call +91 96074 04669.
      </p>
    </div>
  );
}
