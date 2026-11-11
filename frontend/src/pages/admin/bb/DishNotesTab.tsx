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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts } from '@/hooks/productHooks';
import { withToast } from '@/lib/apiToast';
import { bbService, DIET_LABEL } from '@/lib/bb';
import type { Diet, DishNoteDto } from '@/lib/bb';
import { useAdminList } from './useAdminList';
import FormErrors, { errCls } from './FormErrors';

interface Form { productId: string; diet: Diet; signature: boolean; newUntil: string; pairing: string }

export default function DishNotesTab() {
  const { data, refresh } = useAdminList('dish-notes', bbService.admin.dishNotes);
  const { data: products } = useProducts({});
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<DishNoteDto | null>(null);
  const errors: string[] = [];
  if (form) {
    if (!form.productId) errors.push('Pick a menu item.');
    if (form.pairing.length > 160) errors.push('Pairing must be under 160 characters.');
  }
  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      await withToast(bbService.admin.upsertDishNote({ productId: Number(form.productId), diet: form.diet, signature: form.signature,
        newUntil: form.newUntil || null, pairing: form.pairing.trim() || null }), 'Menu note saved');
      setForm(null); refresh();
    } finally { setSaving(false); }
  };
  const steps: WizardStep[] = form ? [{
    id: 'note', title: 'Menu note', error: errors.length > 0, complete: errors.length === 0,
    content: (<div className="space-y-4">
      <FormErrors errors={errors} />
      <div><Label>Menu item</Label>
        <Select value={form.productId} onValueChange={v => setForm({ ...form, productId: v })}>
          <SelectTrigger className={errCls(!form.productId)}><SelectValue placeholder="Choose a dish" /></SelectTrigger>
          <SelectContent>{(products ?? []).map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
        </Select></div>
      <div><Label>Diet marker</Label>
        <Select value={form.diet} onValueChange={v => setForm({ ...form, diet: v as Diet })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{(Object.keys(DIET_LABEL) as Diet[]).map(d => <SelectItem key={d} value={d}>{DIET_LABEL[d]}</SelectItem>)}</SelectContent>
        </Select></div>
      <div className="flex items-center gap-3"><Switch id="dn-sig" checked={form.signature} onCheckedChange={v => setForm({ ...form, signature: v })} /><Label htmlFor="dn-sig">Signature dish (shown on the home page)</Label></div>
      <div><Label htmlFor="dn-new">Show “New” until (optional)</Label><Input id="dn-new" type="date" value={form.newUntil} onChange={e => setForm({ ...form, newUntil: e.target.value })} /></div>
      <div><Label htmlFor="dn-pair">Good with (optional)</Label><Input id="dn-pair" value={form.pairing} onChange={e => setForm({ ...form, pairing: e.target.value })} className={errCls(form.pairing.length > 160)} /></div>
    </div>),
  }] : [];
  const cols: ColDef<DishNoteDto>[] = [
    { field: 'productName', headerName: 'Dish', flex: 1 }, { field: 'diet', headerName: 'Diet', width: 130, valueFormatter: p => DIET_LABEL[p.value as Diet] ?? p.value },
    { field: 'signature', headerName: 'Signature', width: 110 }, { field: 'newUntil', headerName: 'New until', width: 130 }, { field: 'pairing', headerName: 'Good with', flex: 1 },
  ];
  const actions: RowAction<DishNoteDto>[] = [
    { label: 'Edit', icon: Pencil, onClick: r => setForm({ productId: String(r.productId), diet: r.diet, signature: r.signature, newUntil: r.newUntil ?? '', pairing: r.pairing ?? '' }) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: r => setDel(r) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Veg / egg / non-veg marks, signatures and “New” badges for dishes. Edit names and prices under Products.</p>
        <div className="flex gap-2">
          <BulkUploadDialog title="Bulk upload menu notes" columns={['productSlug', 'diet', 'signature', 'newUntil', 'pairing']}
            sampleRow={['chicken-gurkha-bagel', 'NON_VEG', 'true', '', 'Vietnamese Iced Coffee']} templateName="menu-notes-template.csv"
            onUpload={async f => { const r = await bbService.admin.uploadDishNotes(f); refresh(); return r; }} />
          <Button onClick={() => setForm({ productId: '', diet: 'VEG', signature: false, newUntil: '', pairing: '' })}>Add note</Button>
        </div>
      </div>
      <AdminDataGrid<DishNoteDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No menu notes yet." height="60vh" />
      <StepperSheet open={form != null} onOpenChange={o => !o && setForm(null)} title="Menu note" steps={steps} canSave={errors.length === 0} saving={saving} onSave={save} />
      <ConfirmDialog open={del != null} onOpenChange={() => setDel(null)} title="Delete this menu note?" confirmLabel="Delete" destructive
        onConfirm={async () => { if (del) { await withToast(bbService.admin.deleteDishNote(del.id), 'Deleted'); setDel(null); refresh(); } }} />
    </div>
  );
}
