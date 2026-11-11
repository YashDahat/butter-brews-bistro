import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ColDef } from 'ag-grid-community';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { type RowAction } from '@/components/admin/RowActionsCell';
import { BulkUploadDialog } from '@/components/admin/BulkUploadDialog';
import { StepperSheet, type WizardStep } from '@/components/admin/StepperSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withToast } from '@/lib/apiToast';
import { bbService, IDEA_STATUS_LABEL, TOPIC_LABEL } from '@/lib/bb';
import type { IdeaDto, IdeaStatus, IdeaTopic } from '@/lib/bb';
import { useAdminList } from './useAdminList';
import FormErrors, { errCls } from './FormErrors';

export default function IdeasTab() {
  const { data, refresh } = useAdminList('ideas', bbService.admin.ideas);
  const [edit, setEdit] = useState<{ idea: IdeaDto; status: IdeaStatus; reply: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<IdeaDto | null>(null);
  const errors = edit && edit.reply.length > 280 ? ['Reply must be under 280 characters.'] : [];
  const save = async () => {
    if (!edit) return;
    setSaving(true);
    try {
      await withToast(bbService.admin.updateIdea(edit.idea.id, { status: edit.status, teamReply: edit.reply.trim() || null }), 'Idea updated');
      setEdit(null); refresh();
    } finally { setSaving(false); }
  };
  const steps: WizardStep[] = edit ? [{ id: 'idea', title: 'Status & reply', error: errors.length > 0, complete: errors.length === 0, content: (<div className="space-y-4">
    <FormErrors errors={errors} />
    <div className="rounded-md border border-border p-3"><p className="font-semibold">{edit.idea.title}</p>{edit.idea.details && <p className="text-sm text-muted-foreground">{edit.idea.details}</p>}
      <p className="mt-1 text-xs text-muted-foreground">{TOPIC_LABEL[edit.idea.topic]} · {edit.idea.votes} +1s · from {edit.idea.authorName}</p></div>
    <div><Label>Status</Label>
      <Select value={edit.status} onValueChange={v => setEdit({ ...edit, status: v as IdeaStatus })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{(Object.keys(IDEA_STATUS_LABEL) as IdeaStatus[]).map(s => <SelectItem key={s} value={s}>{IDEA_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
      </Select></div>
    <div><Label htmlFor="id-reply">Public reply from the team (optional)</Label>
      <Textarea id="id-reply" rows={4} value={edit.reply} onChange={e => setEdit({ ...edit, reply: e.target.value })} className={errCls(edit.reply.length > 280)} /></div>
  </div>) }] : [];
  const cols: ColDef<IdeaDto>[] = [
    { field: 'createdAt', headerName: 'Date', width: 120, valueFormatter: p => p.value ? new Date(p.value).toLocaleDateString('en-IN') : '' },
    { field: 'topic', headerName: 'Topic', width: 120, valueFormatter: p => TOPIC_LABEL[p.value as IdeaTopic] ?? p.value },
    { field: 'title', headerName: 'Idea', flex: 1 }, { field: 'votes', headerName: '+1s', width: 80 },
    { field: 'status', headerName: 'Status', width: 130, valueFormatter: p => IDEA_STATUS_LABEL[p.value as IdeaStatus] ?? p.value },
    { field: 'authorName', headerName: 'From', width: 130 },
  ];
  const actions: RowAction<IdeaDto>[] = [
    { label: 'Update status', icon: Pencil, onClick: r => setEdit({ idea: r, status: r.status, reply: r.teamReply ?? '' }) },
    { label: 'Delete', icon: Trash2, danger: true, onClick: r => setDel(r) },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Guest ideas from the Schmear Lab. Planned and Done ideas show publicly as “ideas we acted on”. Not now hides an idea.</p>
        <BulkUploadDialog title="Bulk upload ideas (comment cards)" columns={['topic', 'title', 'details', 'status', 'teamReply']}
          sampleRow={['BAGEL', 'Jalapeño cheddar bagel', 'Heard at the counter', 'NEW', '']} templateName="ideas-template.csv"
          onUpload={async file => { const r = await bbService.admin.uploadIdeas(file); refresh(); return r; }} />
      </div>
      <AdminDataGrid<IdeaDto> rowData={data ?? []} columnDefs={cols} actions={actions} emptyMessage="No ideas yet." height="60vh" />
      <StepperSheet open={edit != null} onOpenChange={o => !o && setEdit(null)} title="Schmear Lab idea" steps={steps} canSave={errors.length === 0} saving={saving} onSave={save} />
      <ConfirmDialog open={del != null} onOpenChange={() => setDel(null)} title="Delete this idea?" confirmLabel="Delete" destructive
        onConfirm={async () => { if (del) { await withToast(bbService.admin.deleteIdea(del.id), 'Deleted'); setDel(null); refresh(); } }} />
    </div>
  );
}
