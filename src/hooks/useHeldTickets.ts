import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  cancelHeldTicket,
  getAllHeldTickets,
  getMyHeldTickets,
} from '@/services/heldTicketService';
import type { HeldTicket, TicketStatus } from '@/types/heldTicket';

interface UseHeldTicketsOptions {
  admin?: boolean;
}

export interface UseHeldTicketsReturn {
  tickets: HeldTicket[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  cancelTicket: (id: string) => Promise<void>;
}

export function useHeldTickets(
  options: UseHeldTicketsOptions = {}
): UseHeldTicketsReturn {
  const { admin = false } = options;
  const [tickets, setTickets] = useState<HeldTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const fetcher = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = admin ? await getAllHeldTickets() : await getMyHeldTickets();
      if (mounted.current) setTickets(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu';
      if (mounted.current) setError(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    mounted.current = true;
    fetcher();
    return () => {
      mounted.current = false;
    };
  }, [fetcher]);

  // Realtime — cập nhật total_price + ticket_status khi có thay đổi
  useEffect(() => {
    const channel = supabase
      .channel('held_tickets_changes')
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

  return { tickets, loading, error, refetch: fetcher, cancelTicket };
}
