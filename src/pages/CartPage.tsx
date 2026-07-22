import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TooltipProvider } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useHeldTicketsAdmin } from '@/hooks/useHeldTicketsAdmin';
import { getHeldTicketTripOptions } from '@/services/heldTicketService';
import type { HeldTicket, TicketStatus, Airline } from '@/types/heldTicket';
import { TICKET_STATUS_LABEL } from '@/types/heldTicket';
import { CartTicketsTable } from '@/components/heldTickets/CartTicketsTable';
import { HeldTicketsPagination } from '@/components/heldTickets/HeldTicketsPagination';
import { HeldTicketDetailModal } from '@/components/heldTickets/HeldTicketDetailModal';

// Server-side pagination — chỉ load đúng dữ liệu của trang hiện tại,
// không tải toàn bộ vé của user rồi mới lọc/phân trang ở client.
const PAGE_SIZE = 100;

const STATUS_OPTIONS: Array<{ value: 'all' | TicketStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'holding', label: TICKET_STATUS_LABEL.holding },
  { value: 'paid', label: TICKET_STATUS_LABEL.paid },
  { value: 'ticketed', label: TICKET_STATUS_LABEL.ticketed },
  { value: 'cancelled', label: TICKET_STATUS_LABEL.cancelled },
  { value: 'expired', label: TICKET_STATUS_LABEL.expired },
];

const AIRLINE_OPTIONS: Array<'all' | Airline> = ['all', 'VJ', 'VNA', 'SUN', 'OTHER'];

function defaultBookFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}
function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function CartPage() {
  const [tripOptions, setTripOptions] = useState<string[]>([]);

  const [flyFrom, setFlyFrom] = useState('');
  const [flyTo, setFlyTo] = useState('');
  const [bookFrom, setBookFrom] = useState(defaultBookFrom());
  const [bookTo, setBookTo] = useState(todayIso());
  const [airline, setAirline] = useState<'all' | Airline>('all');
  const [trip, setTrip] = useState<string>('all');
  const [status, setStatus] = useState<'all' | TicketStatus>('all');
  const [page, setPage] = useState(1);
  const [detailTicket, setDetailTicket] = useState<HeldTicket | null>(null);

  const { tickets, totalCount, totalPages, loading, error, cancelTicket } = useHeldTicketsAdmin({
    admin: false,
    page,
    pageSize: PAGE_SIZE,
    filters: { airline, status, trip, bookFrom, bookTo, flyFrom, flyTo },
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      // Chỉ lấy chặng bay thuộc vé CỦA USER NÀY (không phải toàn hệ thống).
      const trips = await getHeldTicketTripOptions(user.id);
      setTripOptions(trips);
    })();
  }, []);

  // Đổi filter -> quay về trang 1.
  useEffect(() => {
    setPage(1);
  }, [flyFrom, flyTo, bookFrom, bookTo, airline, trip, status]);

  const reset = () => {
    setFlyFrom('');
    setFlyTo('');
    setBookFrom(defaultBookFrom());
    setBookTo(todayIso());
    setAirline('all');
    setTrip('all');
    setStatus('all');
  };

  const copyPnr = async (pnr: string) => {
    await navigator.clipboard.writeText(pnr);
    toast.success('Đã copy PNR');
  };

  const onCancel = async (id: string) => {
    if (!confirm('Hủy giữ vé này?')) return;
    try {
      await cancelTicket(id);
      toast.success('Đã hủy giữ vé');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi hủy vé');
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                </Button>
              </Link>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Giỏ hàng của tôi
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              Tổng cộng <span className="font-semibold">{totalCount.toLocaleString('en-US')}</span> trường hợp
            </div>
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-lg border p-3 mb-3 space-y-2">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <div>
                <label className="text-xs text-gray-600">Ngày bay từ</label>
                <Input type="date" value={flyFrom} onChange={(e) => setFlyFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Đến</label>
                <Input type="date" value={flyTo} onChange={(e) => setFlyTo(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Ngày đặt từ</label>
                <Input type="date" value={bookFrom} onChange={(e) => setBookFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Đến</label>
                <Input type="date" value={bookTo} onChange={(e) => setBookTo(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-600">Hãng bay</label>
                <Select value={airline} onValueChange={(v) => setAirline(v as 'all' | Airline)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AIRLINE_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>{a === 'all' ? 'Tất cả' : a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Chặng bay</label>
                <Select value={trip} onValueChange={setTrip}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {tripOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
              <div>
                <label className="text-xs text-gray-600">Trạng Thái</label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'all' | TicketStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-start-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={reset}>Đặt lại bộ lọc</Button>
              </div>
            </div>
          </div>

          <CartTicketsTable
            tickets={tickets}
            loading={loading}
            error={error}
            startIndex={(page - 1) * PAGE_SIZE}
            onOpenDetail={setDetailTicket}
            onCopyPnr={copyPnr}
            onCancel={onCancel}
          />

          <HeldTicketsPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalCount={totalCount}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>

        <HeldTicketDetailModal
          ticket={detailTicket}
          open={!!detailTicket}
          onClose={() => setDetailTicket(null)}
        />
      </div>
    </TooltipProvider>
  );
}
