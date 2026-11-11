import type { ColDef } from 'ag-grid-community';
import { Link } from 'react-router-dom';
import { AdminDataGrid } from '@/components/admin/AdminDataGrid';
import { bbService, STAGE_LABEL } from '@/lib/bb';
import type { AdminReservationRow } from '@/lib/bb';
import { useAdminList } from './useAdminList';

/** Read-only view of table bookings. They are orders on the bb-table workflow, so stage changes happen on the order board. */
export default function ReservationsTab() {
  const { data } = useAdminList('reservations', bbService.admin.reservations);
  const cols: ColDef<AdminReservationRow>[] = [
    { field: 'slotKey', headerName: 'When', width: 160, sort: 'desc' }, { field: 'areaName', headerName: 'Area', width: 150 },
    { field: 'guests', headerName: 'Guests', width: 90 }, { field: 'stageCode', headerName: 'Stage', width: 130, valueFormatter: p => STAGE_LABEL[p.value as string] ?? p.value },
    { field: 'orderNumber', headerName: 'Order', width: 140 }, { field: 'occasion', headerName: 'Occasion', width: 140 },
    { field: 'withPet', headerName: 'Pet', width: 80 }, { field: 'note', headerName: 'Note', flex: 1 },
  ];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Bookings are orders on the “Table bookings” workflow: seat guests, complete or cancel them on the <Link to="/admin/orders" className="underline">order board</Link>.
        Bookings come from guests, so there is no bulk upload here.
      </p>
      <AdminDataGrid<AdminReservationRow> rowData={data ?? []} columnDefs={cols} emptyMessage="No bookings yet." height="60vh" />
    </div>
  );
}
