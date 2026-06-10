export interface EmployeeGroup {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

export interface Employee {
  id: string;
  name: string;
  employee_group_id: string | null;
  active: boolean;
  sort_order: number;
}

export interface ResourceType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
}

export interface Resource {
  id: string;
  resource_type_id: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
}

export interface ResourceAccess {
  id: string;
  resource_id: string;
  employee_group_id: string;
}

export type CheckinStatus = 'active' | 'completed';
export type CheckinRole = 'primary' | 'support';

export interface EmployeeCheckin {
  id: string;
  employee_id: string;
  resource_id: string;
  checkin_time: string;
  checkout_time: string | null;
  status: CheckinStatus;
  notes: string | null;
  created_at: string;
  role_type: CheckinRole;
}

export interface ActiveSessionView extends EmployeeCheckin {
  employee_name: string;
}

export interface ReportRow {
  id: string;
  employee_id: string;
  employee_name: string;
  group_id: string | null;
  group_name: string | null;
  resource_type_id: string;
  resource_type_name: string;
  resource_id: string;
  resource_name: string;
  checkin_time: string;
  checkout_time: string | null;
  duration_minutes: number;
  status: CheckinStatus;
  role_type: CheckinRole;
}

export interface DashboardSummaryRow {
  resource_type_id: string;
  resource_type_name: string;
  total_resources: number;
  active_count: number;
  available_count: number;
  today_sessions: number;
  today_minutes: number;
}

export type SupportRequestStatus = 'open' | 'resolved' | 'expired' | 'cancelled';

export interface SupportRequest {
  id: string;
  resource_id: string;
  requested_by_employee_id: string;
  status: SupportRequestStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by_employee_id: string | null;
  expires_at: string;
}
