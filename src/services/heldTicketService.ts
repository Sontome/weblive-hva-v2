import { supabase } from '@/integrations/supabase/client';
import type {
  HeldTicket,
  HeldTicketSegment,
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
      departure_date: seg.departure_date,
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

async function attachSegments(list: HeldTicketRow[]): Promise<HeldTicket[]> {
  if (list.length === 0) return [];
  const ids = list.map((t) => t.id);
  const { data: segs, error: segErr } = await supabase
    .from('held_ticket_segments')
    .select('*')
    .in('held_ticket_id', ids);
  if (segErr) throw new Error(segErr.message);
  const segRows = (segs || []) as HeldSegmentRow[];
  return list.map((t) => normalizeTicket(t, segRows));
}

export async function getMyHeldTickets(): Promise<HeldTicket[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('held_tickets')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return attachSegments((data || []) as HeldTicketRow[]);
}

export async function getAllHeldTickets(): Promise<HeldTicket[]> {
  const { data, error } = await supabase
    .from('held_tickets')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return attachSegments((data || []) as HeldTicketRow[]);
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
  tongbillgiagoc: number | string | null | undefined
): Promise<void> {
  try {
    if (!pnr) return;
    const num = Number(tongbillgiagoc);
    if (!Number.isFinite(num) || num <= 0) return;

    const { error } = await supabase
      .from('held_tickets')
      .update({ total_price: num, updated_at: new Date().toISOString() })
      .eq('pnr', pnr)
      .is('total_price', null);

    if (error) console.error(`[syncTicketPrice] PNR ${pnr}:`, error);
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
