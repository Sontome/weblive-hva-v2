import { useCallback, useEffect, useState } from 'react';

const KEY = 'employee_identity_v1';

export interface EmployeeIdentity {
  employee_id: string;
  employee_name: string;
  selected_at: string;
}

function read(): EmployeeIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EmployeeIdentity) : null;
  } catch { return null; }
}

export function useEmployeeIdentity() {
  const [identity, setIdentity] = useState<EmployeeIdentity | null>(() => read());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setIdentity(read()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setEmployee = useCallback((employee_id: string, employee_name: string) => {
    const v: EmployeeIdentity = { employee_id, employee_name, selected_at: new Date().toISOString() };
    localStorage.setItem(KEY, JSON.stringify(v));
    setIdentity(v);
  }, []);

  const clearEmployee = useCallback(() => {
    localStorage.removeItem(KEY);
    setIdentity(null);
  }, []);

  return { identity, setEmployee, clearEmployee };
}
