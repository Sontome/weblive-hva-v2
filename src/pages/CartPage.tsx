import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Copy, Info, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useHeldTickets } from '@/hooks/useHeldTickets';
import type { HeldTicket, TicketStatus, Airline } from '@/types/heldTicket';
import { TICKET_STATUS_LABEL } from '@/types/heldTicket';
import {
  AirlineBadge,
  StatusBadge,
  formatDateTime,
  formatMoney,
} from '@/components/heldTickets/heldTicketUI';
import { HeldTicketDetailModal } from '@/components/heldTickets/HeldTicketDetailModal';

const PAGE_SIZE = 20;

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
  const { tickets, loading, error, cancelTicket } = useHeldTickets();

  const [flyFrom, setFlyFrom] = useState('');
  const [flyTo, setFlyTo] = useState('');
  const [bookFrom, setBookFrom] = useState(defaultBookFrom());
  const [bookTo, setBookTo] = useState(todayIso());
  const [airline, setAirline] = useState<'all' | Airline>('all');
  const [trip, setTrip] = useState<string>('all');
  const [status, setStatus] = useState<'all' | TicketStatus>('all');
  const [page, setPage] = useState(1);
  const [detailTicket, setDetailTicket] = useState<HeldTicket | null>(null);

  const tripOptions = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => t.segments.forEach((s) => set.add(s.trip)));
    return Array.from(set).sort();
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const firstSeg = t.segments[0];
      if (flyFrom && firstSeg && firstSeg.departure_date < flyFrom) return false;
      if (flyTo && firstSeg && firstSeg.departure_date > flyTo) return false;
      if (bookFrom && t.created_at.slice(0, 10) < bookFrom) return false;
      if (bookTo && t.created_at.slice(0, 10) > bookTo) return false;
      if (airline !== 'all' && t.airline !== airline) return false;
      if (trip !== 'all' && !t.segments.some((s) => s.trip === trip)) return false;
      if (status !== 'all' && t.ticket_status !== status) return false;
      return true;
    });
  }, [tickets, flyFrom, flyTo, bookFrom, bookTo, airline, trip, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const isExpireRed = (expire?: string | null) => {
    if (!expire) return false;
    const diff = new Date(expire).getTime() - Date.now();
    return diff > 0 && diff < 2 * 60 * 60 * 1000;
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
              Tổng cộng <span className="font-semibold">{filtered.length}</span> trường hợp
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

          {/* Table */}
          <div className="bg-white rounded-lg border overflow-x-auto">
            <div className="px-3 py-2 text-sm font-semibold border-b">
              Tổng cộng {filtered.length} trường hợp
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead>PNR</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Nhân viên</TableHead>
                  <TableHead>Hành trình lựa chọn</TableHead>
                  <TableHead>Ngày đặt chỗ</TableHead>
                  <TableHead className="text-center">Khách</TableHead>
                  <TableHead>Hành khách</TableHead>
                  <TableHead className="text-right">Tổng bill giá gốc</TableHead>
                  <TableHead>TL (Hạn thanh toán)</TableHead>
                  <TableHead>Hãng</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow><TableCell colSpan={12} className="text-center py-6 text-gray-500">Đang tải...</TableCell></TableRow>
                )}
                {!loading && error && (
                  <TableRow><TableCell colSpan={12} className="text-center py-6 text-red-600">{error}</TableCell></TableRow>
                )}
                {!loading && !error && pageData.length === 0 && (
                  <TableRow><TableCell colSpan={12} className="text-center py-6 text-gray-500">Không có dữ liệu</TableCell></TableRow>
                )}
                {pageData.map((t, i) => {
                  const idx = (page - 1) * PAGE_SIZE + i + 1;
                  const namelistStr = t.namelist.join(', ');
                  const canCancel = t.ticket_status === 'holding';
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{idx}</TableCell>
                      <TableCell>
                        <button
                          className="font-mono font-bold hover:underline"
                          onClick={() => setDetailTicket(t)}
                        >
                          {t.pnr}
                        </button>
                      </TableCell>
                      <TableCell><StatusBadge status={t.ticket_status} /></TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {t.employee_name || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-xs">
                        {t.segments.map((s) => (
                          <div key={s.id} className="text-orange-500 font-mono">
                            {s.trip} / {s.departure_date} {s.departure_time}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {formatDateTime(t.created_at)}
                      </TableCell>
                      <TableCell className="text-center">{t.number_person}</TableCell>
                      <TableCell className="text-xs max-w-[180px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="truncate">{namelistStr}</div>
                          </TooltipTrigger>
                          <TooltipContent>{namelistStr}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {t.total_price !== null
                          ? formatMoney(t.total_price)
                          : <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className={`text-xs whitespace-nowrap ${isExpireRed(t.expire_date) ? 'text-red-600' : ''}`}>
                        {formatDateTime(t.expire_date)}
                      </TableCell>
                      <TableCell><AirlineBadge airline={t.airline} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailTicket(t)}>
                            <Info className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyPnr(t.pnr)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          {canCancel && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => onCancel(t.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 text-sm">
            <div>Tổng cộng <span className="font-semibold">{filtered.length}</span> trường hợp</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</Button>
              <span>{page} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>›</Button>
            </div>
          </div>
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
