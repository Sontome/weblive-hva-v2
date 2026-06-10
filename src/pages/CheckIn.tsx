import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, LogIn, LogOut, Activity, LifeBuoy, HandHelping, Crown, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useResources } from '@/hooks/useResources';
import { useEmployeeIdentity } from '@/hooks/useEmployeeIdentity';
import { EmployeeIdentityModal } from '@/components/attendance/EmployeeIdentityModal';
import { EmployeeIdentityBadge } from '@/components/attendance/EmployeeIdentityBadge';
import {
  checkinResource, checkoutResource, dashboardSummary,
  requestSupport,
} from '@/services/resourceService';
import {
  notifyPrimaryCheckIn, notifyPrimaryCheckOut, notifySupportRequest,
  notifyJoinSupport, notifySupportCheckOut, notifySupportResolved,
} from '@/lib/checkinNotifications';
import type { DashboardSummaryRow, EmployeeCheckin, Resource } from '@/types/resources';

const durMin = (start: string) => Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 60000));
const fmtDur = (m: number) => `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`;
const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch { return iso; } };
const fmtCountdown = (ms: number) => {
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const CheckInPage = () => {
  const navigate = useNavigate();
  const { employees, types, resources, access, active, supportRequests, loading, tick, refreshActive } = useResources();
  const { identity, setEmployee } = useEmployeeIdentity();
  const [summary, setSummary] = useState<DashboardSummaryRow[]>([]);
  const [tab, setTab] = useState<string>('');
  const [busyResourceId, setBusyResourceId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/auth');
    })();
  }, [navigate]);

  useEffect(() => { if (!tab && types.length) setTab(types[0].id); }, [types, tab]);

  const loadSummary = async () => {
    try { setSummary(await dashboardSummary()); } catch (e) { /* ignore */ }
  };
  useEffect(() => { loadSummary(); }, [active.length, supportRequests.length, tick]);

  const empName = (id: string) => employees.find((e) => e.id === id)?.name || id;

  const activeByResource = useMemo(() => {
    const m = new Map<string, EmployeeCheckin[]>();
    active.forEach((a) => {
      if (!m.has(a.resource_id)) m.set(a.resource_id, []);
      m.get(a.resource_id)!.push(a);
    });
    return m;
  }, [active]);

  const openSupportByResource = useMemo(() => {
    const m = new Map<string, typeof supportRequests[number]>();
    supportRequests.forEach((r) => { if (r.status === 'open' && new Date(r.expires_at).getTime() > Date.now()) m.set(r.resource_id, r); });
    return m;
  }, [supportRequests, tick]);

  const allowed = (resourceId: string) => {
    const allowedGroups = access.filter((a) => a.resource_id === resourceId).map((a) => a.employee_group_id);
    if (!identity) return false;
    if (allowedGroups.length === 0) return true;
    const emp = employees.find((e) => e.id === identity.employee_id);
    return !!(emp?.employee_group_id && allowedGroups.includes(emp.employee_group_id));
  };

  const requireIdentity = (): boolean => {
    if (!identity) { toast.error('Vui lòng chọn nhân viên trước'); return false; }
    return true;
  };

  const doPrimaryCheckin = async (r: Resource, rtName: string) => {
    if (!requireIdentity()) return;
    if (!allowed(r.id)) { toast.error('Bạn không có quyền cho resource này'); return; }
    setBusyResourceId(r.id);
    try {
      await checkinResource(identity!.employee_id, r.id, undefined, 'primary');
      toast.success('Check in chính thành công');
      notifyPrimaryCheckIn(identity!.employee_name, rtName, r.name);
      refreshActive();
    } catch (e: any) { toast.error(e.message || 'Check in thất bại'); }
    finally { setBusyResourceId(null); }
  };

  const doCheckout = async (session: EmployeeCheckin, r: Resource, rtName: string) => {
    setBusyResourceId(r.id);
    try {
      await checkoutResource(session.id);
      const dur = durMin(session.checkin_time);
      toast.success('Đã check out');
      const name = empName(session.employee_id);
      if (session.role_type === 'primary') notifyPrimaryCheckOut(name, rtName, r.name, dur);
      else notifySupportCheckOut(name, rtName, r.name, dur);
      refreshActive();
    } catch (e: any) { toast.error(e.message || 'Check out thất bại'); }
    finally { setBusyResourceId(null); }
  };

  const doRequestSupport = async (r: Resource, rtName: string) => {
    if (!requireIdentity()) return;
    setBusyResourceId(r.id);
    try {
      await requestSupport(r.id, identity!.employee_id);
      toast.success('Đã gửi yêu cầu hỗ trợ');
      notifySupportRequest(identity!.employee_name, rtName, r.name);
      refreshActive();
    } catch (e: any) { toast.error(e.message || 'Yêu cầu hỗ trợ thất bại'); }
    finally { setBusyResourceId(null); }
  };

  const doJoinSupport = async (r: Resource, rtName: string) => {
    if (!requireIdentity()) return;
    if (!allowed(r.id)) { toast.error('Bạn không có quyền cho resource này'); return; }
    const req = openSupportByResource.get(r.id);
    setBusyResourceId(r.id);
    try {
      await checkinResource(identity!.employee_id, r.id, undefined, 'support');
      toast.success('Đã vào hỗ trợ');
      const requester = req ? empName(req.requested_by_employee_id) : '';
      notifyJoinSupport(identity!.employee_name, requester, rtName, r.name);
      if (req) {
        const mins = Math.max(0, Math.floor((Date.now() - new Date(req.created_at).getTime()) / 60000));
        notifySupportResolved(requester, identity!.employee_name, rtName, r.name, mins);
      }
      refreshActive();
    } catch (e: any) { toast.error(e.message || 'Vào hỗ trợ thất bại'); }
    finally { setBusyResourceId(null); }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  const activeTypes = types.filter((t) => t.active);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <EmployeeIdentityModal
        open={!identity}
        onSelected={(id, name) => setEmployee(id, name)}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Trang chủ
            </Button>
            <h1 className="text-2xl font-bold">Check In / Check Out</h1>
          </div>
          <div className="flex items-center gap-2">
            <EmployeeIdentityBadge />
            <Button variant="outline" size="sm" onClick={() => navigate('/attendance-reports')}>
              <Activity className="w-4 h-4 mr-1" /> Reports
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {summary.map((s) => (
            <Card key={s.resource_type_id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{s.resource_type_name}</div>
                  <Badge variant="secondary">{s.total_resources}</Badge>
                </div>
                <div className="flex gap-3 text-sm">
                  <span className="text-green-600 font-medium">● {s.active_count} có chính</span>
                  <span className="text-muted-foreground">○ {s.available_count} trống</span>
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
              {activeTypes.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>{t.name}</TabsTrigger>
              ))}
            </TabsList>
            {activeTypes.map((t) => (
              <TabsContent key={t.id} value={t.id}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {resources.filter((r) => r.active && r.resource_type_id === t.id).map((r) => {
                    const sessions = activeByResource.get(r.id) || [];
                    const primary = sessions.find((s) => s.role_type === 'primary');
                    const supports = sessions.filter((s) => s.role_type === 'support');
                    const supportReq = openSupportByResource.get(r.id);
                    const remainingMs = supportReq ? new Date(supportReq.expires_at).getTime() - Date.now() : 0;
                    const busy = busyResourceId === r.id;
                    const mySession = identity ? sessions.find((s) => s.employee_id === identity.employee_id) : undefined;
                    const canJoinSupport = !!identity && !mySession && !!supportReq && remainingMs > 0;

                    return (
                      <Card key={r.id} className={supportReq ? 'border-red-400' : primary ? 'border-green-500' : ''}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between gap-2">
                            <div className="flex flex-col">
                              <span>{r.name}</span>
                              <span className="text-xs font-normal text-muted-foreground">{t.name}</span>
                            </div>
                            {supportReq ? <Badge className="bg-red-600">🔴 Cần hỗ trợ</Badge>
                              : primary ? <Badge className="bg-green-600">🟢 Hoạt động</Badge>
                              : <Badge variant="secondary">Trống</Badge>}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Crown className="w-3 h-3" /> Primary</div>
                            {primary ? (
                              <div className="flex items-center justify-between mt-1">
                                <div>
                                  <div className="font-medium text-sm">{empName(primary.employee_id)}</div>
                                  <div className="text-xs text-muted-foreground">Từ {fmtTime(primary.checkin_time)} · {fmtDur(durMin(primary.checkin_time))}</div>
                                </div>
                                {identity?.employee_id === primary.employee_id && (
                                  <Button size="sm" variant="destructive" disabled={busy} onClick={() => doCheckout(primary, r, t.name)}>
                                    <LogOut className="w-3 h-3 mr-1" /> Check Out
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <Button size="sm" className="w-full mt-1" disabled={busy || !identity} onClick={() => doPrimaryCheckin(r, t.name)}>
                                <LogIn className="w-4 h-4 mr-1" /> Check In Primary
                              </Button>
                            )}
                          </div>

                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Support ({supports.length})</div>
                            {supports.length === 0 ? (
                              <div className="text-xs text-muted-foreground italic mt-1">Chưa có nhân viên hỗ trợ</div>
                            ) : (
                              <ul className="mt-1 space-y-1">
                                {supports.map((s) => (
                                  <li key={s.id} className="flex items-center justify-between text-sm">
                                    <span>
                                      {empName(s.employee_id)}
                                      <span className="text-xs text-muted-foreground ml-1">· {fmtDur(durMin(s.checkin_time))}</span>
                                    </span>
                                    {identity?.employee_id === s.employee_id && (
                                      <Button size="sm" variant="outline" disabled={busy} onClick={() => doCheckout(s, r, t.name)}>
                                        Rời hỗ trợ
                                      </Button>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {supportReq && (
                            <div className="border rounded p-2 bg-red-50 text-xs space-y-0.5">
                              <div><span className="text-muted-foreground">Yêu cầu bởi: </span><span className="font-medium">{empName(supportReq.requested_by_employee_id)}</span></div>
                              <div><span className="text-muted-foreground">Lúc: </span>{fmtTime(supportReq.created_at)}</div>
                              <div><span className="text-muted-foreground">Còn lại: </span><span className="font-mono font-semibold">{fmtCountdown(remainingMs)}</span></div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm" variant="outline" className="flex-1"
                              disabled={busy || !identity || !!supportReq || !primary}
                              onClick={() => doRequestSupport(r, t.name)}
                              title={!primary ? 'Cần có Primary trước' : supportReq ? 'Đã có yêu cầu mở' : ''}
                            >
                              <LifeBuoy className="w-3 h-3 mr-1" /> Request Support
                            </Button>
                            {canJoinSupport && (
                              <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700"
                                disabled={busy} onClick={() => doJoinSupport(r, t.name)}>
                                <HandHelping className="w-3 h-3 mr-1" /> Join Support
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {resources.filter((r) => r.active && r.resource_type_id === t.id).length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-6">Chưa có resource trong loại này.</div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
