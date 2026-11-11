import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLoyaltyMe } from '@/hooks/loyaltyHooks';
import { Button } from '@/components/ui/button';
import WaysToEarn from '@/components/bb/WaysToEarn';
import Hanko from '@/components/bb/Hanko';

function Balance() {
  const { data } = useLoyaltyMe();
  if (!data) return null;
  return (
    <div className="mt-8 flex items-center gap-4 rounded-sm border border-border bg-card p-5">
      <Hanko label={String(Math.round(data.coinBalance))} sub="coins" />
      <div>
        <p className="font-semibold">You have {Math.round(data.coinBalance)} coins{data.tierName ? ` · ${data.tierName}` : ''}</p>
        <p className="text-sm text-muted-foreground">Turn on "use coins" at checkout to take them off your bill. <Link to="/account" className="underline">Coin history</Link></p>
      </div>
    </div>
  );
}

export default function RewardsPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <p className="bb-kicker text-muted-foreground">Rewards</p>
      <h1 className="font-display mt-2 text-4xl sm:text-6xl">Coins for the regulars</h1>
      <p className="mt-4 text-lg">
        Orders earn coins, and so does helping us get better: rating a dish, telling us how an order went, dropping an idea in the Schmear Lab.
        Spend coins at checkout. The more you visit, the higher your tier.
      </p>
      {isAuthenticated ? <Balance /> : (
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="bb-tap"><Link to="/signup">Join and get a welcome offer</Link></Button>
          <Button asChild variant="outline" className="bb-tap"><Link to="/login">Log in</Link></Button>
        </div>
      )}
      <div className="mt-12"><WaysToEarn /></div>
      <section className="mt-12" aria-labelledby="spend">
        <h2 id="spend" className="font-display text-2xl">Spending coins</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>Add your bagels, bowls or a cake to the cart.</li>
          <li>At checkout, turn on "use coins". We show exactly how much comes off before you pay.</li>
          <li>Pay the rest by UPI, card or at the counter for pickup.</li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">Coins are a discount, not cash, and expire as set out in the <Link to="/loyalty-terms" className="underline">reward terms</Link>.</p>
      </section>
    </div>
  );
}
