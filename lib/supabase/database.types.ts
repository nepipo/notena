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
      audit_log: {
        Row: {
          aktion: string
          created_at: string
          entity_data: Json | null
          entity_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          aktion: string
          created_at?: string
          entity_data?: Json | null
          entity_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          aktion?: string
          created_at?: string
          entity_data?: Json | null
          entity_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      briefing_cache: {
        Row: {
          created_at: string
          datum: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          datum: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          datum?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_rate_limit: {
        Row: {
          count: number
          hour_bucket: string
          user_id: string
        }
        Insert: {
          count?: number
          hour_bucket: string
          user_id: string
        }
        Update: {
          count?: number
          hour_bucket?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          id: string
          nachricht: string
          seite: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nachricht: string
          seite?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nachricht?: string
          seite?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      hausaufgabe: {
        Row: {
          beschreibung: string
          created_at: string
          erledigt: boolean
          fach_id: string | null
          faellig_am: string
          id: string
          user_id: string
        }
        Insert: {
          beschreibung: string
          created_at?: string
          erledigt?: boolean
          fach_id?: string | null
          faellig_am: string
          id?: string
          user_id: string
        }
        Update: {
          beschreibung?: string
          created_at?: string
          erledigt?: boolean
          fach_id?: string | null
          faellig_am?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hausaufgabe_fach_id_fkey"
            columns: ["fach_id"]
            isOneToOne: false
            referencedRelation: "schule_fach"
            referencedColumns: ["id"]
          },
        ]
      }
      nutzer_profil: {
        Row: {
          aktuelle_woche: string | null
          aktuelles_halbjahr: string | null
          briefing_aktiv: boolean
          bundesland: string | null
          created_at: string
          default_gewichtung: Json | null
          eingabe_modus: string
          geburtsjahr: number | null
          id: string
          klasse: number | null
          klausur_erinnerung_tage: number[]
          ls_customer_id: string | null
          ls_subscription_id: string | null
          name: string | null
          notensystem: string
          onboarding_abgeschlossen: boolean
          plan_bis: string | null
          plan_intervall: string | null
          plan_status: string | null
          plan_tier: string
          schule: string | null
          trial_genutzt: boolean
          updated_at: string
          wochen_modus: string | null
        }
        Insert: {
          aktuelle_woche?: string | null
          aktuelles_halbjahr?: string | null
          briefing_aktiv?: boolean
          bundesland?: string | null
          created_at?: string
          default_gewichtung?: Json | null
          eingabe_modus?: string
          geburtsjahr?: number | null
          id: string
          klasse?: number | null
          klausur_erinnerung_tage?: number[]
          ls_customer_id?: string | null
          ls_subscription_id?: string | null
          name?: string | null
          notensystem?: string
          onboarding_abgeschlossen?: boolean
          plan_bis?: string | null
          plan_intervall?: string | null
          plan_status?: string | null
          plan_tier?: string
          schule?: string | null
          trial_genutzt?: boolean
          updated_at?: string
          wochen_modus?: string | null
        }
        Update: {
          aktuelle_woche?: string | null
          aktuelles_halbjahr?: string | null
          briefing_aktiv?: boolean
          bundesland?: string | null
          created_at?: string
          default_gewichtung?: Json | null
          eingabe_modus?: string
          geburtsjahr?: number | null
          id?: string
          klasse?: number | null
          klausur_erinnerung_tage?: number[]
          ls_customer_id?: string | null
          ls_subscription_id?: string | null
          name?: string | null
          notensystem?: string
          onboarding_abgeschlossen?: boolean
          plan_bis?: string | null
          plan_intervall?: string | null
          plan_status?: string | null
          plan_tier?: string
          schule?: string | null
          trial_genutzt?: boolean
          updated_at?: string
          wochen_modus?: string | null
        }
        Relationships: []
      }
      push_subscription: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      schule_fach: {
        Row: {
          ausgeschlossen: boolean
          created_at: string
          fach_gewicht: number
          farbe: string | null
          gewicht_klausur: number
          gewicht_muendlich: number
          gewicht_sonstige: number
          gewichtung_config: Json | null
          halbjahr: string | null
          id: string
          name: string
          niveau: string
          user_id: string
        }
        Insert: {
          ausgeschlossen?: boolean
          created_at?: string
          fach_gewicht?: number
          farbe?: string | null
          gewicht_klausur?: number
          gewicht_muendlich?: number
          gewicht_sonstige?: number
          gewichtung_config?: Json | null
          halbjahr?: string | null
          id?: string
          name: string
          niveau?: string
          user_id: string
        }
        Update: {
          ausgeschlossen?: boolean
          created_at?: string
          fach_gewicht?: number
          farbe?: string | null
          gewicht_klausur?: number
          gewicht_muendlich?: number
          gewicht_sonstige?: number
          gewichtung_config?: Json | null
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
            referencedColumns: ["id"]
          },
        ]
      }
      stundenplan_entfall: {
        Row: {
          created_at: string | null
          datum: string
          id: string
          stunde_id: string
          typ: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          datum: string
          id?: string
          stunde_id: string
          typ?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          datum?: string
          id?: string
          stunde_id?: string
          typ?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stundenplan_entfall_stunde_id_fkey"
            columns: ["stunde_id"]
            isOneToOne: false
            referencedRelation: "stundenplan_stunde"
            referencedColumns: ["id"]
          },
        ]
      }
      stundenplan_stunde: {
        Row: {
          bezeichnung: string | null
          fach_id: string | null
          id: string
          lehrer: string | null
          raum: string | null
          user_id: string
          woche_typ: string | null
          wochentag: number
          zeit_end: string
          zeit_start: string
        }
        Insert: {
          bezeichnung?: string | null
          fach_id?: string | null
          id?: string
          lehrer?: string | null
          raum?: string | null
          user_id: string
          woche_typ?: string | null
          wochentag: number
          zeit_end: string
          zeit_start: string
        }
        Update: {
          bezeichnung?: string | null
          fach_id?: string | null
          id?: string
          lehrer?: string | null
          raum?: string | null
          user_id?: string
          woche_typ?: string | null
          wochentag?: number
          zeit_end?: string
          zeit_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "stundenplan_stunde_fach_id_fkey"
            columns: ["fach_id"]
            isOneToOne: false
            referencedRelation: "schule_fach"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_coach_rate_limit: { Args: { p_limit?: number }; Returns: Json }
      delete_current_user: { Args: never; Returns: undefined }
      klausur_erinnerungen_heute: {
        Args: never
        Returns: {
          fach_name: string
          klausur_titel: string
          tage_bis: number
          user_id: string
          vorbereitung_prozent: number
        }[]
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
