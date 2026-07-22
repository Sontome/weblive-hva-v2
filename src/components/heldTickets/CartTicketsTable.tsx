import React from 'react';
import { Copy, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { HeldTicket } from '@/types/heldTicket';
import { AirlineBadge, StatusBadge, formatDateTime, formatMoney } from './heldTicketUI';

export interface CartTicketsTableProps {
  tickets: HeldTicket[];
  loading: boolean;
  error: string | null;
  startIndex: number;
  onOpenDetail: (ticket: HeldTicket) => void;
  onCopyPnr: (pnr: string) => void;
  onCancel: (id: string) => void;
}

const COLS = 11;

function isExpireRed(expire?: string | null): boolean {
  if (!expire) return false;
  const diff = new Date(expire).getTime() - Date.now();
  return diff > 0 && diff < 2 * 60 * 60 * 1000;
}

/**
 * Bảng "Giỏ hàng của tôi". Chỉ render đúng dữ liệu của trang hiện tại
 * (server-side pagination) — giữ nguyên loading overlay khi chuyển trang.
 */
export function CartTicketsTable({
  tickets,
  loading,
  error,
  startIndex,
  onOpenDetail,
  onCopyPnr,
  onCancel,
}: CartTicketsTableProps) {
  return (
    <div className="bg-white rounded-lg border overflow-x-auto relative">
      {loading && tickets.length > 0 && (
        <div className="absolute inset-0 bg-white/60 flex items-start justify-center pt-8 z-10">
          <span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      )}
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
          {loading && tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLS + 1} className="text-center py-6 text-gray-500">
                Đang tải...
              </TableCell>
            </TableRow>
          )}
          {!loading && error && (
            <TableRow>
              <TableCell colSpan={COLS + 1} className="text-center py-6 text-red-600">
                {error}
              </TableCell>
            </TableRow>
          )}
          {!loading && !error && tickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={COLS + 1} className="text-center py-6 text-gray-500">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          )}
          {tickets.map((t, i) => {
            const idx = startIndex + i + 1;
            const namelistStr = t.namelist.join(', ');
            const canCancel = t.ticket_status === 'holding';
            return (
              <TableRow key={t.id}>
                <TableCell>{idx}</TableCell>
                <TableCell>
                  <button
                    className="font-mono font-bold hover:underline"
                    onClick={() => onOpenDetail(t)}
                  >
                    {t.pnr}
                  </button>
                </TableCell>
                <TableCell>
                  <StatusBadge status={t.ticket_status} />
                </TableCell>
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
                  {t.total_price !== null ? (
                    formatMoney(t.total_price)
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell
                  className={`text-xs whitespace-nowrap ${
                    isExpireRed(t.expire_date) ? 'text-red-600' : ''
                  }`}
                >
                  {formatDateTime(t.expire_date)}
                </TableCell>
                <TableCell>
                  <AirlineBadge airline={t.airline} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onOpenDetail(t)}
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onCopyPnr(t.pnr)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700"
                        onClick={() => onCancel(t.id)}
                      >
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
  );
}
