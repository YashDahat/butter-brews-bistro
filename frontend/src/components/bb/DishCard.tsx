import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Share2, Star } from 'lucide-react';
import { useCart } from '@/cart';
import type { ProductDto } from '@/types/product';
import type { DishNoteDto } from '@/lib/bb';
import { formatINR, whatsappShare } from '@/lib/bb';
import { Button } from '@/components/ui/button';
import DietMark from './DietMark';
import FavouriteButton from './FavouriteButton';

/** One dish on the menu: a ruled line on the board, not a boxed card. */
export default function DishCard({ p, note, reviewCoins }: { p: ProductDto; note?: DishNoteDto; reviewCoins?: number }) {
  const { addItem } = useCart();
  const needsChoice = (p.variants?.length ?? 0) > 0;
  const add = () => {
    addItem({ id: `PRODUCT:${p.id}`, name: p.name, unitPrice: Number(p.price), imageUrl: p.imageUrl ?? null,
      metadata: { itemType: 'PRODUCT', itemId: p.id } });
    toast.success(`${p.name} is in your cart`);
  };
  return (
    <article className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-b border-border py-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {note && <DietMark diet={note.diet} />}
          {note?.signature && <span className="bb-kicker text-[hsl(36_80%_25%)] dark:text-[hsl(var(--butter))]">Signature</span>}
          {note?.isNew && <span className="rounded-full bg-[hsl(var(--butter))] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--espresso))]">New</span>}
        </div>
        <h3 className="mt-1.5 text-lg font-semibold leading-snug">
          <Link to={`/products/${p.slug}`} className="underline-offset-4 hover:underline">{p.name}</Link>
        </h3>
        {p.description && <p className="mt-1 text-[0.95rem] text-muted-foreground">{p.description}</p>}
        {note?.pairing && <p className="mt-1 text-sm italic text-muted-foreground">Good with: {note.pairing}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link to={`/products/${p.slug}`} className="bb-tap inline-flex items-center gap-1 underline-offset-4 hover:underline">
            <Star size={15} aria-hidden="true" /> Rate it{reviewCoins ? ` · +${reviewCoins} coins` : ''}
          </Link>
          <a href={whatsappShare(`${p.name} at Butter Brews, Model Colony, Pune ${window.location.origin}/products/${p.slug}`)}
             target="_blank" rel="noopener noreferrer" className="bb-tap inline-flex items-center gap-1 underline-offset-4 hover:underline">
            <Share2 size={15} aria-hidden="true" /> Share on WhatsApp
          </a>
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className="font-display text-xl">{formatINR(Number(p.price))}{needsChoice ? '+' : ''}</span>
        <div className="flex items-center gap-1">
          <FavouriteButton productId={p.id} name={p.name} />
          {needsChoice
            ? <Button asChild size="sm" variant="outline" className="bb-tap"><Link to={`/products/${p.slug}`}>Choose</Link></Button>
            : <Button size="sm" className="bb-tap" onClick={add} aria-label={`Add ${p.name} to cart`}>Add</Button>}
        </div>
      </div>
    </article>
  );
}
