export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ComplianceDocType =
  | 'tax_compliance'
  | 'agpo_cert'
  | 'cr12'
  | 'business_permit'
  | 'kra_pin_cert'
  | 'bank_reference'
  | 'audited_accounts'
  | 'other';

export type ComplianceDocStatus = 'valid' | 'expiring_soon' | 'expired';

export type TenderSource = 'mygov' | 'ifmis' | 'agpo_portal' | 'manual';

export type TenderStatus =
  | 'discovered'
  | 'qualifying'
  | 'qualified'
  | 'disqualified'
  | 'in_progress'
  | 'submitted'
  | 'won'
  | 'lost'
  | 'expired';

export type QualificationRecommendation = 'pursue' | 'skip' | 'borderline';

export type ApplicationStatus =
  | 'drafting'
  | 'docs_ready'
  | 'submitted'
  | 'awarded'
  | 'rejected';

export type SubmissionMethod = 'physical' | 'online_portal' | 'email';

export type GeneratedDocType =
  | 'technical_proposal'
  | 'financial_proposal'
  | 'cover_letter'
  | 'compliance_bundle'
  | 'form_of_tender'
  | 'other';

export type GeneratedDocStatus = 'draft' | 'reviewed' | 'final';

export type AgentMessageRole = 'user' | 'assistant' | 'tool';

export type TenderDeadlineType =
  | 'submission'
  | 'clarification'
  | 'site_visit'
  | 'bid_bond';

export interface PastProject {
  client: string;
  value: number | string;
  year: number | string;
  description: string;
}

export interface KeyPersonnel {
  name: string;
  role: string;
  bio: string;
  cv_url?: string;
}

export interface BankDetails {
  bank_name?: string;
  branch?: string;
  account_name?: string;
  account_number?: string;
  swift_code?: string;
}

export interface ChecklistItem {
  item: string;
  required: boolean;
  status: 'pending' | 'attached' | 'verified';
  document_id?: string;
}

export interface Database {
  public: {
    Tables: {
      company_profile: {
        Row: {
          id: number;
          legal_name: string;
          registration_number: string | null;
          agpo_category: string | null;
          agpo_cert_number: string | null;
          agpo_cert_expiry: string | null;
          kra_pin: string | null;
          tax_compliance_cert_number: string | null;
          tax_compliance_cert_expiry: string | null;
          cr12_details: Json;
          business_permit_details: Json;
          core_services: Json;
          past_projects: Json;
          key_personnel: Json;
          bank_details: Json;
          physical_address: string | null;
          postal_address: string | null;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          legal_name: string;
          registration_number?: string | null;
          agpo_category?: string | null;
          agpo_cert_number?: string | null;
          agpo_cert_expiry?: string | null;
          kra_pin?: string | null;
          tax_compliance_cert_number?: string | null;
          tax_compliance_cert_expiry?: string | null;
          cr12_details?: Json;
          business_permit_details?: Json;
          core_services?: Json;
          past_projects?: Json;
          key_personnel?: Json;
          bank_details?: Json;
          physical_address?: string | null;
          postal_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          legal_name?: string;
          registration_number?: string | null;
          agpo_category?: string | null;
          agpo_cert_number?: string | null;
          agpo_cert_expiry?: string | null;
          kra_pin?: string | null;
          tax_compliance_cert_number?: string | null;
          tax_compliance_cert_expiry?: string | null;
          cr12_details?: Json;
          business_permit_details?: Json;
          core_services?: Json;
          past_projects?: Json;
          key_personnel?: Json;
          bank_details?: Json;
          physical_address?: string | null;
          postal_address?: string | null;
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      compliance_documents: {
        Row: {
          id: string;
          doc_type: ComplianceDocType;
          file_url: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          status: ComplianceDocStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          doc_type: ComplianceDocType;
          file_url?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          status?: ComplianceDocStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          doc_type?: ComplianceDocType;
          file_url?: string | null;
          issue_date?: string | null;
          expiry_date?: string | null;
          status?: ComplianceDocStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenders: {
        Row: {
          id: string;
          source: TenderSource;
          external_reference: string | null;
          title: string;
          procuring_entity: string;
          category: string | null;
          description: string | null;
          publish_date: string | null;
          submission_deadline: string;
          clarification_deadline: string | null;
          site_visit_date: string | null;
          estimated_value: number | null;
          tender_document_url: string | null;
          status: TenderStatus;
          raw_scraped_data: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source?: TenderSource;
          external_reference?: string | null;
          title: string;
          procuring_entity: string;
          category?: string | null;
          description?: string | null;
          publish_date?: string | null;
          submission_deadline: string;
          clarification_deadline?: string | null;
          site_visit_date?: string | null;
          estimated_value?: number | null;
          tender_document_url?: string | null;
          status?: TenderStatus;
          raw_scraped_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          source?: TenderSource;
          external_reference?: string | null;
          title?: string;
          procuring_entity?: string;
          category?: string | null;
          description?: string | null;
          publish_date?: string | null;
          submission_deadline?: string;
          clarification_deadline?: string | null;
          site_visit_date?: string | null;
          estimated_value?: number | null;
          tender_document_url?: string | null;
          status?: TenderStatus;
          raw_scraped_data?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qualification_results: {
        Row: {
          id: string;
          tender_id: string;
          eligible_agpo: boolean;
          score: number;
          matched_services: Json;
          gaps: Json;
          ai_reasoning: string | null;
          recommendation: QualificationRecommendation;
          reviewed_by_user: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tender_id: string;
          eligible_agpo?: boolean;
          score?: number;
          matched_services?: Json;
          gaps?: Json;
          ai_reasoning?: string | null;
          recommendation?: QualificationRecommendation;
          reviewed_by_user?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tender_id?: string;
          eligible_agpo?: boolean;
          score?: number;
          matched_services?: Json;
          gaps?: Json;
          ai_reasoning?: string | null;
          recommendation?: QualificationRecommendation;
          reviewed_by_user?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'qualification_results_tender_id_fkey';
            columns: ['tender_id'];
            isOneToOne: false;
            referencedRelation: 'tenders';
            referencedColumns: ['id'];
          },
        ];
      };
      applications: {
        Row: {
          id: string;
          tender_id: string;
          status: ApplicationStatus;
          checklist: Json;
          submission_method: SubmissionMethod;
          submission_deadline: string | null;
          submitted_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tender_id: string;
          status?: ApplicationStatus;
          checklist?: Json;
          submission_method?: SubmissionMethod;
          submission_deadline?: string | null;
          submitted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tender_id?: string;
          status?: ApplicationStatus;
          checklist?: Json;
          submission_method?: SubmissionMethod;
          submission_deadline?: string | null;
          submitted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'applications_tender_id_fkey';
            columns: ['tender_id'];
            isOneToOne: false;
            referencedRelation: 'tenders';
            referencedColumns: ['id'];
          },
        ];
      };
      document_templates: {
        Row: {
          id: string;
          name: string;
          doc_type: string;
          template_content: string;
          is_fixed_format: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          doc_type: string;
          template_content: string;
          is_fixed_format?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          doc_type?: string;
          template_content?: string;
          is_fixed_format?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      generated_documents: {
        Row: {
          id: string;
          application_id: string;
          doc_type: GeneratedDocType;
          template_id: string | null;
          content: string | null;
          file_url: string | null;
          version: number;
          status: GeneratedDocStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          doc_type: GeneratedDocType;
          template_id?: string | null;
          content?: string | null;
          file_url?: string | null;
          version?: number;
          status?: GeneratedDocStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          doc_type?: GeneratedDocType;
          template_id?: string | null;
          content?: string | null;
          file_url?: string | null;
          version?: number;
          status?: GeneratedDocStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'generated_documents_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'generated_documents_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'document_templates';
            referencedColumns: ['id'];
          },
        ];
      };
      agent_conversations: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      agent_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: AgentMessageRole;
          content: string;
          tool_calls: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: AgentMessageRole;
          content: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          role?: AgentMessageRole;
          content?: string;
          tool_calls?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_messages_conversation_id_fkey';
            columns: ['conversation_id'];
            isOneToOne: false;
            referencedRelation: 'agent_conversations';
            referencedColumns: ['id'];
          },
        ];
      };
      tender_deadlines: {
        Row: {
          id: string;
          tender_id: string;
          deadline_type: TenderDeadlineType;
          deadline_at: string;
          reminder_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tender_id: string;
          deadline_type: TenderDeadlineType;
          deadline_at: string;
          reminder_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tender_id?: string;
          deadline_type?: TenderDeadlineType;
          deadline_at?: string;
          reminder_sent?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tender_deadlines_tender_id_fkey';
            columns: ['tender_id'];
            isOneToOne: false;
            referencedRelation: 'tenders';
            referencedColumns: ['id'];
          },
        ];
      };
      scrape_logs: {
        Row: {
          id: string;
          source: string;
          status: string;
          tenders_found: number;
          tenders_imported: number;
          error_message: string | null;
          stack_trace: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          status: string;
          tenders_found?: number;
          tenders_imported?: number;
          error_message?: string | null;
          stack_trace?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          status?: string;
          tenders_found?: number;
          tenders_imported?: number;
          error_message?: string | null;
          stack_trace?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          message: string;
          severity: string;
          entity_type: string | null;
          entity_id: string | null;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          message: string;
          severity?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          message?: string;
          severity?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      system_settings: {
        Row: {
          id: number;
          email_notifications_enabled: boolean;
          in_app_notifications_enabled: boolean;
          notification_email: string | null;
          deadline_thresholds_days: Json;
          compliance_thresholds_days: Json;
          auto_qualify_discovered: boolean;
          min_score_to_notify: number;
          resend_api_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          email_notifications_enabled?: boolean;
          in_app_notifications_enabled?: boolean;
          notification_email?: string | null;
          deadline_thresholds_days?: Json;
          compliance_thresholds_days?: Json;
          auto_qualify_discovered?: boolean;
          min_score_to_notify?: number;
          resend_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          email_notifications_enabled?: boolean;
          in_app_notifications_enabled?: boolean;
          notification_email?: string | null;
          deadline_thresholds_days?: Json;
          compliance_thresholds_days?: Json;
          auto_qualify_discovered?: boolean;
          min_score_to_notify?: number;
          resend_api_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      compliance_doc_type: ComplianceDocType;
      compliance_doc_status: ComplianceDocStatus;
      tender_source: TenderSource;
      tender_status: TenderStatus;
      qualification_recommendation: QualificationRecommendation;
      application_status: ApplicationStatus;
      submission_method: SubmissionMethod;
      generated_doc_type: GeneratedDocType;
      generated_doc_status: GeneratedDocStatus;
      agent_message_role: AgentMessageRole;
      tender_deadline_type: TenderDeadlineType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
