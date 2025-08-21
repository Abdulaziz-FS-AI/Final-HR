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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
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
          ai_model_used: string | null
          ai_tokens_used: number | null
          bonus_points: number | null
          candidate_email: string | null
          candidate_name: string | null
          candidate_phone: string | null
          created_at: string | null
          education_score: number | null
          evaluated_at: string | null
          expanded_view: Json
          experience_score: number | null
          file_id: string | null
          id: string
          is_reviewed: boolean | null
          is_shortlisted: boolean | null
          match_level: string | null
          overall_score: number
          penalty_points: number | null
          questions_score: number | null
          review_notes: string | null
          reviewed_at: string | null
          role_id: string | null
          session_id: string
          skills_score: number | null
          status: string
          table_view: Json
          user_id: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_model_used?: string | null
          ai_tokens_used?: number | null
          bonus_points?: number | null
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          created_at?: string | null
          education_score?: number | null
          evaluated_at?: string | null
          expanded_view: Json
          experience_score?: number | null
          file_id?: string | null
          id?: string
          is_reviewed?: boolean | null
          is_shortlisted?: boolean | null
          match_level?: string | null
          overall_score: number
          penalty_points?: number | null
          questions_score?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          role_id?: string | null
          session_id: string
          skills_score?: number | null
          status: string
          table_view: Json
          user_id?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_model_used?: string | null
          ai_tokens_used?: number | null
          bonus_points?: number | null
          candidate_email?: string | null
          candidate_name?: string | null
          candidate_phone?: string | null
          created_at?: string | null
          education_score?: number | null
          evaluated_at?: string | null
          expanded_view?: Json
          experience_score?: number | null
          file_id?: string | null
          id?: string
          is_reviewed?: boolean | null
          is_shortlisted?: boolean | null
          match_level?: string | null
          overall_score?: number
          penalty_points?: number | null
          questions_score?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          role_id?: string | null
          session_id?: string
          skills_score?: number | null
          status?: string
          table_view?: Json
          user_id?: string | null
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
          failed_resumes: number | null
          id: string
          processed_resumes: number | null
          role_id: string
          role_snapshot: Json
          session_name: string | null
          started_at: string | null
          status: string | null
          total_resumes: number
          upload_session_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          failed_resumes?: number | null
          id?: string
          processed_resumes?: number | null
          role_id: string
          role_snapshot: Json
          session_name?: string | null
          started_at?: string | null
          status?: string | null
          total_resumes?: number
          upload_session_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          failed_resumes?: number | null
          id?: string
          processed_resumes?: number | null
          role_id?: string
          role_snapshot?: Json
          session_name?: string | null
          started_at?: string | null
          status?: string | null
          total_resumes?: number
          upload_session_id?: string | null
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
            foreignKeyName: "evaluation_sessions_upload_session_id_fkey"
            columns: ["upload_session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
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
          can_retry: boolean | null
          content_hash: string | null
          duplicate_of: string | null
          error_log: Json | null
          error_message: string | null
          error_severity: string | null
          extracted_metadata: Json | null
          extracted_text: string | null
          extraction_method: string | null
          failure_code: string | null
          failure_reason: string | null
          failure_stage: string | null
          file_code: string
          file_size: number
          id: string
          is_duplicate: boolean | null
          last_re_evaluation_at: string | null
          manual_intervention_required: boolean | null
          max_retries: number | null
          mime_type: string
          original_name: string
          page_count: number | null
          processed_at: string | null
          re_evaluation_count: number | null
          re_evaluation_reason: string | null
          re_evaluation_requested_by: string | null
          retry_count: number | null
          session_id: string
          storage_bucket: string | null
          storage_path: string
          storage_url: string | null
          stored_name: string
          upload_status: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          can_retry?: boolean | null
          content_hash?: string | null
          duplicate_of?: string | null
          error_log?: Json | null
          error_message?: string | null
          error_severity?: string | null
          extracted_metadata?: Json | null
          extracted_text?: string | null
          extraction_method?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          failure_stage?: string | null
          file_code?: string
          file_size: number
          id?: string
          is_duplicate?: boolean | null
          last_re_evaluation_at?: string | null
          manual_intervention_required?: boolean | null
          max_retries?: number | null
          mime_type: string
          original_name: string
          page_count?: number | null
          processed_at?: string | null
          re_evaluation_count?: number | null
          re_evaluation_reason?: string | null
          re_evaluation_requested_by?: string | null
          retry_count?: number | null
          session_id: string
          storage_bucket?: string | null
          storage_path: string
          storage_url?: string | null
          stored_name: string
          upload_status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          can_retry?: boolean | null
          content_hash?: string | null
          duplicate_of?: string | null
          error_log?: Json | null
          error_message?: string | null
          error_severity?: string | null
          extracted_metadata?: Json | null
          extracted_text?: string | null
          extraction_method?: string | null
          failure_code?: string | null
          failure_reason?: string | null
          failure_stage?: string | null
          file_code?: string
          file_size?: number
          id?: string
          is_duplicate?: boolean | null
          last_re_evaluation_at?: string | null
          manual_intervention_required?: boolean | null
          max_retries?: number | null
          mime_type?: string
          original_name?: string
          page_count?: number | null
          processed_at?: string | null
          re_evaluation_count?: number | null
          re_evaluation_reason?: string | null
          re_evaluation_requested_by?: string | null
          retry_count?: number | null
          session_id?: string
          storage_bucket?: string | null
          storage_path?: string
          storage_url?: string | null
          stored_name?: string
          upload_status?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_re_evaluation_requested_by_fkey"
            columns: ["re_evaluation_requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_uploads_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "evaluation_sessions"
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
      role_education_requirements: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          requirement: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          requirement: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          requirement?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_education_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_experience_requirements: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          is_required: boolean | null
          minimum_years: number | null
          requirement: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          minimum_years?: number | null
          requirement: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_required?: boolean | null
          minimum_years?: number | null
          requirement?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_experience_requirements_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_questions: {
        Row: {
          created_at: string | null
          id: string
          question_category: string | null
          question_text: string
          role_id: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_category?: string | null
          question_text: string
          role_id: string
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: string
          question_category?: string | null
          question_text?: string
          role_id?: string
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
          is_required: boolean | null
          role_id: string
          skill_category: string | null
          skill_name: string
          weight: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          role_id: string
          skill_category?: string | null
          skill_name: string
          weight: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          role_id?: string
          skill_category?: string | null
          skill_name?: string
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
          id: string
          is_active: boolean | null
          last_used_at: string | null
          penalty_config: Json | null
          responsibilities: string | null
          title: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          bonus_config?: Json | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          penalty_config?: Json | null
          responsibilities?: string | null
          title: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          bonus_config?: Json | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          penalty_config?: Json | null
          responsibilities?: string | null
          title?: string
          usage_count?: number | null
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
          error_count: number | null
          failed_files: number | null
          file_manifest: Json | null
          id: string
          last_error: string | null
          processed_files: number | null
          role_id: string | null
          session_code: string
          session_status: string | null
          started_at: string | null
          total_files: number
          uploaded_files: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_count?: number | null
          failed_files?: number | null
          file_manifest?: Json | null
          id?: string
          last_error?: string | null
          processed_files?: number | null
          role_id?: string | null
          session_code?: string
          session_status?: string | null
          started_at?: string | null
          total_files?: number
          uploaded_files?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_count?: number | null
          failed_files?: number | null
          file_manifest?: Json | null
          id?: string
          last_error?: string | null
          processed_files?: number | null
          role_id?: string | null
          session_code?: string
          session_status?: string | null
          started_at?: string | null
          total_files?: number
          uploaded_files?: number | null
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
          id: string
          last_name: string | null
          settings: Json | null
          updated_at: string | null
          usage_stats: Json | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          settings?: Json | null
          updated_at?: string | null
          usage_stats?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_role_with_details: {
        Args: {
          p_education_requirements?: Json
          p_experience_requirements?: Json
          p_questions?: Json
          p_role_data: Json
          p_skills?: Json
        }
        Returns: Json
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_failed_resumes: {
        Args: { session_id: string }
        Returns: undefined
      }
      increment_processed_resumes: {
        Args: { session_id: string }
        Returns: undefined
      }
      test_auth_uid: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
    Enums: {},
  },
} as const