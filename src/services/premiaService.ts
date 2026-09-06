import type { FlightSearchData } from '@/types/flight';

const PREMIA_BASE = 'https://apilive.hanvietair.com/premia';

const logTag = (tag: string, payload: any) => {
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, payload);
};

export interface PremiaSearchResult {
  status_code: number;
  body: any[];
  error?: string;
}

export const searchPremiaFlights = async (searchData: FlightSearchData): Promise<PremiaSearchResult> => {
  const isRT = searchData.tripType === 'RT';
  const body: Record<string, any> = {
    adt: String(searchData.adults ?? 1),
    arr0: searchData.arrival,
    chd: String(searchData.children ?? 0),
    dep0: searchData.departure,
    depdate0: searchData.departureDate,
    inf: String(searchData.infants ?? 0),
    sochieu: searchData.tripType,
  };
  if (isRT) body.depdate1 = searchData.returnDate || searchData.departureDate;

  logTag('PREMIA_SEARCH_REQUEST', body);
  try {
    const res = await fetch(`${PREMIA_BASE}/check-ve-v3`, {
      method: 'POST',
      headers: { accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      logTag('PREMIA_SEARCH_ERROR', { status: res.status, txt });
      return { status_code: res.status, body: [], error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    const list: any[] = data?.body ?? data?.data?.body ?? [];
    logTag('PREMIA_SEARCH_RESPONSE', { total: list.length });
    return { status_code: list.length > 0 ? 200 : 404, body: list };
  } catch (err: any) {
    logTag('PREMIA_SEARCH_EXCEPTION', err?.message || String(err));
    return { status_code: 500, body: [], error: err?.message || 'Network error' };
  }
};

/** Nhãn hành lý Premia theo mã hạng vé trả về ở `hành_lý_vna` */
export const getPremiaBaggageLabel = (code?: string): string => {
  const c = (code || '').trim().toUpperCase();
  if (c === 'YL') return 'Premia 15kg+15kg ký gửi';
  if (c === 'YS') return 'Premia 23kg+23kg ký gửi';
  return 'Premia 23kg+23kg ký gửi';
};
