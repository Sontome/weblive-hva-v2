/** Raw V5 segments remain intact; summaries are display-only compatibility views. */
export interface VnaSegment {
  hãng: string;
  id: string;
  nơi_đi: string;
  nơi_đến: string;
  giờ_cất_cánh: string;
  ngày_cất_cánh: string;
  giờ_hạ_cánh: string;
  ngày_hạ_cánh: string;
  thời_gian_bay: string;
  thời_gian_chờ: string;
  số_hiệu_máy_bay: string;
  số_điểm_dừng: string;
  điểm_dừng_1: string;
  điểm_dừng_2: string;
  loại_vé: string;
  [key: string]: unknown;
}

export interface VnaItineraryV5 {
  chiều_đi: VnaSegment[];
  chiều_về?: VnaSegment[];
  thông_tin_chung: Record<string, any>;
  [key: string]: unknown;
}

export function connectionWait(previous: VnaSegment, next: VnaSegment): string {
  if (previous.nơi_đến !== next.nơi_đi) return '';
  const localMinutes = (date: string, time: string) => {
    const [day, month, year] = date.split('/').map(Number);
    const [hour, minute] = time.split(':').map(Number);
    return Date.UTC(year, month - 1, day, hour, minute) / 60000;
  };
  const minutes = localMinutes(next.ngày_cất_cánh, next.giờ_cất_cánh) - localMinutes(previous.ngày_hạ_cánh, previous.giờ_hạ_cánh);
  if (!Number.isFinite(minutes) || minutes < 0) return '';
  return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
}

export function summarizeVnaDirection(segments: VnaSegment[]) {
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return undefined;
  return {
    ...first,
    nơi_đến: last.nơi_đến,
    giờ_hạ_cánh: last.giờ_hạ_cánh,
    ngày_hạ_cánh: last.ngày_hạ_cánh,
    số_điểm_dừng: String(segments.length - 1),
    điểm_dừng_1: segments.length > 1 ? first.nơi_đến : '',
    điểm_dừng_2: segments.length > 2 ? segments[1].nơi_đến : '',
    thời_gian_bay: String(segments.reduce((sum, segment) => sum + (Number(segment.thời_gian_bay) || 0), 0)),
    thời_gian_chờ: segments.length > 1 ? connectionWait(first, segments[1]) : '00:00',
    loại_vé: segments.map((segment) => segment.loại_vé).join('-'),
    segments,
  };
}

export function adaptVnaV5Itinerary(itinerary: VnaItineraryV5) {
  return {
    ...itinerary,
    chiều_đi: summarizeVnaDirection(itinerary.chiều_đi),
    chiều_về: summarizeVnaDirection(itinerary.chiều_về ?? []),
    vnaItinerary: itinerary,
  };
}

export function getVnaBookingSegments(itinerary: Record<string, any>): VnaSegment[] {
  if (Array.isArray(itinerary.chiều_đi)) return [...itinerary.chiều_đi, ...(itinerary.chiều_về ?? [])];
  return Object.keys(itinerary).filter((key) => /^chặng_\d+$/.test(key))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]))
    .map((key) => itinerary[key]);
}
