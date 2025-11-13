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

// Corresponds to the 'downloads' table
export interface Download {
  id: string;
  title: string;
  description: string;
  file_url: string;
  is_premium: boolean;
}

// Corresponds to the new 'chapters' table. It can have its own downloads.
export interface Chapter {
  id: string;
  course_id: string;
  title: string;
  description: string;
  video_url: string;
  position: number;
  downloads: Download[]; // Joined from 'chapter_downloads'
}

// Corresponds to the new 'courses' table structure
export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  is_premium: boolean;
  syllabus: string;
  tags: string[];
}


export interface Community {
  id: string;
  created_at: string;
  name: string;
  description: string;
  image_url: string;
  is_premium: boolean;
}

// Corresponds to the new 'classrooms' table
export interface Classroom {
  id: string;
  name: string;
  description: string;
  is_premium: boolean;
  course_id: string;
  primary_community_id: string;
  // These fields are joined in the API call for displaying in lists
  course_title?: string;
  primary_community_name?: string;
}

export type View = 'community' | 'courses' | 'classroom' | 'downloads' | 'settings' | 'admin';

export interface AiChatMessage {
  role: 'user' | 'model';
  text: string;
}