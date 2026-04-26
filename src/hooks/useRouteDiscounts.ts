import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

/**
 * Hook tải danh sách giảm giá theo chặng bay.
 * Cache toàn bộ list trong state, expose hàm `getDiscount(airline, from, to)`
 * để FlightResults tra cứu nhanh khi tính giá.
 */
export const useRouteDiscounts = () => {
  const [discounts, setDiscounts] = useState<RouteDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await (supabase as any)
      .from('route_discounts')
      .select('*')
      .order('airline_code', { ascending: true })
      .order('origin_code', { ascending: true });

    if (error) {
      console.error('Error fetching route discounts:', error);
      setDiscounts([]);
    } else {
      setDiscounts((data || []) as RouteDiscount[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

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

  return { discounts, isLoading, refetch: fetchDiscounts, getDiscount };
};
