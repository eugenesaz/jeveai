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
      conversations: {
        Row: {
          course_id: string
          created_at: string
          id: string
          message_highlight: string | null
          message_time: string
          name: string
          response: string
          response_time: string
          user_id: string
          user_message: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          message_highlight?: string | null
          message_time?: string
          name: string
          response: string
          response_time?: string
          user_id: string
          user_message: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          message_highlight?: string | null
          message_time?: string
          name?: string
          response?: string
          response_time?: string
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          ai_instructions: string | null
          course_plan: string | null
          created_at: string | null
          description: string | null
          details: string | null
          duration: number | null
          id: string
          materials: string | null
          name: string
          price: number
          project_id: string
          recurring: boolean | null
          status: boolean | null
          telegram_bot: string | null
          type: string | null
        }
        Insert: {
          ai_instructions?: string | null
          course_plan?: string | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          duration?: number | null
          id?: string
          materials?: string | null
          name: string
          price: number
          project_id: string
          recurring?: boolean | null
          status?: boolean | null
          telegram_bot?: string | null
          type?: string | null
        }
        Update: {
          ai_instructions?: string | null
          course_plan?: string | null
          created_at?: string | null
          description?: string | null
          details?: string | null
          duration?: number | null
          id?: string
          materials?: string | null
          name?: string
          price?: number
          project_id?: string
          recurring?: boolean | null
          status?: boolean | null
          telegram_bot?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          created_at: string
          id: string
          memory: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          instagram: string | null
          role: string | null
          telegram: string | null
          tiktok: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          instagram?: string | null
          role?: string | null
          telegram?: string | null
          tiktok?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          role?: string | null
          telegram?: string | null
          tiktok?: string | null
        }
        Relationships: []
      }
      project_knowledge_vector: {
        Row: {
          content: string | null
          created_at: string
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      project_secrets: {
        Row: {
          created_at: string | null
          gemini_api_key: string | null
          id: string
          project_id: string
          stripe_secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gemini_api_key?: string | null
          id?: string
          project_id: string
          stripe_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gemini_api_key?: string | null
          id?: string
          project_id?: string
          stripe_secret?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_secrets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shares: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          inviter_id: string | null
          project_id: string
          role: Database["public"]["Enums"]["project_role"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          inviter_id?: string | null
          project_id: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          inviter_id?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_shares_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color_scheme: string | null
          created_at: string | null
          id: string
          landing_image: string | null
          name: string
          status: boolean | null
          telegram_bot: string | null
          url_name: string
          user_id: string
        }
        Insert: {
          color_scheme?: string | null
          created_at?: string | null
          id?: string
          landing_image?: string | null
          name: string
          status?: boolean | null
          telegram_bot?: string | null
          url_name: string
          user_id: string
        }
        Update: {
          color_scheme?: string | null
          created_at?: string | null
          id?: string
          landing_image?: string | null
          name?: string
          status?: boolean | null
          telegram_bot?: string | null
          url_name?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          begin_date: string | null
          created_at: string | null
          end_date: string | null
          enrollment_id: string
          id: string
          is_paid: boolean | null
        }
        Insert: {
          begin_date?: string | null
          created_at?: string | null
          end_date?: string | null
          enrollment_id: string
          id?: string
          is_paid?: boolean | null
        }
        Update: {
          begin_date?: string | null
          created_at?: string | null
          end_date?: string | null
          enrollment_id?: string
          id?: string
          is_paid?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscription_enrollment"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_project_roles: {
        Row: {
          created_at: string | null
          id: string
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_project_roles_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_customer_role_to_all_projects: {
        Args: { customer_id: string; influencer_id: string }
        Returns: undefined
      }
      assign_influencer_role_to_own_project: {
        Args: { owner_id: string; project_id: string }
        Returns: undefined
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_project_role: {
        Args: {
          user_uuid: string
          project_uuid: string
          required_roles: Database["public"]["Enums"]["project_role"][]
        }
        Returns: boolean
      }
      get_user_id_by_telegram: {
        Args: { telegram_name: string }
        Returns: string
      }
      get_user_owned_project_ids: {
        Args: { owner_id: string }
        Returns: string[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_knowledge: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      project_role: "owner" | "contributor" | "knowledge_manager" | "read_only"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_role: ["owner", "contributor", "knowledge_manager", "read_only"],
    },
  },
} as const
