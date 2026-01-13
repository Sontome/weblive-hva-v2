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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
