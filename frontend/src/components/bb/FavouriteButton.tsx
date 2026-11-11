import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useFavourites, useToggleFavourite } from '@/hooks/bbHooks';
import { cn } from '@/lib/utils';

export default function FavouriteButton({ productId, name, className }: { productId: number; name: string; className?: string }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: favs } = useFavourites();
  const toggle = useToggleFavourite();
  const on = !!favs?.includes(productId);
  return (
    <button
      type="button"
      className={cn('bb-tap inline-flex items-center justify-center rounded-full transition-colors hover:bg-muted', className)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      disabled={toggle.isPending}
      onClick={() => {
        if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent('/menu')}`); return; }
        toggle.mutate({ productId, on: !on });
      }}
    >
      <Heart size={20} aria-hidden="true" className={on ? 'fill-[hsl(var(--nonveg))] text-[hsl(var(--nonveg))]' : ''} />
    </button>
  );
}
