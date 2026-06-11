import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search, RotateCcw, Download, BarChart3 } from 'lucide-react';
import { useResources } from '@/hooks/useResources';
import { reportCheckins, dashboardSummary } from '@/services/resourceService';
import type { ReportRow, DashboardSummaryRow } from '@/types/resources';

const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('vi-VN'); } catch { return iso; }
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); };
const fmtDur = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;

const ALL = 'all';

const AttendanceReports = () => {
  const navigate = useNavigate();
  const { groups, employees, types, resources } = useResources();
  const [fromDate, setFromDate] = useState(monthAgoStr());
  const [toDate, setToDate] = useState(todayStr());
  const [empId, setEmpId] = useState(ALL);
  const [groupId, setGroupId] = useState(ALL);
  const [typeId, setTypeId] = useState(ALL);
  const [resId, setResId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [summary, setSummary] = useState<DashboardSummaryRow[]>([]);

  useEffect(() => { dashboardSummary().then(setSummary).catch(() => {}); }, []);

  const handleSearch = async () => {
    setIsLoading(true); setHasSearched(true);
    try {
      const data = await reportCheckins({
        from_date: fromDate, to_date: toDate,
        emp: empId === ALL ? null : empId,
        group_id: groupId === ALL ? null : groupId,
        type_id: typeId === ALL ? null : typeId,
        resource_id: resId === ALL ? null : resId,
        status: status === ALL ? null : status,
        role: role === ALL ? null : role,
      });
      setRows(data);
    } catch (err: any) {
      toast.error(err.message || 'Không tải được báo cáo'); setRows([]);
    } finally { setIsLoading(false); }
  };

  const handleReset = () => {
    setFromDate(monthAgoStr()); setToDate(todayStr());
    setEmpId(ALL); setGroupId(ALL); setTypeId(ALL); setResId(ALL); setStatus(ALL); setRole(ALL);
    setRows([]); setHasSearched(false);
  };

  const totals = useMemo(() => {
    const min = rows.reduce((s, r) => s + (r.duration_minutes || 0), 0);
    return { sessions: rows.length, hours: (min / 60).toFixed(2), employees: new Set(rows.map(r => r.employee_id)).size };
  }, [rows]);

  const filteredResources = typeId === ALL ? resources : resources.filter(r => r.resource_type_id === typeId);

  const exportCSV = () => {
    const headers = ['Employee', 'Group', 'Resource Type', 'Resource', 'Role', 'Check-in', 'Check-out', 'Duration', 'Status'];
    const lines = [headers.join(',')];
    rows.forEach(r => {
      lines.push([
        r.employee_name, r.group_name ?? '', r.resource_type_name, r.resource_name,
        r.role_type,
        fmtDateTime(r.checkin_time), fmtDateTime(r.checkout_time),
        fmtDur(r.duration_minutes || 0), r.status,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });
    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `attendance_${fromDate}_${toDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
            </Button>
            <h1 className="text-2xl font-bold">Attendance Reports</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} disabled={rows.length === 0}>
              <Download className="w-4 h-4 mr-1" /> Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/attendance-reports/shift-dashboard')} className="bg-indigo-600 hover:bg-indigo-700">
              <BarChart3 className="w-4 h-4 mr-1" /> Shift Report Dashboard
            </Button>
          </div>
        </div>

        {/* Today dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summary.map(s => (
            <Card key={s.resource_type_id}><CardContent className="pt-4">
              <div className="font-semibold">{s.resource_type_name}</div>
              <div className="text-sm text-muted-foreground">Hôm nay</div>
              <div className="text-2xl font-bold mt-1">{s.today_sessions} <span className="text-sm font-normal text-muted-foreground">sessions</span></div>
              <div className="text-sm">{(s.today_minutes / 60).toFixed(1)}h · {s.active_count} active</div>
            </CardContent></Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Bộ lọc</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><Label>Từ ngày</Label><Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-2" /></div>
              <div><Label>Đến ngày</Label><Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-2" /></div>
              <div><Label>Nhân viên</Label>
                <Select value={empId} onValueChange={setEmpId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Group</Label>
                <Select value={groupId} onValueChange={setGroupId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Resource Type</Label>
                <Select value={typeId} onValueChange={(v) => { setTypeId(v); setResId(ALL); }}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{types.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Resource</Label>
                <Select value={resId} onValueChange={setResId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value={ALL}>Tất cả</SelectItem>{filteredResources.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label>
                <Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Role</Label>
                <Select value={role} onValueChange={setRole}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tất cả</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />} Search
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isLoading}><RotateCcw className="w-4 h-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Sessions</div><div className="text-2xl font-bold mt-1">{totals.sessions}</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Hours</div><div className="text-2xl font-bold mt-1">{totals.hours}</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Employees</div><div className="text-2xl font-bold mt-1">{totals.employees}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Chi tiết phiên</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline mr-2" />Đang tải...</div>
                : rows.length === 0 ? <div className="py-12 text-center text-muted-foreground">Không có dữ liệu</div>
                : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Nhân viên</TableHead><TableHead>Group</TableHead>
                        <TableHead>Type</TableHead><TableHead>Resource</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Bắt đầu</TableHead><TableHead>Kết thúc</TableHead>
                        <TableHead className="text-right">Duration</TableHead><TableHead>Status</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {rows.map(r => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium">{r.employee_name}</TableCell>
                            <TableCell>{r.group_name ?? '—'}</TableCell>
                            <TableCell>{r.resource_type_name}</TableCell>
                            <TableCell>{r.resource_name}</TableCell>
                            <TableCell>{r.role_type === 'primary' ? <Badge className="bg-green-600">Primary</Badge> : <Badge className="bg-amber-600">Support</Badge>}</TableCell>
                            <TableCell>{fmtDateTime(r.checkin_time)}</TableCell>
                            <TableCell>{fmtDateTime(r.checkout_time)}</TableCell>
                            <TableCell className="text-right">{fmtDur(r.duration_minutes || 0)}</TableCell>
                            <TableCell>{r.status === 'active' ? <Badge className="bg-green-600">active</Badge> : <Badge variant="secondary">completed</Badge>}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceReports;
