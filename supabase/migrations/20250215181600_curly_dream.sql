/*
  # Add System Configuration Support

  1. New Tables
    - `system_configs` - Stores system-wide configuration settings
      - `key` (text, primary key)
      - `value` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for admin access
*/

-- Create system_configs table
CREATE TABLE IF NOT EXISTS system_configs (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_configs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage system configs"
  ON system_configs
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (u.role = 'admin' OR u.role = 'super_admin')
    )
  );

-- Insert default configurations
INSERT INTO system_configs (key, value)
VALUES
  ('maintenanceMode', 'false'),
  ('systemVersion', '"1.0.0"'),
  ('maxUploadSize', '10485760'),
  ('allowedFileTypes', '["image/jpeg", "image/png", "image/gif", "application/pdf"]'),
  ('emailNotifications', 'true'),
  ('smsNotifications', 'true')
ON CONFLICT (key) DO NOTHING;