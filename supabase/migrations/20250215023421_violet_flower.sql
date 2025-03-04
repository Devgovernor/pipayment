/*
  # Add notification templates

  1. New Tables
    - `notification_templates`
      - `id` (uuid, primary key)
      - `name` (text)
      - `type` (enum: email, sms)
      - `subject` (text)
      - `content` (text)
      - `variables` (jsonb)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `notification_templates` table
    - Add policies for admin access
*/

-- Create enum type for template types
CREATE TYPE template_type AS ENUM ('email', 'sms');

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type template_type NOT NULL,
  subject text NOT NULL,
  content text NOT NULL,
  variables jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage notification templates"
  ON notification_templates
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX notification_templates_type_idx ON notification_templates(type);
CREATE INDEX notification_templates_is_active_idx ON notification_templates(is_active);