import { useCallback, useMemo } from 'react';
import { useConfigTable } from '@/lib/configStore';

export interface RouteDiscount {
  id: string;
  airline_code: string;
  origin_code: string;
  destination_code: string;
  discount_amount: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Route discounts from the shared cached store (6h TTL, deduped). */
export const useRouteDiscounts = () => {
  const { data, isLoading, refetch } = useConfigTable<RouteDiscount>('route_discounts');
  const discounts = useMemo(() => data ?? [], [data]);

  /** Trả về số tiền giảm cho 1 chặng (0 nếu không có / inactive) */
  const getDiscount = useCallback(
    (airline: string, from: string, to: string): number => {
      if (!airline || !from || !to) return 0;
      const a = airline.toUpperCase();
      const f = from.toUpperCase();
      const t = to.toUpperCase();
      const match = discounts.find(
        (d) =>
          d.is_active &&
          d.airline_code.toUpperCase() === a &&
          d.origin_code.toUpperCase() === f &&
          d.destination_code.toUpperCase() === t
      );
      return match ? Number(match.discount_amount) : 0;
    },
    [discounts]
  );

  return { discounts, isLoading, refetch, getDiscount };
};
