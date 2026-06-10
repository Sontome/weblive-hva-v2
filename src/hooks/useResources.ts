import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  listEmployeeGroups, listEmployees, listResourceTypes, listResources,
  listResourceAccess, listActiveCheckins, listOpenSupportRequests, expireSupportRequests,
} from '@/services/resourceService';
import { notifySupportExpired } from '@/lib/checkinNotifications';
import type {
  EmployeeGroup, Employee, ResourceType, Resource, ResourceAccess, EmployeeCheckin, SupportRequest,
} from '@/types/resources';

export function useResources() {
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [access, setAccess] = useState<ResourceAccess[]>([]);
  const [active, setActive] = useState<EmployeeCheckin[]>([]);
  const [supportRequests, setSupportRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [g, e, t, r, a, c, sr] = await Promise.all([
        listEmployeeGroups(), listEmployees(), listResourceTypes(),
        listResources(), listResourceAccess(), listActiveCheckins(), listOpenSupportRequests(),
      ]);
      setGroups(g); setEmployees(e); setTypes(t);
      setResources(r); setAccess(a); setActive(c); setSupportRequests(sr);
    } catch (err) {
      console.error('useResources load error', err);
    } finally { setLoading(false); }
  }, []);

  const refreshActive = useCallback(async () => {
    try {
      const [a, sr] = await Promise.all([listActiveCheckins(), listOpenSupportRequests()]);
      setActive(a); setSupportRequests(sr);
    } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const ch = (supabase as any)
      .channel('checkins-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_checkins' }, () => refreshActive())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_requests' }, () => refreshActive())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [refreshActive]);

  // tick for duration display + auto-expire support requests
  useEffect(() => {
    const i = setInterval(async () => {
      setTick((t) => t + 1);
      try {
        const toExpire = supportRequests.filter((r) => new Date(r.expires_at).getTime() <= Date.now());
        if (toExpire.length) {
          await expireSupportRequests();
          for (const r of toExpire) {
            const res = resources.find((x) => x.id === r.resource_id);
            const t = res ? types.find((x) => x.id === res.resource_type_id) : undefined;
            const requester = employees.find((e) => e.id === r.requested_by_employee_id);
            if (res && t && requester) {
              notifySupportExpired(requester.name, t.name, res.name);
            }
          }
          refreshActive();
        }
      } catch { /* ignore */ }
    }, 15000);
    return () => clearInterval(i);
  }, [supportRequests, refreshActive, resources, types, employees]);

  return { groups, employees, types, resources, access, active, supportRequests, loading, refresh, refreshActive, tick };
}
