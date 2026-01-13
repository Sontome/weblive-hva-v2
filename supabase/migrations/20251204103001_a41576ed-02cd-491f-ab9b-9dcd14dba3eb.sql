-- Drop existing price_configs and recreate with new structure
DROP TABLE IF EXISTS public.price_configs;

-- Create new price_configs table with customer_mode support
CREATE TABLE public.price_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_mode TEXT NOT NULL CHECK (customer_mode IN ('page', 'live', 'custom')),
  one_way_fee NUMERIC NOT NULL DEFAULT 0,
  round_trip_fee_vietjet NUMERIC NOT NULL DEFAULT 0,
  round_trip_fee_vna NUMERIC NOT NULL DEFAULT 0,
  -- VNA thresholds and discounts for 3 tiers
  vna_threshold_1 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_ow_1 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_rt_1 NUMERIC NOT NULL DEFAULT 0,
  vna_threshold_2 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_ow_2 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_rt_2 NUMERIC NOT NULL DEFAULT 0,
  vna_threshold_3 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_ow_3 NUMERIC NOT NULL DEFAULT 0,
  vna_discount_rt_3 NUMERIC NOT NULL DEFAULT 0,
  -- Vietjet thresholds and discounts for 3 tiers
  vietjet_threshold_1 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_ow_1 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_rt_1 NUMERIC NOT NULL DEFAULT 0,
  vietjet_threshold_2 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_ow_2 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_rt_2 NUMERIC NOT NULL DEFAULT 0,
  vietjet_threshold_3 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_ow_3 NUMERIC NOT NULL DEFAULT 0,
  vietjet_discount_rt_3 NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (customer_mode)
);

-- Enable RLS
ALTER TABLE public.price_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view price configs" 
ON public.price_configs 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage price configs" 
ON public.price_configs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_price_configs_updated_at
BEFORE UPDATE ON public.price_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default values for all 3 modes
INSERT INTO public.price_configs (customer_mode, one_way_fee, round_trip_fee_vietjet, round_trip_fee_vna, vna_threshold_1, vna_discount_ow_1, vna_discount_rt_1, vna_threshold_2, vna_discount_ow_2, vna_discount_rt_2, vna_threshold_3, vna_discount_ow_3, vna_discount_rt_3, vietjet_threshold_1, vietjet_discount_ow_1, vietjet_discount_rt_1, vietjet_threshold_2, vietjet_discount_ow_2, vietjet_discount_rt_2, vietjet_threshold_3, vietjet_discount_ow_3, vietjet_discount_rt_3)
VALUES 
  ('page', 35000, 20000, 15000, 300000, 15000, 0, 500000, 20000, 0, 800000, 20000, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  ('live', 25000, 10000, 10000, 300000, 10000, 0, 500000, 15000, 3000, 700000, 15000, 5000, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  ('custom', 0, 0, 0, 300000, 0, 0, 500000, 0, 0, 700000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);