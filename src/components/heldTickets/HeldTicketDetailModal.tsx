import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { HeldTicket } from '@/types/heldTicket';
import { AirlineBadge, StatusBadge, formatDateTime, formatMoney } from './heldTicketUI';

interface Props {
  ticket: HeldTicket | null;
  open: boolean;
  onClose: () => void;
}

export function HeldTicketDetailModal({ ticket, open, onClose }: Props) {
  if (!ticket) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono text-2xl">{ticket.pnr}</span>
            <AirlineBadge airline={ticket.airline} />
            <StatusBadge status={ticket.ticket_status} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div>
            <span className="font-medium">Thanh toán: </span>
            {ticket.payment_status ? (
              <span className="text-green-600">Đã thanh toán</span>
            ) : (
              <span className="text-orange-600">Chưa thanh toán</span>
            )}
          </div>

          <div>
            <div className="font-medium mb-1">Hành khách:</div>
            <div className="flex flex-wrap gap-1">
              {ticket.namelist.map((n, i) => (
                <span
                  key={`${n}-${i}`}
                  className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                >
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="font-medium mb-2">Chặng bay:</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Chặng</TableHead>
                  <TableHead>Ngày bay</TableHead>
                  <TableHead>Giờ bay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticket.segments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.segment_order}</TableCell>
                    <TableCell className="font-mono">{s.trip}</TableCell>
                    <TableCell>{s.departure_date}</TableCell>
                    <TableCell>{s.departure_time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-gray-700">
            <div>
              <div className="font-medium">Tổng bill giá gốc</div>
              <div>
                {ticket.total_price !== null
                  ? formatMoney(ticket.total_price)
                  : 'Chưa có giá'}
              </div>
            </div>
            <div>
              <div className="font-medium">Hạn thanh toán</div>
              <div className="text-red-600">{formatDateTime(ticket.expire_date)}</div>
            </div>
            <div>
              <div className="font-medium">Ngày tạo</div>
              <div>{formatDateTime(ticket.created_at)}</div>
            </div>
            <div>
              <div className="font-medium">Cập nhật</div>
              <div>{formatDateTime(ticket.updated_at)}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
