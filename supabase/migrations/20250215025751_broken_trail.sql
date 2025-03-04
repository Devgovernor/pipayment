/*
  # Create sessions table and update users table

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `device_info` (jsonb)
      - `ip_address` (inet)
      - `is_active` (boolean)
      - `last_activity` (timestamptz)
      - `ended_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to users table
    - Add `otp_secret` column
    - Add `otp_enabled` column
    - Add `phone_number` column
    - Add `phone_verified` column

  3. Security
    - Enable RLS on sessions table
    - Add policies for session management
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  device_info jsonb NOT NULL,
  ip_address inet NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_activity timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS otp_secret text,
ADD COLUMN IF NOT EXISTS otp_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false;

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own sessions"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sessions"
  ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_is_active_idx ON sessions(is_active);
CREATE INDEX sessions_last_activity_idx ON sessions(last_activity);
CREATE INDEX users_phone_number_idx ON users(phone_number);