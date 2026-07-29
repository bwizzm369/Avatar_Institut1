export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EnrollmentStatusDb =
  | "pending_payment"
  | "active"
  | "completed"
  | "revoked";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_ar: string;
          summary_en: string;
          summary_ar: string;
          description_en: string;
          description_ar: string;
          price_cents: number;
          currency: string;
          duration_weeks: number;
          level_en: string;
          level_ar: string;
          is_demo: boolean;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en: string;
          title_ar: string;
          summary_en?: string;
          summary_ar?: string;
          description_en?: string;
          description_ar?: string;
          price_cents: number;
          currency?: string;
          duration_weeks?: number;
          level_en?: string;
          level_ar?: string;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title_en?: string;
          title_ar?: string;
          summary_en?: string;
          summary_ar?: string;
          description_en?: string;
          description_ar?: string;
          price_cents?: number;
          currency?: string;
          duration_weeks?: number;
          level_en?: string;
          level_ar?: string;
          is_demo?: boolean;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      course_modules: {
        Row: {
          id: string;
          course_id: string;
          title_en: string;
          title_ar: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title_en: string;
          title_ar: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title_en?: string;
          title_ar?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title_en: string;
          title_ar: string;
          duration_minutes: number;
          sort_order: number;
          lesson_type: "video" | "text" | "pdf";
          bunny_video_id: string | null;
          text_content_en: string;
          text_content_ar: string;
          pdf_url: string | null;
          is_preview: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title_en: string;
          title_ar: string;
          duration_minutes?: number;
          sort_order?: number;
          lesson_type?: "video" | "text" | "pdf";
          bunny_video_id?: string | null;
          text_content_en?: string;
          text_content_ar?: string;
          pdf_url?: string | null;
          is_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title_en?: string;
          title_ar?: string;
          duration_minutes?: number;
          sort_order?: number;
          lesson_type?: "video" | "text" | "pdf";
          bunny_video_id?: string | null;
          text_content_en?: string;
          text_content_ar?: string;
          pdf_url?: string | null;
          is_preview?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "course_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          status: EnrollmentStatusDb;
          enrolled_at: string | null;
          payment_confirmed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          status?: EnrollmentStatusDb;
          enrolled_at?: string | null;
          payment_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          status?: EnrollmentStatusDb;
          enrolled_at?: string | null;
          payment_confirmed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
          last_position_seconds: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
          last_position_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          lesson_id?: string;
          completed?: boolean;
          completed_at?: string | null;
          last_position_seconds?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_actively_enrolled: {
        Args: { p_course_id: string };
        Returns: boolean;
      };
      lesson_course_id: {
        Args: { p_lesson_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
export type CourseModuleRow = Database["public"]["Tables"]["course_modules"]["Row"];
export type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
export type EnrollmentRow = Database["public"]["Tables"]["enrollments"]["Row"];
export type LessonProgressRow =
  Database["public"]["Tables"]["lesson_progress"]["Row"];
