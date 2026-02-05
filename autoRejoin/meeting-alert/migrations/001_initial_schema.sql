-- Meeting Alert Database Schema
-- Version: 001_initial_schema
-- Description: Initial database setup with accounts, meetings, subscriptions, and notifications tables

-- =============================================
-- TABLE: accounts
-- Purpose: Store Google OAuth tokens and provider information
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_provider_account UNIQUE (provider, provider_account_id)
);

-- Index for quick lookups by user
CREATE INDEX idx_accounts_user_id ON accounts(user_id);

-- =============================================
-- TABLE: meetings
-- Purpose: Store meeting data from Google Calendar
-- =============================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'google_meet',
  meeting_id TEXT NOT NULL,
  meeting_link TEXT,
  title TEXT,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  attendees JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended')),
  user_left_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_user_left_at ON meetings(user_left_at) WHERE user_left_at IS NOT NULL;
CREATE INDEX idx_meetings_last_checked ON meetings(last_checked_at);
CREATE INDEX idx_meetings_scheduled_start ON meetings(scheduled_start);

-- =============================================
-- TABLE: subscriptions
-- Purpose: Track Stripe subscription status for users
-- =============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'pro',
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick subscription lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- =============================================
-- TABLE: notifications
-- Purpose: Track notification history and delivery status
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'browser')),
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clicked_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'failed'))
);

-- Indexes for notification queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_meeting_id ON notifications(meeting_id);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- Purpose: Automatically update the updated_at column on row changes
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic updated_at maintenance
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- Purpose: Ensure users can only access their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES: accounts
-- =============================================

-- Users can view their own accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert their own accounts"
  ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update their own accounts"
  ON accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete their own accounts"
  ON accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: meetings
-- =============================================

-- Users can view their own meetings
CREATE POLICY "Users can view their own meetings"
  ON meetings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own meetings
CREATE POLICY "Users can insert their own meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own meetings
CREATE POLICY "Users can update their own meetings"
  ON meetings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own meetings
CREATE POLICY "Users can delete their own meetings"
  ON meetings
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: subscriptions
-- =============================================

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription
CREATE POLICY "Users can insert their own subscription"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription
CREATE POLICY "Users can update their own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own subscription
CREATE POLICY "Users can delete their own subscription"
  ON subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- RLS POLICIES: notifications
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (e.g., marking as clicked)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- COMMENTS: Document table purposes
-- =============================================

COMMENT ON TABLE accounts IS 'Stores Google OAuth tokens and provider account information';
COMMENT ON TABLE meetings IS 'Stores meeting data synced from Google Calendar';
COMMENT ON TABLE subscriptions IS 'Tracks Stripe subscription status and billing information';
COMMENT ON TABLE notifications IS 'Records notification history and delivery status';

COMMENT ON COLUMN accounts.expires_at IS 'Unix timestamp (seconds) when the access token expires';
COMMENT ON COLUMN meetings.attendees IS 'JSON array of meeting attendees with email and name';
COMMENT ON COLUMN meetings.user_left_at IS 'Timestamp when user left the meeting (for rejoining logic)';
COMMENT ON COLUMN meetings.last_checked_at IS 'Last time we checked participant status';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'Whether subscription cancels at end of current period';
COMMENT ON COLUMN notifications.clicked_at IS 'Timestamp when user clicked on the notification';

-- =============================================
-- INITIAL SETUP COMPLETE
-- =============================================

-- Verify all tables were created
DO $$
BEGIN
  RAISE NOTICE 'Migration 001_initial_schema completed successfully!';
  RAISE NOTICE 'Created tables: accounts, meetings, subscriptions, notifications';
  RAISE NOTICE 'Created indexes for optimal query performance';
  RAISE NOTICE 'Enabled Row Level Security on all tables';
  RAISE NOTICE 'Created RLS policies for secure data access';
END $$;
