-- Add tiers 4, 5 for VNA
ALTER TABLE public.price_configs 
ADD COLUMN vna_threshold_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vna_discount_ow_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vna_discount_rt_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vna_threshold_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN vna_discount_ow_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN vna_discount_rt_5 numeric NOT NULL DEFAULT 0;

-- Add tiers 4, 5 for Vietjet
ALTER TABLE public.price_configs 
ADD COLUMN vietjet_threshold_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vietjet_discount_ow_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vietjet_discount_rt_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN vietjet_threshold_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN vietjet_discount_ow_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN vietjet_discount_rt_5 numeric NOT NULL DEFAULT 0;

-- Add Other airline with 5 tiers
ALTER TABLE public.price_configs 
ADD COLUMN round_trip_fee_other numeric NOT NULL DEFAULT 0,
ADD COLUMN other_threshold_1 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_ow_1 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_rt_1 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_threshold_2 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_ow_2 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_rt_2 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_threshold_3 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_ow_3 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_rt_3 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_threshold_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_ow_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_rt_4 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_threshold_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_ow_5 numeric NOT NULL DEFAULT 0,
ADD COLUMN other_discount_rt_5 numeric NOT NULL DEFAULT 0;