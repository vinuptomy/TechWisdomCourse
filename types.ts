export type UserPlan = 'free' | 'premium';

// Corresponds to the 'profiles' table in Supabase
export interface UserProfile {
  id: string; // Corresponds to auth.users.id
  name:string;
  email: string;
  avatar_url: string;
  plan: UserPlan;
  stripe_customer_id?: string;
}

// Corresponds to the 'posts' table
export interface Post {
  id: string;
  author_id: string;
  author: Pick<UserProfile, 'id' | 'name' | 'avatar_url'>; // Joined author data from 'profiles'
  content: string;
  created_at: string;
  likes: number;
  comments_count: number;
}

// Corresponds to the 'lessons' table
export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  video_id: string; // YouTube video ID
  is_premium: boolean;
}

// Corresponds to the 'courses' table
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  lessons: Lesson[]; // Joined from 'lessons' table
}

// Corresponds to the 'downloads' table
export interface Download {
  id:string;
  title: string;
  description: string;
  file_url: string;
}

export type View = 'community' | 'classroom' | 'downloads' | 'settings';

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}
