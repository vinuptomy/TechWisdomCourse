export type UserPlan = 'free' | 'premium';
export type UserRole = 'member' | 'admin';

// Represents the data structure in the 'profiles' table
export interface Profile {
  id: string;
  name: string;
  avatar_url: string;
  plan: UserPlan;
  role: UserRole;
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

// Corresponds to the data returned by our custom 'get_posts_with_details' function
export interface Post {
  id: string;
  author_id: string;
  author: AuthorProfile;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  community_id: string;
  user_has_liked: boolean;
}

// Corresponds to the 'comments' table, with joined author data
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  post_id: string;
  author: AuthorProfile;
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

export interface Community {
  id: string;
  created_at: string;
  name: string;
  description: string;
  image_url: string;
  is_premium: boolean;
}

export type View = 'community' | 'classroom' | 'downloads' | 'settings' | 'admin';

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}