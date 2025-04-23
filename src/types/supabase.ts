
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
  color_scheme: 'blue' | 'red' | 'orange' | 'green' | null;
  landing_image: string | null;
  user_id: string;
  created_at: string | null;
  telegram_bot: string | null;
  description: string | null; // Added description property
}

export interface ProjectKnowledge {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  document_url: string | null;
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
