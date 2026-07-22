export type Airline = 'VJ' | 'VNA' | 'SUN' | 'OTHER';

export type TicketStatus =
  | 'holding'
  | 'paid'
  | 'ticketed'
  | 'issued'
  | 'cancelled'
  | 'expired';

export interface HeldTicketSegment {
  id: string;
  held_ticket_id: string;
  segment_order: number;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string; // 'YYYY-MM-DD'
  departure_time: string; // 'HH:MM'
  trip: string; // 'HAN-SGN'
  created_at: string;
}

export interface HeldTicket {
  id: string;
  user_id: string;
  pnr: string;
  airline: Airline;
  number_person: number;
  namelist: string[];
  payment_status: boolean;
  ticket_status: TicketStatus;
  hold_date: string;
  expire_date: string | null;
  total_price: number | null;
  employee_name: string | null;
  created_at: string;
  updated_at: string;
  segments: HeldTicketSegment[];
}

export interface HoldTicketSegmentInput {
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  trip: string;
}

export interface HoldTicketPayload {
  pnr: string;
  airline: Airline;
  namelist: string[];
  segments: HoldTicketSegmentInput[];
  expire_date?: string | null;
  total_price?: number | null;
}

/**
 * Bộ lọc dùng cho danh sách Held Tickets phân trang (server-side).
 * Tất cả optional — không set nghĩa là "không lọc theo trường đó".
 */
export interface HeldTicketsFilters {
  /** Chỉ áp dụng khi gọi ở chế độ admin. 'all' = mọi user. */
  userId?: string;
  airline?: 'all' | Airline;
  status?: 'all' | TicketStatus;
  /** Lọc theo chặng bay (khớp bất kỳ segment nào của vé). 'all' = mọi chặng. */
  trip?: string;
  /** Ngày đặt chỗ (created_at), dạng 'YYYY-MM-DD'. */
  bookFrom?: string;
  bookTo?: string;
  /** Ngày bay (departure_date của segment đầu tiên), dạng 'YYYY-MM-DD'. */
  flyFrom?: string;
  flyTo?: string;
}

export interface HeldTicketsPageResult {
  tickets: HeldTicket[];
  totalCount: number;
}

export interface AirlineHeldBookingResponse {
  pnr: string;
  tongbillgiagoc?: number;
  [key: string]: unknown;
}

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  holding: 'Đang giữ',
  paid: 'Đã thanh toán',
  ticketed: 'Đã xuất vé',
  issued: 'Đã xuất vé',
  cancelled: 'Đã hủy',
  expired: 'Hết hạn',
};

export const AIRLINE_LABEL: Record<Airline, string> = {
  VJ: 'VietJet',
  VNA: 'Vietnam Airlines',
  SUN: 'Sun PhuQuoc',
  OTHER: 'Khác',
};

export function mapAirlineName(name: string | undefined | null): Airline {
  if (!name) return 'OTHER';
  const n = name.toLowerCase();
  if (n.includes('vietjet') || n === 'vj') return 'VJ';
  if (n.includes('vietnam airlines') || n === 'vna') return 'VNA';
  if (n.includes('sun') || n === 'sunpq' || n === 'sun pq') return 'SUN';
  return 'OTHER';
}
