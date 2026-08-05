import React from 'react';
import { X, History, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSnapshotSummaries } from '@/lib/searchCache/hooks';
import { deleteSnapshot, minutesAgo } from '@/lib/searchCache/cache';
import type { AirlineStatus, SnapshotSummary } from '@/lib/searchCache/types';

interface Props {
  open: boolean;
  onClose: () => void;
  onView: (summary: SnapshotSummary) => void;
  highlightId?: string | null;
}

const formatPrice = (value: number | null): string =>
  value === null ? '—' : value.toLocaleString('vi-VN');

const formatDate = (iso: string): string => {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}` : iso;
};

const statusLabel: Record<AirlineStatus, string> = {
  pending: 'Đang chờ',
  success: 'Có vé',
  no_flights: 'Không có vé',
  error: 'Lỗi',
  domestic_error: 'Không hỗ trợ',
};

const statusClass: Record<AirlineStatus, string> = {
  pending: 'text-muted-foreground',
  success: 'text-emerald-600',
  no_flights: 'text-muted-foreground',
  error: 'text-destructive',
  domestic_error: 'text-destructive',
};

const AirlineRow: React.FC<{ code: string; price: number | null; status: AirlineStatus }> = ({
  code,
  price,
  status,
}) => (
  <div className="flex items-center justify-between text-xs">
    <span className="font-semibold">{code}</span>
    <span className="flex items-center gap-2">
      <span className="tabular-nums">{formatPrice(price)}</span>
      <span className={statusClass[status]}>{statusLabel[status]}</span>
    </span>
  </div>
);

export const SearchHistorySidebar: React.FC<Props> = ({ open, onClose, onView, highlightId }) => {
  const summaries = useSnapshotSummaries(open);

  return (
    <>
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-[340px] max-w-[92vw] flex-col border-l bg-background shadow-xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4" /> Lịch sử tìm kiếm
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Đóng lịch sử">
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {summaries.length === 0 && (
            <p className="px-1 py-6 text-center text-xs text-muted-foreground">
              Chưa có kết quả nào được lưu.
            </p>
          )}
          {summaries.map((s) => (
            <div
              key={s.id}
              className={`rounded-lg border p-3 transition-colors ${
                highlightId === s.id ? 'border-primary bg-accent' : 'bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">
                    {s.origin} → {s.destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(s.departDate)}
                    {s.returnDate ? ` - ${formatDate(s.returnDate)}` : ''}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{minutesAgo(s.createdAt)} phút trước</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Xoá"
                  onClick={() => void deleteSnapshot(s.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="mt-2 space-y-1">
                {/* <AirlineRow code="VN" price={s.cheapestVN} status={s.statusVN} />
                <AirlineRow code="VJ" price={s.cheapestVJ} status={s.statusVJ} />
                <AirlineRow code="SUN" price={s.cheapestSUN} status={s.statusSUN} /> */}
                <AirlineRow code="VN" price="" status={s.statusVN} />
                <AirlineRow code="VJ" price="" status={s.statusVJ} />
                <AirlineRow code="SUN" price="" status={s.statusSUN} />
              </div>

              <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => onView(s)}>
                <Eye className="mr-1 h-3.5 w-3.5" /> View
              </Button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
