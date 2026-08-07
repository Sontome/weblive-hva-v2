import { supabase } from '@/integrations/supabase/client';

export type TimeMode = 'day' | 'month' | 'range';
export type Unit = 'PNR' | 'PAX';

export interface DashboardFilters {
  startDate: string; // ISO
  endDate: string; // ISO
  employees: string[] | null;
  airlines: string[] | null;
  trips: string[] | null;
}

export interface StatRow {
  employee_name: string | null;
  airline: string | null;
  date_bucket: string;
  ticket_status: string;
  pnr_count: number;
  pax_sum: number;
  total_price_sum: number;
}

export interface TripStatRow {
  trip: string;
  ticket_status: string;
  pnr_count: number;
  pax_sum: number;
  total_price_sum: number;
  top_employee: string | null;
}

function params(f: DashboardFilters) {
  return {
    p_start_date: f.startDate,
    p_end_date: f.endDate,
    p_employees: f.employees && f.employees.length ? f.employees : null,
    p_airlines: f.airlines && f.airlines.length ? f.airlines : null,
    p_trips: f.trips && f.trips.length ? f.trips : null,
  };
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

export async function fetchDashboardStats(f: DashboardFilters): Promise<StatRow[]> {
  const { data, error } = await supabase.rpc('get_dashboard_stats', params(f));
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    employee_name: (r.employee_name as string) ?? null,
    airline: (r.airline as string) ?? null,
    date_bucket: r.date_bucket as string,
    ticket_status: (r.ticket_status as string) ?? 'holding',
    pnr_count: num(r.pnr_count),
    pax_sum: num(r.pax_sum),
    total_price_sum: num(r.total_price_sum),
  }));
}

export async function fetchDashboardStatsByTrip(f: DashboardFilters): Promise<TripStatRow[]> {
  const { data, error } = await supabase.rpc('get_dashboard_stats_by_trip', params(f));
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    trip: (r.trip as string) ?? '',
    ticket_status: (r.ticket_status as string) ?? 'holding',
    pnr_count: num(r.pnr_count),
    pax_sum: num(r.pax_sum),
    total_price_sum: num(r.total_price_sum),
    top_employee: (r.top_employee as string) ?? null,
  }));
}

export interface FilterOptions {
  employees: string[];
  airlines: string[];
  trips: string[];
}

export async function fetchFilterOptions(): Promise<FilterOptions> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string
  ) => Promise<{ data: unknown; error: { message: string } | null }>)('get_dashboard_filter_options');
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as
    | { employees?: string[]; airlines?: string[]; trips?: string[] }
    | undefined;
  return {
    employees: row?.employees ?? [],
    airlines: row?.airlines ?? [],
    trips: row?.trips ?? [],
  };
}

export function formatVnd(v: number): string {
  return `${Math.round(v).toLocaleString('en-US')} ₫`;
}
