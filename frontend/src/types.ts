export type EventItem = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  description: string;
  venue: string;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  is_published?: boolean;
  is_closed?: boolean;
  is_featured: boolean;
  show_public_details: boolean;
  extra_question: string;
  extra_question_required: boolean;
  taken: number;
  seats_left: number | null;
  is_full?: boolean;
  registrations?: RegistrationItem[];
};

export type RegistrationItem = {
  id: number;
  full_name: string;
  gender: string;
  kab_email: string;
  phone: string;
  programme: string;
  year_of_study: string;
  extra_answer: string;
  attended: boolean;
  created_at: string;
  event?: number;
  event_title?: string;
  venue?: string;
  starts_at?: string;
};

export type Stats = {
  events: number;
  upcoming: number;
  registrations: number;
  attended: number;
};
