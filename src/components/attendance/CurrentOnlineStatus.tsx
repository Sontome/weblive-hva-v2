import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineRow {
  employee_id: string;
  started_at: string;
  employees?: { name: string } | null;
}

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

export const CurrentOnlineStatus = ({ refreshKey = 0 }: { refreshKey?: number }) => {
  const [rows, setRows] = useState<OnlineRow[]>([]);

  const load = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('current_online')
        .select('employee_id, started_at, employees(name)');
      if (error) throw error;
      setRows((data as OnlineRow[]) || []);
    } catch (err) {
      // Fallback: bảng có thể chưa tồn tại - hiển thị offline
      setRows([]);
    }
  };

  useEffect(() => {
    load();
    const channel = (supabase as any)
      .channel('current_online_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'current_online' }, () => load())
      .subscribe();
    return () => {
      (supabase as any).removeChannel(channel);
    };
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
        <div key={r.employee_id} className="flex items-center gap-1.5">
          <span className="relative inline-flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-green-500" />
          </span>
          <span className="font-medium text-foreground">
            {r.employees?.name || r.employee_id}
          </span>
          <span className="text-muted-foreground">since {formatTime(r.started_at)}</span>
        </div>
      ))}
    </div>
  );
};
