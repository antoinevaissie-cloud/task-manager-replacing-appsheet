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
      daily_stats: {
        Row: {
          completions: number
          created_at: string
          id: string
          overrides: number
          perfect_day: boolean
          rollovers: number
          stat_date: string
        }
        Insert: {
          completions?: number
          created_at?: string
          id?: string
          overrides?: number
          perfect_day?: boolean
          rollovers?: number
          stat_date: string
        }
        Update: {
          completions?: number
          created_at?: string
          id?: string
          overrides?: number
          perfect_day?: boolean
          rollovers?: number
          stat_date?: string
        }
        Relationships: []
      }
      graveyard: {
        Row: {
          archived_at: string
          id: string
          reason: string | null
          task_id: string | null
        }
        Insert: {
          archived_at?: string
          id?: string
          reason?: string | null
          task_id?: string | null
        }
        Update: {
          archived_at?: string
          id?: string
          reason?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graveyard_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_changes: {
        Row: {
          changed_at: string
          from_priority: Database["public"]["Enums"]["task_priority"]
          id: string
          reason: string | null
          task_id: string | null
          to_priority: Database["public"]["Enums"]["task_priority"]
        }
        Insert: {
          changed_at?: string
          from_priority: Database["public"]["Enums"]["task_priority"]
          id?: string
          reason?: string | null
          task_id?: string | null
          to_priority: Database["public"]["Enums"]["task_priority"]
        }
        Update: {
          changed_at?: string
          from_priority?: Database["public"]["Enums"]["task_priority"]
          id?: string
          reason?: string | null
          task_id?: string | null
          to_priority?: Database["public"]["Enums"]["task_priority"]
        }
        Relationships: [
          {
            foreignKeyName: "priority_changes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      rollover_history: {
        Row: {
          automatic: boolean
          from_date: string
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          rolled_over_at: string
          task_id: string | null
          to_date: string
        }
        Insert: {
          automatic?: boolean
          from_date: string
          id?: string
          priority: Database["public"]["Enums"]["task_priority"]
          rolled_over_at?: string
          task_id?: string | null
          to_date: string
        }
        Update: {
          automatic?: boolean
          from_date?: string
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          rolled_over_at?: string
          task_id?: string | null
          to_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "rollover_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          context: string | null
          created_at: string
          description: string | null
          due_date: string
          follow_up_item: boolean
          id: string
          last_rescheduled_at: string | null
          last_rolled_over_at: string | null
          notes: string | null
          reschedule_count: number
          rollover_count: number
          someday: boolean
          sort_order: number | null
          status: Database["public"]["Enums"]["task_status"]
          tags: string[] | null
          title: string
          updated_at: string
          urgency: Database["public"]["Enums"]["task_priority"]
        }
        Insert: {
          completed_at?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          follow_up_item?: boolean
          id?: string
          last_rescheduled_at?: string | null
          last_rolled_over_at?: string | null
          notes?: string | null
          reschedule_count?: number
          rollover_count?: number
          someday?: boolean
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["task_priority"]
        }
        Update: {
          completed_at?: string | null
          context?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          follow_up_item?: boolean
          id?: string
          last_rescheduled_at?: string | null
          last_rolled_over_at?: string | null
          notes?: string | null
          reschedule_count?: number
          rollover_count?: number
          someday?: boolean
          sort_order?: number | null
          status?: Database["public"]["Enums"]["task_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["task_priority"]
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
      task_priority: "P1" | "P2" | "P3" | "P4"
      task_status: "open" | "completed" | "archived" | "waiting"
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
      task_priority: ["P1", "P2", "P3", "P4"],
      task_status: ["open", "completed", "archived", "waiting"],
    },
  },
} as const
