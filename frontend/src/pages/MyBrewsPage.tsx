import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserRound, LifeBuoy, Gift, Share2 } from 'lucide-react';
import { useCart } from '@/cart';
import { useMyOrders } from '@/hooks/orderHooks';
import { useLoyaltyMe } from '@/hooks/loyaltyHooks';
import { useProducts } from '@/hooks/productHooks';
import { useFavourites, useMarkJourney, useMyIdeas, useMyReservations } from '@/hooks/bbHooks';
import type { OrderDto } from '@/types/order';
import { formatINR, IDEA_STATUS_LABEL, slotLabel, whatsappShare } from '@/lib/bb';
import { Button } from '@/components/ui/button';
import FeedbackForm from '@/components/FeedbackForm';
import Hanko from '@/components/bb/Hanko';
import JourneyChecklist from '@/components/bb/JourneyChecklist';
import OrderProgress from '@/components/bb/OrderProgress';
import WaysToEarn from '@/components/bb/WaysToEarn';
import DishCard from '@/components/bb/DishCard';

const FINISHED = ['HANDED_OVER', 'COLLECTED', 'COMPLETED', 'DELIVERED'];

function OrderRow({ o }: { o: OrderDto }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const mark = useMarkJourney();
  const [rating, setRating] = useState(false);
  const isTable = o.workflowCode === 'bb-table';
  const finished = !!o.currentStageCode && FINISHED.includes(o.currentStageCode);
  const reorder = () => {
    o.items.filter(i => i.itemType === 'PRODUCT').forEach(i => addItem({
      id: `${i.itemType}:${i.itemId}`, name: i.variantLabel ? `${i.name} (${i.variantLabel})` : i.name,
      unitPrice: Number(i.unitPrice), imageUrl: i.imageUrl ?? null, variantKey: i.variantKey ?? undefined,
      metadata: { itemType: i.itemType, itemId: i.itemId },
    }, i.quantity));
    mark.mutate('REORDER');
    toast.success('Your usual is back in the cart');
    navigate('/cart');
  };
  return (
    <li className="border-b border-border py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-semibold">
          {isTable ? 'Table booking' : o.workflowCode === 'bb-bakehouse' ? 'Bakehouse order' : 'Café order'} · {o.orderNumber}
        </p>
        <p className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}{!isTable && ` · ${formatINR(Number(o.total))}`}</p>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{o.items.map(i => `${i.quantity} × ${i.name}`).join(', ')}</p>
      <div className="mt-3"><OrderProgress workflowCode={o.workflowCode} stageCode={o.currentStageCode} /></div>
      <div className="mt-3 flex flex-wrap gap-2">
        {!isTable && <Button size="sm" className="bb-tap" onClick={reorder}>Reorder</Button>}
        <Button asChild size="sm" variant="outline" className="bb-tap"><Link to={`/orders/${o.id}`}>Details</Link></Button>
        {finished && !o.feedbackSubmitted && <Button size="sm" variant="outline" className="bb-tap" onClick={() => setRating(true)}>Rate this {isTable ? 'visit' : 'order'}</Button>}
        <Button asChild size="sm" variant="ghost" className="bb-tap"><Link to="/support">Need help with this?</Link></Button>
      </div>
      {rating && <FeedbackForm orderId={o.id} />}
    </li>
  );
}

export default function MyBrewsPage() {
  const { data: me } = useLoyaltyMe();
  const { data: orders, isLoading } = useMyOrders();
  const { data: bookings } = useMyReservations();
  const { data: favIds } = useFavourites();
  const { data: products } = useProducts({});
  const { data: ideas } = useMyIdeas();
  const favs = (products ?? []).filter(p => favIds?.includes(p.id));
  const toRate = (orders ?? []).filter(o => o.currentStageCode && FINISHED.includes(o.currentStageCode) && !o.feedbackSubmitted).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <p className="bb-kicker text-muted-foreground">My account</p>
      <div className="mt-2 flex flex-wrap items-center gap-5">
        <Hanko label={String(Math.round(me?.coinBalance ?? 0))} sub="coins" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl">My Brews</h1>
          <p className="text-muted-foreground">{me ? `${Math.round(me.coinBalance)} coins to use at checkout${me.tierName ? ` · ${me.tierName} tier` : ''}.` : 'Your orders, tables, favourites and rewards in one place.'}</p>
        </div>
      </div>
      <nav aria-label="Account" className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" className="bb-tap"><Link to="/account"><UserRound size={16} aria-hidden="true" /> Profile, password & coin history</Link></Button>
        <Button asChild variant="outline" className="bb-tap"><Link to="/rewards"><Gift size={16} aria-hidden="true" /> Ways to earn</Link></Button>
        <Button asChild variant="outline" className="bb-tap"><Link to="/support"><LifeBuoy size={16} aria-hidden="true" /> Support</Link></Button>
        <Button asChild variant="outline" className="bb-tap"><a href="#favourites">Favourites</a></Button>
        <Button asChild variant="outline" className="bb-tap"><a href="#ideas">My ideas</a></Button>
      </nav>

      <div className="mt-10"><JourneyChecklist /></div>

      <section id="orders" className="mt-14 scroll-mt-24" aria-labelledby="h-orders">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="h-orders" className="font-display text-3xl">Orders & bookings</h2>
          <Link to="/orders" className="text-sm underline">Full order history</Link>
        </div>
        {toRate > 0 && <p className="mt-2 text-sm">You have {toRate} to rate. Each rating earns coins, whatever you score us.</p>}
        {isLoading && <p className="mt-4 text-muted-foreground">Fetching your orders…</p>}
        {!isLoading && !orders?.length && (
          <p className="mt-4 text-muted-foreground">No orders yet. <Link to="/menu" className="underline">Start with a bagel</Link> or <Link to="/book" className="underline">book a table</Link>.</p>
        )}
        <ul>{(orders ?? []).slice(0, 8).map(o => <OrderRow key={o.id} o={o} />)}</ul>
      </section>

      <section id="bookings" className="mt-14 scroll-mt-24" aria-labelledby="h-bookings">
        <h2 id="h-bookings" className="font-display text-3xl">Tables</h2>
        {!bookings?.length ? <p className="mt-3 text-muted-foreground">No tables booked. <Link to="/book" className="underline">Book one</Link>; it's free.</p> : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {bookings.slice(0, 6).map(b => (
              <li key={b.orderId} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{b.areaName} · {slotLabel(b.slotKey)} · {b.guests} guests{b.withPet ? ' · with pet' : ''}</span>
                <span className="flex items-center gap-3">
                  <OrderProgress workflowCode="bb-table" stageCode={b.stageCode} />
                  <Link to={`/orders/${b.orderId}`} className="text-sm underline">{b.cancellable ? 'Details or cancel' : 'Details'}</Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="favourites" className="mt-14 scroll-mt-24" aria-labelledby="h-favs">
        <h2 id="h-favs" className="font-display text-3xl">Favourites</h2>
        {favs.length === 0 ? <p className="mt-3 text-muted-foreground">Tap the heart on any dish to keep it here for next time. <Link to="/menu" className="underline">Browse the menu</Link>.</p>
          : <div>{favs.map(p => <DishCard key={p.id} p={p} />)}</div>}
      </section>

      <section id="ideas" className="mt-14 scroll-mt-24" aria-labelledby="h-ideas">
        <h2 id="h-ideas" className="font-display text-3xl">My ideas</h2>
        {!ideas?.length ? <p className="mt-3 text-muted-foreground">Nothing in the Lab from you yet. <Link to="/schmear-lab" className="underline">Suggest a bagel</Link>.</p> : (
          <ul className="mt-3 divide-y divide-border border-y border-border">
            {ideas.map(i => (
              <li key={i.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{i.title}</span>
                  <span className="text-sm">{IDEA_STATUS_LABEL[i.status]} · {i.votes} +1s</span>
                </div>
                {i.teamReply && <p className="mt-1 text-sm text-muted-foreground">The team: {i.teamReply}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14 rounded-sm border border-border bg-card p-5 sm:p-6">
        <WaysToEarn />
        <a href={whatsappShare(`Come try the bagels at Butter Brews, Model Colony, Pune: ${window.location.origin}`)} target="_blank" rel="noopener noreferrer"
           className="bb-tap mt-5 inline-flex items-center gap-2 underline-offset-4 hover:underline">
          <Share2 size={16} aria-hidden="true" /> Invite a friend on WhatsApp
        </a>
      </section>
    </div>
  );
}
