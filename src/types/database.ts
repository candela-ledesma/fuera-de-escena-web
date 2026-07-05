export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          author_id: string;
          body: string;
          category_id: string | null;
          created_at: string;
          event_date: string | null;
          id: string;
          published_at: string | null;
          rating: number | null;
          slug: string;
          status: Database["public"]["Enums"]["review_status"];
          title: string;
          updated_at: string;
          venue: string | null;
        };
        Insert: {
          author_id: string;
          body: string;
          category_id?: string | null;
          created_at?: string;
          event_date?: string | null;
          id?: string;
          published_at?: string | null;
          rating?: number | null;
          slug: string;
          status?: Database["public"]["Enums"]["review_status"];
          title: string;
          updated_at?: string;
          venue?: string | null;
        };
        Update: {
          author_id?: string;
          body?: string;
          category_id?: string | null;
          created_at?: string;
          event_date?: string | null;
          id?: string;
          published_at?: string | null;
          rating?: number | null;
          slug?: string;
          status?: Database["public"]["Enums"]["review_status"];
          title?: string;
          updated_at?: string;
          venue?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      review_images: {
        Row: {
          alt_text: string | null;
          created_at: string;
          id: string;
          position: number;
          review_id: string;
          storage_path: string;
        };
        Insert: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          position: number;
          review_id: string;
          storage_path: string;
        };
        Update: {
          alt_text?: string | null;
          created_at?: string;
          id?: string;
          position?: number;
          review_id?: string;
          storage_path?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      review_tags: {
        Row: {
          review_id: string;
          tag_id: string;
        };
        Insert: {
          review_id: string;
          tag_id: string;
        };
        Update: {
          review_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_tags_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "review_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          author_name: string;
          body: string;
          created_at: string;
          id: string;
          review_id: string;
          status: Database["public"]["Enums"]["comment_status"];
        };
        Insert: {
          author_name: string;
          body: string;
          created_at?: string;
          id?: string;
          review_id: string;
          status?: Database["public"]["Enums"]["comment_status"];
        };
        Update: {
          author_name?: string;
          body?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
          status?: Database["public"]["Enums"]["comment_status"];
        };
        Relationships: [
          {
            foreignKeyName: "comments_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          anon_id: string;
          created_at: string;
          id: string;
          review_id: string;
          type: Database["public"]["Enums"]["reaction_type"];
        };
        Insert: {
          anon_id: string;
          created_at?: string;
          id?: string;
          review_id: string;
          type: Database["public"]["Enums"]["reaction_type"];
        };
        Update: {
          anon_id?: string;
          created_at?: string;
          id?: string;
          review_id?: string;
          type?: Database["public"]["Enums"]["reaction_type"];
        };
        Relationships: [
          {
            foreignKeyName: "reactions_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      review_status: "draft" | "published";
      comment_status: "pending" | "approved" | "rejected";
      reaction_type: "like" | "love" | "wow" | "applause";
    };
    CompositeTypes: Record<string, never>;
  };
}