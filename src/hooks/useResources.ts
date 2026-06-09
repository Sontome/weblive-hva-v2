import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  listEmployeeGroups, listEmployees, listResourceTypes, listResources,
  listResourceAccess, listActiveCheckins,
} from '@/services/resourceService';
import type {
  EmployeeGroup, Employee, ResourceType, Resource, ResourceAccess, EmployeeCheckin,
} from '@/types/resources';

export function useResources() {
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [access, setAccess] = useState<ResourceAccess[]>([]);
  const [active, setActive] = useState<EmployeeCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [g, e, t, r, a, c] = await Promise.all([
        listEmployeeGroups(), listEmployees(), listResourceTypes(),
        listResources(), listResourceAccess(), listActiveCheckins(),
      ]);
      setGroups(g); setEmployees(e); setTypes(t);
      setResources(r); setAccess(a); setActive(c);
    } catch (err) {
      console.error('useResources load error', err);
    } finally { setLoading(false); }
  }, []);

  const refreshActive = useCallback(async () => {
    try { setActive(await listActiveCheckins()); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const ch = (supabase as any)
      .channel('checkins-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_checkins' }, () => refreshActive())
      .subscribe();
    return () => { (supabase as any).removeChannel(ch); };
  }, [refreshActive]);

  // tick for duration display
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(i);
  }, []);

  return { groups, employees, types, resources, access, active, loading, refresh, refreshActive, tick };
}
