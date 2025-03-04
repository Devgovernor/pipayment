/*
  # Dispute Resolution System

  1. New Tables
    - `dispute_evidence` - Stores evidence files and details for disputes
    - `dispute_comments` - Stores comments and communication for disputes
    - `dispute_history` - Tracks dispute status changes and actions

  2. Changes
    - Add new columns to `disputes` table for resolution workflow
    - Add new dispute status options

  3. Security
    - Enable RLS on all new tables
    - Add policies for merchants and admins
*/

-- Create dispute evidence table
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id),
  file_url text NOT NULL,
  file_type text NOT NULL,
  description text,
  uploaded_by uuid REFERENCES users(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create dispute comments table
CREATE TABLE IF NOT EXISTS dispute_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id),
  user_id uuid NOT NULL REFERENCES users(id),
  comment text NOT NULL,
  internal boolean NOT NULL DEFAULT false,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create dispute history table
CREATE TABLE IF NOT EXISTS dispute_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id),
  user_id uuid NOT NULL REFERENCES users(id),
  action text NOT NULL,
  old_status dispute_status,
  new_status dispute_status,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add new columns to disputes table
ALTER TABLE disputes
ADD COLUMN IF NOT EXISTS evidence_due_date timestamptz,
ADD COLUMN IF NOT EXISTS merchant_evidence_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_evidence_submitted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes text;

-- Enable RLS
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_history ENABLE ROW LEVEL SECURITY;

-- Create policies for dispute evidence
CREATE POLICY "Users can view their own dispute evidence"
  ON dispute_evidence
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN payments p ON d.payment_id = p.id
      WHERE d.id = dispute_evidence.dispute_id
      AND (p.merchant_id = auth.uid() OR uploaded_by = auth.uid())
    )
  );

CREATE POLICY "Users can upload evidence to their own disputes"
  ON dispute_evidence
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN payments p ON d.payment_id = p.id
      WHERE d.id = dispute_id
      AND (p.merchant_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
    )
  );

-- Create policies for dispute comments
CREATE POLICY "Users can view dispute comments"
  ON dispute_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN payments p ON d.payment_id = p.id
      WHERE d.id = dispute_comments.dispute_id
      AND (p.merchant_id = auth.uid() OR internal = false OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
    )
  );

CREATE POLICY "Users can add comments to disputes"
  ON dispute_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN payments p ON d.payment_id = p.id
      WHERE d.id = dispute_id
      AND (p.merchant_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
    )
  );

-- Create policies for dispute history
CREATE POLICY "Users can view dispute history"
  ON dispute_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes d
      JOIN payments p ON d.payment_id = p.id
      WHERE d.id = dispute_history.dispute_id
      AND (p.merchant_id = auth.uid() OR auth.uid() IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
    )
  );

-- Create indexes
CREATE INDEX dispute_evidence_dispute_id_idx ON dispute_evidence(dispute_id);
CREATE INDEX dispute_comments_dispute_id_idx ON dispute_comments(dispute_id);
CREATE INDEX dispute_history_dispute_id_idx ON dispute_history(dispute_id);
CREATE INDEX dispute_history_created_at_idx ON dispute_history(created_at);