import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useIdeas, useSubmitIdea, useVoteIdea, useWaysToEarn } from '@/hooks/bbHooks';
import { IDEA_STATUS_LABEL, TOPIC_LABEL, whatsappShare } from '@/lib/bb';
import type { IdeaTopic, IdeaDto } from '@/lib/bb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import StepHead from '@/components/bb/StepHead';
import Hanko from '@/components/bb/Hanko';

function IdeaRow({ i }: { i: IdeaDto }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const vote = useVoteIdea();
  return (
    <li className="grid grid-cols-[auto_1fr] gap-4 border-b border-border py-5">
      <button type="button"
        className={cn('bb-tap flex flex-col items-center justify-center rounded-sm border px-3 py-1',
          i.voted ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted')}
        disabled={i.mine || i.voted || vote.isPending}
        aria-label={i.mine ? `Your idea has ${i.votes} votes` : i.voted ? `You +1'd this. ${i.votes} votes` : `+1 ${i.title}. ${i.votes} votes`}
        onClick={() => { if (!isAuthenticated) { navigate('/login?redirect=/schmear-lab'); return; } vote.mutate(i.id); }}>
        <span className="text-xs font-semibold">+1</span>
        <span className="font-display text-xl leading-none">{i.votes}</span>
      </button>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-border px-2 py-0.5">{TOPIC_LABEL[i.topic]}</span>
          <span className={cn('rounded-full px-2 py-0.5 font-semibold',
            i.status === 'DONE' ? 'bg-[hsl(var(--butter))] text-[hsl(var(--espresso))]' : i.status === 'PLANNED' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
            {IDEA_STATUS_LABEL[i.status]}
          </span>
          {i.mine && <span className="text-muted-foreground">Your idea</span>}
        </div>
        <h3 className="mt-1.5 text-lg font-semibold">{i.title}</h3>
        {i.details && <p className="text-muted-foreground">{i.details}</p>}
        {i.teamReply && <p className="mt-2 border-l-2 border-[hsl(var(--butter))] pl-3 text-sm"><span className="font-semibold">From the team:</span> {i.teamReply}</p>}
        <p className="mt-1 text-xs text-muted-foreground">from {i.authorName ?? 'a guest'}</p>
        {i.mine && (
          <a className="bb-tap mt-1 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline" target="_blank" rel="noopener noreferrer"
             href={whatsappShare(`I suggested "${i.title}" at the Butter Brews Schmear Lab. +1 it here: ${window.location.origin}/schmear-lab`)}>
            <Share2 size={14} aria-hidden="true" /> Ask friends to +1
          </a>
        )}
      </div>
    </li>
  );
}

export default function SchmearLabPage() {
  const { isAuthenticated } = useAuth();
  const { data: ideas, isLoading, isError } = useIdeas();
  const { data: earn } = useWaysToEarn();
  const submit = useSubmitIdea();
  const [topic, setTopic] = useState<IdeaTopic | ''>('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [touched, setTouched] = useState(false);
  const [stamp, setStamp] = useState<number | null>(null);
  const coins = earn?.find(r => r.eventType === 'SUGGESTION')?.coins;

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!topic) e.push('Pick what your idea is about.');
    if (title.trim().length < 4 || title.trim().length > 80) e.push('Give it a short title (4 to 80 characters).');
    if (details.length > 600) e.push('Keep the details under 600 characters.');
    return e;
  }, [topic, title, details]);
  const canSave = errors.length === 0 && !submit.isPending;

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    if (!canSave || !topic) return;
    const r = await submit.mutateAsync({ topic, title: title.trim(), details: details.trim() || null });
    toast.success(r.message);
    setStamp(r.coinsEarned);
    setTopic(''); setTitle(''); setDetails(''); setTouched(false);
  };

  const acted = (ideas ?? []).filter(i => i.status === 'DONE' || i.status === 'PLANNED');
  const open = (ideas ?? []).filter(i => i.status === 'NEW');

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
      <StepHead n="02" step="Proof" marathi="फुगणे" title="The Schmear Lab"
        lead="Every good bagel started as somebody's idea. Suggest a filling, a brew, a bake or a fix. Regulars +1 the ones they'd order, and the team marks what makes it onto the board." />
      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <section aria-labelledby="suggest">
          <h2 id="suggest" className="font-display text-2xl">Suggest an idea</h2>
          <p className="mt-1 text-sm text-muted-foreground">{coins ? `Earns +${Math.round(coins)} coins for your first idea each day, whatever it says.` : 'Every idea is read by the team.'}</p>
          {stamp != null && (
            <div className="mt-4 flex items-center gap-3 rounded-sm border border-border bg-card p-3" aria-live="polite">
              <Hanko label={stamp > 0 ? `+${stamp}` : '✓'} sub={stamp > 0 ? 'coins' : 'thanks'} animate className="h-12 w-12" />
              <p className="text-sm">It's in the Lab. We read every one, and we'll reply right here.</p>
            </div>
          )}
          {!isAuthenticated ? (
            <div className="mt-5 rounded-sm border border-dashed border-border p-5">
              <p>Log in to suggest and +1 ideas. Reading them is open to everyone.</p>
              <Button asChild className="bb-tap mt-3"><Link to="/login?redirect=/schmear-lab">Log in</Link></Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
              {touched && errors.length > 0 && (
                <div role="alert" className="rounded-sm border border-destructive bg-destructive/10 p-3 text-sm">
                  <ul className="list-disc pl-5">{errors.map(m => <li key={m}>{m}</li>)}</ul>
                </div>
              )}
              <div>
                <Label htmlFor="i-topic">It's about</Label>
                <Select value={topic} onValueChange={v => setTopic(v as IdeaTopic)}>
                  <SelectTrigger id="i-topic" className={cn('mt-1 h-11', touched && !topic && 'border-destructive focus-visible:ring-destructive')}><SelectValue placeholder="Choose one" /></SelectTrigger>
                  <SelectContent>{(Object.keys(TOPIC_LABEL) as IdeaTopic[]).map(t => <SelectItem key={t} value={t}>{TOPIC_LABEL[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="i-title">Your idea in a line</Label>
                <Input id="i-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={90} placeholder="A misal-spiced cream cheese bagel"
                  className={cn('mt-1 h-11', touched && (title.trim().length < 4 || title.length > 80) && 'border-destructive focus-visible:ring-destructive')} />
              </div>
              <div>
                <Label htmlFor="i-details">Tell us more (optional)</Label>
                <Textarea id="i-details" value={details} onChange={e => setDetails(e.target.value)} rows={4} maxLength={620}
                  className={cn('mt-1', details.length > 600 && 'border-destructive focus-visible:ring-destructive')} />
              </div>
              <Button type="submit" className="bb-tap" disabled={touched && !canSave}>{submit.isPending ? 'Sending…' : 'Drop it in the Lab'}</Button>
            </form>
          )}
        </section>
        <section aria-labelledby="board">
          <h2 id="board" className="font-display text-2xl">Ideas we acted on</h2>
          {isLoading && <p className="mt-3 text-muted-foreground">Reading the board…</p>}
          {isError && <p className="mt-3">The board won't load right now. Try again shortly.</p>}
          {!isLoading && acted.length === 0 && <p className="mt-3 text-muted-foreground">Nothing marked yet. The first idea the team picks will show up here.</p>}
          <ul>{acted.map(i => <IdeaRow key={i.id} i={i} />)}</ul>
          <h2 className="font-display mt-10 text-2xl">In the Lab</h2>
          {!isLoading && open.length === 0 && <p className="mt-3 text-muted-foreground">No open ideas. Be the first.</p>}
          <ul>{open.map(i => <IdeaRow key={i.id} i={i} />)}</ul>
        </section>
      </div>
    </div>
  );
}
