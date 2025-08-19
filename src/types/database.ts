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
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_results: {
        Row: {
          ai_confidence: number | null
          analysis_summary: string | null
          bonus_points: number | null
          candidate_name: string | null
          created_at: string | null
          file_id: string
          id: string
          overall_score: number
          penalty_points: number | null
          questions_analysis: Json | null
          raw_ai_output: Json | null
          recommendations: Json | null
          red_flags: Json | null
          role_id: string
          session_id: string
          skills_analysis: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          analysis_summary?: string | null
          bonus_points?: number | null
          candidate_name?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          overall_score: number
          penalty_points?: number | null
          questions_analysis?: Json | null
          raw_ai_output?: Json | null
          recommendations?: Json | null
          red_flags?: Json | null
          role_id: string
          session_id: string
          skills_analysis?: Json | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          analysis_summary?: string | null
          bonus_points?: number | null
          candidate_name?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          overall_score?: number
          penalty_points?: number | null
          questions_analysis?: Json | null
          raw_ai_output?: Json | null
          recommendations?: Json | null
          red_flags?: Json | null
          role_id?: string
          session_id?: string
          skills_analysis?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_results_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_results_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "evaluation_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          role_id: string
          session_name: string | null
          status: string
          total_files: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          role_id: string
          session_name?: string | null
          status?: string
          total_files?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          role_id?: string
          session_name?: string | null
          status?: string
          total_files?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_sessions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      file_uploads: {
        Row: {
          created_at: string | null
          error_details: Json | null
          extracted_text: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          processing_attempts: number
          session_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          extracted_text?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          processing_attempts?: number
          session_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          extracted_text?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          processing_attempts?: number
          session_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_queue: {
        Row: {
          attempts: number
          created_at: string | null
          error_details: Json | null
          file_id: string
          id: string
          priority: string
          scheduled_for: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string | null
          error_details?: Json | null
          file_id: string
          id?: string
          priority?: string
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string | null
          error_details?: Json | null
          file_id?: string
          id?: string
          priority?: string
          scheduled_for?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processing_queue_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      role_questions: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          question_text: string
          role_id: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          question_text: string
          role_id: string
          updated_at?: string | null
          weight: number
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          question_text?: string
          role_id?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_questions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_skills: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean
          role_id: string
          skill_category: string | null
          skill_name: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          role_id: string
          skill_category?: string | null
          skill_name: string
          updated_at?: string | null
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean
          role_id?: string
          skill_category?: string | null
          skill_name?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "role_skills_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          bonus_config: Json | null
          created_at: string | null
          description: string
          education_requirements: Json | null
          experience_requirements: Json | null
          id: string
          is_active: boolean
          penalty_config: Json | null
          responsibilities: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_config?: Json | null
          created_at?: string | null
          description: string
          education_requirements?: Json | null
          experience_requirements?: Json | null
          id?: string
          is_active?: boolean
          penalty_config?: Json | null
          responsibilities?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_config?: Json | null
          created_at?: string | null
          description?: string
          education_requirements?: Json | null
          experience_requirements?: Json | null
          id?: string
          is_active?: boolean
          penalty_config?: Json | null
          responsibilities?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          files_processed: number
          files_total: number
          id: string
          role_id: string
          session_name: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          files_processed?: number
          files_total: number
          id?: string
          role_id: string
          session_name?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          files_processed?: number
          files_total?: number
          id?: string
          role_id?: string
          session_name?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upload_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string | null
          google_id: string | null
          id: string
          last_name: string | null
          microsoft_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          google_id?: string | null
          id: string
          last_name?: string | null
          microsoft_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          google_id?: string | null
          id?: string
          last_name?: string | null
          microsoft_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_files_processed: {
        Args: {
          session_id: string
        }
        Returns: undefined
      }
      requeue_failed_processing: {
        Args: {
          max_attempts?: number
        }
        Returns: number
      }
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