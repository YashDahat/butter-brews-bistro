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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/productHooks';
import { withToast } from '@/lib/apiToast';
import { bbService, BAKE_STATUS_LABEL, todayISO } from '@/lib/bb';
import type { BakeDropDto, BakeStatus } from '@/lib/bb';
import { useAdminList } from './useAdminList';
import FormErrors, { errCls } from './FormErrors';

interface Form { id: number | null; name: string; productId: string; bakeDate: string; outAt: string; status: BakeStatus; note: string; sortOrder: string }
const empty = (): Form => ({ id: null, name: '', productId: 'none', bakeDate: todayISO(), outAt: '', status: 'IN_THE_OVEN', note: '', sortOrder: '0' });

export default function BakeBoardTab() {
  const { data, refresh } = useAdminList('bakes', bbService.admin.bakes);
  const { data: products } = useProducts({});
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<BakeDropDto | null>(null);

  const errors: string[] = [];
  if (form) {
    if (!form.name.trim()) errors.push('Name is required.');
    if (form.name.length > 80) errors.push('Name must be under 80 characters.');
    if (!form.bakeDate) errors.push('Bake date is required.');
    if (form.outAt && !/^([01]\d|2[0-3]):[0-5]\d$/.test(form.outAt)) errors.push('Out-of-oven time must look like 08:30.');
    if (form.note.length > 140) errors.push('Note must be under 140 characters.');
    if (form.sortOrder && !/^-?\d+$/.test(form.sortOrder)) errors.push('Order must be a whole number.');
  }
  const save = async () => {
    if (!form) return;
    setSaving(true);
    const req = { name: form.name.trim(), productId: form.productId === 'none' ? null : Number(form.productId), bakeDate: form.bakeDate,
      outAt: form.outAt || null, status: form.status, note: form.note.trim() || null, sortOrder: Number(form.sortOrder || 0) };
    try {
      await withToast(form.id ? bbService.admin.updateBake(form.id, req) : bbService.admin.createBake(req), 'Bake board updated');
      setForm(null); refresh();
    } finally { setSaving(false); }
  };
  const steps: WizardStep[] = form ? [{
    id: 'bake', title: 'Bake', error: errors.length > 0, complete: errors.length === 0,
    content: (<div className="space-y-4">
      <FormErrors errors={errors} />
      <div><Label htmlFor="bk-name">Name</Label><Input id="bk-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={errCls(!form.name.trim())} /></div>
      <div><Label>Links to menu item (optional)</Label>
        <Select value={form.productId} onValueChange={v => setForm({ ...form, productId: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="none">No link</SelectItem>{(products ?? []).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
        </Select></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label htmlFor="bk-date">Bake date</Label><Input id="bk-date" type="date" value={form.bakeDate} onChange={e => setForm({ ...form, bakeDate: e.target.value })} className={errCls(!form.bakeDate)} /></div>
        <div><Label htmlFor="bk-out">Out of the oven</Label><Input id="bk-out" type="time" value={form.outAt} onChange={e => setForm({ ...form, outAt: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Status</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as BakeStatus })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(BAKE_STATUS_LABEL) as BakeStatus[]).map(s => <SelectItem key={s} value={s}>{BAKE_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
          </Select></div>
        <div><Label htmlFor="bk-ord">Order on board</Label><Input id="bk-ord" inputMode="numeric" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: e.target.value })} /></div>
      </div>
      <div><Label htmlFor="bk-note">Note</Label><Input id="bk-note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={errCls(form.note.length > 140)} /></div>
    </div>),
  }] : [];

  const cols: ColDef<BakeDropDto>[] = [
    { field: 'bakeDate', headerName: 'Date', width: 120 }, { field: 'outAt', headerName: 'Out at', width: 100 },
    { field: 'name', headerName: 'Bake', flex: 1 }, { field: 'status', headerName: 'Status', width: 130, valueFormatter: p => BAKE_STATUS_LABEL[p.value as BakeStatus] ?? p.value },
    { field: 'note', headerName: 'Note', flex: 1 },
  ];
  const actions: RowAction<BakeDropDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: r => setForm({ id: r.id, name: r.name, productId: r.productId ? String(r.productId) : 'none', bakeDate: r.bakeDate, outAt: r.outAt ?? '', status: r.status, note: r.note ?? '', sortOrder: String(r.sortOrder ?? 0) }) },
    { label: 'Mark out now', onClick: r => { void withToast(bbService.admin.updateBake(r.id, { ...r, status: 'OUT_NOW' }), `${r.name} is out`).then(refresh); } },
    { label: 'Mark sold out', onClick: r => { void withToast(bbService.admin.updateBake(r.id, { ...r, status: 'SOLD_OUT' }), `${r.name} sold out`).then(refresh); } },
    { label: 'Delete', icon: Trash2, danger: true, onClick: r => setDel(r) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">What the public "Out of the oven" board shows today.</p>
        <div className="flex gap-2">
          <BulkUploadDialog title="Bulk upload bakes" columns={['name', 'productSlug', 'bakeDate', 'outAt', 'status', 'note', 'sortOrder']}
            sampleRow={['Morning bagels', 'cream-cheese-bagel', todayISO(), '08:30', 'OUT_NOW', 'First batch', '1']} templateName="bakes-template.csv"
            onUpload={async f => { const r = await bbService.admin.uploadBakes(f); refresh(); return r; }} />
          <Button onClick={() => setForm(empty())}>Add bake</Button>
        </div>
      </div>
      <AdminDataGrid<BakeDropDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No bakes posted yet." height="60vh" />
      <StepperSheet open={form != null} onOpenChange={o => !o && setForm(null)} title={form?.id ? `Edit — ${form.name}` : 'New bake'}
        steps={steps} canSave={errors.length === 0} saving={saving} onSave={save} />
      <ConfirmDialog open={del != null} onOpenChange={() => setDel(null)} title="Remove this bake?" description={<>“{del?.name}” leaves the board.</>}
        confirmLabel="Remove" destructive onConfirm={async () => { if (del) { await withToast(bbService.admin.deleteBake(del.id), 'Removed'); setDel(null); refresh(); } }} />
    </div>
  );
}
