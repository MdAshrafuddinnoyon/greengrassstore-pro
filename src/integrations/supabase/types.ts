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
      blog_posts: {
        Row: {
          author_name: string
          category: string
          content: string
          content_ar: string | null
          created_at: string
          excerpt: string
          excerpt_ar: string | null
          featured_image: string | null
          id: string
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number
          slug: string
          status: string
          tags: string[] | null
          title: string
          title_ar: string | null
          updated_at: string
          view_count: number
        }
        Insert: {
          author_name?: string
          category?: string
          content: string
          content_ar?: string | null
          created_at?: string
          excerpt: string
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          title_ar?: string | null
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_name?: string
          category?: string
          content?: string
          content_ar?: string | null
          created_at?: string
          excerpt?: string
          excerpt_ar?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number
          id: string
          image: string | null
          is_active: boolean
          name: string
          name_ar: string | null
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          id?: string
          image?: string | null
          is_active?: boolean
          name: string
          name_ar?: string | null
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          id?: string
          image?: string | null
          is_active?: boolean
          name?: string
          name_ar?: string | null
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_requirements: {
        Row: {
          admin_notes: string | null
          budget: string | null
          created_at: string
          description: string
          email: string
          id: string
          name: string
          phone: string | null
          requirement_type: string
          status: string
          timeline: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          budget?: string | null
          created_at?: string
          description: string
          email: string
          id?: string
          name: string
          phone?: string | null
          requirement_type?: string
          status?: string
          timeline?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          budget?: string | null
          created_at?: string
          description?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          requirement_type?: string
          status?: string
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      media_files: {
        Row: {
          alt_text: string | null
          caption: string | null
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          folder: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          folder?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          folder?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string | null
          shipping: number
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          payment_method?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          shipping?: number
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      popup_notifications: {
        Row: {
          button_link: string | null
          button_text: string | null
          button_text_ar: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          display_frequency: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          start_date: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          button_link?: string | null
          button_text?: string | null
          button_text_ar?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_frequency?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          button_link?: string | null
          button_text?: string | null
          button_text_ar?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_frequency?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          start_date?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          option1_name: string | null
          option1_value: string | null
          option2_name: string | null
          option2_value: string | null
          option3_name: string | null
          option3_value: string | null
          price: number
          product_id: string
          sku: string | null
          stock_quantity: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          price?: number
          product_id: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          option1_name?: string | null
          option1_value?: string | null
          option2_name?: string | null
          option2_value?: string | null
          option3_name?: string | null
          option3_value?: string | null
          price?: number
          product_id?: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          description_ar: string | null
          featured_image: string | null
          id: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          is_new: boolean
          is_on_sale: boolean
          name: string
          name_ar: string | null
          option1_name: string | null
          option1_values: string[] | null
          option2_name: string | null
          option2_values: string[] | null
          option3_name: string | null
          option3_values: string[] | null
          price: number
          product_type: string
          sku: string | null
          slug: string
          stock_quantity: number
          subcategory: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          featured_image?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          name: string
          name_ar?: string | null
          option1_name?: string | null
          option1_values?: string[] | null
          option2_name?: string | null
          option2_values?: string[] | null
          option3_name?: string | null
          option3_values?: string[] | null
          price?: number
          product_type?: string
          sku?: string | null
          slug: string
          stock_quantity?: number
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          description_ar?: string | null
          featured_image?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean
          name?: string
          name_ar?: string | null
          option1_name?: string | null
          option1_values?: string[] | null
          option2_name?: string | null
          option2_values?: string[] | null
          option3_name?: string | null
          option3_values?: string[] | null
          price?: number
          product_type?: string
          sku?: string | null
          slug?: string
          stock_quantity?: number
          subcategory?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vip_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          points_earned: number
          points_redeemed: number
          tier_id: string | null
          tier_updated_at: string | null
          total_spend: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          points_earned?: number
          points_redeemed?: number
          tier_id?: string | null
          tier_updated_at?: string | null
          total_spend?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          points_earned?: number
          points_redeemed?: number
          tier_id?: string | null
          tier_updated_at?: string | null
          total_spend?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_members_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "vip_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_settings: {
        Row: {
          created_at: string
          hero_subtitle: string | null
          hero_subtitle_ar: string | null
          hero_title: string | null
          hero_title_ar: string | null
          id: string
          is_enabled: boolean
          points_per_aed: number | null
          program_description: string | null
          program_description_ar: string | null
          program_name: string
          program_name_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          hero_subtitle?: string | null
          hero_subtitle_ar?: string | null
          hero_title?: string | null
          hero_title_ar?: string | null
          id?: string
          is_enabled?: boolean
          points_per_aed?: number | null
          program_description?: string | null
          program_description_ar?: string | null
          program_name?: string
          program_name_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          hero_subtitle?: string | null
          hero_subtitle_ar?: string | null
          hero_title?: string | null
          hero_title_ar?: string | null
          id?: string
          is_enabled?: boolean
          points_per_aed?: number | null
          program_description?: string | null
          program_description_ar?: string | null
          program_name?: string
          program_name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vip_tiers: {
        Row: {
          benefits: Json | null
          benefits_ar: Json | null
          color_gradient: string | null
          created_at: string
          discount_percent: number
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_best_value: boolean
          max_spend: number | null
          min_spend: number
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          benefits?: Json | null
          benefits_ar?: Json | null
          color_gradient?: string | null
          created_at?: string
          discount_percent?: number
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_best_value?: boolean
          max_spend?: number | null
          min_spend?: number
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          benefits?: Json | null
          benefits_ar?: Json | null
          color_gradient?: string | null
          created_at?: string
          discount_percent?: number
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_best_value?: boolean
          max_spend?: number | null
          min_spend?: number
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_image: string | null
          product_price: string | null
          product_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_image?: string | null
          product_price?: string | null
          product_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_image?: string | null
          product_price?: string | null
          product_title?: string
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
      app_role: "admin" | "moderator" | "user" | "store_manager"
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
      app_role: ["admin", "moderator", "user", "store_manager"],
    },
  },
} as const
