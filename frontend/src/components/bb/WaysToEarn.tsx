import { Link } from 'react-router-dom';
import { useWaysToEarn } from '@/hooks/bbHooks';
import Hanko from './Hanko';

/** Live list of coin-earning actions, read from the loyalty engine's own rules (no hard-coded numbers). */
export default function WaysToEarn({ heading = true }: { heading?: boolean }) {
  const { data, isLoading, isError } = useWaysToEarn();
  return (
    <section aria-labelledby={heading ? 'ways-to-earn' : undefined}>
      {heading && <h2 id="ways-to-earn" className="font-display text-2xl sm:text-3xl">Ways to earn coins</h2>}
      {isLoading && <p className="mt-4 text-muted-foreground">Counting coins…</p>}
      {isError && <p className="mt-4 text-muted-foreground">Rewards are taking a breather. Try again in a moment.</p>}
      {data && data.length === 0 && <p className="mt-4 text-muted-foreground">Rewards are paused right now.</p>}
      {data && data.length > 0 && (
        <ul className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {data.map(r => (
            <li key={r.eventType} className="flex items-start gap-4">
              <Hanko label={`+${Math.round(r.coins)}`} sub="coins" />
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-sm text-muted-foreground">
                  {r.detail}
                  {r.perDayCap ? ` Up to ${r.perDayCap} a day.` : ''}
                  {r.onceOnly ? ' Once per account.' : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        Coins are for taking part, never for a good rating: an honest two-star review earns the same as five.
        Coins are a small discount on your next order; use them at checkout. <Link to="/loyalty-terms" className="underline underline-offset-4">Reward terms</Link>
      </p>
    </section>
  );
}
