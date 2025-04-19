
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
  ai_instructions: string | null;  // Ensure this is included
  materials: string | null;  // Ensure this is included
}
