-- Create enum types for notifications
CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE notification_type AS ENUM ('security', 'transaction', 'account', 'system');

-- Create in-app notifications table
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  read boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add notification settings to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS settings jsonb;

-- Enable RLS
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON in_app_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON in_app_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX in_app_notifications_user_id_idx ON in_app_notifications(user_id);
CREATE INDEX in_app_notifications_read_idx ON in_app_notifications(read);
CREATE INDEX in_app_notifications_created_at_idx ON in_app_notifications(created_at);