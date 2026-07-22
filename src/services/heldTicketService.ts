import { supabase } from '@/integrations/supabase/client';
import type {
  HeldTicket,
  HeldTicketSegment,
  HeldTicketsFilters,
  HeldTicketsPageResult,
  HoldTicketPayload,
  TicketStatus,
  Airline,
} from '@/types/heldTicket';

type HeldTicketRow = {
  id: string;
  user_id: string;
  pnr: string;
  airline: string;
  number_person: number;
  namelist: string[] | null;
  payment_status: boolean;
  ticket_status: string;
  hold_date: string;
  expire_date: string | null;
  total_price: number | string | null;
  employee_name: string | null;
  created_at: string;
  updated_at: string;
};

type HeldSegmentRow = {
  id: string;
  held_ticket_id: string;
  segment_order: number;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string;
  trip: string;
  created_at: string;
};

function normalizeTicket(row: HeldTicketRow, segments: HeldSegmentRow[]): HeldTicket {
  return {
    id: row.id,
    user_id: row.user_id,
    pnr: row.pnr,
    airline: (row.airline as Airline) || 'OTHER',
    number_person: row.number_person,
    namelist: row.namelist || [],
    payment_status: row.payment_status,
    ticket_status: (row.ticket_status as TicketStatus) || 'holding',
    hold_date: row.hold_date,
    expire_date: row.expire_date,
    total_price: row.total_price === null || row.total_price === undefined
      ? null
      : Number(row.total_price),
    employee_name: row.employee_name ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    segments: segments
      .filter((s) => s.held_ticket_id === row.id)
      .sort((a, b) => a.segment_order - b.segment_order)
      .map<HeldTicketSegment>((s) => ({ ...s })),
  };
}

export async function saveHeldTicket(payload: HoldTicketPayload): Promise<HeldTicket> {
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error('Bạn chưa đăng nhập');

  const namelist = (payload.namelist || []).map((n) => n.trim()).filter(Boolean);

  // Normalize expire_date -> ISO timestamp. Fallback to end of today (local).
  const normalizeExpire = (raw: string | null | undefined): string => {
    const endOfToday = () => {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };
    if (!raw || typeof raw !== 'string') return endOfToday();
    const s = raw.trim();
    // Already ISO-ish
    const iso = new Date(s);
    if (!isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(s)) return iso.toISOString();
    // "HH:mm DD/MM/YYYY" or "DD/MM/YYYY HH:mm" or "DD/MM/YYYY"
    const m1 = s.match(/^(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m1) {
      const [, hh, mm, dd, mo, yy] = m1;
      return new Date(+yy, +mo - 1, +dd, +hh, +mm, 0).toISOString();
    }
    const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/);
    if (m2) {
      const [, dd, mo, yy, hh, mm] = m2;
      return new Date(+yy, +mo - 1, +dd, hh ? +hh : 23, mm ? +mm : 59, hh ? 0 : 59).toISOString();
    }
    return endOfToday();
  };
  const expireIso = normalizeExpire(payload.expire_date);

  // Lấy tên nhân viên đang chọn trên phiên (localStorage)
  let employeeName: string | null = null;
  try {
    const raw = localStorage.getItem('employee_identity_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.employee_name) employeeName = String(parsed.employee_name);
    }
  } catch { /* ignore */ }

  // Normalize departure_date -> 'YYYY-MM-DD' (accept DD/MM/YYYY, DD-MM-YYYY, or ISO)
  const normalizeDate = (raw: string | null | undefined): string => {
    if (!raw || typeof raw !== 'string') return '';
    const s = raw.trim();
    const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
      const [, y, m, d] = iso;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dmy) {
      let [, d, m, y] = dmy;
      let yy = parseInt(y);
      if (yy < 100) yy += 2000;
      return `${yy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return s;
  };

  const { data: existing } = await supabase
    .from('held_tickets')
    .select('id')
    .eq('pnr', payload.pnr)
    .maybeSingle();
  if (existing?.id) {
    // Đã tồn tại -> trả về record hiện có
    const full = await getHeldTicketByPNR(payload.pnr);
    if (full) return full;
  }

  const { data: inserted, error: insErr } = await supabase
    .from('held_tickets')
    .insert({
      user_id: user.id,
      pnr: payload.pnr,
      airline: payload.airline,
      number_person: namelist.length || 1,
      namelist,
      expire_date: expireIso,
      total_price: payload.total_price ?? null,
      employee_name: employeeName,
    })
    .select('*')
    .single();

  if (insErr || !inserted) throw new Error(insErr?.message || 'Không thể lưu vé');

  if (payload.segments?.length) {
    const segRows = payload.segments.map((seg, i) => ({
      held_ticket_id: inserted.id,
      segment_order: i + 1,
      departure_airport: seg.departure_airport,
      arrival_airport: seg.arrival_airport,
      departure_date: normalizeDate(seg.departure_date),
      departure_time: seg.departure_time,
      trip: seg.trip,
    }));

    const { error: segErr } = await supabase
      .from('held_ticket_segments')
      .insert(segRows);

    if (segErr) {
      // rollback
      await supabase.from('held_tickets').delete().eq('id', inserted.id);
      throw new Error(segErr.message);
    }
  }

  const { data: segs } = await supabase
    .from('held_ticket_segments')
    .select('*')
    .eq('held_ticket_id', inserted.id);

  return normalizeTicket(inserted as HeldTicketRow, (segs || []) as HeldSegmentRow[]);
}

// ---------------------------------------------------------------------------
// Phân trang server-side cho danh sách Held Tickets (admin & user)
// ---------------------------------------------------------------------------
// Thay vì (1) tải toàn bộ held_tickets rồi (2) query held_ticket_segments
// bằng `.in('held_ticket_id', <toàn bộ id>)`, các hàm dưới đây:
//   - Chỉ lấy đúng dữ liệu của TRANG hiện tại (`.range(from, to)`).
//   - Ưu tiên dùng relationship embed của Supabase/PostgREST
//     (`held_ticket_segments(*)`) để lấy segment CÙNG lúc với ticket,
//     trong 1 request duy nhất — không còn query `.in()` riêng.
//   - Khi cần lọc theo trường của segment (ngày bay / chặng bay), việc lọc
//     được đẩy xuống DB bằng inner-join filter (`held_ticket_segments!inner`),
//     và bước lấy đầy đủ segment sau đó luôn bị giới hạn theo đúng số vé của
//     trang hiện tại (tối đa `pageSize` id) — không bao giờ là hàng nghìn id.

type HeldTicketWithSegments = HeldTicketRow & {
  held_ticket_segments: HeldSegmentRow[];
};

/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase's chainable
   query builder type changes shape with every .eq()/.gte() call; typing this
   precisely isn't practical for a small internal filter-building helper. */
/** Áp các filter dùng chung (cột trực tiếp trên held_tickets) vào 1 query builder. */
function applyCommonFilters(
  query: any,
  opts: { scopedUserId?: string; filters: HeldTicketsFilters }
): any {
  let q = query;
  const { scopedUserId, filters } = opts;
  if (scopedUserId) q = q.eq('user_id', scopedUserId);
  if (filters.airline && filters.airline !== 'all') q = q.eq('airline', filters.airline);
  if (filters.status && filters.status !== 'all') q = q.eq('ticket_status', filters.status);
  if (filters.bookFrom) q = q.gte('created_at', `${filters.bookFrom}T00:00:00`);
  if (filters.bookTo) q = q.lte('created_at', `${filters.bookTo}T23:59:59.999`);
  return q;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const SEGMENTS_EMBED = 'held_ticket_segments(*)';

/**
 * Lấy 1 trang Held Tickets theo filter, server-side pagination.
 * - `options.admin = false`: chỉ lấy vé của user hiện tại (dùng cho CartPage).
 * - `options.admin = true`: lấy toàn hệ thống, có thể lọc theo `filters.userId`.
 */
export async function getHeldTicketsPage(
  filters: HeldTicketsFilters,
  page: number,
  pageSize: number,
  options: { admin: boolean } = { admin: false }
): Promise<HeldTicketsPageResult> {
  const { admin } = options;

  let scopedUserId: string | undefined;
  if (!admin) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { tickets: [], totalCount: 0 };
    scopedUserId = user.id;
  } else if (filters.userId && filters.userId !== 'all') {
    scopedUserId = filters.userId;
  }

  const hasSegmentFilter =
    !!filters.flyFrom || !!filters.flyTo || (!!filters.trip && filters.trip !== 'all');

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (!hasSegmentFilter) {
    // Trường hợp phổ biến nhất: 1 request duy nhất, join segment qua
    // relationship — không còn request .in() riêng cho segment nữa.
    let query = supabase.from('held_tickets').select(`*, ${SEGMENTS_EMBED}`, {
      count: 'exact',
    });
    query = applyCommonFilters(query, { scopedUserId, filters });
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    const rows = (data || []) as unknown as HeldTicketWithSegments[];
    return {
      tickets: rows.map((r) => normalizeTicket(r, r.held_ticket_segments || [])),
      totalCount: count ?? 0,
    };
  }

  // Có lọc theo dữ liệu nằm ở segment (ngày bay / chặng bay): PostgREST
  // không thể vừa lọc theo child table vừa embed ĐẦY ĐỦ children trong
  // cùng 1 query (dùng !inner để lọc thì kết quả embed cũng bị cắt theo
  // điều kiện lọc). Nên tách 2 bước, nhưng bước 2 luôn bị chặn ở tối đa
  // `pageSize` id (mặc định 100) — không bao giờ là toàn bộ bảng.

  // Bước 1: xác định id + tổng số vé khớp điều kiện (filter đẩy xuống DB).
  let matchQuery = supabase
    .from('held_tickets')
    .select('id, created_at, held_ticket_segments!inner(departure_date,trip)', {
      count: 'exact',
    });
  matchQuery = applyCommonFilters(matchQuery, { scopedUserId, filters });
  if (filters.trip && filters.trip !== 'all') {
    matchQuery = matchQuery.eq('held_ticket_segments.trip', filters.trip);
  }
  if (filters.flyFrom) {
    matchQuery = matchQuery.gte('held_ticket_segments.departure_date', filters.flyFrom);
  }
  if (filters.flyTo) {
    matchQuery = matchQuery.lte('held_ticket_segments.departure_date', filters.flyTo);
  }
  matchQuery = matchQuery.order('created_at', { ascending: false }).range(from, to);

  const { data: matchRows, error: matchErr, count } = await matchQuery;
  if (matchErr) throw new Error(matchErr.message);

  // 1 vé có nhiều segment nên inner-join có thể trả trùng id (vd: cả 2
  // chặng khứ hồi đều rơi trong khoảng ngày lọc) -> dedupe, giữ thứ tự.
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const r of (matchRows || []) as { id: string }[]) {
    if (!seen.has(r.id)) {
      seen.add(r.id);
      ids.push(r.id);
    }
  }
  if (ids.length === 0) return { tickets: [], totalCount: count ?? 0 };

  // Bước 2: lấy đầy đủ vé + TOÀN BỘ segment (không chỉ segment khớp filter)
  // cho đúng các id ở trên. `ids.length <= pageSize` luôn đúng.
  const { data: fullRows, error: fullErr } = await supabase
    .from('held_tickets')
    .select(`*, ${SEGMENTS_EMBED}`)
    .in('id', ids);
  if (fullErr) throw new Error(fullErr.message);

  const byId = new Map(
    ((fullRows || []) as unknown as HeldTicketWithSegments[]).map((r) => [r.id, r])
  );
  // Giữ đúng thứ tự (created_at desc) đã sort/phân trang ở bước 1.
  const ordered = ids.map((id) => byId.get(id)).filter((r): r is HeldTicketWithSegments => !!r);

  return {
    tickets: ordered.map((r) => normalizeTicket(r, r.held_ticket_segments || [])),
    totalCount: count ?? 0,
  };
}

/**
 * Danh sách chặng bay (trip) để đổ vào dropdown filter.
 * Chỉ select đúng 1 cột `trip` — nhẹ hơn nhiều so với việc suy ra option
 * từ toàn bộ dữ liệu ticket+segment đã tải như cách cũ.
 * `userId`: nếu truyền vào (vd: trang Giỏ hàng cá nhân) thì chỉ lấy chặng
 * bay thuộc các vé của đúng user đó (join `held_tickets!inner`).
 * (Nếu muốn tối ưu hơn nữa, có thể thay bằng 1 view/RPC `SELECT DISTINCT`.)
 */
export async function getHeldTicketTripOptions(userId?: string): Promise<string[]> {
  const query = supabase.from('held_ticket_segments');
  const built = userId
    ? query.select('trip, held_tickets!inner(user_id)').eq('held_tickets.user_id', userId)
    : query.select('trip');
  const { data, error } = await built.limit(5000);
  if (error) return [];
  const set = new Set<string>((data || []).map((r: { trip: string }) => r.trip));
  return Array.from(set).sort();
}

export async function getHeldTicketByPNR(pnr: string): Promise<HeldTicket | null> {
  const { data, error } = await supabase
    .from('held_tickets')
    .select('*')
    .eq('pnr', pnr)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const { data: segs } = await supabase
    .from('held_ticket_segments')
    .select('*')
    .eq('held_ticket_id', (data as HeldTicketRow).id);
  return normalizeTicket(data as HeldTicketRow, (segs || []) as HeldSegmentRow[]);
}

export async function cancelHeldTicket(id: string): Promise<void> {
  const { error } = await supabase
    .from('held_tickets')
    .update({ ticket_status: 'cancelled' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Cập nhật total_price khi gọi API check vé chờ của hãng.
 * Chỉ ghi khi total_price hiện đang NULL — không bao giờ ghi đè.
 * Không throw để không phá luồng chính.
 */
export async function syncTicketPrice(
  pnr: string,
  tongbillgiagoc: number | string | null | undefined,
  paymentstatus?: boolean | null
): Promise<void> {
  try {
    if (!pnr) return;
    const num = Number(tongbillgiagoc);
    if (!Number.isFinite(num) || num <= 0) return;

    // Chỉ set total_price khi đang NULL — không ghi đè giá cũ
    const { error: priceErr } = await supabase
      .from('held_tickets')
      .update({ total_price: num, updated_at: new Date().toISOString() })
      .eq('pnr', pnr)
      .is('total_price', null);
    if (priceErr) console.error(`[syncTicketPrice:price] PNR ${pnr}:`, priceErr);

    // Chỉ đánh dấu đã thanh toán / đã xuất vé khi hãng xác nhận paymentstatus = true
    if (paymentstatus === true) {
      const { error: statusErr } = await supabase
        .from('held_tickets')
        .update({
          payment_status: true,
          ticket_status: 'issued',
          updated_at: new Date().toISOString(),
        })
        .eq('pnr', pnr);
      if (statusErr) console.error(`[syncTicketPrice:status] PNR ${pnr}:`, statusErr);
    }
  } catch (e) {
    console.error('[syncTicketPrice] unexpected error:', e);
  }
}

export async function listAllUsers(): Promise<{ id: string; email: string | null }[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email')
    .order('email', { ascending: true });
  if (error) return [];
  return (data || []) as { id: string; email: string | null }[];
}
