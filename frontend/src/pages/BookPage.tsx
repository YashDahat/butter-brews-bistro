import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useAvailability, useBookTable, useMyReservations } from '@/hooks/bbHooks';
import { slotLabel, todayISO } from '@/lib/bb';
import type { ReservationView } from '@/lib/bb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import StepHead from '@/components/bb/StepHead';
import OrderProgress from '@/components/bb/OrderProgress';
import Hanko from '@/components/bb/Hanko';

const addDays = (iso: string, n: number) => {
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export default function BookPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [guests, setGuests] = useState('2');
  const [occasion, setOccasion] = useState('');
  const [withPet, setWithPet] = useState(false);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState<ReservationView | null>(null);
  const { data: areas, isLoading, isError } = useAvailability(date);
  const book = useBookTable();
  const area = areas?.find(a => a.areaId === areaId) ?? null;

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!date || date < today || date > addDays(today, 21)) e.date = 'Pick a date within the next 3 weeks.';
    if (!areaId) e.area = 'Choose where you would like to sit.';
    if (!time) e.time = 'Choose a time.';
    const g = Number(guests);
    if (!Number.isInteger(g) || g < 1) e.guests = 'Tell us how many are coming.';
    else if (area && g > area.maxParty) e.guests = `${area.name} seats up to ${area.maxParty} per booking. For bigger groups, message us.`;
    if (withPet && area && !area.petFriendly) e.pet = `${area.name} can't host pets. Tables marked pet-friendly can.`;
    if (occasion.length > 60) e.occasion = 'Keep the occasion under 60 characters.';
    if (note.length > 280) e.note = 'Keep the note under 280 characters.';
    return e;
  }, [date, today, areaId, time, guests, area, withPet, occasion, note]);
  const canSave = Object.keys(errors).length === 0 && !book.isPending;
  const bad = (k: string) => touched && errors[k] ? 'border-destructive focus-visible:ring-destructive' : '';

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    if (!isAuthenticated) { navigate(`/login?redirect=${encodeURIComponent('/book')}`); return; }
    if (!canSave || !areaId || !time) return;
    const r = await book.mutateAsync({ areaId, date, time, guests: Number(guests), occasion: occasion || null, withPet, note: note || null });
    setDone(r);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <StepHead n="05" step="Serve" marathi="वाढणे" title="Book a table"
        lead="Booking is free and takes a minute. Running late or changing plans? WhatsApp us or cancel from your account." />
      {done ? (
        <section className="mt-10 flex flex-wrap items-start gap-5 rounded-sm border border-border bg-card p-6" aria-live="polite">
          <Hanko label="✓" sub="held" animate />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl">Your table is held</h2>
            <p className="mt-1">{done.areaName} · {slotLabel(done.slotKey)} · {done.guests} {done.guests === 1 ? 'guest' : 'guests'}</p>
            <div className="mt-3"><OrderProgress workflowCode="bb-table" stageCode={done.stageCode} /></div>
            <p className="mt-3 text-sm text-muted-foreground">We've emailed you the details. Change of plans? Cancel from <Link to="/my-brews#bookings" className="underline">My account</Link>.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild className="bb-tap"><Link to="/menu">Look at the menu</Link></Button>
              <Button asChild variant="outline" className="bb-tap"><Link to="/my-brews">My account</Link></Button>
              <Button variant="ghost" className="bb-tap" onClick={() => { setDone(null); setTime(null); setTouched(false); }}>Book another</Button>
            </div>
          </div>
        </section>
      ) : (
        <form onSubmit={submit} noValidate className="mt-10 space-y-8">
          {touched && Object.keys(errors).length > 0 && (
            <div role="alert" className="rounded-sm border border-destructive bg-destructive/10 p-4 text-sm">
              <p className="font-semibold">A couple of things before we hold your table:</p>
              <ul className="mt-1 list-disc pl-5">{Object.values(errors).map(m => <li key={m}>{m}</li>)}</ul>
            </div>
          )}
          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <Label htmlFor="b-date">Date</Label>
              <Input id="b-date" type="date" min={today} max={addDays(today, 21)} value={date}
                onChange={e => { setDate(e.target.value); setTime(null); }} className={cn('mt-1 h-11', bad('date'))} />
            </div>
            <div>
              <Label htmlFor="b-guests">Guests</Label>
              <Input id="b-guests" type="number" inputMode="numeric" min={1} max={area?.maxParty ?? 8} value={guests}
                onChange={e => setGuests(e.target.value)} className={cn('mt-1 h-11', bad('guests'))} />
            </div>
            <div>
              <Label htmlFor="b-occasion">Occasion (optional)</Label>
              <Input id="b-occasion" value={occasion} onChange={e => setOccasion(e.target.value)} placeholder="Birthday, catch-up…" className={cn('mt-1 h-11', bad('occasion'))} />
            </div>
          </div>

          <fieldset>
            <legend className="font-semibold">Where would you like to sit?</legend>
            {isLoading && <p className="mt-2 text-muted-foreground">Checking tables…</p>}
            {isError && <p className="mt-2">We couldn't load tables. Call +91 96074 04669 and we'll book you in.</p>}
            <div className={cn('mt-3 grid gap-3 sm:grid-cols-2', touched && errors.area && 'rounded-sm ring-2 ring-destructive')}>
              {areas?.map(a => (
                <label key={a.areaId} className={cn('flex cursor-pointer items-start gap-3 rounded-sm border p-4',
                  areaId === a.areaId ? 'border-primary bg-primary/5' : 'border-border')}>
                  <input type="radio" name="area" className="mt-1 h-5 w-5 accent-[hsl(var(--primary))]" checked={areaId === a.areaId}
                    onChange={() => { setAreaId(a.areaId); setTime(null); }} />
                  <span>
                    <span className="block font-semibold">{a.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {a.outdoor ? 'Open air' : 'Indoors'} · up to {a.maxParty} per table{a.petFriendly ? ' · pet-friendly' : ''}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {area && (
            <fieldset>
              <legend className="font-semibold">Time</legend>
              <div className={cn('mt-3 flex flex-wrap gap-2', touched && errors.time && 'rounded-sm p-1 ring-2 ring-destructive')}>
                {area.slots.map(s => (
                  <button key={s.key} type="button" disabled={!s.bookable}
                    onClick={() => setTime(s.time)}
                    aria-pressed={time === s.time}
                    className={cn('bb-tap rounded-full border px-4 text-sm tabular-nums transition-colors',
                      time === s.time ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
                      !s.bookable && 'cursor-not-allowed opacity-40 line-through')}
                    aria-label={`${s.time}${s.bookable ? `, ${s.seatsLeft} seats left` : ', unavailable'}`}>
                    {s.time}
                  </button>
                ))}
              </div>
              {area.slots.every(s => !s.bookable) && <p className="mt-2 text-sm text-muted-foreground">No tables left for this day. Try another date, or message us and we'll see what we can do.</p>}
            </fieldset>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Checkbox id="b-pet" checked={withPet} onCheckedChange={v => setWithPet(v === true)} className={cn('mt-1', bad('pet'))} />
              <Label htmlFor="b-pet" className="leading-snug">Bringing a pet (pet-friendly tables only)</Label>
            </div>
            <div>
              <Label htmlFor="b-note">Anything we should know? (optional)</Label>
              <Textarea id="b-note" value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={3} className={cn('mt-1', bad('note'))} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" className="bb-tap" disabled={touched && !canSave}>
              {book.isPending ? 'Holding your table…' : isAuthenticated ? 'Hold my table' : 'Log in to book'}
            </Button>
            <p className="text-sm text-muted-foreground">Need help? <Link to="/support" className="underline">Message us</Link></p>
          </div>
        </form>
      )}
      <MyUpcoming />
    </div>
  );
}

function MyUpcoming() {
  const { isAuthenticated } = useAuth();
  const { data } = useMyReservations();
  if (!isAuthenticated || !data?.length) return null;
  const upcoming = data.filter(r => r.stageCode === 'CONFIRMED' || r.stageCode === 'REQUESTED');
  if (!upcoming.length) return null;
  return (
    <section className="mt-14" aria-labelledby="my-upcoming">
      <h2 id="my-upcoming" className="font-display text-2xl">Your upcoming tables</h2>
      <ul className="mt-4 divide-y divide-border border-y border-border">
        {upcoming.map(r => (
          <li key={r.orderId} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span>{r.areaName} · {slotLabel(r.slotKey)} · {r.guests} guests</span>
            <Link to={`/orders/${r.orderId}`} className="text-sm underline">Details or cancel</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
