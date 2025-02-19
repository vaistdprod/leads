export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          gemini_api_key: string | null
          pagespeed_api_key: string | null
          blacklist_sheet_id: string | null
          contacts_sheet_id: string | null
          impersonated_email: string | null
          column_mappings: Json | null
          temperature: number | null
          top_k: number | null
          top_p: number | null
          use_google_search: boolean | null
          enrichment_prompt: string | null
          email_prompt: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          gemini_api_key?: string | null
          pagespeed_api_key?: string | null
          blacklist_sheet_id?: string | null
          contacts_sheet_id?: string | null
          impersonated_email?: string | null
          column_mappings?: Json | null
          temperature?: number | null
          top_k?: number | null
          top_p?: number | null
          use_google_search?: boolean | null
          enrichment_prompt?: string | null
          email_prompt?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          gemini_api_key?: string | null
          pagespeed_api_key?: string | null
          blacklist_sheet_id?: string | null
          contacts_sheet_id?: string | null
          impersonated_email?: string | null
          column_mappings?: Json | null
          temperature?: number | null
          top_k?: number | null
          top_p?: number | null
          use_google_search?: boolean | null
          enrichment_prompt?: string | null
          email_prompt?: string | null
        }
      }
      processing_logs: {
        Row: {
          id: string
          user_id: string
          created_at: string
          stage: string
          status: string
          message: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          stage: string
          status: string
          message: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          stage?: string
          status?: string
          message?: string
          metadata?: Json | null
        }
      }
      lead_history: {
        Row: {
          id: string
          user_id: string
          created_at: string
          email: string
          status: string
          details: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          email: string
          status: string
          details?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          email?: string
          status?: string
          details?: Json | null
        }
      }
      email_history: {
        Row: {
          id: string
          user_id: string
          created_at: string
          email: string
          subject: string
          status: string
          scheduled_for: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          email: string
          subject: string
          status: string
          scheduled_for?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          email?: string
          subject?: string
          status?: string
          scheduled_for?: string | null
        }
      }
      dashboard_stats: {
        Row: {
          id: string
          user_id: string
          created_at: string
          total_leads: number
          processed_leads: number
          success_rate: number
          last_processed: string | null
          blacklist_count: number
          contacts_count: number
          emails_sent: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          total_leads: number
          processed_leads: number
          success_rate: number
          last_processed?: string | null
          blacklist_count: number
          contacts_count: number
          emails_sent: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          total_leads?: number
          processed_leads?: number
          success_rate?: number
          last_processed?: string | null
          blacklist_count?: number
          contacts_count?: number
          emails_sent?: number
        }
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
  }
}
