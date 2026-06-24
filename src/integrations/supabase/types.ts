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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      groups: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          created_at: string
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          phase: Database["public"]["Enums"]["match_phase"]
          status: Database["public"]["Enums"]["match_status"]
          voting_open: boolean
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          created_at?: string
          home_score?: number | null
          home_team_id: string
          id?: string
          kickoff_at: string
          phase?: Database["public"]["Enums"]["match_phase"]
          status?: Database["public"]["Enums"]["match_status"]
          voting_open?: boolean
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          created_at?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          phase?: Database["public"]["Enums"]["match_phase"]
          status?: Database["public"]["Enums"]["match_status"]
          voting_open?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          btts: string | null
          combo_15: string | null
          combo_35: string | null
          created_at: string
          double_chance: string | null
          exact_away: number | null
          exact_home: number | null
          id: string
          match_id: string
          points: number
          result_90: string | null
          total_25: string | null
          total_35: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          btts?: string | null
          combo_15?: string | null
          combo_35?: string | null
          created_at?: string
          double_chance?: string | null
          exact_away?: number | null
          exact_home?: number | null
          id?: string
          match_id: string
          points?: number
          result_90?: string | null
          total_25?: string | null
          total_35?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          btts?: string | null
          combo_15?: string | null
          combo_35?: string | null
          created_at?: string
          double_chance?: string | null
          exact_away?: number | null
          exact_home?: number | null
          id?: string
          match_id?: string
          points?: number
          result_90?: string | null
          total_25?: string | null
          total_35?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      prizes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          phase: Database["public"]["Enums"]["match_phase"]
          position: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          phase: Database["public"]["Enums"]["match_phase"]
          position?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          phase?: Database["public"]["Enums"]["match_phase"]
          position?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          predictions_correct: number
          predictions_made: number
          previous_rank: number | null
          total_points: number
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          predictions_correct?: number
          predictions_made?: number
          previous_rank?: number | null
          total_points?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          predictions_correct?: number
          predictions_made?: number
          previous_rank?: number | null
          total_points?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: string | null
          created_at: string
          flag: string | null
          group_id: string | null
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          flag?: string | null
          group_id?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          flag?: string | null
          group_id?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comentario: string | null
          created_at: string
          design: number | null
          facilidade: number | null
          id: string
          pontos: number | null
          recomendacao: number | null
          torneios: number | null
          user_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          design?: number | null
          facilidade?: number | null
          id?: string
          pontos?: number | null
          recomendacao?: number | null
          torneios?: number | null
          user_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string
          design?: number | null
          facilidade?: number | null
          id?: string
          pontos?: number | null
          recomendacao?: number | null
          torneios?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      league_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          pool_code: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          pool_code: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          pool_code?: string
          user_id?: string
        }
        Relationships: []
      }
      match_odds: {
        Row: {
          created_at: string
          id: string
          match_id: string
          prob_away: number
          prob_btts_no: number
          prob_btts_yes: number
          prob_draw: number
          prob_home: number
          prob_over25: number
          prob_over35: number
          prob_under25: number
          prob_under35: number
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          prob_away: number
          prob_btts_no: number
          prob_btts_yes: number
          prob_draw: number
          prob_home: number
          prob_over25: number
          prob_over35: number
          prob_under25: number
          prob_under35: number
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          prob_away?: number
          prob_btts_no?: number
          prob_btts_yes?: number
          prob_draw?: number
          prob_home?: number
          prob_over25?: number
          prob_over35?: number
          prob_under25?: number
          prob_under35?: number
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          created_at: string
          excerpt: string | null
          id: string
          image_position: string | null
          image_url: string | null
          published: boolean
          slug: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          published?: boolean
          slug?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          published?: boolean
          slug?: string | null
          title?: string
        }
        Relationships: []
      }
      pool_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          pool_id: string
          start_points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          pool_id: string
          start_points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          pool_id?: string
          start_points?: number
          user_id?: string
        }
        Relationships: []
      }
      pools: {
        Row: {
          code: string
          created_at: string
          created_by: string
          emoji: string | null
          id: string
          name: string
          prize: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          emoji?: string | null
          id?: string
          name: string
          prize?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          emoji?: string | null
          id?: string
          name?: string
          prize?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      match_phase: "grupos" | "ronda32" | "oitavos" | "quartos" | "meias" | "final"
      match_status: "scheduled" | "live" | "finished"
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
      match_phase: ["grupos", "ronda32", "oitavos", "quartos", "meias", "final"],
      match_status: ["scheduled", "live", "finished"],
    },
  },
} as const
