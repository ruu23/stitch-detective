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
      avatars: {
        Row: {
          avatar_model_url: string | null
          avatar_thumbnail_url: string | null
          body_shape_params: Json | null
          created_at: string
          face_features: Json | null
          hair_color: string | null
          hair_style: string | null
          id: string
          skin_tone_hex: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_model_url?: string | null
          avatar_thumbnail_url?: string | null
          body_shape_params?: Json | null
          created_at?: string
          face_features?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          id?: string
          skin_tone_hex?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_model_url?: string | null
          avatar_thumbnail_url?: string | null
          body_shape_params?: Json | null
          created_at?: string
          face_features?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          id?: string
          skin_tone_hex?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avatars_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      body_scans: {
        Row: {
          body_shape: string | null
          bust: number | null
          created_at: string
          face_image_url: string | null
          front_image_url: string | null
          hair_color: string | null
          height: number | null
          hips: number | null
          id: string
          inseam: number | null
          measurements_json: Json | null
          shoulder_width: number | null
          side_image_url: string | null
          skin_tone_hex: string | null
          skin_undertone: string | null
          updated_at: string
          user_id: string
          waist: number | null
          weight: number | null
        }
        Insert: {
          body_shape?: string | null
          bust?: number | null
          created_at?: string
          face_image_url?: string | null
          front_image_url?: string | null
          hair_color?: string | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurements_json?: Json | null
          shoulder_width?: number | null
          side_image_url?: string | null
          skin_tone_hex?: string | null
          skin_undertone?: string | null
          updated_at?: string
          user_id: string
          waist?: number | null
          weight?: number | null
        }
        Update: {
          body_shape?: string | null
          bust?: number | null
          created_at?: string
          face_image_url?: string | null
          front_image_url?: string | null
          hair_color?: string | null
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurements_json?: Json | null
          shoulder_width?: number | null
          side_image_url?: string | null
          skin_tone_hex?: string | null
          skin_undertone?: string | null
          updated_at?: string
          user_id?: string
          waist?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "body_scans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_tracking: {
        Row: {
          created_at: string
          id: string
          month_year: string
          monthly_budget: number
          savings_goal: number | null
          spent_this_month: number | null
          updated_at: string
          user_id: string
          wishlist_items: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          month_year: string
          monthly_budget: number
          savings_goal?: number | null
          spent_this_month?: number | null
          updated_at?: string
          user_id: string
          wishlist_items?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          month_year?: string
          monthly_budget?: number
          savings_goal?: number | null
          spent_this_month?: number | null
          updated_at?: string
          user_id?: string
          wishlist_items?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_tracking_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_looks: {
        Row: {
          activity: string | null
          created_at: string
          id: string
          outfit_id: string | null
          scheduled_date: string
          user_id: string
        }
        Insert: {
          activity?: string | null
          created_at?: string
          id?: string
          outfit_id?: string | null
          scheduled_date: string
          user_id: string
        }
        Update: {
          activity?: string | null
          created_at?: string
          id?: string
          outfit_id?: string | null
          scheduled_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_looks_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_looks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      closet_items: {
        Row: {
          ai_tags: string[] | null
          brand: string | null
          category: Database["public"]["Enums"]["clothing_category"]
          color: string | null
          color_primary: string | null
          color_secondary: string | null
          cost_per_wear: number | null
          created_at: string
          formality_level: number | null
          hijab_friendly: boolean | null
          id: string
          image_url: string | null
          item_type: string | null
          modest_coverage: string | null
          name: string
          notes: string | null
          pattern: string | null
          price_paid: number | null
          purchase_date: string | null
          season: string | null
          style: string | null
          suitable_occasions: string[] | null
          user_id: string
          wear_count: number | null
        }
        Insert: {
          ai_tags?: string[] | null
          brand?: string | null
          category: Database["public"]["Enums"]["clothing_category"]
          color?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          cost_per_wear?: number | null
          created_at?: string
          formality_level?: number | null
          hijab_friendly?: boolean | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          modest_coverage?: string | null
          name: string
          notes?: string | null
          pattern?: string | null
          price_paid?: number | null
          purchase_date?: string | null
          season?: string | null
          style?: string | null
          suitable_occasions?: string[] | null
          user_id: string
          wear_count?: number | null
        }
        Update: {
          ai_tags?: string[] | null
          brand?: string | null
          category?: Database["public"]["Enums"]["clothing_category"]
          color?: string | null
          color_primary?: string | null
          color_secondary?: string | null
          cost_per_wear?: number | null
          created_at?: string
          formality_level?: number | null
          hijab_friendly?: boolean | null
          id?: string
          image_url?: string | null
          item_type?: string | null
          modest_coverage?: string | null
          name?: string
          notes?: string | null
          pattern?: string | null
          price_paid?: number | null
          purchase_date?: string | null
          season?: string | null
          style?: string | null
          suitable_occasions?: string[] | null
          user_id?: string
          wear_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "closet_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      outfit_items: {
        Row: {
          item_id: string
          outfit_id: string
        }
        Insert: {
          item_id: string
          outfit_id: string
        }
        Update: {
          item_id?: string
          outfit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outfit_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "closet_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outfit_items_outfit_id_fkey"
            columns: ["outfit_id"]
            isOneToOne: false
            referencedRelation: "outfits"
            referencedColumns: ["id"]
          },
        ]
      }
      outfits: {
        Row: {
          avatar_render_url: string | null
          budget_used: number | null
          created_at: string
          id: string
          location: string | null
          name: string
          occasion: string | null
          scheduled_date: string | null
          user_id: string
          weather_condition: string | null
          weather_temp: number | null
        }
        Insert: {
          avatar_render_url?: string | null
          budget_used?: number | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          occasion?: string | null
          scheduled_date?: string | null
          user_id: string
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Update: {
          avatar_render_url?: string | null
          budget_used?: number | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          occasion?: string | null
          scheduled_date?: string | null
          user_id?: string
          weather_condition?: string | null
          weather_temp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "outfits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          body_measurements: Json | null
          created_at: string
          favorite_brands: string[] | null
          full_name: string | null
          id: string
          is_veiled: boolean | null
          lifestyle_type: string | null
          location: string | null
          monthly_budget: number | null
          occupation: string | null
          styling_preference:
            | Database["public"]["Enums"]["styling_preference"]
            | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          body_measurements?: Json | null
          created_at?: string
          favorite_brands?: string[] | null
          full_name?: string | null
          id: string
          is_veiled?: boolean | null
          lifestyle_type?: string | null
          location?: string | null
          monthly_budget?: number | null
          occupation?: string | null
          styling_preference?:
            | Database["public"]["Enums"]["styling_preference"]
            | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          body_measurements?: Json | null
          created_at?: string
          favorite_brands?: string[] | null
          full_name?: string | null
          id?: string
          is_veiled?: boolean | null
          lifestyle_type?: string | null
          location?: string | null
          monthly_budget?: number | null
          occupation?: string | null
          styling_preference?:
            | Database["public"]["Enums"]["styling_preference"]
            | null
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          activities: string[] | null
          budget_allocated: number | null
          created_at: string
          destination: string
          end_date: string
          id: string
          packing_list: string[] | null
          start_date: string
          updated_at: string
          user_id: string
          weather_forecast: Json | null
        }
        Insert: {
          activities?: string[] | null
          budget_allocated?: number | null
          created_at?: string
          destination: string
          end_date: string
          id?: string
          packing_list?: string[] | null
          start_date: string
          updated_at?: string
          user_id: string
          weather_forecast?: Json | null
        }
        Update: {
          activities?: string[] | null
          budget_allocated?: number | null
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          packing_list?: string[] | null
          start_date?: string
          updated_at?: string
          user_id?: string
          weather_forecast?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
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
      clothing_category:
        | "tops"
        | "bottoms"
        | "dresses"
        | "outerwear"
        | "shoes"
        | "accessories"
        | "bags"
      styling_preference: "veiled" | "unveiled"
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
      clothing_category: [
        "tops",
        "bottoms",
        "dresses",
        "outerwear",
        "shoes",
        "accessories",
        "bags",
      ],
      styling_preference: ["veiled", "unveiled"],
    },
  },
} as const
