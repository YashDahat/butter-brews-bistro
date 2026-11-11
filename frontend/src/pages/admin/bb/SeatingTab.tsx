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
import type { SeatingAreaDto } from '@/lib/bb';
import { useAdminList } from './useAdminList';
import FormErrors, { errCls } from './FormErrors';

interface Form { id: number | null; name: string; slug: string; description: string; seatsPerSlot: string; maxParty: string;
  firstSlot: string; lastSlot: string; slotMinutes: string; outdoor: boolean; petFriendly: boolean; active: boolean; sortOrder: string }
const empty = (): Form => ({ id: null, name: '', slug: '', description: '', seatsPerSlot: '20', maxParty: '6', firstSlot: '09:00', lastSlot: '21:00',
  slotMinutes: '60', outdoor: false, petFriendly: false, active: true, sortOrder: '0' });
const int = (s: string) => (/^\d+$/.test(s) ? Number(s) : NaN);

export default function SeatingTab() {
  const { data, refresh } = useAdminList('seating', bbService.admin.seating);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<SeatingAreaDto | null>(null);
  const errors: string[] = [];
  if (form) {
    const seats = int(form.seatsPerSlot), party = int(form.maxParty), mins = int(form.slotMinutes);
    if (!form.name.trim()) errors.push('Name is required.');
    if (!(seats >= 1 && seats <= 200)) errors.push('Seats per slot must be 1 to 200.');
    if (!(party >= 1 && party <= seats)) errors.push('Max party must be between 1 and seats per slot.');
    if (!(mins >= 15 && mins <= 240)) errors.push('Slot length must be 15 to 240 minutes.');
    if (!form.firstSlot || !form.lastSlot || form.lastSlot < form.firstSlot) errors.push('Last slot must be after the first slot.');
  }
  const save = async () => {
    if (!form) return;
    setSaving(true);
    const req = { name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() || null, seatsPerSlot: int(form.seatsPerSlot),
      maxParty: int(form.maxParty), firstSlot: form.firstSlot, lastSlot: form.lastSlot, slotMinutes: int(form.slotMinutes), outdoor: form.outdoor,
      petFriendly: form.petFriendly, active: form.active, sortOrder: Number(form.sortOrder || 0) };
    try {
      await withToast(form.id ? bbService.admin.updateArea(form.id, req) : bbService.admin.createArea(req), 'Seating saved');
      setForm(null); refresh();
    } finally { setSaving(false); }
  };
  const f = form;
  const steps: WizardStep[] = f ? [
    { id: 'area', title: 'Area', error: !f.name.trim(), complete: !!f.name.trim(), content: (<div className="space-y-4">
      <FormErrors errors={errors} />
      <div><Label htmlFor="sa-name">Name</Label><Input id="sa-name" value={f.name} onChange={e => setForm({ ...f, name: e.target.value })} className={errCls(!f.name.trim())} /></div>
      <div><Label htmlFor="sa-slug">Slug (optional)</Label><Input id="sa-slug" value={f.slug} onChange={e => setForm({ ...f, slug: e.target.value })} /></div>
      <div><Label htmlFor="sa-desc">Description</Label><Textarea id="sa-desc" value={f.description} onChange={e => setForm({ ...f, description: e.target.value })} /></div>
      <div className="flex items-center gap-3"><Switch id="sa-out" checked={f.outdoor} onCheckedChange={v => setForm({ ...f, outdoor: v })} /><Label htmlFor="sa-out">Outdoor</Label></div>
      <div className="flex items-center gap-3"><Switch id="sa-pet" checked={f.petFriendly} onCheckedChange={v => setForm({ ...f, petFriendly: v })} /><Label htmlFor="sa-pet">Pet-friendly</Label></div>
      <div className="flex items-center gap-3"><Switch id="sa-act" checked={f.active} onCheckedChange={v => setForm({ ...f, active: v })} /><Label htmlFor="sa-act">Taking bookings</Label></div>
    </div>) },
    { id: 'slots', title: 'Slots & capacity', error: errors.length > 0, complete: errors.length === 0, content: (<div className="space-y-4">
      <FormErrors errors={errors} />
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="sa-seats">Seats per slot</Label><Input id="sa-seats" inputMode="numeric" value={f.seatsPerSlot} onChange={e => setForm({ ...f, seatsPerSlot: e.target.value })} className={errCls(!(int(f.seatsPerSlot) >= 1))} /></div>
        <div><Label htmlFor="sa-party">Max party</Label><Input id="sa-party" inputMode="numeric" value={f.maxParty} onChange={e => setForm({ ...f, maxParty: e.target.value })} className={errCls(!(int(f.maxParty) >= 1 && int(f.maxParty) <= int(f.seatsPerSlot)))} /></div>
        <div><Label htmlFor="sa-first">First slot</Label><Input id="sa-first" type="time" value={f.firstSlot} onChange={e => setForm({ ...f, firstSlot: e.target.value })} /></div>
        <div><Label htmlFor="sa-last">Last slot</Label><Input id="sa-last" type="time" value={f.lastSlot} onChange={e => setForm({ ...f, lastSlot: e.target.value })} className={errCls(f.lastSlot < f.firstSlot)} /></div>
        <div><Label htmlFor="sa-mins">Slot length (minutes)</Label><Input id="sa-mins" inputMode="numeric" value={f.slotMinutes} onChange={e => setForm({ ...f, slotMinutes: e.target.value })} className={errCls(!(int(f.slotMinutes) >= 15 && int(f.slotMinutes) <= 240))} /></div>
        <div><Label htmlFor="sa-sort">Display order</Label><Input id="sa-sort" inputMode="numeric" value={f.sortOrder} onChange={e => setForm({ ...f, sortOrder: e.target.value })} /></div>
      </div>
    </div>) },
  ] : [];
  const cols: ColDef<SeatingAreaDto>[] = [
    { field: 'name', headerName: 'Area', flex: 1 }, { field: 'seatsPerSlot', headerName: 'Seats/slot', width: 110 }, { field: 'maxParty', headerName: 'Max party', width: 110 },
    { field: 'firstSlot', headerName: 'First', width: 90 }, { field: 'lastSlot', headerName: 'Last', width: 90 }, { field: 'petFriendly', headerName: 'Pets', width: 90 }, { field: 'active', headerName: 'Active', width: 90 },
  ];
  const actions: RowAction<SeatingAreaDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: r => setForm({ id: r.id, name: r.name, slug: r.slug, description: r.description ?? '', seatsPerSlot: String(r.seatsPerSlot),
      maxParty: String(r.maxParty), firstSlot: r.firstSlot, lastSlot: r.lastSlot, slotMinutes: String(r.slotMinutes), outdoor: r.outdoor, petFriendly: r.petFriendly,
      active: r.active, sortOrder: String(r.sortOrder ?? 0) }) },
    { label: 'Stop bookings', icon: Trash2, danger: true, hidden: r => !r.active, onClick: r => setDel(r) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Bookable areas and their slot grid. Bookings themselves run on the order board (Table bookings workflow).</p>
        <div className="flex gap-2">
          <BulkUploadDialog title="Bulk upload seating" columns={['name', 'slug', 'description', 'seatsPerSlot', 'maxParty', 'firstSlot', 'lastSlot', 'slotMinutes', 'outdoor', 'petFriendly', 'sortOrder']}
            sampleRow={['Window bar', 'window-bar', 'Counter seats by the window', '6', '2', '09:00', '21:00', '60', 'false', 'false', '3']} templateName="seating-template.csv"
            onUpload={async file => { const r = await bbService.admin.uploadSeating(file); refresh(); return r; }} />
          <Button onClick={() => setForm(empty())}>Add area</Button>
        </div>
      </div>
      <AdminDataGrid<SeatingAreaDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No seating areas." height="60vh" />
      <StepperSheet open={form != null} onOpenChange={o => !o && setForm(null)} title={form?.id ? `Edit — ${form.name}` : 'New seating area'} steps={steps} canSave={errors.length === 0} saving={saving} onSave={save} />
      <ConfirmDialog open={del != null} onOpenChange={() => setDel(null)} title="Stop taking bookings here?" description="Existing bookings stay as they are." confirmLabel="Stop bookings" destructive
        onConfirm={async () => { if (del) { await withToast(bbService.admin.deleteArea(del.id), 'Area closed for bookings'); setDel(null); refresh(); } }} />
    </div>
  );
}
