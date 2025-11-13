export type UserPlan = 'free' | 'premium';

// Represents the data structure in the 'profiles' table
export interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  plan: UserPlan;
  stripe_customer_id?: string;
}

// Represents the application's user model, combining auth data (email) and profile data
export interface UserProfile extends Profile {
  email: string;
}

// A slimmed-down profile for embedding in other data types like posts
export interface AuthorProfile {
  id: string;
  name: string;
  avatar_url: string;
}

// Corresponds to the 'posts' table
export interface Post {
  id: string;
  author_id: string;
  author: AuthorProfile | null; // Joined author data from 'profiles'
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
