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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      connection_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_one: string
          participant_two: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one: string
          participant_two: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_one?: string
          participant_two?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "group_events"
            referencedColumns: ["id"]
          },
        ]
      }
      group_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          group_id: string
          id: string
          is_virtual: boolean
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          group_id: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          group_id?: string
          id?: string
          is_virtual?: boolean
          location?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_files: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          group_id: string
          id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          group_id: string
          id?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          group_id?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_files_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_invitations: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by: string
          invited_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by: string
          invited_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string
          invited_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_invitations_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "group_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: string | null
          cover_color: string | null
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          icon_url: string | null
          id: string
          is_private: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cover_color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cover_color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          icon_url?: string | null
          id?: string
          is_private?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      index_claims: {
        Row: {
          admin_notes: string | null
          created_at: string
          id: string
          index_startup_id: string
          member_startup_id: string
          proof_url: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["index_claim_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          index_startup_id: string
          member_startup_id: string
          proof_url?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["index_claim_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          id?: string
          index_startup_id?: string
          member_startup_id?: string
          proof_url?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["index_claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "index_claims_index_startup_id_fkey"
            columns: ["index_startup_id"]
            isOneToOne: false
            referencedRelation: "index_startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "index_claims_member_startup_id_fkey"
            columns: ["member_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      index_funding_rounds: {
        Row: {
          amount_usd: number | null
          announced_on: string | null
          created_at: string
          id: string
          index_startup_id: string
          notes: string | null
          round_type: Database["public"]["Enums"]["index_round_type"]
          source_url: string | null
          updated_at: string
        }
        Insert: {
          amount_usd?: number | null
          announced_on?: string | null
          created_at?: string
          id?: string
          index_startup_id: string
          notes?: string | null
          round_type: Database["public"]["Enums"]["index_round_type"]
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          amount_usd?: number | null
          announced_on?: string | null
          created_at?: string
          id?: string
          index_startup_id?: string
          notes?: string | null
          round_type?: Database["public"]["Enums"]["index_round_type"]
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "index_funding_rounds_index_startup_id_fkey"
            columns: ["index_startup_id"]
            isOneToOne: false
            referencedRelation: "index_startups"
            referencedColumns: ["id"]
          },
        ]
      }
      index_investors: {
        Row: {
          check_size_max: number | null
          check_size_min: number | null
          created_at: string
          description: string | null
          focus_sectors: string[]
          hq_country: string | null
          id: string
          linked_user_id: string | null
          logo_url: string | null
          name: string
          slug: string | null
          source: Database["public"]["Enums"]["index_source"]
          stage_focus: string[]
          type: Database["public"]["Enums"]["index_investor_type"] | null
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          description?: string | null
          focus_sectors?: string[]
          hq_country?: string | null
          id?: string
          linked_user_id?: string | null
          logo_url?: string | null
          name: string
          slug?: string | null
          source?: Database["public"]["Enums"]["index_source"]
          stage_focus?: string[]
          type?: Database["public"]["Enums"]["index_investor_type"] | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          description?: string | null
          focus_sectors?: string[]
          hq_country?: string | null
          id?: string
          linked_user_id?: string | null
          logo_url?: string | null
          name?: string
          slug?: string | null
          source?: Database["public"]["Enums"]["index_source"]
          stage_focus?: string[]
          type?: Database["public"]["Enums"]["index_investor_type"] | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      index_round_investors: {
        Row: {
          created_at: string
          id: string
          index_investor_id: string
          is_lead: boolean
          round_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          index_investor_id: string
          is_lead?: boolean
          round_id: string
        }
        Update: {
          created_at?: string
          id?: string
          index_investor_id?: string
          is_lead?: boolean
          round_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "index_round_investors_index_investor_id_fkey"
            columns: ["index_investor_id"]
            isOneToOne: false
            referencedRelation: "index_investors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "index_round_investors_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "index_funding_rounds"
            referencedColumns: ["id"]
          },
        ]
      }
      index_startups: {
        Row: {
          city: string | null
          claimed_by_startup_id: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          founded_year: number | null
          id: string
          is_raising: boolean
          logo_url: string | null
          name: string
          sector: Database["public"]["Enums"]["index_sector"] | null
          slug: string | null
          source: Database["public"]["Enums"]["index_source"]
          sparkx_score: number | null
          stage: Database["public"]["Enums"]["index_stage"] | null
          team_size: number | null
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          city?: string | null
          claimed_by_startup_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_raising?: boolean
          logo_url?: string | null
          name: string
          sector?: Database["public"]["Enums"]["index_sector"] | null
          slug?: string | null
          source?: Database["public"]["Enums"]["index_source"]
          sparkx_score?: number | null
          stage?: Database["public"]["Enums"]["index_stage"] | null
          team_size?: number | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          city?: string | null
          claimed_by_startup_id?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          id?: string
          is_raising?: boolean
          logo_url?: string | null
          name?: string
          sector?: Database["public"]["Enums"]["index_sector"] | null
          slug?: string | null
          source?: Database["public"]["Enums"]["index_source"]
          sparkx_score?: number | null
          stage?: Database["public"]["Enums"]["index_stage"] | null
          team_size?: number | null
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "index_startups_claimed_by_startup_id_fkey"
            columns: ["claimed_by_startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_shortlists: {
        Row: {
          created_at: string
          id: string
          investor_data: Json | null
          investor_id: string
          investor_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investor_data?: Json | null
          investor_id: string
          investor_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investor_data?: Json | null
          investor_id?: string
          investor_name?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_views: {
        Row: {
          id: string
          investor_icon: string | null
          investor_id: string
          investor_name: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          investor_icon?: string | null
          investor_id: string
          investor_name: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          investor_icon?: string | null
          investor_id?: string
          investor_name?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          created_at: string
          currency: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          mentor_id: string
          session_duration: number
          session_price: number | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          mentor_id: string
          session_duration?: number
          session_price?: number | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          mentor_id?: string
          session_duration?: number
          session_price?: number | null
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_bookings: {
        Row: {
          booking_date: string
          created_at: string
          end_time: string
          id: string
          mentee_id: string
          mentor_id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          created_at?: string
          end_time: string
          id?: string
          mentee_id: string
          mentor_id: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          created_at?: string
          end_time?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          mentee_id: string
          mentor_id: string
          status: string
          stripe_session_id: string | null
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          mentee_id: string
          mentor_id: string
          status?: string
          stripe_session_id?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          status?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mentor_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          amount: string | null
          application_url: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string
          eligibility: string | null
          id: string
          is_featured: boolean | null
          location: string | null
          organization: string
          organization_logo: string | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: string | null
          application_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description: string
          eligibility?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          organization: string
          organization_logo?: string | null
          tags?: string[] | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          amount?: string | null
          application_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          eligibility?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          organization?: string
          organization_logo?: string | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "opportunities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      opportunity_applications: {
        Row: {
          additional_docs: string[] | null
          answers: Json | null
          cover_letter: string | null
          created_at: string
          id: string
          opportunity_id: string
          phone: string | null
          resume_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          additional_docs?: string[] | null
          answers?: Json | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          phone?: string | null
          resume_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          additional_docs?: string[] | null
          answers?: Json | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          phone?: string | null
          resume_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_decks: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          image_urls: string[] | null
          startup_id: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          startup_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          image_urls?: string[] | null
          startup_id?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "posts_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_level: string | null
          availability: string | null
          avatar_url: string | null
          bio: string | null
          booking_url: string | null
          company_name: string | null
          company_stage: string | null
          created_at: string
          expertise: string[] | null
          full_name: string | null
          funding_required: number | null
          headline: string | null
          id: string
          industry: string | null
          investment_focus: string | null
          investment_range: string | null
          linkedin_url: string | null
          location: string | null
          membership: Database["public"]["Enums"]["membership_type"]
          onboarding_step: Database["public"]["Enums"]["onboarding_step"]
          phone: string | null
          portfolio_size: number | null
          team_size: number | null
          updated_at: string
          user_id: string
          verification: Database["public"]["Enums"]["verification_status"]
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          admin_level?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          booking_url?: string | null
          company_name?: string | null
          company_stage?: string | null
          created_at?: string
          expertise?: string[] | null
          full_name?: string | null
          funding_required?: number | null
          headline?: string | null
          id?: string
          industry?: string | null
          investment_focus?: string | null
          investment_range?: string | null
          linkedin_url?: string | null
          location?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          phone?: string | null
          portfolio_size?: number | null
          team_size?: number | null
          updated_at?: string
          user_id: string
          verification?: Database["public"]["Enums"]["verification_status"]
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          admin_level?: string | null
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          booking_url?: string | null
          company_name?: string | null
          company_stage?: string | null
          created_at?: string
          expertise?: string[] | null
          full_name?: string | null
          funding_required?: number | null
          headline?: string | null
          id?: string
          industry?: string | null
          investment_focus?: string | null
          investment_range?: string | null
          linkedin_url?: string | null
          location?: string | null
          membership?: Database["public"]["Enums"]["membership_type"]
          onboarding_step?: Database["public"]["Enums"]["onboarding_step"]
          phone?: string | null
          portfolio_size?: number | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
          verification?: Database["public"]["Enums"]["verification_status"]
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      session_reminders: {
        Row: {
          booking_id: string
          id: string
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          id?: string
          reminder_type?: string
          sent_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      startup_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          role: string
          startup_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          role?: string
          startup_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          role?: string
          startup_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_invitations_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_members: {
        Row: {
          confirmed: boolean
          created_at: string
          id: string
          role: string
          startup_id: string
          user_id: string
        }
        Insert: {
          confirmed?: boolean
          created_at?: string
          id?: string
          role?: string
          startup_id: string
          user_id: string
        }
        Update: {
          confirmed?: boolean
          created_at?: string
          id?: string
          role?: string
          startup_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          created_at: string
          created_by: string
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_url: string | null
          linkedin_url: string | null
          location: string | null
          logo_url: string | null
          mission: string | null
          name: string
          registration_doc_url: string | null
          short_description: string | null
          slug: string | null
          stage: string | null
          twitter_url: string | null
          updated_at: string
          verification_status: string
          vision: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name: string
          registration_doc_url?: string | null
          short_description?: string | null
          slug?: string | null
          stage?: string | null
          twitter_url?: string | null
          updated_at?: string
          verification_status?: string
          vision?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          logo_url?: string | null
          mission?: string | null
          name?: string
          registration_doc_url?: string | null
          short_description?: string | null
          slug?: string | null
          stage?: string | null
          twitter_url?: string | null
          updated_at?: string
          verification_status?: string
          vision?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          additional_info: string | null
          created_at: string
          document_url: string | null
          id: string
          linkedin_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          linkedin_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          created_at?: string
          document_url?: string | null
          id?: string
          linkedin_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          company_stage: string | null
          created_at: string | null
          expertise: string[] | null
          full_name: string | null
          headline: string | null
          industry: string | null
          linkedin_url: string | null
          location: string | null
          onboarding_step: Database["public"]["Enums"]["onboarding_step"] | null
          user_id: string | null
          verification:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url: string | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_stage?: string | null
          created_at?: string | null
          expertise?: string[] | null
          full_name?: string | null
          headline?: string | null
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_step?:
            | Database["public"]["Enums"]["onboarding_step"]
            | null
          user_id?: string | null
          verification?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_stage?: string | null
          created_at?: string | null
          expertise?: string[] | null
          full_name?: string | null
          headline?: string | null
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          onboarding_step?:
            | Database["public"]["Enums"]["onboarding_step"]
            | null
          user_id?: string | null
          verification?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          website_url?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_level: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_blocked: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      is_group_creator: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_public: { Args: { _group_id: string }; Returns: boolean }
      is_startup_admin: {
        Args: { _startup_id: string; _user_id: string }
        Returns: boolean
      }
      is_startup_member: {
        Args: { _startup_id: string; _user_id: string }
        Returns: boolean
      }
      is_startup_role: {
        Args: { _role: string; _startup_id: string; _user_id: string }
        Returns: boolean
      }
      verify_admin_invitation: {
        Args: { _token: string }
        Returns: {
          email: string
          id: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role:
        | "startup_founder"
        | "investor"
        | "mentor"
        | "ecosystem_partner"
        | "service_provider"
        | "admin"
        | "member"
      index_claim_status: "pending" | "approved" | "rejected"
      index_investor_type:
        | "vc"
        | "angel"
        | "accelerator"
        | "corporate"
        | "dfi"
        | "family_office"
        | "syndicate"
        | "government"
        | "other"
      index_round_type:
        | "pre_seed"
        | "seed"
        | "series_a"
        | "series_b"
        | "series_c"
        | "growth"
        | "debt"
        | "grant"
        | "bridge"
        | "other"
      index_sector:
        | "fintech"
        | "agritech"
        | "healthtech"
        | "edtech"
        | "ecommerce"
        | "logistics"
        | "energy"
        | "creative"
        | "mobility"
        | "proptech"
        | "insurtech"
        | "cleantech"
        | "ai"
        | "saas"
        | "deeptech"
        | "media"
        | "other"
      index_source: "admin" | "scrape" | "claim" | "import"
      index_stage:
        | "idea"
        | "pre_seed"
        | "seed"
        | "series_a"
        | "series_b"
        | "series_c"
        | "growth"
        | "mature"
      membership_type: "standard" | "premium"
      onboarding_step:
        | "role_selection"
        | "profile_details"
        | "kyc"
        | "subscription"
        | "completed"
      verification_status: "unverified" | "pending" | "verified"
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
      app_role: [
        "startup_founder",
        "investor",
        "mentor",
        "ecosystem_partner",
        "service_provider",
        "admin",
        "member",
      ],
      index_claim_status: ["pending", "approved", "rejected"],
      index_investor_type: [
        "vc",
        "angel",
        "accelerator",
        "corporate",
        "dfi",
        "family_office",
        "syndicate",
        "government",
        "other",
      ],
      index_round_type: [
        "pre_seed",
        "seed",
        "series_a",
        "series_b",
        "series_c",
        "growth",
        "debt",
        "grant",
        "bridge",
        "other",
      ],
      index_sector: [
        "fintech",
        "agritech",
        "healthtech",
        "edtech",
        "ecommerce",
        "logistics",
        "energy",
        "creative",
        "mobility",
        "proptech",
        "insurtech",
        "cleantech",
        "ai",
        "saas",
        "deeptech",
        "media",
        "other",
      ],
      index_source: ["admin", "scrape", "claim", "import"],
      index_stage: [
        "idea",
        "pre_seed",
        "seed",
        "series_a",
        "series_b",
        "series_c",
        "growth",
        "mature",
      ],
      membership_type: ["standard", "premium"],
      onboarding_step: [
        "role_selection",
        "profile_details",
        "kyc",
        "subscription",
        "completed",
      ],
      verification_status: ["unverified", "pending", "verified"],
    },
  },
} as const
