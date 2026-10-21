import type { SunPQItinerarySegment } from './sunpq';

/** Một chặng trong hành trình hiện tại của PNR (từ /spa/checkpnr -> data.chieudi/chieuve) */
export interface SunPQCurrentSegment {
  departure?: string;
  arrival?: string;
  flight_date?: string;
  flight_number?: number | string;
  carrier?: string;
  booking_class?: string;
  fare_basis?: string;
  flight_status?: string;
  segment_id?: number;
  trip_id?: number;
  departure_info?: { datetime?: string; [k: string]: unknown };
  arrival_info?: { datetime?: string; [k: string]: unknown };
  [k: string]: unknown;
}

export interface SunPQPassengerInfo {
  type?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  [k: string]: unknown;
}

/** data bên trong response /spa/checkpnr */
export interface SunPQCheckPnrData {
  pnr?: string;
  status?: string;
  hang?: string;
  currency?: string;
  chieudi?: SunPQCurrentSegment[];
  chieuve?: SunPQCurrentSegment[];
  passengers?: SunPQPassengerInfo[];
  [k: string]: unknown;
}

export interface SunPQCheckPnrResponse {
  success?: boolean;
  message?: string;
  detail?: string;
  error?: string;
  data?: SunPQCheckPnrData;
  [k: string]: unknown;
}

export interface SunPQPaxPricing {
  type?: string;
  quantity?: number;
  currency?: string;
  old_base_fare?: number;
  new_base_fare?: number;
  chenhlech_giagoc?: number;
  chenhlech_thuephi?: number;
  phi_doi_ve?: number;
  tong_moi_khach?: number;
  [k: string]: unknown;
}

export interface SunPQChangeData {
  pnr_number?: string;
  currency?: string;
  chenhlech_giagoc?: number;
  chenhlech_thuephi?: number;
  phi_doi_ve?: number;
  tong_giathaydoi?: number;
  pax_pricing?: SunPQPaxPricing[];
  list_itinerary?: SunPQItinerarySegment[];
  segment_ids?: number[];
  [k: string]: unknown;
}

export interface SunPQChangeResponse {
  success?: boolean;
  trace_id?: string;
  message?: string;
  detail?: string;
  error?: string;
  data?: SunPQChangeData;
  [k: string]: unknown;
}
