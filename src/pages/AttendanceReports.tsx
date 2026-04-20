import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Search, RotateCcw } from 'lucide-react';

interface Employee { id: string; name: string; }
interface Session {
  employee_id?: string;
  employee_name?: string;
  start_time: string;
  end_time: string | null;
  total_minutes?: number;
}

const fmtDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('vi-VN'); } catch { return iso; }
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const monthAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const AttendanceReports = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fromDate, setFromDate] = useState(monthAgoStr());
  const [toDate, setToDate] = useState(todayStr());
  const [empId, setEmpId] = useState<string>('all');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('employees')
          .select('id, name')
          .order('name');
        if (error) throw error;
        setEmployees((data as Employee[]) || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const { data, error } = await (supabase as any).rpc('report_sessions', {
        from_date: fromDate,
        to_date: toDate,
        emp: empId === 'all' ? null : empId,
      });
      if (error) throw error;
      setSessions((data as Session[]) || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Không tải được báo cáo');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFromDate(monthAgoStr());
    setToDate(todayStr());
    setEmpId('all');
    setSessions([]);
    setHasSearched(false);
  };

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((s, x) => s + (x.total_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(2);
  const employeesCount = new Set(sessions.map((s) => s.employee_id || s.employee_name)).size;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
            </Button>
            <h1 className="text-2xl font-bold">Attendance Reports</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Bộ lọc</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label>Nhân viên</Label>
                <Select value={empId} onValueChange={setEmpId}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={isLoading} className="flex-1">
                  {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Search className="w-4 h-4 mr-1" />}
                  Search
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Sessions</div><div className="text-2xl font-bold mt-1">{totalSessions}</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Total Hours</div><div className="text-2xl font-bold mt-1">{totalHours}</div></CardContent></Card>
              <Card><CardContent className="pt-6"><div className="text-sm text-muted-foreground">Employees</div><div className="text-2xl font-bold mt-1">{employeesCount}</div></CardContent></Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Chi tiết phiên làm việc</CardTitle></CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin inline mr-2" />Đang tải...</div>
                ) : sessions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">Không có dữ liệu</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nhân viên</TableHead>
                          <TableHead>Bắt đầu</TableHead>
                          <TableHead>Kết thúc</TableHead>
                          <TableHead className="text-right">Phút</TableHead>
                          <TableHead className="text-right">Giờ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((s, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{s.employee_name || s.employee_id}</TableCell>
                            <TableCell>{fmtDateTime(s.start_time)}</TableCell>
                            <TableCell>{fmtDateTime(s.end_time)}</TableCell>
                            <TableCell className="text-right">{s.total_minutes ?? 0}</TableCell>
                            <TableCell className="text-right">{((s.total_minutes ?? 0) / 60).toFixed(2)}</TableCell>
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
