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
          role: "student" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string;
          last_name?: string;
          locale?: string;
          role?: "student" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string;
          last_name?: string;
          locale?: string;
          role?: "student" | "admin";
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
          price_cents: number | null;
          currency: string;
          duration_weeks: number;
          level_en: string;
          level_ar: string;
          is_demo: boolean;
          is_published: boolean;
          image_url: string | null;
          is_for_sale: boolean;
          student_pass_included: boolean;
          student_pass_discount_percent: number;
          legacy_only: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_en?: string;
          title_ar: string;
          summary_en?: string;
          summary_ar?: string;
          description_en?: string;
          description_ar?: string;
          price_cents?: number | null;
          currency?: string;
          duration_weeks?: number;
          level_en?: string;
          level_ar?: string;
          is_demo?: boolean;
          is_published?: boolean;
          image_url?: string | null;
          is_for_sale?: boolean;
          student_pass_included?: boolean;
          student_pass_discount_percent?: number;
          legacy_only?: boolean;
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
          price_cents?: number | null;
          currency?: string;
          duration_weeks?: number;
          level_en?: string;
          level_ar?: string;
          is_demo?: boolean;
          is_published?: boolean;
          image_url?: string | null;
          is_for_sale?: boolean;
          student_pass_included?: boolean;
          student_pass_discount_percent?: number;
          legacy_only?: boolean;
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
      legacy_students: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          linked_profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          linked_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          linked_profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_students_linked_profile_id_fkey";
            columns: ["linked_profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      legacy_course_completions: {
        Row: {
          id: string;
          legacy_student_id: string;
          course_id: string | null;
          course_title_original: string;
          completed_at: string;
          old_certificate_number: string | null;
          certificate_language: "en" | "ar" | null;
          import_fingerprint: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          legacy_student_id: string;
          course_id?: string | null;
          course_title_original: string;
          completed_at: string;
          old_certificate_number?: string | null;
          certificate_language?: "en" | "ar" | null;
          import_fingerprint: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          legacy_student_id?: string;
          course_id?: string | null;
          course_title_original?: string;
          completed_at?: string;
          old_certificate_number?: string | null;
          certificate_language?: "en" | "ar" | null;
          import_fingerprint?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "legacy_course_completions_legacy_student_id_fkey";
            columns: ["legacy_student_id"];
            isOneToOne: false;
            referencedRelation: "legacy_students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "legacy_course_completions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      certificates: {
        Row: {
          id: string;
          certificate_number: string;
          status: "issued" | "revoked";
          issued_at: string;
          revoked_at: string | null;
          revoked_reason: string | null;
          course_id: string | null;
          profile_id: string | null;
          legacy_student_id: string | null;
          enrollment_id: string | null;
          legacy_completion_id: string | null;
          old_certificate_number: string | null;
          language: "en" | "ar" | null;
          holder_display_name: string;
          course_title_ar: string;
          course_title_en: string;
          issued_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          certificate_number: string;
          status?: "issued" | "revoked";
          issued_at: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          course_id?: string | null;
          profile_id?: string | null;
          legacy_student_id?: string | null;
          enrollment_id?: string | null;
          legacy_completion_id?: string | null;
          old_certificate_number?: string | null;
          language?: "en" | "ar" | null;
          holder_display_name: string;
          course_title_ar?: string;
          course_title_en?: string;
          issued_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          certificate_number?: string;
          status?: "issued" | "revoked";
          issued_at?: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          course_id?: string | null;
          profile_id?: string | null;
          legacy_student_id?: string | null;
          enrollment_id?: string | null;
          legacy_completion_id?: string | null;
          old_certificate_number?: string | null;
          language?: "en" | "ar" | null;
          holder_display_name?: string;
          course_title_ar?: string;
          course_title_en?: string;
          issued_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_legacy_student_id_fkey";
            columns: ["legacy_student_id"];
            isOneToOne: false;
            referencedRelation: "legacy_students";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey";
            columns: ["enrollment_id"];
            isOneToOne: false;
            referencedRelation: "enrollments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_legacy_completion_id_fkey";
            columns: ["legacy_completion_id"];
            isOneToOne: false;
            referencedRelation: "legacy_course_completions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "certificates_issued_by_fkey";
            columns: ["issued_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      certificate_year_counters: {
        Row: {
          year: number;
          last_value: number;
        };
        Insert: {
          year: number;
          last_value?: number;
        };
        Update: {
          year?: number;
          last_value?: number;
        };
        Relationships: [];
      };
      student_pass_subscriptions: {
        Row: {
          id: string;
          profile_id: string;
          status: "active" | "inactive" | "cancelled" | "expired";
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          source: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          status?: "active" | "inactive" | "cancelled" | "expired";
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          source?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          status?: "active" | "inactive" | "cancelled" | "expired";
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          source?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_pass_subscriptions_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
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
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      lesson_course_id: {
        Args: { p_lesson_id: string };
        Returns: string;
      };
      has_active_student_pass: {
        Args: { p_profile_id: string };
        Returns: boolean;
      };
      next_certificate_number: {
        Args: { p_year: number };
        Returns: string;
      };
      certificate_is_own: {
        Args: { p_profile_id: string | null; p_legacy_student_id: string | null };
        Returns: boolean;
      };
      verify_certificate: {
        Args: { p_number: string };
        Returns: {
          certificate_number: string;
          status: "issued" | "revoked";
          holder_display_name: string;
          course_title_en: string;
          course_title_ar: string;
          issued_at: string;
        }[];
      };
      issue_certificate: {
        Args: {
          p_issued_at: string;
          p_course_id: string | null;
          p_profile_id: string | null;
          p_legacy_student_id: string | null;
          p_enrollment_id: string | null;
          p_legacy_completion_id: string | null;
          p_old_certificate_number: string | null;
          p_language: string | null;
        };
        Returns: {
          certificate_number: string;
          already_existed: boolean;
          status: "issued" | "revoked";
          holder_display_name: string;
          course_title_en: string;
          course_title_ar: string;
          issued_at: string;
        }[];
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
export type LegacyStudentRow =
  Database["public"]["Tables"]["legacy_students"]["Row"];
export type LegacyCourseCompletionRow =
  Database["public"]["Tables"]["legacy_course_completions"]["Row"];
export type StudentPassSubscriptionRow =
  Database["public"]["Tables"]["student_pass_subscriptions"]["Row"];
export type CertificateRow = Database["public"]["Tables"]["certificates"]["Row"];
export type CertificateYearCounterRow =
  Database["public"]["Tables"]["certificate_year_counters"]["Row"];
