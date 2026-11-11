import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { type RowAction } from '@/components/admin/RowActionsCell';
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog';
import { StepperSheet, type WizardStep } from '@/components/admin/StepperSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { withToast } from '@/lib/apiToast';
import { bbService } from '@/lib/bb';
import type { StoryChapterDto } from '@/lib/bb';
import { useAdminList } from './useAdminList';
import FormErrors, { errCls } from './FormErrors';

interface Form { id: number | null; ordinal: string; step: string; marker: string; title: string; body: string; active: boolean }

export default function StoryTab() {
  const { data, refresh } = useAdminList('story', bbService.admin.story);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<StoryChapterDto | null>(null);
  const errors: string[] = [];
  if (form) {
    const n = Number(form.ordinal);
    if (!Number.isInteger(n) || n < 1 || n > 99) errors.push('Order must be 1 to 99.');
    if (!form.step.trim() || form.step.length > 24) errors.push('Step name is required (max 24).');
    if (form.marker.length > 24) errors.push('Marker must be under 24 characters.');
    if (!form.title.trim() || form.title.length > 120) errors.push('Title is required (max 120).');
    if (!form.body.trim() || form.body.length > 1200) errors.push('Story text is required (max 1200).');
  }
  const save = async () => {
    if (!form) return;
    setSaving(true);
    const req = { ordinal: Number(form.ordinal), step: form.step.trim(), marker: form.marker.trim() || null, title: form.title.trim(), body: form.body.trim(), active: form.active };
    try {
      await withToast(form.id ? bbService.admin.updateChapter(form.id, req) : bbService.admin.createChapter(req), 'Story saved');
      setForm(null); refresh();
    } finally { setSaving(false); }
  };
  const f = form;
  const steps: WizardStep[] = f ? [{ id: 'ch', title: 'Chapter', error: errors.length > 0, complete: errors.length === 0, content: (<div className="space-y-4">
    <FormErrors errors={errors} />
    <div className="grid grid-cols-3 gap-3">
      <div><Label htmlFor="st-ord">Order</Label><Input id="st-ord" inputMode="numeric" value={f.ordinal} onChange={e => setForm({ ...f, ordinal: e.target.value })} /></div>
      <div><Label htmlFor="st-step">Step</Label><Input id="st-step" value={f.step} onChange={e => setForm({ ...f, step: e.target.value })} className={errCls(!f.step.trim())} /></div>
      <div><Label htmlFor="st-mark">Marker</Label><Input id="st-mark" value={f.marker} onChange={e => setForm({ ...f, marker: e.target.value })} placeholder="2018" /></div>
    </div>
    <div><Label htmlFor="st-title">Title</Label><Input id="st-title" value={f.title} onChange={e => setForm({ ...f, title: e.target.value })} className={errCls(!f.title.trim())} /></div>
    <div><Label htmlFor="st-body">Story</Label><Textarea id="st-body" rows={7} value={f.body} onChange={e => setForm({ ...f, body: e.target.value })} className={errCls(!f.body.trim() || f.body.length > 1200)} /></div>
    <div className="flex items-center gap-3"><Switch id="st-act" checked={f.active} onCheckedChange={v => setForm({ ...f, active: v })} /><Label htmlFor="st-act">Published</Label></div>
  </div>) }] : [];
  const cols: ColDef<StoryChapterDto>[] = [
    { field: 'ordinal', headerName: '#', width: 70 }, { field: 'step', headerName: 'Step', width: 110 }, { field: 'marker', headerName: 'Marker', width: 130 },
    { field: 'title', headerName: 'Title', flex: 1 }, { field: 'active', headerName: 'Published', width: 110 },
  ];
  const actions: RowAction<StoryChapterDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: r => setForm({ id: r.id, ordinal: String(r.ordinal), step: r.step, marker: r.marker ?? '', title: r.title, body: r.body, active: r.active }) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: r => setDel(r) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">The Our Story timeline. Keep it true: only facts you'd be happy for regulars to read.</p>
        <div className="flex gap-2">
          <BulkUploadDialog title="Bulk upload story chapters" columns={['ordinal', 'step', 'marker', 'title', 'body']}
            sampleRow={['6', 'Serve', '2027', 'A new chapter', 'What happened next…']} templateName="story-template.csv"
            onUpload={async file => { const r = await bbService.admin.uploadStory(file); refresh(); return r; }} />
          <Button onClick={() => setForm({ id: null, ordinal: String((data?.length ?? 0) + 1), step: '', marker: '', title: '', body: '', active: true })}>Add chapter</Button>
        </div>
      </div>
      <AdminDataGrid<StoryChapterDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No chapters yet." height="60vh" />
      <StepperSheet open={form != null} onOpenChange={o => !o && setForm(null)} title={form?.id ? 'Edit chapter' : 'New chapter'} steps={steps} canSave={errors.length === 0} saving={saving} onSave={save} />
      <ConfirmDialog open={del != null} onOpenChange={() => setDel(null)} title="Delete this chapter?" confirmLabel="Delete" destructive
        onConfirm={async () => { if (del) { await withToast(bbService.admin.deleteChapter(del.id), 'Deleted'); setDel(null); refresh(); } }} />
    </div>
  );
}
