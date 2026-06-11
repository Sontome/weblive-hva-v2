import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Loader2, Clock, Users, AlertTriangle, TrendingUp, Crown, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useResources } from '@/hooks/useResources';
import type { Employee, EmployeeCheckin, SupportRequest } from '@/types/resources';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';

const ALL = 'all';
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysAgoStr = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

const colorFor = (key: string): string => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360} 70% 55%)`;
};

const fmtDur = (mins: number) => `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
const fmtDT = (iso: string | null) => iso ? new Date(iso).toLocaleString('vi-VN') : '—';

interface CheckinRow extends EmployeeCheckin {}

const ShiftDashboard = () => {
  const navigate = useNavigate();
  const { employees, resources, types, loading: rLoading } = useResources();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [resourceId, setResourceId] = useState(ALL);
  const [displayName, setDisplayName] = useState(ALL);
  const [groupMode, setGroupMode] = useState<'display' | 'account'>('display');
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [supports, setSupports] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<CheckinRow | null>(null);
  const [selectedSR, setSelectedSR] = useState<SupportRequest | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);

  const empById = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const resById = useMemo(() => new Map(resources.map(r => [r.id, r])), [resources]);
  const typeById = useMemo(() => new Map(types.map(t => [t.id, t])), [types]);

  const displayOf = (e?: Employee) => (e?.display_name?.trim() || e?.name || '—');

  const fetchData = async () => {
    setLoading(true);
    try {
      const fromIso = new Date(from + 'T00:00:00').toISOString();
      const toIso = new Date(to + 'T23:59:59').toISOString();
      const sb: any = supabase;
      const [{ data: ck, error: e1 }, { data: sr, error: e2 }] = await Promise.all([
        sb.from('employee_checkins').select('*').gte('checkin_time', fromIso).lte('checkin_time', toIso).order('checkin_time', { ascending: true }),
        sb.from('support_requests').select('*').gte('created_at', fromIso).lte('created_at', toIso).order('created_at', { ascending: true }),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      setCheckins(ck || []); setSupports(sr || []);
    } catch (e: any) {
      toast.error(e.message || 'Lỗi tải dữ liệu');
    } finally { setLoading(false); }
  };

  useEffect(() => { if (!rLoading) fetchData(); /* eslint-disable-next-line */ }, [from, to, rLoading]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); /* eslint-disable-next-line */ }, [from, to]);

  // Filtered checkins
  const filtered = useMemo(() => checkins.filter(c => {
    if (resourceId !== ALL && c.resource_id !== resourceId) return false;
    if (displayName !== ALL) {
      const e = empById.get(c.employee_id); if (!e || displayOf(e) !== displayName) return false;
    }
    return true;
  }), [checkins, resourceId, displayName, empById]);

  const allDisplayNames = useMemo(() => {
    const s = new Set<string>();
    employees.forEach(e => { if (e.active) s.add(displayOf(e)); });
    return Array.from(s).sort();
  }, [employees]);

  // duration helper
  const durMin = (c: CheckinRow) => {
    const start = new Date(c.checkin_time).getTime();
    const end = c.checkout_time ? new Date(c.checkout_time).getTime() : Date.now();
    return Math.max(0, Math.round((end - start) / 60000));
  };

  // KPI
  const kpis = useMemo(() => {
    const totalMin = filtered.reduce((s, c) => s + durMin(c), 0);
    const byEmp = new Map<string, number>();
    filtered.forEach(c => {
      const e = empById.get(c.employee_id); if (!e) return;
      const k = displayOf(e); byEmp.set(k, (byEmp.get(k) || 0) + durMin(c));
    });
    let topName = '—', topMin = 0;
    byEmp.forEach((v, k) => { if (v > topMin) { topMin = v; topName = k; } });
    const filteredSR = supports.filter(s => resourceId === ALL || s.resource_id === resourceId);
    const resolved = filteredSR.filter(s => s.resolved_at);
    const avgResp = resolved.length
      ? resolved.reduce((s, r) => s + (new Date(r.resolved_at!).getTime() - new Date(r.created_at).getTime()), 0) / resolved.length / 1000
      : 0;
    return {
      totalHours: (totalMin / 60).toFixed(1),
      sessions: filtered.length,
      supports: filteredSR.length,
      avgRespSec: avgResp,
      topName, topHours: (topMin / 60).toFixed(1),
    };
  }, [filtered, supports, empById, resourceId]);

  // Timeline rows
  const rows = useMemo(() => {
    const map = new Map<string, { key: string; label: string; sub?: string; items: CheckinRow[] }>();
    filtered.forEach(c => {
      const e = empById.get(c.employee_id); if (!e) return;
      const dn = displayOf(e);
      const key = groupMode === 'display' ? dn : e.id;
      const label = groupMode === 'display' ? dn : e.name;
      const sub = groupMode === 'account' && e.name !== dn ? dn : undefined;
      if (!map.has(key)) map.set(key, { key, label, sub, items: [] });
      map.get(key)!.items.push(c);
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, empById, groupMode]);

  // Time window
  const winStart = new Date(from + 'T00:00:00').getTime();
  const winEnd = new Date(to + 'T23:59:59').getTime();
  const winSpan = Math.max(1, winEnd - winStart);
  const dayCount = Math.max(1, Math.round((winEnd - winStart) / 86400000));

  const ticks = useMemo(() => {
    const out: { left: number; label: string }[] = [];
    if (dayCount <= 1) {
      for (let h = 0; h <= 24; h += 2) {
        const t = winStart + h * 3600000;
        out.push({ left: ((t - winStart) / winSpan) * 100, label: `${String(h).padStart(2, '0')}h` });
      }
    } else {
      const step = dayCount <= 7 ? 1 : Math.ceil(dayCount / 10);
      for (let d = 0; d <= dayCount; d += step) {
        const t = winStart + d * 86400000;
        out.push({ left: ((t - winStart) / winSpan) * 100, label: new Date(t).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) });
      }
    }
    return out;
  }, [winStart, winSpan, dayCount]);

  // Charts data
  const pieData = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach(c => {
      const e = empById.get(c.employee_id); if (!e) return;
      const k = displayOf(e); m.set(k, (m.get(k) || 0) + durMin(c));
    });
    return Array.from(m.entries()).map(([name, mins]) => ({ name, value: Math.round(mins / 60 * 10) / 10 }))
      .sort((a, b) => b.value - a.value).slice(0, 12);
  }, [filtered, empById]);

  const heatmapData = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach(c => {
      const d = new Date(c.checkin_time).toISOString().slice(0, 10);
      m.set(d, (m.get(d) || 0) + durMin(c));
    });
    const out: { date: string; hours: number }[] = [];
    for (let d = 0; d < dayCount; d++) {
      const dt = new Date(winStart + d * 86400000).toISOString().slice(0, 10);
      out.push({ date: dt.slice(5), hours: Math.round((m.get(dt) || 0) / 60 * 10) / 10 });
    }
    return out;
  }, [filtered, dayCount, winStart]);

  const supportTrend = useMemo(() => {
    const m = new Map<string, number>();
    supports.forEach(s => {
      const d = new Date(s.created_at).toISOString().slice(0, 10);
      m.set(d, (m.get(d) || 0) + 1);
    });
    const out: { date: string; count: number }[] = [];
    for (let d = 0; d < dayCount; d++) {
      const dt = new Date(winStart + d * 86400000).toISOString().slice(0, 10);
      out.push({ date: dt.slice(5), count: m.get(dt) || 0 });
    }
    return out;
  }, [supports, dayCount, winStart]);

  // Employee detail panel
  const empDetail = useMemo(() => {
    if (!selectedEmp) return null;
    const accounts = employees.filter(e => displayOf(e) === selectedEmp);
    const accIds = new Set(accounts.map(a => a.id));
    const sessions = filtered.filter(c => accIds.has(c.employee_id));
    const perAccount = accounts.map(a => {
      const mins = sessions.filter(s => s.employee_id === a.id).reduce((s, c) => s + durMin(c), 0);
      return { name: a.name, mins };
    });
    const total = perAccount.reduce((s, x) => s + x.mins, 0);
    return { accounts, sessions: sessions.slice(-10).reverse(), perAccount, total };
  }, [selectedEmp, employees, filtered]);

  const exportCSV = () => {
    const headers = ['Display Name', 'Account', 'Resource', 'Checkin', 'Checkout', 'Duration (min)', 'Role', 'Status'];
    const lines = [headers.join(',')];
    filtered.forEach(c => {
      const e = empById.get(c.employee_id);
      const r = resById.get(c.resource_id);
      lines.push([displayOf(e), e?.name ?? '', r?.name ?? '', fmtDT(c.checkin_time), fmtDT(c.checkout_time), durMin(c), c.role_type, c.status]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `shift_${from}_${to}.csv`; a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-100">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/attendance-reports')} className="bg-gray-50 border-slate-300 text-slate-900 hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Shift Report Dashboard</h1>
              <div className="text-xs text-slate-500">Auto refresh mỗi 30s · {filtered.length} sessions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="bg-gray-50 border-slate-300 text-slate-900 hover:bg-slate-100">
              {loading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="bg-gray-50 border-slate-300 text-slate-900 hover:bg-slate-100">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-white border-slate-200 shadow-sm mb-4">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div><Label className="text-slate-600 text-xs">Từ ngày</Label><Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="mt-1 bg-white border-slate-300" /></div>
              <div><Label className="text-slate-600 text-xs">Đến ngày</Label><Input type="date" value={to} onChange={e => setTo(e.target.value)} className="mt-1 bg-white border-slate-300" /></div>
              <div><Label className="text-slate-600 text-xs">Resource</Label>
                <Select value={resourceId} onValueChange={setResourceId}>
                  <SelectTrigger className="mt-1 bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{resources.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-600 text-xs">Nhân viên</Label>
                <Select value={displayName} onValueChange={setDisplayName}>
                  <SelectTrigger className="mt-1 bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{allDisplayNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-600 text-xs">Group by</Label>
                <Select value={groupMode} onValueChange={(v: any) => setGroupMode(v)}>
                  <SelectTrigger className="mt-1 bg-white border-slate-300"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="display">Display Name</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-slate-600 text-xs">Zoom nhanh</Label>
                <div className="flex gap-1 mt-1">
                  <Button size="sm" variant="outline" className="flex-1 bg-white border-slate-300 text-xs" onClick={() => { setFrom(todayStr()); setTo(todayStr()); }}>1D</Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-white border-slate-300 text-xs" onClick={() => { setFrom(daysAgoStr(6)); setTo(todayStr()); }}>7D</Button>
                  <Button size="sm" variant="outline" className="flex-1 bg-white border-slate-300 text-xs" onClick={() => { setFrom(daysAgoStr(29)); setTo(todayStr()); }}>30D</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[
            { i: <Clock className="w-4 h-4" />, l: 'Tổng giờ trực', v: `${kpis.totalHours}h`, c: 'from-indigo-100 to-indigo-50 border-indigo-500/30' },
            { i: <Users className="w-4 h-4" />, l: 'Tổng checkin', v: kpis.sessions, c: 'from-emerald-100 to-emerald-50 border-emerald-500/30' },
            { i: <AlertTriangle className="w-4 h-4" />, l: 'Support requests', v: kpis.supports, c: 'from-amber-100 to-amber-50 border-amber-500/30' },
            { i: <TrendingUp className="w-4 h-4" />, l: 'TG phản hồi TB', v: kpis.avgRespSec ? `${Math.floor(kpis.avgRespSec / 60)}m${Math.round(kpis.avgRespSec % 60)}s` : '—', c: 'from-rose-100 to-rose-50 border-rose-500/30' },
            { i: <Crown className="w-4 h-4" />, l: 'Trực nhiều nhất', v: <><div className="truncate">{kpis.topName}</div><div className="text-xs text-slate-500">{kpis.topHours}h</div></>, c: 'from-fuchsia-100 to-fuchsia-50 border-fuchsia-500/30' },
          ].map((k, i) => (
            <Card key={i} className={`bg-gradient-to-br ${k.c} border`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">{k.i}{k.l}</div>
                <div className="text-2xl font-bold mt-1">{k.v}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Timeline */}
        <Card className="bg-white border-slate-200 shadow-sm mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-base">Timeline trực</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="py-12 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin inline" /></div>
            : rows.length === 0 ? <div className="py-12 text-center text-slate-500">Không có dữ liệu</div>
            : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Ticks */}
                  <div className="flex">
                    <div className="w-44 shrink-0" />
                    <div className="relative flex-1 h-6 border-b border-slate-200">
                      {ticks.map((t, i) => (
                        <div key={i} className="absolute top-0 text-[10px] text-slate-500" style={{ left: `${t.left}%`, transform: 'translateX(-50%)' }}>
                          {t.label}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Rows */}
                  <div className="max-h-[500px] overflow-y-auto">
                    {rows.map(row => (
                      <div key={row.key} className="flex items-center hover:bg-slate-100">
                        <button onClick={() => setSelectedEmp(groupMode === 'display' ? row.label : displayOf(empById.get(row.key)))} className="w-44 shrink-0 py-2 px-2 text-left text-sm font-medium truncate hover:text-indigo-400">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: colorFor(row.label) }} />
                            <div className="min-w-0">
                              <div className="truncate">{row.label}</div>
                              {row.sub && <div className="text-[10px] text-slate-500 truncate">{row.sub}</div>}
                            </div>
                          </div>
                        </button>
                        <div className="relative flex-1 h-10 border-b border-slate-200/50">
                          {/* grid lines */}
                          {ticks.map((t, i) => (
                            <div key={i} className="absolute top-0 bottom-0 border-l border-slate-200/40" style={{ left: `${t.left}%` }} />
                          ))}
                          {row.items.map(c => {
                            const s = new Date(c.checkin_time).getTime();
                            const e = c.checkout_time ? new Date(c.checkout_time).getTime() : Math.min(Date.now(), winEnd);
                            const left = Math.max(0, ((s - winStart) / winSpan) * 100);
                            const width = Math.max(0.3, ((Math.min(e, winEnd) - Math.max(s, winStart)) / winSpan) * 100);
                            const emp = empById.get(c.employee_id);
                            const dn = displayOf(emp);
                            const bg = colorFor(dn);
                            const isSupport = c.role_type === 'support';
                            const isActive = c.status === 'active';
                            return (
                              <button
                                key={c.id}
                                onClick={() => setSelected(c)}
                                title={`${dn} (${emp?.name}) · ${resById.get(c.resource_id)?.name ?? ''}\n${fmtDT(c.checkin_time)} → ${c.checkout_time ? fmtDT(c.checkout_time) : 'đang trực'}\n${fmtDur(durMin(c))} · ${c.role_type} · ${c.status}`}
                                className="absolute top-1.5 bottom-1.5 rounded transition-all hover:ring-2 hover:ring-white/80 hover:z-10"
                                style={{
                                  left: `${left}%`, width: `${width}%`,
                                  background: isSupport ? `repeating-linear-gradient(45deg, ${bg}, ${bg} 4px, ${bg}cc 4px, ${bg}cc 8px)` : bg,
                                  opacity: isActive ? 1 : 0.85,
                                  boxShadow: isActive ? `0 0 0 1px ${bg}, 0 0 12px ${bg}80` : 'none',
                                }}
                              />
                            );
                          })}
                          {/* Support markers */}
                          {supports.filter(sr => {
                            if (resourceId !== ALL && sr.resource_id !== resourceId) return false;
                            const requester = empById.get(sr.requested_by_employee_id);
                            const key = groupMode === 'display' ? displayOf(requester) : requester?.id;
                            return key === row.key;
                          }).map(sr => {
                            const t = new Date(sr.created_at).getTime();
                            const left = ((t - winStart) / winSpan) * 100;
                            if (left < 0 || left > 100) return null;
                            return (
                              <button key={sr.id} onClick={() => setSelectedSR(sr)}
                                className="absolute top-0 -translate-x-1/2 text-rose-500 hover:scale-125 transition" style={{ left: `${left}%` }}
                                title="Support request">
                                <AlertTriangle className="w-4 h-4" fill="currentColor" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500" /> Primary</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: 'repeating-linear-gradient(45deg,#6366f1,#6366f1 3px,#6366f199 3px,#6366f199 6px)' }} /> Support</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-rose-500" fill="currentColor" /> Support request</span>
            </div>
          </CardContent>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tỷ lệ giờ trực</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label={(d: any) => `${d.name}: ${d.value}h`}>
                    {pieData.map(d => <Cell key={d.name} fill={colorFor(d.name)} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Tổng giờ theo nhân viên</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pieData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} interval={0} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="value" name="Giờ">
                    {pieData.map(d => <Cell key={d.name} fill={colorFor(d.name)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Giờ trực theo ngày</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={heatmapData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                  <Bar dataKey="hours" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-base">Support requests trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={supportTrend}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0' }} />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session detail */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="bg-white border-slate-200 shadow-sm text-slate-100">
          <DialogHeader><DialogTitle>Chi tiết phiên trực</DialogTitle></DialogHeader>
          {selected && (() => {
            const e = empById.get(selected.employee_id);
            const r = resById.get(selected.resource_id);
            const t = r ? typeById.get(r.resource_type_id) : null;
            return (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Display Name</span><span className="font-medium">{displayOf(e)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Account</span><span>{e?.name ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Resource</span><span>{t?.name ? `${t.name} · ` : ''}{r?.name ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Role</span>{selected.role_type === 'primary' ? <Badge className="bg-emerald-600">Primary</Badge> : <Badge className="bg-amber-600">Support</Badge>}</div>
                <div className="flex justify-between"><span className="text-slate-500">Checkin</span><span>{fmtDT(selected.checkin_time)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Checkout</span><span>{selected.checkout_time ? fmtDT(selected.checkout_time) : '— (đang trực)'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tổng thời lượng</span><span className="font-semibold">{fmtDur(durMin(selected))}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><span>{selected.status}</span></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Support request detail */}
      <Dialog open={!!selectedSR} onOpenChange={o => !o && setSelectedSR(null)}>
        <DialogContent className="bg-white border-slate-200 shadow-sm text-slate-100">
          <DialogHeader><DialogTitle>Support request</DialogTitle></DialogHeader>
          {selectedSR && (() => {
            const requester = empById.get(selectedSR.requested_by_employee_id);
            const resolver = selectedSR.resolved_by_employee_id ? empById.get(selectedSR.resolved_by_employee_id) : null;
            const r = resById.get(selectedSR.resource_id);
            return (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Người tạo</span><span>{displayOf(requester)}{requester && requester.name !== displayOf(requester) ? ` (${requester.name})` : ''}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Thời gian tạo</span><span>{fmtDT(selectedSR.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Trạng thái</span><span>{selectedSR.status}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Người xử lý</span><span>{resolver ? displayOf(resolver) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Thời gian xử lý</span><span>{fmtDT(selectedSR.resolved_at)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Resource</span><span>{r?.name ?? '—'}</span></div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Employee detail */}
      <Dialog open={!!selectedEmp} onOpenChange={o => !o && setSelectedEmp(null)}>
        <DialogContent className="bg-white border-slate-200 shadow-sm text-slate-100 max-w-lg">
          <DialogHeader><DialogTitle>{selectedEmp}</DialogTitle></DialogHeader>
          {empDetail && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Tổng giờ</span><span className="text-xl font-bold">{fmtDur(empDetail.total)}</span></div>
              <div>
                <div className="text-slate-500 mb-1">Accounts</div>
                <div className="space-y-1">
                  {empDetail.perAccount.map(a => (
                    <div key={a.name} className="flex justify-between bg-slate-800/60 px-2 py-1 rounded">
                      <span>{a.name}</span><span className="font-mono">{fmtDur(a.mins)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Lịch sử gần nhất</div>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {empDetail.sessions.map(s => {
                    const r = resById.get(s.resource_id);
                    return (
                      <div key={s.id} className="flex justify-between text-xs bg-slate-800/40 px-2 py-1 rounded">
                        <span>{r?.name ?? '—'} · {fmtDT(s.checkin_time)}</span>
                        <span className="font-mono">{fmtDur(durMin(s))}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShiftDashboard;
