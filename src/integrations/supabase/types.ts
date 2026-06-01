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
      ama_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ama_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ama_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ama_question_votes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ama_question_votes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "ama_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      ama_questions: {
        Row: {
          answer: string | null
          created_at: string
          id: string
          is_answered: boolean | null
          is_pinned: boolean | null
          question: string
          session_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean | null
          is_pinned?: boolean | null
          question: string
          session_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string
          id?: string
          is_answered?: boolean | null
          is_pinned?: boolean | null
          question?: string
          session_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ama_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ama_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ama_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          max_participants: number | null
          mentor_id: string
          participant_count: number | null
          scheduled_at: string
          status: string
          title: string
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          mentor_id: string
          participant_count?: number | null
          scheduled_at: string
          status?: string
          title: string
          topic: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_participants?: number | null
          mentor_id?: string
          participant_count?: number | null
          scheduled_at?: string
          status?: string
          title?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      annotations: {
        Row: {
          color: string | null
          comment: string | null
          created_at: string
          id: string
          note_id: string
          page_number: number
          position: Json
          text_content: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          note_id: string
          page_number: number
          position: Json
          text_content?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          note_id?: string
          page_number?: number
          position?: Json
          text_content?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotations_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      brainstorm_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_mentor_message: boolean | null
          message_type: string | null
          room_id: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_mentor_message?: boolean | null
          message_type?: string | null
          room_id: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_mentor_message?: boolean | null
          message_type?: string | null
          room_id?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brainstorm_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "brainstorm_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      brainstorm_participants: {
        Row: {
          id: string
          is_mentor: boolean | null
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_mentor?: boolean | null
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_mentor?: boolean | null
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brainstorm_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "brainstorm_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      brainstorm_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          mentor_led: boolean | null
          name: string
          participant_count: number | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          mentor_led?: boolean | null
          name: string
          participant_count?: number | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          mentor_led?: boolean | null
          name?: string
          participant_count?: number | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cheat_sheets: {
        Row: {
          category: string
          created_at: string
          description: string | null
          downloads: number
          file_url: string | null
          format: string
          id: string
          is_public: boolean
          pages: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_url?: string | null
          format?: string
          id?: string
          is_public?: boolean
          pages?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          downloads?: number
          file_url?: string | null
          format?: string
          id?: string
          is_public?: boolean
          pages?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      circle_feedback: {
        Row: {
          circle_id: string
          content: string
          created_at: string
          from_user_id: string
          id: string
          rating: number | null
          to_user_id: string
        }
        Insert: {
          circle_id: string
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          rating?: number | null
          to_user_id: string
        }
        Update: {
          circle_id?: string
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          rating?: number | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_feedback_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "feedback_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "classroom_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_messages: {
        Row: {
          classroom_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          classroom_id: string
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          classroom_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_messages_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "virtual_classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "classroom_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_notes: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          note_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          note_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_notes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "note_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      community_post_likes: {
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
        Relationships: []
      }
      community_posts: {
        Row: {
          comment_count: number
          content: string
          created_at: string
          id: string
          image_url: string | null
          like_count: number
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_count?: number
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_count?: number
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          like_count?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_attendance: {
        Row: {
          checked_in_at: string
          event_id: string
          id: string
          method: string
          notes: string | null
          user_id: string
        }
        Insert: {
          checked_in_at?: string
          event_id: string
          id?: string
          method?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          checked_in_at?: string
          event_id?: string
          id?: string
          method?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          capacity: number
          created_at: string
          description: string
          ends_at: string | null
          featured: boolean
          id: string
          mode: string
          organizer_id: string
          prize: string | null
          registration_count: number
          registration_deadline: string | null
          starts_at: string
          status: string
          tags: string[]
          title: string
          type: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          banner_url?: string | null
          capacity?: number
          created_at?: string
          description?: string
          ends_at?: string | null
          featured?: boolean
          id?: string
          mode?: string
          organizer_id: string
          prize?: string | null
          registration_count?: number
          registration_deadline?: string | null
          starts_at: string
          status?: string
          tags?: string[]
          title: string
          type?: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          banner_url?: string | null
          capacity?: number
          created_at?: string
          description?: string
          ends_at?: string | null
          featured?: boolean
          id?: string
          mode?: string
          organizer_id?: string
          prize?: string | null
          registration_count?: number
          registration_deadline?: string | null
          starts_at?: string
          status?: string
          tags?: string[]
          title?: string
          type?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: []
      }
      feedback_circle_members: {
        Row: {
          circle_id: string
          id: string
          joined_at: string
          project_name: string | null
          skills: string[] | null
          user_id: string
        }
        Insert: {
          circle_id: string
          id?: string
          joined_at?: string
          project_name?: string | null
          skills?: string[] | null
          user_id: string
        }
        Update: {
          circle_id?: string
          id?: string
          joined_at?: string
          project_name?: string | null
          skills?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "feedback_circles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_circles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          meeting_time: string | null
          name: string
          status: string
          topic: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_time?: string | null
          name: string
          status?: string
          topic: string
          updated_at?: string
          week_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          meeting_time?: string | null
          name?: string
          status?: string
          topic?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: []
      }
      flashcard_decks: {
        Row: {
          card_count: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          study_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_count?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          study_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_count?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          study_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          card_id: string
          ease: number
          id: string
          next_review_at: string
          reviewed_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          ease?: number
          id?: string
          next_review_at?: string
          reviewed_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          ease?: number
          id?: string
          next_review_at?: string
          reviewed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          front: string
          hint: string | null
          id: string
          position: number
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          front: string
          hint?: string | null
          id?: string
          position?: number
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          front?: string
          hint?: string | null
          id?: string
          position?: number
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          like_count: number
          parent_id: string | null
          thread_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          thread_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          thread_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_thread_likes: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_threads: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          is_locked: boolean
          is_pinned: boolean
          last_activity_at: string
          like_count: number
          reply_count: number
          tags: string[]
          title: string
          updated_at: string
          user_id: string
          view_count: number
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          like_count?: number
          reply_count?: number
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
          view_count?: number
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          like_count?: number
          reply_count?: number
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      idea_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          idea_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          idea_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          idea_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_messages_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_public: boolean | null
          status: string | null
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          id?: string
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          message: string | null
          requested_role: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          message?: string | null
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          message?: string | null
          requested_role?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_session_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          host_id: string
          id: string
          max_participants: number
          participant_count: number
          price: number
          recording_url: string | null
          scheduled_at: string
          session_type: string
          status: string
          title: string
          topic: string | null
          updated_at: string
          video_link: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id: string
          id?: string
          max_participants?: number
          participant_count?: number
          price?: number
          recording_url?: string | null
          scheduled_at: string
          session_type?: string
          status?: string
          title: string
          topic?: string | null
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          host_id?: string
          id?: string
          max_participants?: number
          participant_count?: number
          price?: number
          recording_url?: string | null
          scheduled_at?: string
          session_type?: string
          status?: string
          title?: string
          topic?: string | null
          updated_at?: string
          video_link?: string | null
        }
        Relationships: []
      }
      mentor_availability: {
        Row: {
          booking_id: string | null
          created_at: string
          ends_at: string
          id: string
          is_booked: boolean
          mentor_id: string
          starts_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          ends_at: string
          id?: string
          is_booked?: boolean
          mentor_id: string
          starts_at: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          ends_at?: string
          id?: string
          is_booked?: boolean
          mentor_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentor_availability_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_bookings: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          mentee_id: string
          mentor_id: string
          notes: string | null
          price_paid: number
          scheduled_at: string
          slot_id: string | null
          status: string
          updated_at: string
          video_link: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          mentee_id: string
          mentor_id: string
          notes?: string | null
          price_paid?: number
          scheduled_at: string
          slot_id?: string | null
          status?: string
          updated_at?: string
          video_link?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          price_paid?: number
          scheduled_at?: string
          slot_id?: string | null
          status?: string
          updated_at?: string
          video_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_bookings_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "mentor_availability"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_profiles: {
        Row: {
          availability_text: string | null
          bio: string | null
          company: string | null
          created_at: string
          expertise: string[]
          id: string
          is_active: boolean
          languages: string[]
          price_per_hour: number
          rating: number
          reviews_count: number
          sessions_count: number
          title: string
          updated_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          availability_text?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          languages?: string[]
          price_per_hour?: number
          rating?: number
          reviews_count?: number
          sessions_count?: number
          title: string
          updated_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          availability_text?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          expertise?: string[]
          id?: string
          is_active?: boolean
          languages?: string[]
          price_per_hour?: number
          rating?: number
          reviews_count?: number
          sessions_count?: number
          title?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      mentor_reviews: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          mentee_id: string
          mentor_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          mentee_id: string
          mentor_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "mentor_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_reviews_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      note_ai_content: {
        Row: {
          flashcards: Json | null
          generated_at: string
          id: string
          note_id: string
          quiz_data: Json | null
          related_notes: string[] | null
          summary: string | null
        }
        Insert: {
          flashcards?: Json | null
          generated_at?: string
          id?: string
          note_id: string
          quiz_data?: Json | null
          related_notes?: string[] | null
          summary?: string | null
        }
        Update: {
          flashcards?: Json | null
          generated_at?: string
          id?: string
          note_id?: string
          quiz_data?: Json | null
          related_notes?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "note_ai_content_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: true
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_bookmarks: {
        Row: {
          created_at: string
          id: string
          note_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_bookmarks_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      note_comments: {
        Row: {
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_edited: boolean | null
          is_helpful: boolean | null
          is_reported: boolean | null
          note_id: string
          parent_id: string | null
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_edited?: boolean | null
          is_helpful?: boolean | null
          is_reported?: boolean | null
          note_id: string
          parent_id?: string | null
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_edited?: boolean | null
          is_helpful?: boolean | null
          is_reported?: boolean | null
          note_id?: string
          parent_id?: string | null
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_comments_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "note_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      note_ratings: {
        Row: {
          created_at: string
          id: string
          note_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_ratings_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          branch: string | null
          category: string | null
          content_url: string
          created_at: string
          description: string | null
          downloads: number | null
          file_type: string | null
          id: string
          last_viewed_at: string | null
          rating: number | null
          report_count: number | null
          semester: number | null
          study_time_minutes: number | null
          subject: string
          tags: string[] | null
          title: string
          university: string | null
          updated_at: string
          user_id: string
          views: number | null
          year: number | null
        }
        Insert: {
          branch?: string | null
          category?: string | null
          content_url: string
          created_at?: string
          description?: string | null
          downloads?: number | null
          file_type?: string | null
          id?: string
          last_viewed_at?: string | null
          rating?: number | null
          report_count?: number | null
          semester?: number | null
          study_time_minutes?: number | null
          subject: string
          tags?: string[] | null
          title: string
          university?: string | null
          updated_at?: string
          user_id: string
          views?: number | null
          year?: number | null
        }
        Update: {
          branch?: string | null
          category?: string | null
          content_url?: string
          created_at?: string
          description?: string | null
          downloads?: number | null
          file_type?: string | null
          id?: string
          last_viewed_at?: string | null
          rating?: number | null
          report_count?: number | null
          semester?: number | null
          study_time_minutes?: number | null
          subject?: string
          tags?: string[] | null
          title?: string
          university?: string | null
          updated_at?: string
          user_id?: string
          views?: number | null
          year?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      qa_answer_votes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      qa_answers: {
        Row: {
          body: string
          created_at: string
          id: string
          is_accepted: boolean
          question_id: string
          updated_at: string
          upvotes: number
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          question_id: string
          updated_at?: string
          upvotes?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_accepted?: boolean
          question_id?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: []
      }
      qa_question_votes: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      qa_questions: {
        Row: {
          answer_count: number
          body: string
          category: string
          created_at: string
          id: string
          is_pinned: boolean
          is_resolved: boolean
          tags: string[]
          title: string
          updated_at: string
          upvotes: number
          user_id: string
          view_count: number
        }
        Insert: {
          answer_count?: number
          body: string
          category?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_resolved?: boolean
          tags?: string[]
          title: string
          updated_at?: string
          upvotes?: number
          user_id: string
          view_count?: number
        }
        Update: {
          answer_count?: number
          body?: string
          category?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          is_resolved?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          upvotes?: number
          user_id?: string
          view_count?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          quiz_id: string
          score: number
          time_taken_seconds: number
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id: string
          score?: number
          time_taken_seconds?: number
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          quiz_id?: string
          score?: number
          time_taken_seconds?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          position: number
          question: string
          quiz_id: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question: string
          quiz_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          position?: number
          question?: string
          quiz_id?: string
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          attempts_count: number
          category: string
          created_at: string
          description: string | null
          difficulty: string
          duration_minutes: number
          id: string
          is_public: boolean
          question_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts_count?: number
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_public?: boolean
          question_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts_count?: number
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          is_public?: boolean
          question_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_note: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          reason: string
          reported_by: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          reason: string
          reported_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          reason?: string
          reported_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_progress: {
        Row: {
          completed: boolean
          completed_at: string
          id: string
          roadmap_id: string
          step_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string
          id?: string
          roadmap_id: string
          step_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string
          id?: string
          roadmap_id?: string
          step_id?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          position: number
          resources: Json
          roadmap_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          resources?: Json
          roadmap_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          position?: number
          resources?: Json
          roadmap_id?: string
          title?: string
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          category: string
          created_at: string
          description: string | null
          difficulty: string
          duration: string | null
          id: string
          is_public: boolean
          step_count: number
          title: string
          topics: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_public?: boolean
          step_count?: number
          title: string
          topics?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: string
          duration?: string | null
          id?: string
          is_public?: boolean
          step_count?: number
          title?: string
          topics?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_participants: {
        Row: {
          id: string
          joined_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "study_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_invites: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          group_id: string
          id: string
          max_uses: number
          revoked: boolean
          role: string
          token: string
          uses: number
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          group_id: string
          id?: string
          max_uses?: number
          revoked?: boolean
          role?: string
          token: string
          uses?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          group_id?: string
          id?: string
          max_uses?: number
          revoked?: boolean
          role?: string
          token?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_group_invites_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
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
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_messages: {
        Row: {
          content: string
          created_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_rooms: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_id: string
          id: string
          is_active: boolean
          meeting_link: string | null
          name: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          meeting_link?: string | null
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          meeting_link?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_rooms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          active_room_count: number
          banner_url: string | null
          category: string | null
          created_at: string
          description: string
          id: string
          member_count: number
          member_limit: number
          name: string
          owner_id: string
          privacy: string
          updated_at: string
        }
        Insert: {
          active_room_count?: number
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          member_count?: number
          member_limit?: number
          name: string
          owner_id: string
          privacy?: string
          updated_at?: string
        }
        Update: {
          active_room_count?: number
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          member_count?: number
          member_limit?: number
          name?: string
          owner_id?: string
          privacy?: string
          updated_at?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string
          current_page: number | null
          host_id: string
          id: string
          is_active: boolean | null
          note_id: string
          session_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number | null
          host_id: string
          id?: string
          is_active?: boolean | null
          note_id: string
          session_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          note_id?: string
          session_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_sessions_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          required_skills: string[] | null
          status: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          required_skills?: string[] | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          required_skills?: string[] | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_messages: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean | null
          message_type: string | null
          reply_to: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string | null
          reply_to?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
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
      virtual_classroom_participants: {
        Row: {
          classroom_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          classroom_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          classroom_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_classroom_participants_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "virtual_classrooms"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_classrooms: {
        Row: {
          created_at: string
          description: string
          duration_minutes: number
          host_id: string
          id: string
          max_participants: number
          meeting_link: string | null
          participant_count: number
          recording_url: string | null
          scheduled_at: string
          status: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          duration_minutes?: number
          host_id: string
          id?: string
          max_participants?: number
          meeting_link?: string | null
          participant_count?: number
          recording_url?: string | null
          scheduled_at: string
          status?: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          duration_minutes?: number
          host_id?: string
          id?: string
          max_participants?: number
          meeting_link?: string | null
          participant_count?: number
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_mentor_slot: {
        Args: {
          _duration?: number
          _notes?: string
          _price?: number
          _slot_id: string
        }
        Returns: string
      }
      bump_cheatsheet_downloads: { Args: { _id: string }; Returns: undefined }
      cancel_event_registration: {
        Args: { _event_id: string }
        Returns: undefined
      }
      cancel_learning_session_rsvp: {
        Args: { _session_id: string }
        Returns: undefined
      }
      cancel_mentor_booking: {
        Args: { _booking_id: string }
        Returns: undefined
      }
      check_in_event: {
        Args: { _event_id: string; _user_id?: string }
        Returns: string
      }
      compute_note_quality_score: {
        Args: { _note_id: string }
        Returns: number
      }
      count_circle_feedback: {
        Args: { _circle_ids: string[] }
        Returns: {
          circle_id: string
          feedback_count: number
        }[]
      }
      create_group_invite: {
        Args: {
          _expires_in_hours?: number
          _group_id: string
          _max_uses?: number
          _role?: string
        }
        Returns: {
          expires_at: string
          id: string
          token: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_forum_thread_views: {
        Args: { _thread_id: string }
        Returns: undefined
      }
      increment_idea_upvotes: { Args: { _idea_id: string }; Returns: undefined }
      increment_note_downloads: {
        Args: { _note_id: string }
        Returns: undefined
      }
      increment_note_views: { Args: { _note_id: string }; Returns: undefined }
      increment_qa_question_views: {
        Args: { _question_id: string }
        Returns: undefined
      }
      is_study_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      join_ama_session: { Args: { _session_id: string }; Returns: undefined }
      join_study_group: { Args: { _group_id: string }; Returns: undefined }
      join_virtual_classroom: {
        Args: { _classroom_id: string }
        Returns: undefined
      }
      leave_ama_session: { Args: { _session_id: string }; Returns: undefined }
      leave_study_group: { Args: { _group_id: string }; Returns: undefined }
      leave_virtual_classroom: {
        Args: { _classroom_id: string }
        Returns: undefined
      }
      record_quiz_attempt: {
        Args: {
          _answers: Json
          _quiz_id: string
          _score: number
          _time_seconds: number
          _total: number
        }
        Returns: string
      }
      redeem_group_invite: { Args: { _token: string }; Returns: string }
      register_for_event: { Args: { _event_id: string }; Returns: string }
      rsvp_learning_session: {
        Args: { _session_id: string }
        Returns: undefined
      }
      toggle_ama_question_vote: {
        Args: { _question_id: string }
        Returns: Json
      }
      toggle_classroom_reaction: {
        Args: { _emoji: string; _message_id: string }
        Returns: Json
      }
      toggle_comment_vote: {
        Args: { _comment_id: string; _user_id: string; _vote_type: string }
        Returns: Json
      }
      toggle_community_post_like: { Args: { _post_id: string }; Returns: Json }
      toggle_forum_thread_like: { Args: { _thread_id: string }; Returns: Json }
      toggle_qa_answer_vote: { Args: { _answer_id: string }; Returns: Json }
      toggle_qa_question_vote: { Args: { _question_id: string }; Returns: Json }
      toggle_roadmap_step: {
        Args: { _roadmap_id: string; _step_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "founder"
        | "co_founder"
        | "designer"
        | "developer"
        | "marketer"
        | "analyst"
        | "researcher"
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
        "admin",
        "moderator",
        "user",
        "founder",
        "co_founder",
        "designer",
        "developer",
        "marketer",
        "analyst",
        "researcher",
      ],
    },
  },
} as const
