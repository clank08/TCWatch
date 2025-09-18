-- TCWatch Row Level Security (RLS) Policies
-- This file contains all RLS policies for privacy-first data access

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Content tables (public read, admin write)
-- No RLS on content, content_cases, challenges as they are public data

-- User Profiles: Users can only see/edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Allow users to view profiles of friends (for social features)
CREATE POLICY "Users can view friends profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.requester_id::text = auth.uid()::text AND f.addressee_id::text = user_id::text) OR
        (f.addressee_id::text = auth.uid()::text AND f.requester_id::text = user_id::text)
      ) AND f.status = 'accepted'
    )
  );

-- User Content: Users can only access their own content tracking
CREATE POLICY "Users can manage own content tracking" ON user_content
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Episode Progress: Users can only access their own episode progress
CREATE POLICY "Users can manage own episode progress" ON episode_progress
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Custom Lists: Users can see their own lists and public/friends lists
CREATE POLICY "Users can manage own lists" ON custom_lists
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view public lists" ON custom_lists
  FOR SELECT USING (privacy = 'public');

CREATE POLICY "Users can view friends lists" ON custom_lists
  FOR SELECT USING (
    privacy = 'friends' AND EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.requester_id::text = auth.uid()::text AND f.addressee_id::text = user_id::text) OR
        (f.addressee_id::text = auth.uid()::text AND f.requester_id::text = user_id::text)
      ) AND f.status = 'accepted'
    )
  );

-- List Items: Access follows list privacy settings
CREATE POLICY "Users can manage own list items" ON list_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM custom_lists cl
      WHERE cl.id = list_id AND auth.uid()::text = cl.user_id::text
    )
  );

CREATE POLICY "Users can view public list items" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_lists cl
      WHERE cl.id = list_id AND cl.privacy = 'public'
    )
  );

CREATE POLICY "Users can view friends list items" ON list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM custom_lists cl
      WHERE cl.id = list_id AND cl.privacy = 'friends'
      AND EXISTS (
        SELECT 1 FROM friendships f
        WHERE (
          (f.requester_id::text = auth.uid()::text AND f.addressee_id::text = cl.user_id::text) OR
          (f.addressee_id::text = auth.uid()::text AND f.requester_id::text = cl.user_id::text)
        ) AND f.status = 'accepted'
      )
    )
  );

-- Friendships: Users can manage their own friendship requests
CREATE POLICY "Users can manage own friendships" ON friendships
  FOR ALL USING (
    auth.uid()::text = requester_id::text OR auth.uid()::text = addressee_id::text
  );

-- Social Activities: Users can see their own activities and friends' activities based on privacy
CREATE POLICY "Users can manage own activities" ON social_activities
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view friends activities" ON social_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.requester_id::text = auth.uid()::text AND f.addressee_id::text = user_id::text) OR
        (f.addressee_id::text = auth.uid()::text AND f.requester_id::text = user_id::text)
      ) AND f.status = 'accepted'
    )
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id::text = user_id::text
      AND (up.privacy_settings->>'activity_visible')::boolean = true
    )
  );

-- Notifications: Users can only access their own notifications
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Challenge Participants: Users can manage their own participation
CREATE POLICY "Users can manage own challenge participation" ON challenge_participants
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can view other participants for leaderboards (limited data)
CREATE POLICY "Users can view challenge leaderboards" ON challenge_participants
  FOR SELECT USING (true); -- Public leaderboard data

-- Challenge Progress: Users can manage their own challenge progress
CREATE POLICY "Users can manage own challenge progress" ON challenge_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.id = participant_id AND auth.uid()::text = cp.user_id::text
    )
  );

-- User Achievements: Users can manage their own achievements
CREATE POLICY "Users can manage own achievements" ON user_achievements
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Users can view friends' achievements for social features
CREATE POLICY "Users can view friends achievements" ON user_achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE (
        (f.requester_id::text = auth.uid()::text AND f.addressee_id::text = user_id::text) OR
        (f.addressee_id::text = auth.uid()::text AND f.requester_id::text = user_id::text)
      ) AND f.status = 'accepted'
    )
  );

-- Create function to check if user has admin role (for future admin features)
CREATE OR REPLACE FUNCTION auth.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = user_id
    AND u.raw_app_meta_data->>'role' = 'admin'
  );
$$;

-- Admin policies for content management (uncomment when admin features are implemented)
-- CREATE POLICY "Admins can manage all content" ON content
--   FOR ALL USING (auth.is_admin(auth.uid()));

-- CREATE POLICY "Admins can manage all cases" ON content_cases
--   FOR ALL USING (auth.is_admin(auth.uid()));

-- Indexes for RLS performance optimization
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_user_id ON user_content(user_id);
CREATE INDEX IF NOT EXISTS idx_episode_progress_user_id ON episode_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_privacy ON custom_lists(privacy);
CREATE INDEX IF NOT EXISTS idx_friendships_requester_id ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee_id ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_social_activities_user_id ON social_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- Create function to initialize user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, display_name, created_at, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  RETURN new;
END;
$$;

-- Trigger to create user profile automatically when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Revoke unnecessary permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON content TO anon; -- Allow anonymous users to browse content
GRANT SELECT ON content_cases TO anon; -- Allow anonymous users to browse cases
GRANT SELECT ON challenges TO anon; -- Allow anonymous users to see challenges

-- Comments for documentation
COMMENT ON POLICY "Users can view own profile" ON user_profiles IS 'Users can only view their own profile data';
COMMENT ON POLICY "Users can manage own content tracking" ON user_content IS 'Users can only access their own content tracking data';
COMMENT ON POLICY "Users can view public lists" ON custom_lists IS 'Anyone can view lists marked as public';
COMMENT ON POLICY "Users can view friends lists" ON custom_lists IS 'Users can view lists from confirmed friends when privacy is set to friends';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user profile when a new user signs up via Supabase Auth';