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
      nutzer_profil: {
        Row: {
          aktuelles_halbjahr: string | null
          created_at: string
          eingabe_modus: string
          geburtsjahr: number | null
          id: string
          klasse: number | null
          name: string | null
          notensystem: string
          plan_tier: string
          schule: string | null
          updated_at: string
        }
        Insert: {
          aktuelles_halbjahr?: string | null
          created_at?: string
          eingabe_modus?: string
          geburtsjahr?: number | null
          id: string
          klasse?: number | null
          name?: string | null
          notensystem?: string
          plan_tier?: string
          schule?: string | null
          updated_at?: string
        }
        Update: {
          aktuelles_halbjahr?: string | null
          created_at?: string
          eingabe_modus?: string
          geburtsjahr?: number | null
          id?: string
          klasse?: number | null
          name?: string | null
          notensystem?: string
          plan_tier?: string
          schule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      schule_fach: {
        Row: {
          created_at: string
          fach_gewicht: number
          farbe: string | null
          gewicht_klausur: number
          gewicht_muendlich: number
          gewicht_sonstige: number
          halbjahr: string | null
          id: string
          name: string
          niveau: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fach_gewicht?: number
          farbe?: string | null
          gewicht_klausur?: number
          gewicht_muendlich?: number
          gewicht_sonstige?: number
          halbjahr?: string | null
          id?: string
          name: string
          niveau?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fach_gewicht?: number
          farbe?: string | null
          gewicht_klausur?: number
          gewicht_muendlich?: number
          gewicht_sonstige?: number
          halbjahr?: string | null
          id?: string
          name?: string
          niveau?: string
          user_id?: string
        }
        Relationships: []
      }
      schule_klausur: {
        Row: {
          created_at: string
          datum: string
          fach_id: string | null
          id: string
          notiz: string | null
          titel: string
          user_id: string
          vorbereitung_prozent: number
        }
        Insert: {
          created_at?: string
          datum: string
          fach_id?: string | null
          id?: string
          notiz?: string | null
          titel: string
          user_id: string
          vorbereitung_prozent?: number
        }
        Update: {
          created_at?: string
          datum?: string
          fach_id?: string | null
          id?: string
          notiz?: string | null
          titel?: string
          user_id?: string
          vorbereitung_prozent?: number
        }
        Relationships: [
          {
            foreignKeyName: "schule_klausur_fach_id_fkey"
            columns: ["fach_id"]
            isOneToOne: false
            referencedRelation: "schule_fach"
            referencedColumns: ["id"]
          },
        ]
      }
      schule_note: {
        Row: {
          bezeichnung: string | null
          created_at: string
          datum: string | null
          fach_id: string
          gewicht: number
          id: string
          kategorie: string
          punkte: number
          user_id: string
        }
        Insert: {
          bezeichnung?: string | null
          created_at?: string
          datum?: string | null
          fach_id: string
          gewicht?: number
          id?: string
          kategorie: string
          punkte: number
          user_id: string
        }
        Update: {
          bezeichnung?: string | null
          created_at?: string
          datum?: string | null
          fach_id?: string
          gewicht?: number
          id?: string
          kategorie?: string
          punkte?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schule_note_fach_id_fkey"
            columns: ["fach_id"]
            isOneToOne: false
            referencedRelation: "schule_fach"
            referencedColumns: [
              "id",
            ]
          },
        ]
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
