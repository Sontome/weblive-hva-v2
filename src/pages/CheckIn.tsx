import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, LogIn, LogOut, Users, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useResources } from '@/hooks/useResources';
import { checkinResource, checkoutResource, dashboardSummary } from '@/services/resourceService';
import type { DashboardSummaryRow, Resource } from '@/types/resources';

const fmtTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};
const durMin = (start: string) => {
  try { return Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 60000)); }
  catch { return 0; }
};
const fmtDur = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;

const CheckInPage = () => {
  const navigate = useNavigate();
  const { groups, employees, types, resources, access, active, loading, tick, refreshActive } = useResources();
  const [summary, setSummary] = useState<DashboardSummaryRow[]>([]);
  const [tab, setTab] = useState<string>('');
  const [dialogResource, setDialogResource] = useState<Resource | null>(null);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/auth');
    })();
  }, [navigate]);

  useEffect(() => {
    if (!tab && types.length) setTab(types[0].id);
  }, [types, tab]);

  const loadSummary = async () => {
    try { setSummary(await dashboardSummary()); } catch (e) { /* ignore */ }
  };
  useEffect(() => { loadSummary(); }, [active.length, tick]);

  const activeByResource = useMemo(() => {
    const m = new Map<string, typeof active[number]>();
    active.forEach(a => m.set(a.resource_id, a));
    return m;
  }, [active]);

  const empName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const allowedEmployees = (resourceId: string) => {
    const allowedGroups = access.filter(a => a.resource_id === resourceId).map(a => a.employee_group_id);
    const list = employees.filter(e => e.active);
    if (allowedGroups.length === 0) return list;
    return list.filter(e => e.employee_group_id && allowedGroups.includes(e.employee_group_id));
  };

  const openCheckin = (r: Resource) => { setDialogResource(r); setSelectedEmp(''); };

  const doCheckin = async () => {
    if (!dialogResource || !selectedEmp) { toast.error('Vui lòng chọn nhân viên'); return; }
    setSubmitting(true);
    try {
      await checkinResource(selectedEmp, dialogResource.id);
      toast.success('Check in thành công');
      setDialogResource(null);
      refreshActive();
    } catch (e: any) {
      toast.error(e.message || 'Check in thất bại');
    } finally { setSubmitting(false); }
  };

  const doCheckout = async (checkinId: string) => {
    try {
      await checkoutResource(checkinId);
      toast.success('Đã check out');
      refreshActive();
    } catch (e: any) {
      toast.error(e.message || 'Check out thất bại');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const activeTypes = types.filter(t => t.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
            </Button>
            <h1 className="text-2xl font-bold">Check In / Check Out</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/attendance-reports')}>
            <Activity className="w-4 h-4 mr-1" /> Reports
          </Button>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {summary.map(s => (
            <Card key={s.resource_type_id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{s.resource_type_name}</div>
                  <Badge variant="secondary">{s.total_resources}</Badge>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600 font-medium">● {s.active_count} active</span>
                  <span className="text-muted-foreground">○ {s.available_count} free</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Hôm nay: {s.today_sessions} sessions · {(s.today_minutes / 60).toFixed(1)}h
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeTypes.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            Chưa có Resource Type nào. Vào Admin → Resources để cấu hình.
          </CardContent></Card>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex flex-wrap h-auto">
              {activeTypes.map(t => (
                <TabsTrigger key={t.id} value={t.id}>{t.name}</TabsTrigger>
              ))}
            </TabsList>
            {activeTypes.map(t => (
              <TabsContent key={t.id} value={t.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {resources.filter(r => r.active && r.resource_type_id === t.id).map(r => {
                    const a = activeByResource.get(r.id);
                    return (
                      <Card key={r.id} className={a ? 'border-green-500' : ''}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            {r.name}
                            {a && <Badge className="bg-green-600">Đang dùng</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {a ? (
                            <div className="space-y-2">
                              <div className="text-sm"><Users className="w-3 h-3 inline mr-1" /> <span className="font-medium">{empName(a.employee_id)}</span></div>
                              <div className="text-xs text-muted-foreground">Check-in: {fmtTime(a.checkin_time)} · {fmtDur(durMin(a.checkin_time))}</div>
                              <Button size="sm" variant="destructive" className="w-full" onClick={() => doCheckout(a.id)}>
                                <LogOut className="w-4 h-4 mr-1" /> Check Out
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-sm text-muted-foreground">Available</div>
                              <Button size="sm" className="w-full" onClick={() => openCheckin(r)}>
                                <LogIn className="w-4 h-4 mr-1" /> Check In
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {resources.filter(r => r.active && r.resource_type_id === t.id).length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-6">Chưa có resource trong loại này.</div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <Dialog open={!!dialogResource} onOpenChange={(o) => !o && setDialogResource(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check in: {dialogResource?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label>Nhân viên</Label>
            <Select value={selectedEmp} onValueChange={setSelectedEmp}>
              <SelectTrigger className="mt-2"><SelectValue placeholder="Chọn nhân viên" /></SelectTrigger>
              <SelectContent>
                {dialogResource && allowedEmployees(dialogResource.id).map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}{e.employee_group_id ? ` — ${groups.find(g => g.id === e.employee_group_id)?.name ?? ''}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {dialogResource && allowedEmployees(dialogResource.id).length === 0 && (
              <div className="text-xs text-destructive mt-2">Không có nhân viên đủ điều kiện cho resource này.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogResource(null)} disabled={submitting}>Hủy</Button>
            <Button onClick={doCheckin} disabled={submitting || !selectedEmp}>
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInPage;
