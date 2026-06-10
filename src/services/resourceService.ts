import { supabase } from '@/integrations/supabase/client';
import type {
  EmployeeGroup, Employee, ResourceType, Resource, ResourceAccess,
  EmployeeCheckin, ReportRow, DashboardSummaryRow, SupportRequest, CheckinRole,
} from '@/types/resources';

const sb = supabase as any;

// ===== READS =====
export async function listEmployeeGroups(): Promise<EmployeeGroup[]> {
  const { data, error } = await sb.from('employee_groups').select('*').order('sort_order').order('name');
  if (error) throw error;
  return data || [];
}

export async function listEmployees(): Promise<Employee[]> {
  const { data, error } = await sb.from('employees').select('*').order('sort_order').order('name');
  if (error) throw error;
  return data || [];
}

export async function listResourceTypes(): Promise<ResourceType[]> {
  const { data, error } = await sb.from('resource_types').select('*').order('sort_order').order('name');
  if (error) throw error;
  return data || [];
}

export async function listResources(): Promise<Resource[]> {
  const { data, error } = await sb.from('resources').select('*').order('sort_order').order('name');
  if (error) throw error;
  return data || [];
}

export async function listResourceAccess(): Promise<ResourceAccess[]> {
  const { data, error } = await sb.from('resource_access').select('*');
  if (error) throw error;
  return data || [];
}

export async function listActiveCheckins(): Promise<EmployeeCheckin[]> {
  const { data, error } = await sb.from('employee_checkins').select('*').eq('status', 'active');
  if (error) throw error;
  return data || [];
}

export async function listOpenSupportRequests(): Promise<SupportRequest[]> {
  const { data, error } = await sb.from('support_requests').select('*').eq('status', 'open');
  if (error) throw error;
  return data || [];
}

// ===== ACTIONS =====
export async function checkinResource(
  employeeId: string,
  resourceId: string,
  notes?: string,
  roleType: CheckinRole = 'primary',
): Promise<string> {
  const { data, error } = await sb.rpc('checkin_resource', {
    p_employee_id: employeeId,
    p_resource_id: resourceId,
    p_notes: notes ?? null,
    p_role_type: roleType,
  });
  if (error) throw error;
  return data as string;
}

export async function checkoutResource(checkinId: string): Promise<void> {
  const { error } = await sb.rpc('checkout_resource', { p_checkin_id: checkinId });
  if (error) throw error;
}

export async function requestSupport(resourceId: string, requesterEmployeeId: string): Promise<string> {
  const { data, error } = await sb.rpc('request_support', {
    p_resource_id: resourceId,
    p_requester_employee_id: requesterEmployeeId,
  });
  if (error) throw error;
  return data as string;
}

export async function cancelSupportRequest(requestId: string): Promise<void> {
  const { error } = await sb.rpc('cancel_support_request', { p_request_id: requestId });
  if (error) throw error;
}

export async function expireSupportRequests(): Promise<void> {
  await sb.rpc('expire_support_requests');
}

export async function sendTelegram(message: string): Promise<void> {
  try {
    const response = await fetch('https://apilive.hanvietair.com/send_check_in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (e) {
    console.error('sendTelegram failed', e);
  }
}

// ===== REPORTS =====
export interface ReportFilters {
  from_date: string; to_date: string;
  emp?: string | null; group_id?: string | null;
  type_id?: string | null; resource_id?: string | null;
  status?: string | null;
  role?: string | null;
}

export async function reportCheckins(f: ReportFilters): Promise<ReportRow[]> {
  const { data, error } = await sb.rpc('report_checkins', {
    from_date: f.from_date,
    to_date: f.to_date,
    emp: f.emp ?? null,
    group_id: f.group_id ?? null,
    type_id: f.type_id ?? null,
    resource_id: f.resource_id ?? null,
    status_f: f.status ?? null,
    role_f: (f as any).role ?? null,
  });
  if (error) throw error;
  return data || [];
}

export async function dashboardSummary(): Promise<DashboardSummaryRow[]> {
  const { data, error } = await sb.rpc('dashboard_summary');
  if (error) throw error;
  return data || [];
}

// ===== ADMIN WRITES =====
export const upsertGroup = (row: Partial<EmployeeGroup>) =>
  sb.from('employee_groups').upsert(row).select().single();
export const deleteGroup = (id: string) => sb.from('employee_groups').delete().eq('id', id);

export const upsertEmployee = (row: Partial<Employee>) =>
  sb.from('employees').upsert(row).select().single();
export const deleteEmployee = (id: string) => sb.from('employees').delete().eq('id', id);

export const upsertResourceType = (row: Partial<ResourceType>) =>
  sb.from('resource_types').upsert(row).select().single();
export const deleteResourceType = (id: string) => sb.from('resource_types').delete().eq('id', id);

export const upsertResource = (row: Partial<Resource>) =>
  sb.from('resources').upsert(row).select().single();
export const deleteResource = (id: string) => sb.from('resources').delete().eq('id', id);

export const addResourceAccess = (resource_id: string, employee_group_id: string) =>
  sb.from('resource_access').insert({ resource_id, employee_group_id });
export const removeResourceAccess = (resource_id: string, employee_group_id: string) =>
  sb.from('resource_access').delete().eq('resource_id', resource_id).eq('employee_group_id', employee_group_id);
