import type { FlightSearchData } from '@/types/flight';
import type { SunPQSearchResponse, SunPQBookingPayload, SunPQTrip } from '@/types/sunpq';

const SUNPQ_BASE = 'https://apilive.hanvietair.com/spa';

const logTag = (tag: string, payload: any) => {
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, payload);
};

export interface SunPQSearchResult {
  status_code: number;
  body: SunPQTrip[];
  error?: string;
}

export const searchSunPQFlights = async (searchData: FlightSearchData): Promise<SunPQSearchResult> => {
  const body = {
    departure: searchData.departure,
    arrival: searchData.arrival,
    dep_date: searchData.departureDate,
    arr_date: searchData.tripType === 'RT' ? (searchData.returnDate || searchData.departureDate) : searchData.departureDate,
    trip_type: searchData.tripType,
    adt: searchData.adults || 1,
    chd: searchData.children || 0,
    inf: searchData.infants || 0,
    promo_code: '',
    currency: 'KRW',
  };
  logTag('SUNPQ_SEARCH_REQUEST', body);
  try {
    const res = await fetch(`${SUNPQ_BASE}/check-ve-v3`, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      logTag('SUNPQ_SEARCH_ERROR', { status: res.status, txt });
      return { status_code: res.status, body: [], error: `HTTP ${res.status}` };
    }
    const data: SunPQSearchResponse = await res.json();
    logTag('SUNPQ_SEARCH_RESPONSE', { total: data.total_count ?? data.data?.body?.length });
    const list = data.data?.body ?? data.body ?? [];
    return { status_code: data.success ? 200 : 404, body: list };
  } catch (err: any) {
    logTag('SUNPQ_SEARCH_EXCEPTION', err?.message || String(err));
    return { status_code: 500, body: [], error: err?.message || 'Network error' };
  }
};

export const bookingSunPQ = async (payload: SunPQBookingPayload) => {
  logTag('SUNPQ_BOOKING_REQUEST', payload);
  const res = await fetch(`${SUNPQ_BASE}/booking`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  logTag('SUNPQ_BOOKING_RESPONSE', data);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data as { success: boolean; pnr?: string; message?: string };
};

export const checkSunPQPnr = async (pnr: string) => {
  logTag('SUNPQ_CHECKPNR_REQUEST', { pnr });
  const res = await fetch(`${SUNPQ_BASE}/checkpnr`, {
    method: 'POST',
    headers: { accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ pnr }),
  });
  const data = await res.json().catch(() => ({}));
  logTag('SUNPQ_CHECKPNR_RESPONSE', data);
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
};
