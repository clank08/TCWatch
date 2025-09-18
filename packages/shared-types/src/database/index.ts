// Database schema types (for Prisma and Supabase)

export interface DatabaseUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  profile_image_url?: string;
  created_at: Date;
  updated_at: Date;
  preferences: Record<string, any>;
}

export interface DatabaseContent {
  id: string;
  title: string;
  description: string;
  content_type: 'movie' | 'tv' | 'documentary';
  release_date: Date;
  rating?: number;
  duration?: number;
  genres: string[];
  networks: string[];
  image_url?: string;
  trailer_url?: string;
  tmdb_id?: string;
  imdb_id?: string;
  tvdb_id?: string;
  created_at: Date;
  updated_at: Date;
  crime_case_id?: string;
}

export interface DatabaseUserContent {
  id: string;
  user_id: string;
  content_id: string;
  status: 'want-to-watch' | 'watching' | 'completed' | 'dropped';
  rating?: number;
  notes?: string;
  added_at: Date;
  updated_at: Date;
}

export interface DatabaseEpisodeProgress {
  id: string;
  user_content_id: string;
  season_number: number;
  episode_number: number;
  watched_at: Date;
  created_at: Date;
}

export interface DatabasePlatform {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website_url?: string;
  subscription_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseContentAvailability {
  id: string;
  content_id: string;
  platform_id: string;
  availability_type: 'subscription' | 'rent' | 'buy' | 'free';
  price?: number;
  currency?: string;
  url?: string;
  last_updated: Date;
  created_at: Date;
}

export interface DatabaseCrimeCase {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: Date;
  end_date?: Date;
  status: 'solved' | 'unsolved' | 'cold-case';
  key_persons: string[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseUserList {
  id: string;
  title: string;
  description?: string;
  is_public: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseUserListItem {
  id: string;
  list_id: string;
  content_id: string;
  added_at: Date;
  notes?: string;
  order_index: number;
}

export interface DatabaseFriendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}

// Temporal workflow types
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  workflow_type: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  input: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  started_at: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Search index types
export interface SearchDocument {
  id: string;
  title: string;
  description: string;
  content_type: string;
  genres: string[];
  networks: string[];
  release_year: number;
  rating?: number;
  crime_case_name?: string;
  crime_case_tags?: string[];
  popularity_score: number;
  updated_at: number; // Unix timestamp
}