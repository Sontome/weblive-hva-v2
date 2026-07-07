export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      employee_checkins: {
        Row: {
          checkin_time: string
          checkout_time: string | null
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          resource_id: string
          role_type: Database["public"]["Enums"]["checkin_role"]
          status: Database["public"]["Enums"]["checkin_status"]
        }
        Insert: {
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          resource_id: string
          role_type?: Database["public"]["Enums"]["checkin_role"]
          status?: Database["public"]["Enums"]["checkin_status"]
        }
        Update: {
          checkin_time?: string
          checkout_time?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          resource_id?: string
          role_type?: Database["public"]["Enums"]["checkin_role"]
          status?: Database["public"]["Enums"]["checkin_status"]
        }
        Relationships: [
          {
            foreignKeyName: "employee_checkins_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_checkins_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_groups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          employee_group_id: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          employee_group_id?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          employee_group_id?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_employee_group_id_fkey"
            columns: ["employee_group_id"]
            isOneToOne: false
            referencedRelation: "employee_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      held_ticket_segments: {
        Row: {
          arrival_airport: string
          created_at: string
          departure_airport: string
          departure_date: string
          departure_time: string
          held_ticket_id: string
          id: string
          segment_order: number
          trip: string
        }
        Insert: {
          arrival_airport: string
          created_at?: string
          departure_airport: string
          departure_date: string
          departure_time: string
          held_ticket_id: string
          id?: string
          segment_order: number
          trip: string
        }
        Update: {
          arrival_airport?: string
          created_at?: string
          departure_airport?: string
          departure_date?: string
          departure_time?: string
          held_ticket_id?: string
          id?: string
          segment_order?: number
          trip?: string
        }
        Relationships: [
          {
            foreignKeyName: "held_ticket_segments_held_ticket_id_fkey"
            columns: ["held_ticket_id"]
            isOneToOne: false
            referencedRelation: "held_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      held_tickets: {
        Row: {
          airline: string
          created_at: string
          employee_name: string | null
          expire_date: string | null
          hold_date: string
          id: string
          namelist: string[]
          number_person: number
          payment_status: boolean
          pnr: string
          ticket_status: string
          total_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          airline: string
          created_at?: string
          employee_name?: string | null
          expire_date?: string | null
          hold_date?: string
          id?: string
          namelist?: string[]
          number_person?: number
          payment_status?: boolean
          pnr: string
          ticket_status?: string
          total_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          airline?: string
          created_at?: string
          employee_name?: string | null
          expire_date?: string | null
          hold_date?: string
          id?: string
          namelist?: string[]
          number_person?: number
          payment_status?: boolean
          pnr?: string
          ticket_status?: string
          total_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      price_configs: {
        Row: {
          created_at: string
          customer_mode: string
          id: string
          one_way_fee: number
          other_discount_ow_1: number
          other_discount_ow_2: number
          other_discount_ow_3: number
          other_discount_ow_4: number
          other_discount_ow_5: number
          other_discount_rt_1: number
          other_discount_rt_2: number
          other_discount_rt_3: number
          other_discount_rt_4: number
          other_discount_rt_5: number
          other_threshold_1: number
          other_threshold_2: number
          other_threshold_3: number
          other_threshold_4: number
          other_threshold_5: number
          round_trip_fee_other: number
          round_trip_fee_vietjet: number
          round_trip_fee_vna: number
          sunpq_discount_ow_1: number
          sunpq_discount_ow_2: number
          sunpq_discount_ow_3: number
          sunpq_discount_ow_4: number
          sunpq_discount_ow_5: number
          sunpq_discount_rt_1: number
          sunpq_discount_rt_2: number
          sunpq_discount_rt_3: number
          sunpq_discount_rt_4: number
          sunpq_discount_rt_5: number
          sunpq_one_way_fee: number
          sunpq_round_trip_fee: number
          sunpq_threshold_1: number
          sunpq_threshold_2: number
          sunpq_threshold_3: number
          sunpq_threshold_4: number
          sunpq_threshold_5: number
          updated_at: string
          vietjet_discount_ow_1: number
          vietjet_discount_ow_2: number
          vietjet_discount_ow_3: number
          vietjet_discount_ow_4: number
          vietjet_discount_ow_5: number
          vietjet_discount_rt_1: number
          vietjet_discount_rt_2: number
          vietjet_discount_rt_3: number
          vietjet_discount_rt_4: number
          vietjet_discount_rt_5: number
          vietjet_threshold_1: number
          vietjet_threshold_2: number
          vietjet_threshold_3: number
          vietjet_threshold_4: number
          vietjet_threshold_5: number
          vna_discount_ow_1: number
          vna_discount_ow_2: number
          vna_discount_ow_3: number
          vna_discount_ow_4: number
          vna_discount_ow_5: number
          vna_discount_rt_1: number
          vna_discount_rt_2: number
          vna_discount_rt_3: number
          vna_discount_rt_4: number
          vna_discount_rt_5: number
          vna_threshold_1: number
          vna_threshold_2: number
          vna_threshold_3: number
          vna_threshold_4: number
          vna_threshold_5: number
        }
        Insert: {
          created_at?: string
          customer_mode: string
          id?: string
          one_way_fee?: number
          other_discount_ow_1?: number
          other_discount_ow_2?: number
          other_discount_ow_3?: number
          other_discount_ow_4?: number
          other_discount_ow_5?: number
          other_discount_rt_1?: number
          other_discount_rt_2?: number
          other_discount_rt_3?: number
          other_discount_rt_4?: number
          other_discount_rt_5?: number
          other_threshold_1?: number
          other_threshold_2?: number
          other_threshold_3?: number
          other_threshold_4?: number
          other_threshold_5?: number
          round_trip_fee_other?: number
          round_trip_fee_vietjet?: number
          round_trip_fee_vna?: number
          sunpq_discount_ow_1?: number
          sunpq_discount_ow_2?: number
          sunpq_discount_ow_3?: number
          sunpq_discount_ow_4?: number
          sunpq_discount_ow_5?: number
          sunpq_discount_rt_1?: number
          sunpq_discount_rt_2?: number
          sunpq_discount_rt_3?: number
          sunpq_discount_rt_4?: number
          sunpq_discount_rt_5?: number
          sunpq_one_way_fee?: number
          sunpq_round_trip_fee?: number
          sunpq_threshold_1?: number
          sunpq_threshold_2?: number
          sunpq_threshold_3?: number
          sunpq_threshold_4?: number
          sunpq_threshold_5?: number
          updated_at?: string
          vietjet_discount_ow_1?: number
          vietjet_discount_ow_2?: number
          vietjet_discount_ow_3?: number
          vietjet_discount_ow_4?: number
          vietjet_discount_ow_5?: number
          vietjet_discount_rt_1?: number
          vietjet_discount_rt_2?: number
          vietjet_discount_rt_3?: number
          vietjet_discount_rt_4?: number
          vietjet_discount_rt_5?: number
          vietjet_threshold_1?: number
          vietjet_threshold_2?: number
          vietjet_threshold_3?: number
          vietjet_threshold_4?: number
          vietjet_threshold_5?: number
          vna_discount_ow_1?: number
          vna_discount_ow_2?: number
          vna_discount_ow_3?: number
          vna_discount_ow_4?: number
          vna_discount_ow_5?: number
          vna_discount_rt_1?: number
          vna_discount_rt_2?: number
          vna_discount_rt_3?: number
          vna_discount_rt_4?: number
          vna_discount_rt_5?: number
          vna_threshold_1?: number
          vna_threshold_2?: number
          vna_threshold_3?: number
          vna_threshold_4?: number
          vna_threshold_5?: number
        }
        Update: {
          created_at?: string
          customer_mode?: string
          id?: string
          one_way_fee?: number
          other_discount_ow_1?: number
          other_discount_ow_2?: number
          other_discount_ow_3?: number
          other_discount_ow_4?: number
          other_discount_ow_5?: number
          other_discount_rt_1?: number
          other_discount_rt_2?: number
          other_discount_rt_3?: number
          other_discount_rt_4?: number
          other_discount_rt_5?: number
          other_threshold_1?: number
          other_threshold_2?: number
          other_threshold_3?: number
          other_threshold_4?: number
          other_threshold_5?: number
          round_trip_fee_other?: number
          round_trip_fee_vietjet?: number
          round_trip_fee_vna?: number
          sunpq_discount_ow_1?: number
          sunpq_discount_ow_2?: number
          sunpq_discount_ow_3?: number
          sunpq_discount_ow_4?: number
          sunpq_discount_ow_5?: number
          sunpq_discount_rt_1?: number
          sunpq_discount_rt_2?: number
          sunpq_discount_rt_3?: number
          sunpq_discount_rt_4?: number
          sunpq_discount_rt_5?: number
          sunpq_one_way_fee?: number
          sunpq_round_trip_fee?: number
          sunpq_threshold_1?: number
          sunpq_threshold_2?: number
          sunpq_threshold_3?: number
          sunpq_threshold_4?: number
          sunpq_threshold_5?: number
          updated_at?: string
          vietjet_discount_ow_1?: number
          vietjet_discount_ow_2?: number
          vietjet_discount_ow_3?: number
          vietjet_discount_ow_4?: number
          vietjet_discount_ow_5?: number
          vietjet_discount_rt_1?: number
          vietjet_discount_rt_2?: number
          vietjet_discount_rt_3?: number
          vietjet_discount_rt_4?: number
          vietjet_discount_rt_5?: number
          vietjet_threshold_1?: number
          vietjet_threshold_2?: number
          vietjet_threshold_3?: number
          vietjet_threshold_4?: number
          vietjet_threshold_5?: number
          vna_discount_ow_1?: number
          vna_discount_ow_2?: number
          vna_discount_ow_3?: number
          vna_discount_ow_4?: number
          vna_discount_ow_5?: number
          vna_discount_rt_1?: number
          vna_discount_rt_2?: number
          vna_discount_rt_3?: number
          vna_discount_rt_4?: number
          vna_discount_rt_5?: number
          vna_threshold_1?: number
          vna_threshold_2?: number
          vna_threshold_3?: number
          vna_threshold_4?: number
          vna_threshold_5?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_access: {
        Row: {
          created_at: string
          employee_group_id: string
          id: string
          resource_id: string
        }
        Insert: {
          created_at?: string
          employee_group_id: string
          id?: string
          resource_id: string
        }
        Update: {
          created_at?: string
          employee_group_id?: string
          id?: string
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_access_employee_group_id_fkey"
            columns: ["employee_group_id"]
            isOneToOne: false
            referencedRelation: "employee_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_access_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_types: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          resource_type_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource_type_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource_type_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_resource_type_id_fkey"
            columns: ["resource_type_id"]
            isOneToOne: false
            referencedRelation: "resource_types"
            referencedColumns: ["id"]
          },
        ]
      }
      route_discounts: {
        Row: {
          airline_code: string
          created_at: string
          destination_code: string
          discount_amount: number
          id: string
          is_active: boolean
          origin_code: string
          updated_at: string
        }
        Insert: {
          airline_code?: string
          created_at?: string
          destination_code: string
          discount_amount?: number
          id?: string
          is_active?: boolean
          origin_code: string
          updated_at?: string
        }
        Update: {
          airline_code?: string
          created_at?: string
          destination_code?: string
          discount_amount?: number
          id?: string
          is_active?: boolean
          origin_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          requested_by_employee_id: string
          resolved_at: string | null
          resolved_by_employee_id: string | null
          resource_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          requested_by_employee_id: string
          resolved_at?: string | null
          resolved_by_employee_id?: string | null
          resource_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          requested_by_employee_id?: string
          resolved_at?: string | null
          resolved_by_employee_id?: string | null
          resource_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_requested_by_employee_id_fkey"
            columns: ["requested_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_resolved_by_employee_id_fkey"
            columns: ["resolved_by_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_campaigns: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_rules: {
        Row: {
          action: string
          airline: string | null
          arrival_time: string | null
          campaign_id: string
          created_at: string
          departure_time: string | null
          enabled: boolean
          id: string
          priority: number
          route: string | null
          updated_at: string
          value: string | null
        }
        Insert: {
          action?: string
          airline?: string | null
          arrival_time?: string | null
          campaign_id: string
          created_at?: string
          departure_time?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          route?: string | null
          updated_at?: string
          value?: string | null
        }
        Update: {
          action?: string
          airline?: string | null
          arrival_time?: string | null
          campaign_id?: string
          created_at?: string
          departure_time?: string | null
          enabled?: boolean
          id?: string
          priority?: number
          route?: string | null
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ticket_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_checkout_all: { Args: never; Returns: number }
      cancel_support_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      checkin_resource:
        | {
            Args: {
              p_employee_id: string
              p_notes?: string
              p_resource_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_employee_id: string
              p_notes?: string
              p_resource_id: string
              p_role_type?: string
            }
            Returns: string
          }
      checkout_resource: { Args: { p_checkin_id: string }; Returns: undefined }
      dashboard_summary: {
        Args: never
        Returns: {
          active_count: number
          available_count: number
          resource_type_id: string
          resource_type_name: string
          today_minutes: number
          today_sessions: number
          total_resources: number
        }[]
      }
      expire_support_requests: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      report_checkins:
        | {
            Args: {
              emp?: string
              from_date: string
              group_id?: string
              resource_id?: string
              status_f?: string
              to_date: string
              type_id?: string
            }
            Returns: {
              checkin_time: string
              checkout_time: string
              duration_minutes: number
              employee_id: string
              employee_name: string
              group_id: string
              group_name: string
              id: string
              resource_id: string
              resource_name: string
              resource_type_id: string
              resource_type_name: string
              status: string
            }[]
          }
        | {
            Args: {
              emp?: string
              from_date: string
              group_id?: string
              resource_id?: string
              role_f?: string
              status_f?: string
              to_date: string
              type_id?: string
            }
            Returns: {
              checkin_time: string
              checkout_time: string
              duration_minutes: number
              employee_id: string
              employee_name: string
              group_id: string
              group_name: string
              id: string
              resource_id: string
              resource_name: string
              resource_type_id: string
              resource_type_name: string
              role_type: string
              status: string
            }[]
          }
      request_support: {
        Args: { p_requester_employee_id: string; p_resource_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
      checkin_role: "primary" | "support"
      checkin_status: "active" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      checkin_role: ["primary", "support"],
      checkin_status: ["active", "completed"],
    },
  },
} as const
