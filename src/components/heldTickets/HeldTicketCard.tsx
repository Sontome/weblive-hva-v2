import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { HeldTicket } from '@/types/heldTicket';
import {
  AirlineBadge,
  StatusBadge,
  formatDateTime,
  formatMoney,
} from './heldTicketUI';

interface HeldTicketCardProps {
  ticket: HeldTicket;
  onCancel?: (id: string) => Promise<void>;
}

export function HeldTicketCard({ ticket, onCancel }: HeldTicketCardProps) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!onCancel) return;
    if (!confirm(`Hủy giữ vé PNR ${ticket.pnr}?`)) return;
    setCancelling(true);
    try {
      await onCancel(ticket.id);
      toast.success('Đã hủy vé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Hủy vé thất bại');
    } finally {
      setCancelling(false);
    }
  };

  const copyPnr = async () => {
    await navigator.clipboard.writeText(ticket.pnr);
    toast.success('Đã copy PNR');
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AirlineBadge airline={ticket.airline} />
          <button
            type="button"
            onClick={copyPnr}
            className="font-mono font-bold text-lg hover:underline"
            title="Click để copy"
          >
            {ticket.pnr}
          </button>
          <Copy className="w-3.5 h-3.5 text-gray-400" />
        </div>
        <StatusBadge status={ticket.ticket_status} />
      </div>

      <div className="text-sm text-gray-700">
        <div className="font-medium mb-1">Hành khách ({ticket.number_person}):</div>
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

      <div className="text-sm space-y-1">
        <div className="font-medium">Hành trình:</div>
        {ticket.segments.map((s) => (
          <div key={s.id} className="text-orange-600 font-mono text-xs">
            {s.departure_airport} → {s.arrival_airport} | {s.departure_date}{' '}
            {s.departure_time}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <div>
          {ticket.payment_status ? (
            <span className="text-green-600 font-medium">✓ Đã thanh toán</span>
          ) : (
            <span className="text-orange-600 font-medium">Chưa thanh toán</span>
          )}
        </div>
        <div>
          {ticket.total_price !== null ? (
            <span className="font-semibold text-gray-900">
              {formatMoney(ticket.total_price)}
            </span>
          ) : (
            <span className="inline-block w-16 h-3 bg-gray-200 rounded animate-pulse" />
          )}
        </div>
      </div>

      {ticket.expire_date && (
        <div className="text-xs text-red-600">
          Hết hạn: {formatDateTime(ticket.expire_date)}
        </div>
      )}

      {ticket.ticket_status === 'holding' && onCancel && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-red-600"
          onClick={handleCancel}
          disabled={cancelling}
        >
          <XCircle className="w-4 h-4 mr-1" />
          {cancelling ? 'Đang hủy...' : 'Hủy vé'}
        </Button>
      )}
    </Card>
  );
}
