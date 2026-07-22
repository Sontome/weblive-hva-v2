import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  cancelHeldTicket,
  getHeldTicketsPage,
} from '@/services/heldTicketService';
import type { HeldTicket, HeldTicketsFilters, TicketStatus } from '@/types/heldTicket';

export interface UseHeldTicketsAdminParams {
  /** true = xem toàn hệ thống (admin), false = chỉ vé của user hiện tại. */
  admin?: boolean;
  page: number;
  pageSize: number;
  filters: HeldTicketsFilters;
}

export interface UseHeldTicketsAdminReturn {
  tickets: HeldTicket[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  cancelTicket: (id: string) => Promise<void>;
}

/**
 * Hook phân trang server-side cho Held Tickets.
 * Mỗi lần đổi `page`, `pageSize`, hoặc bất kỳ field nào trong `filters`,
 * hook chỉ gọi ĐÚNG 1 request lấy đúng trang dữ liệu đó — không tải
 * toàn bộ bảng, không query `.in()` với hàng nghìn id.
 */
export function useHeldTicketsAdmin({
  admin = false,
  page,
  pageSize,
  filters,
}: UseHeldTicketsAdminParams): UseHeldTicketsAdminReturn {
  const [tickets, setTickets] = useState<HeldTicket[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // Dùng key ổn định từ các field scalar của filters để tránh phụ thuộc vào
  // reference của object `filters` (nếu component cha tạo object mới mỗi
  // render, effect vẫn không bị gọi lại thừa).
  const filterKey = [
    filters.userId ?? '',
    filters.airline ?? 'all',
    filters.status ?? 'all',
    filters.trip ?? 'all',
    filters.bookFrom ?? '',
    filters.bookTo ?? '',
    filters.flyFrom ?? '',
    filters.flyTo ?? '',
  ].join('|');

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHeldTicketsPage(filters, page, pageSize, { admin });
      if (mounted.current) {
        setTickets(result.tickets);
        setTotalCount(result.totalCount);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu';
      if (mounted.current) setError(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, page, pageSize, filterKey]);

  useEffect(() => {
    mounted.current = true;
    fetcher();
    return () => {
      mounted.current = false;
    };
  }, [fetcher]);

  // Realtime: chỉ patch trực tiếp vé đang hiển thị trên trang hiện tại khi
  // có UPDATE (không cần gọi lại API). Với INSERT/DELETE, tổng số vé và thứ
  // tự phân trang có thể thay đổi nên fetch lại — nhưng vẫn chỉ là 1 request
  // cho đúng trang hiện tại, không phải toàn bộ bảng.
  useEffect(() => {
    const channel = supabase
      .channel('held_tickets_admin_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'held_tickets' },
        (payload) => {
          if (!mounted.current) return;
          if (payload.eventType === 'UPDATE') {
            const next = payload.new as Partial<HeldTicket> & { id: string };
            setTickets((prev) =>
              prev.map((t) =>
                t.id === next.id
                  ? {
                      ...t,
                      ...next,
                      total_price:
                        next.total_price === undefined || next.total_price === null
                          ? t.total_price
                          : Number(next.total_price),
                      ticket_status:
                        (next.ticket_status as TicketStatus) || t.ticket_status,
                    }
                  : t
              )
            );
          } else if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
            fetcher();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetcher]);

  const cancelTicket = useCallback(
    async (id: string) => {
      await cancelHeldTicket(id);
      await fetcher();
    },
    [fetcher]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    tickets,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: fetcher,
    cancelTicket,
  };
}
