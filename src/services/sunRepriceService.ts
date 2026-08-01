const SUN_BASE = 'https://apilive.hanvietair.com/spa';

export interface SunRepriceSegment {
  sochang: number;
  departure: string;
  departurename?: string;
  arrival: string;
  arrivalname?: string;
  loaive?: string;
  status?: string;
  giocatcanh?: string;
  ngaycatcanh?: string;
  giohacanh?: string;
  ngayhacanh?: string;
  thoigianbay?: string;
  sohieumaybay?: string;
}

export interface SunReprisePassenger {
  lastName?: string;
  firstName?: string;
  loaikhach?: string;
  ngaysinh?: string | null;
}

export interface SunBeginRepriceResponse {
  pnr?: string;
  chang?: SunRepriceSegment[];
  passengers?: SunReprisePassenger[];
  paymentstatus?: boolean;
  tongbillgiagoc?: number;
  doituong?: string;
  giavegoc?: number;
  status?: string;
  kakaomess?: string;
  listhanhly?: { airport: string; fare_basis: string; passenger_type: string }[];
}

export interface SunRepriceResponse {
  status?: string;
  reason?: string;
  response?: string;
  [k: string]: any;
}

export const beginSunReprice = async (pnr: string): Promise<SunBeginRepriceResponse> => {
  const res = await fetch(`${SUN_BASE}/beginReprice?pnr=${encodeURIComponent(pnr)}`, {
    headers: { accept: 'application/json' },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.reason || `HTTP ${res.status}`);
  return data as SunBeginRepriceResponse;
};

export const repriceSun = async (pnr: string, type: string): Promise<SunRepriceResponse> => {
  const res = await fetch(
    `${SUN_BASE}/reprice?pnr=${encodeURIComponent(pnr)}&type=${encodeURIComponent(type)}`,
    { headers: { accept: 'application/json' } }
  );
  const data = await res.json().catch(() => ({}));
  return data as SunRepriceResponse;
};
