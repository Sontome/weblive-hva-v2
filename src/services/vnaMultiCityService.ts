export interface MultiCityLeg {
  origin: string;
  destination: string;
  /** YYYY-MM-DD */
  date: string;
}

export interface MultiCitySearchData {
  legs: MultiCityLeg[];
  adults: number;
  children: number;
  infants: number;
  ptcCode: string;
}

export const MULTI_CITY_MIN_LEGS = 2;
export const MULTI_CITY_MAX_LEGS = 4;

/** Validates a multi-city itinerary. Returns an error message or null. */
export const validateMultiCity = (
  legs: MultiCityLeg[],
  koreanCodes: string[],
  vietnamCodes: string[],
): string | null => {
  if (legs.length < MULTI_CITY_MIN_LEGS) return `Cần tối thiểu ${MULTI_CITY_MIN_LEGS} chặng.`;
  if (legs.length > MULTI_CITY_MAX_LEGS) return `Tối đa ${MULTI_CITY_MAX_LEGS} chặng.`;
  for (let i = 0; i < legs.length; i++) {
    const l = legs[i];
    const n = i + 1;
    if (!l.origin) return `Chặng ${n}: thiếu nơi đi.`;
    if (!l.destination) return `Chặng ${n}: thiếu nơi đến.`;
    if (!l.date) return `Chặng ${n}: thiếu ngày đi.`;
    if (l.origin === l.destination) return `Chặng ${n}: nơi đi và nơi đến không được trùng nhau.`;
    if (i > 0 && legs[i - 1].date > l.date) return `Ngày chặng ${n} không được trước ngày chặng ${i}.`;
  }
  if (!koreanCodes.includes(legs[0].origin)) {
    return `Chặng 1 phải khởi hành từ Hàn Quốc (${koreanCodes.join("/")}).`;
  }
  // Điểm đến chặng cuối đã được giới hạn ngay trong bộ chọn sân bay
  // (2 chặng: VN hoặc Hàn; 3-4 chặng: chỉ Hàn) nên không cần chặn khi tìm kiếm.
  return null;
};

export const buildMultiCityPayload = (data: MultiCitySearchData) => ({
  trip_type: "MD",
  origin: data.legs[0].origin,
  destination: data.legs[0].destination,
  legs: data.legs.map((l) => ({ date: l.date, destination: l.destination, origin: l.origin })),
  adult: data.adults,
  child: data.children,
  infant: data.infants,
  cabin_class: "Y",
  ptc_code: data.ptcCode,
});

/** VNA-only multi-city search (check-ve-v4, trip_type MD). */
export const searchVnaMultiCity = async (
  data: MultiCitySearchData,
): Promise<{ status_code: number; body: any[]; error?: string }> => {
  try {
    const res = await fetch("https://apilive.hanvietair.com/vna/check-ve-v4", {
      method: "POST",
      headers: { accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(buildMultiCityPayload(data)),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const body = Array.isArray(json?.body) ? json.body : [];
    if (body.length === 0) return { status_code: 404, body: [], error: "Không có chuyến bay VNA nhiều chặng" };
    return { status_code: 200, body };
  } catch (e: any) {
    console.error("VNA multi-city error:", e);
    return { status_code: 500, body: [], error: "Lỗi API Vietnam Airlines" };
  }
};

/** Extracts chặng_1..chặng_4 from a result row in order. */
export const extractMultiCityLegs = (row: any): any[] => {
  const legs: any[] = [];
  for (let i = 1; i <= MULTI_CITY_MAX_LEGS; i++) {
    const leg = row?.[`chặng_${i}`];
    if (leg) legs.push(leg);
  }
  return legs;
};
