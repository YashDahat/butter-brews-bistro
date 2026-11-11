import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLoyaltyMe } from '@/hooks/loyaltyHooks';
import { useMyOrders } from '@/hooks/orderHooks';
import { useMyReservations } from '@/hooks/bbHooks';
import { Button } from '@/components/ui/button';
import { slotLabel } from '@/lib/bb';
import Hanko from './Hanko';

function SignedInWelcome() {
  const { data: me } = useLoyaltyMe();
  const { data: orders } = useMyOrders();
  const { data: bookings } = useMyReservations();
  const upcoming = bookings?.find(b => b.stageCode === 'CONFIRMED' || b.stageCode === 'REQUESTED');
  const open = orders?.find(o => o.workflowCode !== 'bb-table' && o.currentStageCode && !['HANDED_OVER', 'COLLECTED', 'CANCELLED', 'DELIVERED'].includes(o.currentStageCode));
  const last = orders?.find(o => o.workflowCode === 'bb-kitchen');
  let next: { label: string; href: string };
  if (upcoming) next = { label: `Your table: ${slotLabel(upcoming.slotKey)}`, href: '/my-brews#bookings' };
  else if (open) next = { label: `Follow order ${open.orderNumber}`, href: `/orders/${open.id}` };
  else if (last) next = { label: 'Reorder your usual', href: '/my-brews#orders' };
  else next = { label: "See what's out of the oven", href: '/menu' };
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Hanko label={String(Math.round(me?.coinBalance ?? 0))} sub="coins" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl">Welcome back.</p>
        <p className="text-sm opacity-80">
          {me ? `${Math.round(me.coinBalance)} coins to spend at checkout${me.tierName ? ` · ${me.tierName}` : ''}.` : 'Your coins are on their way.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bb-tap bg-[hsl(var(--butter))] text-[hsl(var(--espresso))] hover:bg-[hsl(41_80%_68%)]"><Link to={next.href}>{next.label}</Link></Button>
        <Button asChild variant="outline" className="bb-tap border-current bg-transparent"><Link to="/my-brews">My account</Link></Button>
      </div>
    </div>
  );
}

/** Warm greeting under the hero: returning guests see coins + one next step; new guests see what joining gives. */
export default function WelcomeStrip() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <SignedInWelcome />;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Hanko label="+" sub="welcome" />
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl">Pull up a chair. Browse as long as you like.</p>
        <p className="text-sm opacity-80">
          Join to get a welcome offer, earn coins for reviews and ideas, save favourites and reorder in one tap.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild className="bb-tap bg-[hsl(var(--butter))] text-[hsl(var(--espresso))] hover:bg-[hsl(41_80%_68%)]"><Link to="/signup">Join Butter Brews</Link></Button>
        <Button asChild variant="outline" className="bb-tap border-current bg-transparent"><Link to="/rewards">How rewards work</Link></Button>
      </div>
    </div>
  );
}
