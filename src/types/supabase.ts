
// Define types for our Supabase tables
export type UserRole = 'influencer' | 'customer' | 'admin';

export interface Profile {
  id: string;
  email: string | null;
  role: UserRole | null;
  telegram: string | null;
  instagram: string | null;
  tiktok: string | null;
  created_at: string | null;
}

export interface Project {
  id: string;
  name: string;
  status: boolean | null;
  url_name: string;
  color_scheme: 'blue' | 'red' | 'orange' | 'green' | 'purple' | 'indigo' | 'pink' | 'teal' | null;
  landing_image: string | null;
  user_id: string;
  created_at: string | null;
  telegram_bot: string | null;
  description: string | null;
  // New properties for shared projects
  isShared?: boolean;
  ownerEmail?: string;
}

// Updated to match project_knowledge_vector table structure with metadata field
export interface ProjectKnowledge {
  id: number;
  content: string;
  created_at: string;
  metadata?: {
    projectId?: string;
    loc?: {
      lines?: {
        to: number;
        from: number;
      };
    };
    source?: string;
    blobType?: string;
  };
}

export interface Course {
  id: string;
  name: string;
  description: string | null;
  status: boolean | null;
  type: string | null;
  price: number;
  duration: number | null;
  recurring: boolean | null;
  details: string | null;
  telegram_bot: string | null;
  project_id: string;
  created_at: string | null;
  ai_instructions: string | null;
  materials: string | null;
  course_plan: string | null;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  created_at: string | null;
}

export interface Subscription {
  id: string;
  enrollment_id: string;
  is_paid: boolean | null;
  begin_date: string | null;
  end_date: string | null;
  created_at: string | null;
}

export interface ProjectSecret {
  id: string;
  project_id: string;
  stripe_secret: string | null;
  gemini_api_key: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Updated type for project roles to include 'owner'
export type ProjectRole = 'owner' | 'contributor' | 'knowledge_manager' | 'read_only';

// New interface for project shares
export interface ProjectShare {
  id: string;
  project_id: string;
  user_id: string;
  inviter_id: string | null;
  role: ProjectRole;
  invited_email: string | null;
  status: 'pending' | 'accepted';
  created_at: string;
  updated_at: string;
}
