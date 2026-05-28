export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          slug: string;
          name: string;
          date: string;
          location: string;
          description: string;
          image_url: string | null;
          age_restriction: "+16" | "+18" | "+21" | null;
          price: number;
          capacity: number;
          status: "draft" | "published" | "sold_out" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          date: string;
          location: string;
          description: string;
          image_url?: string | null;
          age_restriction?: "+16" | "+18" | "+21" | null;
          price: number;
          capacity: number;
          status?: "draft" | "published" | "sold_out" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          date?: string;
          location?: string;
          description?: string;
          image_url?: string | null;
          age_restriction?: "+16" | "+18" | "+21" | null;
          price?: number;
          capacity?: number;
          status?: "draft" | "published" | "sold_out" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          event_id: string;
          full_name: string;
          age: number;
          dni: string;
          phone: string;
          email: string;
          used: boolean;
          used_at: string | null;
          stripe_session_id: string;
          qr_code_value: string;
          alphanumeric_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          full_name: string;
          age: number;
          dni: string;
          phone: string;
          email: string;
          used?: boolean;
          used_at?: string | null;
          stripe_session_id: string;
          qr_code_value: string;
          alphanumeric_code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          full_name?: string;
          age?: number;
          dni?: string;
          phone?: string;
          email?: string;
          used?: boolean;
          used_at?: string | null;
          stripe_session_id?: string;
          qr_code_value?: string;
          alphanumeric_code?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_email_jobs: {
        Row: {
          ticket_id: string;
          status: "pending" | "sent" | "failed";
          error_message: string | null;
          attempt_count: number;
          last_attempt_at: string | null;
          delivered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ticket_id: string;
          status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          attempt_count?: number;
          last_attempt_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          ticket_id?: string;
          status?: "pending" | "sent" | "failed";
          error_message?: string | null;
          attempt_count?: number;
          last_attempt_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_email_jobs_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      realtime_updates: {
        Row: {
          id: number;
          topic: string;
          resource_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          topic: string;
          resource_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          topic?: string;
          resource_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      event_ticket_stats: {
        Row: {
          id: string;
          slug: string;
          name: string;
          date: string;
          location: string;
          price: number;
          capacity: number;
          sold_tickets: number;
          used_tickets: number;
          remaining_tickets: number;
        };
      };
    };
    Functions: {
      issue_ticket: {
        Args: {
          p_event_id: string;
          p_ticket_id: string;
          p_full_name: string;
          p_age: number;
          p_dni: string;
          p_phone: string;
          p_email: string;
          p_stripe_session_id: string;
          p_qr_code_value: string;
          p_alphanumeric_code: string;
        };
        Returns: Database["public"]["Tables"]["tickets"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
