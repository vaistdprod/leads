export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_usage: {
        Row: {
          created_at: string | null
          details: Json | null
          duration: number
          endpoint: string
          id: string
          service: string
          status: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duration: number
          endpoint: string
          id?: string
          service: string
          status: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          details: Json | null
          duration?: number
          endpoint?: string
          id?: string
          service?: string
          status?: number
          user_id?: string
        }
        Relationships: []
      }
      dashboard_stats: {
        Row: {
          blacklist_count: number | null
          contacts_count: number | null
          created_at: string | null
          emails_queued: number | null
          emails_sent: number | null
          id: string
          last_processed: string | null
          processed_leads: number | null
          success_rate: number | null
          total_leads: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          blacklist_count?: number | null
          contacts_count?: number | null
          created_at?: string | null
          emails_queued?: number | null
          emails_sent?: number | null
          id?: string
          last_processed?: string | null
          processed_leads?: number | null
          success_rate?: number | null
          total_leads?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          blacklist_count?: number | null
          contacts_count?: number | null
          created_at?: string | null
          emails_queued?: number | null
          emails_sent?: number | null
          id?: string
          last_processed?: string | null
          processed_leads?: number | null
          success_rate?: number | null
          total_leads?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_history: {
        Row: {
          created_at: string | null
          email: string
          error: string | null
          id: string
          status: string
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          error?: string | null
          id?: string
          status: string
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          error?: string | null
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      function_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          function_name: string
          id: string
          input_params: Json | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          function_name: string
          id?: string
          input_params?: Json | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          function_name?: string
          id?: string
          input_params?: Json | null
        }
        Relationships: []
      }
      lead_history: {
        Row: {
          created_at: string | null
          details: Json | null
          email: string
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          email: string
          id?: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          email?: string
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      processing_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          duration: number | null
          id: string
          leads_processed: number | null
          leads_success: number | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          duration?: number | null
          id?: string
          leads_processed?: number | null
          leads_success?: number | null
          status: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details: Json | null
          duration?: number | null
          id?: string
          leads_processed?: number | null
          leads_success?: number | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_execution_enabled: boolean | null
          blacklist_sheet_id: string | null
          contacts_sheet_id: string | null
          created_at: string | null
          cron_schedule: string | null
          email_prompt: string | null
          enrichment_prompt: string | null
          gemini_api_key: string | null
          id: string
          impersonated_email: string | null
          model: string | null
          temperature: number | null
          top_k: number | null
          top_p: number | null
          updated_at: string | null
          use_google_search: boolean | null
          user_id: string
          column_mappings: {
            name: string
            email: string
            company: string
            position: string
            scheduledFor: string
            status: string
          } | null
        }
        Insert: {
          auto_execution_enabled?: boolean | null
          blacklist_sheet_id?: string | null
          contacts_sheet_id?: string | null
          created_at?: string | null
          cron_schedule?: string | null
          email_prompt?: string | null
          enrichment_prompt?: string | null
          gemini_api_key?: string | null
          id?: string
          impersonated_email?: string | null
          model?: string | null
          temperature?: number | null
          top_k?: number | null
          top_p?: number | null
          updated_at?: string | null
          use_google_search?: boolean | null
          user_id: string
        }
        Update: {
          auto_execution_enabled?: boolean | null
          blacklist_sheet_id?: string | null
          contacts_sheet_id?: string | null
          created_at?: string | null
          cron_schedule?: string | null
          email_prompt?: string | null
          enrichment_prompt?: string | null
          gemini_api_key?: string | null
          id?: string
          impersonated_email?: string | null
          model?: string | null
          temperature?: number | null
          top_k?: number | null
          top_p?: number | null
          updated_at?: string | null
          use_google_search?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
