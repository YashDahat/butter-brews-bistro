import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Settles content into view once, book-like. Content is rendered visible; the hidden state is only armed after
 * mount when IntersectionObserver exists and the visitor hasn't asked for reduced motion, so nothing waits on JS.
 */
export default function Reveal({ children, className, as: Tag = 'div', delay = 0 }:
  { children: ReactNode; className?: string; as?: 'div' | 'section' | 'li' | 'article'; delay?: number }) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9) return; // already on screen: leave it be
    el.classList.add('bb-reveal-armed');
    if (delay) el.style.transitionDelay = `${delay}ms`;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return <Tag ref={ref as never} className={cn(className)}>{children}</Tag>;
}
