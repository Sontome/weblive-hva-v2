import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PriceConfig {
  customer_mode: string;
  one_way_fee: number;
  round_trip_fee_vietjet: number;
  round_trip_fee_vna: number;
  round_trip_fee_other: number;
  // VNA (5 tiers)
  vna_threshold_1: number;
  vna_discount_ow_1: number;
  vna_discount_rt_1: number;
  vna_threshold_2: number;
  vna_discount_ow_2: number;
  vna_discount_rt_2: number;
  vna_threshold_3: number;
  vna_discount_ow_3: number;
  vna_discount_rt_3: number;
  vna_threshold_4: number;
  vna_discount_ow_4: number;
  vna_discount_rt_4: number;
  vna_threshold_5: number;
  vna_discount_ow_5: number;
  vna_discount_rt_5: number;
  // Vietjet (5 tiers)
  vietjet_threshold_1: number;
  vietjet_discount_ow_1: number;
  vietjet_discount_rt_1: number;
  vietjet_threshold_2: number;
  vietjet_discount_ow_2: number;
  vietjet_discount_rt_2: number;
  vietjet_threshold_3: number;
  vietjet_discount_ow_3: number;
  vietjet_discount_rt_3: number;
  vietjet_threshold_4: number;
  vietjet_discount_ow_4: number;
  vietjet_discount_rt_4: number;
  vietjet_threshold_5: number;
  vietjet_discount_ow_5: number;
  vietjet_discount_rt_5: number;
  // Other airlines (5 tiers)
  other_threshold_1: number;
  other_discount_ow_1: number;
  other_discount_rt_1: number;
  other_threshold_2: number;
  other_discount_ow_2: number;
  other_discount_rt_2: number;
  other_threshold_3: number;
  other_discount_ow_3: number;
  other_discount_rt_3: number;
  other_threshold_4: number;
  other_discount_ow_4: number;
  other_discount_rt_4: number;
  other_threshold_5: number;
  other_discount_ow_5: number;
  other_discount_rt_5: number;
}

export const usePriceConfigs = () => {
  const [configs, setConfigs] = useState<Record<string, PriceConfig>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const { data, error } = await supabase
          .from('price_configs')
          .select('*');

        if (error) {
          console.error('Error fetching price configs:', error);
          return;
        }

        const configMap: Record<string, PriceConfig> = {};
        data?.forEach((config) => {
          configMap[config.customer_mode] = config;
        });
        setConfigs(configMap);
      } catch (error) {
        console.error('Error fetching price configs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  return { configs, isLoading };
};
