import { Link } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/lib/bb';
import StepHead from '@/components/bb/StepHead';

export default function VisitPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <StepHead n="05" step="Serve" marathi="वाढणे" title="Find us in Model Colony"
        lead="A small bistro in the lanes of Model Colony, opposite the Hanuman Mandir at Rajas Garden. Parking on the lane can be tight, so come early on weekends." />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.3fr]">
        <ul className="space-y-5 text-lg">
          <li className="flex gap-3"><MapPin className="mt-1 shrink-0" aria-hidden="true" /><span>{BRAND.address}</span></li>
          <li className="flex gap-3"><Clock className="mt-1 shrink-0" aria-hidden="true" /><span>{BRAND.hours}</span></li>
          <li className="flex gap-3"><Phone className="mt-1 shrink-0" aria-hidden="true" /><a href={BRAND.phoneHref} className="underline underline-offset-4">{BRAND.phone}</a></li>
          <li className="flex gap-3"><MessageCircle className="mt-1 shrink-0" aria-hidden="true" /><a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Message us on WhatsApp</a></li>
          <li className="flex flex-wrap gap-3 pt-2">
            <Button asChild className="bb-tap"><a href={BRAND.maps} target="_blank" rel="noopener noreferrer"><Navigation size={16} aria-hidden="true" /> Directions</a></Button>
            <Button asChild variant="outline" className="bb-tap"><a href={BRAND.phoneHref}>Call now</a></Button>
            <Button asChild variant="outline" className="bb-tap"><Link to="/book">Book a table</Link></Button>
          </li>
          <li className="border-t border-border pt-5 text-base text-muted-foreground">
            Writing to us? Open a request on <Link to="/support" className="underline">Support</Link>: you'll get a reply by email and can follow the thread in your account. For something urgent, call.
          </li>
        </ul>
        <div className="overflow-hidden rounded-sm border border-border">
          <iframe title="Map: Butter Brews, Model Colony, Pune" src={BRAND.mapEmbed} loading="lazy" className="h-80 w-full sm:h-[28rem]" referrerPolicy="no-referrer-when-downgrade" />
        </div>
      </div>
    </div>
  );
}
