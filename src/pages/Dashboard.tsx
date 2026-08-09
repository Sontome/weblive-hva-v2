import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MultiSelectFilter } from '@/components/dashboard/MultiSelectFilter';
import {
  fetchDashboardStats,
  fetchDashboardStatsByTrip,
  fetchFilterOptions,
  formatVnd,
  type StatRow,
  type TimeMode,
  type TripStatRow,
  type Unit,
} from '@/services/dashboardService';

const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5',
];
const TOTAL_COLOR = '#111827';

const AIRLINE_PILL: Record<string, string> = {
  VNA: 'border-red-500 text-red-600',
  VJ: 'border-orange-500 text-orange-600',
  SUN: 'border-yellow-500 text-yellow-700',
};

function pad(n: number) {
  return n.toString().padStart(2, '0');
}
function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

type SortDir = 'asc' | 'desc';

export default function Dashboard() {
  const today = new Date();

  // ---- filter form state (applied on "Áp dụng") ----
  const [mode, setMode] = useState<TimeMode>('day');
  const [day, setDay] = useState(toIsoDate(today));
  const [month, setMonth] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`);
  const [rangeFrom, setRangeFrom] = useState(toIsoDate(new Date(Date.now() - 6 * 864e5)));
  const [rangeTo, setRangeTo] = useState(toIsoDate(today));
  const [employees, setEmployees] = useState<string[]>([]);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [trips, setTrips] = useState<string[]>([]);
  const [unit, setUnit] = useState<Unit>('PNR');

  const [options, setOptions] = useState({ employees: [] as string[], airlines: [] as string[], trips: [] as string[] });
  const [allRows, setRows] = useState<StatRow[]>([]);
  const [allTripRows, setTripRows] = useState<TripStatRow[]>([]);
  const [issuedOnly, setIssuedOnly] = useState(false);
  const isIssued = (s: string) => s === 'issued' || s === 'ticketed';
  const rows = useMemo(
    () => (issuedOnly ? allRows.filter((r) => isIssued(r.ticket_status)) : allRows),
    [allRows, issuedOnly]
  );
  const tripRows = useMemo(
    () => (issuedOnly ? allTripRows.filter((r) => isIssued(r.ticket_status)) : allTripRows),
    [allTripRows, issuedOnly]
  );
  const [loading, setLoading] = useState(true);
  const [appliedMode, setAppliedMode] = useState<TimeMode>('day');
  const [appliedRange, setAppliedRange] = useState<{ start: Date; end: Date }>(() => {
    const s = new Date(); s.setHours(0, 0, 0, 0);
    const e = new Date(); e.setHours(23, 59, 59, 999);
    return { start: s, end: e };
  });

  useEffect(() => {
    fetchFilterOptions()
      .then(setOptions)
      .catch(() => toast.error('Không tải được danh sách bộ lọc'));
  }, []);

  const computeRange = (): { start: Date; end: Date } => {
    if (mode === 'day') {
      const s = new Date(`${day}T00:00:00`);
      const e = new Date(`${day}T23:59:59.999`);
      return { start: s, end: e };
    }
    if (mode === 'month') {
      const [y, m] = month.split('-').map(Number);
      return { start: new Date(y, m - 1, 1, 0, 0, 0), end: new Date(y, m, 0, 23, 59, 59, 999) };
    }
    return { start: new Date(`${rangeFrom}T00:00:00`), end: new Date(`${rangeTo}T23:59:59.999`) };
  };

  const load = async (r: { start: Date; end: Date }, m: TimeMode) => {
    setLoading(true);
    try {
      const filters = {
        startDate: r.start.toISOString(),
        endDate: r.end.toISOString(),
        employees: employees.length ? employees : null,
        airlines: airlines.length ? airlines : null,
        trips: trips.length ? trips : null,
      };
      const [stats, tstats] = await Promise.all([
        fetchDashboardStats(filters),
        fetchDashboardStatsByTrip(filters),
      ]);
      setRows(stats);
      setTripRows(tstats);
      setAppliedRange(r);
      setAppliedMode(m);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    void load(computeRange(), mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = () => void load(computeRange(), mode);
  const reset = () => {
    setMode('day');
    setDay(toIsoDate(new Date()));
    setEmployees([]);
    setAirlines([]);
    setTrips([]);
    setUnit('PNR');
    setIssuedOnly(false);
  };

  const val = (r: StatRow) => (unit === 'PNR' ? r.pnr_count : r.pax_sum);
  const tval = (r: TripStatRow) => (unit === 'PNR' ? r.pnr_count : r.pax_sum);

  // ---- KPI ----
  const kpi = useMemo(() => {
    let total = 0, holding = 0, issued = 0, money = 0;
    for (const r of rows) {
      total += val(r);
      if (r.ticket_status === 'holding') holding += val(r);
      if (r.ticket_status === 'issued' || r.ticket_status === 'ticketed') issued += val(r);
      money += r.total_price_sum;
    }
    return { total, holding, issued, money };
  }, [rows, unit]);

  const employeeNames = useMemo(() => {
    const s = new Set<string>();
    rows.forEach((r) => s.add(r.employee_name || 'Không rõ'));
    return Array.from(s).sort();
  }, [rows]);

  const colorOf = (name: string) => COLORS[employeeNames.indexOf(name) % COLORS.length] || COLORS[0];

  // ---- line chart ----
  const lineData = useMemo(() => {
    const labels: string[] = [];
    if (appliedMode === 'day') {
      for (let h = 0; h < 24; h++) labels.push(`${h}h`);
    } else if (appliedMode === 'month') {
      const d = new Date(appliedRange.end);
      for (let i = 1; i <= d.getDate(); i++) labels.push(String(i));
    } else {
      const cur = new Date(appliedRange.start);
      cur.setHours(0, 0, 0, 0);
      while (cur <= appliedRange.end) {
        labels.push(toIsoDate(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }
    const base = labels.map((label) => {
      const row: Record<string, string | number> = { label, 'Tổng': 0 };
      employeeNames.forEach((e) => (row[e] = 0));
      return row;
    });
    const index = new Map(labels.map((l, i) => [l, i]));
    for (const r of rows) {
      const d = new Date(r.date_bucket);
      const key =
        appliedMode === 'day' ? `${d.getHours()}h` : appliedMode === 'month' ? String(d.getDate()) : toIsoDate(d);
      const i = index.get(key);
      if (i === undefined) continue;
      const name = r.employee_name || 'Không rõ';
      base[i]['Tổng'] = (base[i]['Tổng'] as number) + val(r);
      base[i][name] = ((base[i][name] as number) || 0) + val(r);
    }
    return base;
  }, [rows, appliedMode, appliedRange, employeeNames, unit]);

  // ---- employee aggregation ----
  interface EmpAgg {
    name: string;
    pnr: number;
    pax: number;
    holding: number;
    issued: number;
    money: number;
    airlines: Record<string, { pnr: number; pax: number; money: number }>;
  }
  const empAgg = useMemo(() => {
    const map = new Map<string, EmpAgg>();
    for (const r of rows) {
      const name = r.employee_name || 'Không rõ';
      const a = map.get(name) || { name, pnr: 0, pax: 0, holding: 0, issued: 0, money: 0, airlines: {} };
      a.pnr += r.pnr_count;
      a.pax += r.pax_sum;
      a.money += r.total_price_sum;
      if (r.ticket_status === 'holding') a.holding += val(r);
      if (r.ticket_status === 'issued' || r.ticket_status === 'ticketed') a.issued += val(r);
      const al = r.airline || 'OTHER';
      const cur = a.airlines[al] || { pnr: 0, pax: 0, money: 0 };
      cur.pnr += r.pnr_count;
      cur.pax += r.pax_sum;
      cur.money += r.total_price_sum;
      a.airlines[al] = cur;
      map.set(name, a);
    }
    return Array.from(map.values());
  }, [rows, unit]);

  const [empSort, setEmpSort] = useState<{ key: keyof EmpAgg; dir: SortDir }>({ key: 'pnr', dir: 'desc' });
  const empSorted = useMemo(() => {
    const arr = [...empAgg];
    arr.sort((a, b) => {
      const av = a[empSort.key] as number | string;
      const bv = b[empSort.key] as number | string;
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number);
      return empSort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [empAgg, empSort]);

  const [expanded, setExpanded] = useState<string | null>(null);

  // ---- trip aggregation ----
  interface TripAgg {
    trip: string;
    pnr: number;
    pax: number;
    holding: number;
    issued: number;
    money: number;
    top: string;
  }
  const tripAgg = useMemo(() => {
    const map = new Map<string, TripAgg>();
    for (const r of tripRows) {
      const a = map.get(r.trip) || { trip: r.trip, pnr: 0, pax: 0, holding: 0, issued: 0, money: 0, top: '—' };
      a.pnr += r.pnr_count;
      a.pax += r.pax_sum;
      a.money += r.total_price_sum;
      if (r.ticket_status === 'holding') a.holding += tval(r);
      if (r.ticket_status === 'issued' || r.ticket_status === 'ticketed') a.issued += tval(r);
      if (r.top_employee) a.top = r.top_employee;
      map.set(r.trip, a);
    }
    return Array.from(map.values());
  }, [tripRows, unit]);

  const tripChartData = useMemo(
    () =>
      [...tripAgg]
        .map((t) => ({ trip: t.trip, 'Đang giữ': t.holding, 'Đã xuất vé': t.issued, total: t.holding + t.issued }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15),
    [tripAgg]
  );

  const [tripSort, setTripSort] = useState<{ key: keyof TripAgg; dir: SortDir }>({ key: 'pnr', dir: 'desc' });
  const tripSorted = useMemo(() => {
    const arr = [...tripAgg];
    arr.sort((a, b) => {
      const av = a[tripSort.key];
      const bv = b[tripSort.key];
      const cmp = typeof av === 'string' ? String(av).localeCompare(String(bv)) : (av as number) - (bv as number);
      return tripSort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [tripAgg, tripSort]);

  const empBarData = useMemo(
    () => empAgg.map((e) => ({ name: e.name, 'Đang giữ': e.holding, 'Đã xuất vé': e.issued })),
    [empAgg]
  );

  const grand = useMemo(
    () =>
      empAgg.reduce(
        (acc, e) => ({
          pnr: acc.pnr + e.pnr,
          pax: acc.pax + e.pax,
          holding: acc.holding + e.holding,
          issued: acc.issued + e.issued,
          money: acc.money + e.money,
        }),
        { pnr: 0, pax: 0, holding: 0, issued: 0, money: 0 }
      ),
    [empAgg]
  );
  const tripGrand = useMemo(
    () =>
      tripAgg.reduce(
        (acc, e) => ({
          pnr: acc.pnr + e.pnr,
          pax: acc.pax + e.pax,
          holding: acc.holding + e.holding,
          issued: acc.issued + e.issued,
          money: acc.money + e.money,
        }),
        { pnr: 0, pax: 0, holding: 0, issued: 0, money: 0 }
      ),
    [tripAgg]
  );

  const Th = ({ label, onClick, className = '' }: { label: string; onClick?: () => void; className?: string }) => (
    <th className={`px-3 py-2 text-left font-medium ${onClick ? 'cursor-pointer select-none' : ''} ${className}`} onClick={onClick}>
      <span className="inline-flex items-center gap-1">
        {label}
        {onClick && <ArrowUpDown className="w-3 h-3 opacity-50" />}
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Dashboard giữ vé</h1>
          <Link to="/cart" className="ml-auto text-sm text-blue-600 hover:underline">
            Giỏ hàng của tôi
          </Link>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg border p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['day', 'month', 'range'] as TimeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-sm border ${
                  mode === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-white hover:bg-accent'
                }`}
              >
                {m === 'day' ? 'Theo ngày' : m === 'month' ? 'Theo tháng' : 'Khoảng ngày'}
              </button>
            ))}
            <label className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border cursor-pointer select-none hover:bg-accent">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-600"
                checked={issuedOnly}
                onChange={(e) => setIssuedOnly(e.target.checked)}
              />
              Đã xuất vé
            </label>
            <div className="ml-auto inline-flex rounded-md border overflow-hidden">
              {(['PNR', 'PAX'] as Unit[]).map((u) => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 text-sm ${unit === u ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-accent'}`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
            {mode === 'day' && (
              <div>
                <label className="text-xs text-muted-foreground">Ngày</label>
                <Input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
              </div>
            )}
            {mode === 'month' && (
              <div>
                <label className="text-xs text-muted-foreground">Tháng</label>
                <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
              </div>
            )}
            {mode === 'range' && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">Từ ngày</label>
                  <Input type="date" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Đến ngày</label>
                  <Input type="date" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
                </div>
              </>
            )}
            <MultiSelectFilter label="Nhân viên" options={options.employees} selected={employees} onChange={setEmployees} />
            <MultiSelectFilter label="Hãng bay" options={options.airlines} selected={airlines} onChange={setAirlines} />
            <MultiSelectFilter label="Chặng bay" options={options.trips} selected={trips} onChange={setTrips} />
            <div className="flex gap-2">
              <Button size="sm" onClick={apply} disabled={loading}>Áp dụng</Button>
              <Button size="sm" variant="outline" onClick={reset}>Đặt lại</Button>
            </div>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: `Tổng (${unit})`, value: kpi.total.toLocaleString('en-US'), cls: 'text-gray-900' },
            { label: 'Đang giữ', value: kpi.holding.toLocaleString('en-US'), cls: 'text-amber-600' },
            { label: 'Đã xuất vé', value: kpi.issued.toLocaleString('en-US'), cls: 'text-emerald-600' },
            { label: 'Tổng tiền', value: formatVnd(kpi.money), cls: 'text-blue-600' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-lg border p-4">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              {loading ? (
                <Skeleton className="h-7 w-24 mt-2" />
              ) : (
                <div className={`text-2xl font-bold mt-1 ${c.cls}`}>{c.value}</div>
              )}
            </div>
          ))}
        </div>

        {/* Line chart */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Xu hướng theo thời gian</h2>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12, cursor: 'pointer' }} />
                <Line type="monotone" dataKey="Tổng" stroke={TOTAL_COLOR} strokeWidth={3} dot={false} />
                {employeeNames.map((e) => (
                  <Line key={e} type="monotone" dataKey={e} stroke={colorOf(e)} strokeWidth={1.6} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employee bar chart */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">So sánh nhân viên ({unit})</h2>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={empBarData} margin={{ top: 20, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Đang giữ" stackId="s" fill="#4b5563" />
                <Bar dataKey="Đã xuất vé" stackId="s" fill="#0d9488">
                  <LabelList dataKey="Đã xuất vé" position="top" style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Employee table */}
        <div className="bg-white rounded-lg border p-4 hidden md:block">
          <h2 className="font-semibold mb-3">Chi tiết theo nhân viên</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-12">STT</th>
                    <Th label="Nhân viên" onClick={() => setEmpSort({ key: 'name', dir: empSort.key === 'name' && empSort.dir === 'asc' ? 'desc' : 'asc' })} />
                    <Th label="Tổng PNR" onClick={() => setEmpSort({ key: 'pnr', dir: empSort.key === 'pnr' && empSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Tổng PAX" onClick={() => setEmpSort({ key: 'pax', dir: empSort.key === 'pax' && empSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Đang giữ" onClick={() => setEmpSort({ key: 'holding', dir: empSort.key === 'holding' && empSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Đã xuất vé" onClick={() => setEmpSort({ key: 'issued', dir: empSort.key === 'issued' && empSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Tổng tiền" onClick={() => setEmpSort({ key: 'money', dir: empSort.key === 'money' && empSort.dir === 'desc' ? 'asc' : 'desc' })} />
                  </tr>
                </thead>
                <tbody>
                  {empSorted.map((e, i) => (
                    <React.Fragment key={e.name}>
                      <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === e.name ? null : e.name)}>
                        <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                        <td className="px-3 py-2 font-medium">
                          <span className="inline-flex items-center gap-1">
                            {expanded === e.name ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {e.name}
                          </span>
                        </td>
                        <td className="px-3 py-2">{e.pnr.toLocaleString('en-US')}</td>
                        <td className="px-3 py-2">{e.pax.toLocaleString('en-US')}</td>
                        <td className="px-3 py-2">{e.holding.toLocaleString('en-US')}</td>
                        <td className="px-3 py-2">{e.issued.toLocaleString('en-US')}</td>
                        <td className="px-3 py-2">{formatVnd(e.money)}</td>
                      </tr>
                      {expanded === e.name &&
                        Object.entries(e.airlines).map(([al, v]) => (
                          <tr key={`${e.name}-${al}`} className="border-b bg-gray-50/60 text-xs">
                            <td />
                            <td className="px-3 py-1.5 pl-9">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded border font-semibold ${AIRLINE_PILL[al] || 'border-gray-400 text-gray-600'}`}>
                                {al}
                              </span>
                            </td>
                            <td className="px-3 py-1.5">{v.pnr.toLocaleString('en-US')}</td>
                            <td className="px-3 py-1.5">{v.pax.toLocaleString('en-US')}</td>
                            <td colSpan={2} />
                            <td className="px-3 py-1.5">{formatVnd(v.money)}</td>
                          </tr>
                        ))}
                    </React.Fragment>
                  ))}
                  {empSorted.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2">Tổng cộng</td>
                    <td className="px-3 py-2">{grand.pnr.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{grand.pax.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{grand.holding.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{grand.issued.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{formatVnd(grand.money)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Trips */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="font-semibold mb-3">Thống kê theo chặng bay ({unit})</h2>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tripChartData} margin={{ top: 20, right: 10, bottom: 5, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="trip" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Đang giữ" stackId="t" fill="#4b5563" />
                <Bar dataKey="Đã xuất vé" stackId="t" fill="#0d9488">
                  <LabelList dataKey="total" position="top" style={{ fontSize: 11 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-lg border p-4 hidden md:block">
          <h2 className="font-semibold mb-3">Chi tiết theo chặng</h2>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-12">STT</th>
                    <Th label="Chặng" onClick={() => setTripSort({ key: 'trip', dir: tripSort.key === 'trip' && tripSort.dir === 'asc' ? 'desc' : 'asc' })} />
                    <Th label="Tổng PNR" onClick={() => setTripSort({ key: 'pnr', dir: tripSort.key === 'pnr' && tripSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Tổng PAX" onClick={() => setTripSort({ key: 'pax', dir: tripSort.key === 'pax' && tripSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Đang giữ" onClick={() => setTripSort({ key: 'holding', dir: tripSort.key === 'holding' && tripSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Đã xuất vé" onClick={() => setTripSort({ key: 'issued', dir: tripSort.key === 'issued' && tripSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Tổng tiền" onClick={() => setTripSort({ key: 'money', dir: tripSort.key === 'money' && tripSort.dir === 'desc' ? 'asc' : 'desc' })} />
                    <Th label="Nhân viên nhiều nhất" />
                  </tr>
                </thead>
                <tbody>
                  {tripSorted.map((t, i) => (
                    <tr key={t.trip} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2 font-medium">{t.trip}</td>
                      <td className="px-3 py-2">{t.pnr.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2">{t.pax.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2">{t.holding.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2">{t.issued.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2">{formatVnd(t.money)}</td>
                      <td className="px-3 py-2">{t.top || '—'}</td>
                    </tr>
                  ))}
                  {tripSorted.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Không có dữ liệu</td></tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="font-semibold bg-gray-50">
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2">Tổng cộng</td>
                    <td className="px-3 py-2">{tripGrand.pnr.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{tripGrand.pax.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{tripGrand.holding.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{tripGrand.issued.toLocaleString('en-US')}</td>
                    <td className="px-3 py-2">{formatVnd(tripGrand.money)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
