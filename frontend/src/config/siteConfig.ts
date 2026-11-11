// Butter Brews Bistro, Model Colony, Pune: branding, navigation and footer for the foundation shell.
import type { SiteConfig } from '@/shell';

// Fixed espresso bar: header and footer stay dark in both themes. `dark` scopes the dark tokens to the bar
// so the shell's own text-foreground headings stay readable on it.
const BAR = 'dark bg-[#1C1311]';
const CREMA = 'text-[#F3EAD7]';
const HOVER = 'hover:text-[#E7B649]';

export const siteConfig: SiteConfig = {
  header: {
    brandName: 'Butter Brews',
    logoUrl: null,
    navLinks: [
      { label: 'Menu', href: '/menu' },
      { label: 'Book a table', href: '/book' },
      { label: 'Cakes', href: '/cakes' },
      { label: 'Schmear Lab', href: '/schmear-lab' },
      { label: 'Our story', href: '/story' },
      { label: 'Rewards', href: '/rewards' },
      { label: 'Support', href: '/support' },
    ],
    ctaButton: { label: 'Order now', href: '/menu' },
    showAuth: true,
    showCart: true,
    bgClass: BAR,
    textClass: CREMA,
    hoverClass: HOVER,
    ctaClass: 'bg-[#E7B649] text-[#1C1311] hover:bg-[#F0C766]',
  },
  footer: {
    brandName: 'Butter Brews · बटर ब्रूज़',
    tagline: 'Bagels from our own bakehouse, all-day breakfasts and 100% Arabica coffee. Model Colony, Pune, since 2018.',
    address: 'Shop 11 & 12, Rajas Garden, opp. Hanuman Mandir, Model Colony, Shivajinagar, Pune 411016',
    phone: '+91 96074 04669',
    email: null,
    openingHours: 'Open daily, 9 am to 10:30 pm',
    quickLinks: [
      { label: 'Menu & order', href: '/menu' },
      { label: 'Book a table', href: '/book' },
      { label: 'Whole cakes', href: '/cakes' },
      { label: 'Visit & directions', href: '/visit' },
      { label: 'Rewards', href: '/rewards' },
      { label: 'My account', href: '/my-brews' },
      { label: 'Support', href: '/support' },
      { label: 'WhatsApp us', href: 'https://wa.me/919607404669', external: true },
      { label: 'Reward terms', href: '/loyalty-terms' },
    ],
    socialLinks: [{ platform: 'whatsapp', url: 'https://wa.me/919607404669' }],
    bgClass: BAR,
    textClass: CREMA,
    accentClass: HOVER,
  },
};

export default siteConfig;
