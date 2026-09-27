/**
 * Typed Supabase schema for Hockey Ops scouting reads.
 * Keep column names aligned with the live Supabase tables.
 * If you regenerate types from Supabase CLI, replace this file and update queries to match.
 */

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
      players: {
        Row: {
	  notes: string | null
          id: string
          full_name: string
          position: string | null
          team_name: string | null
          jersey_number: number | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
	  notes?: string | null
          id?: string
          full_name: string
          position?: string | null
          team_name?: string | null
          jersey_number?: number | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
  id?: string
  full_name?: string
  position?: string | null
  team_name?: string | null
  jersey_number?: number | null
  is_active?: boolean | null
  notes?: string | null
  created_at?: string | null
}
        Relationships: []
      }
      games: {
        Row: {
          id: string
          season: string | null
          opponent: string | null
          played_at: string | null
          venue: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          season?: string | null
          opponent?: string | null
          played_at?: string | null
          venue?: string | null
          status?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          season?: string | null
          opponent?: string | null
          played_at?: string | null
          venue?: string | null
          status?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          game_id: string | null
          player_id: string | null
          event_type: string | null
          occurred_at: string | null
          period: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          game_id?: string | null
          player_id?: string | null
          event_type?: string | null
          occurred_at?: string | null
          period?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          game_id?: string | null
          player_id?: string | null
          event_type?: string | null
          occurred_at?: string | null
          period?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'events_game_id_fkey'
            columns: ['game_id']
            isOneToOne: false
            referencedRelation: 'games'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'events_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
