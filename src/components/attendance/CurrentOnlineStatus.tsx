import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineRow {
  id: string;
  employee_id: string;
  resource_id: string;
  checkin_time: string;
  role_type?: 'primary' | 'support';
  employee_name?: string;
  resource_name?: string;
}

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch { return iso; }
};

export const CurrentOnlineStatus = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [rows, setRows] = useState<OnlineRow[]>([]);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('employee_checkins')
        .select('id, employee_id, resource_id, checkin_time, role_type, employees(name), resources(name)')
        .eq('status', 'active');
      if (error) throw error;
      setRows(((data as any[]) || []).map(r => ({
        id: r.id, employee_id: r.employee_id, resource_id: r.resource_id,
        checkin_time: r.checkin_time, role_type: r.role_type,
        employee_name: r.employees?.name, resource_name: r.resources?.name,
      })));
    } catch (err) { setRows([]); }
  };

  useEffect(() => {
    load();
    const channel = (supabase as any)
      .channel('checkins_online')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_checkins' }, () => load())
      .subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [refreshKey]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
        Không có ai online
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-1.5">
          <span className="relative inline-flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${r.role_type === 'support' ? 'bg-amber-500' : 'bg-green-500'}`} />
          </span>
          <span className="font-medium text-foreground">
            {r.employee_name || r.employee_id}
            {r.resource_name ? <span className="text-muted-foreground"> @ {r.resource_name}</span> : null}
            {r.role_type === 'support' ? <span className="ml-1 text-[10px] uppercase text-amber-600 font-semibold">SUP</span> : null}
          </span>
          <span className="text-muted-foreground">since {formatTime(r.checkin_time)}</span>
        </div>
      ))}
    </div>
  );
};
