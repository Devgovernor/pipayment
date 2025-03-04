/*
  # Create Refunds and Disputes Tables

  1. New Tables
    - `refunds`
      - `id` (uuid, primary key)
      - `amount` (numeric)
      - `reason` (text)
      - `status` (enum)
      - `payment_id` (uuid, foreign key)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `disputes`
      - `id` (uuid, primary key)
      - `reason` (enum)
      - `description` (text)
      - `status` (enum)
      - `payment_id` (uuid, foreign key)
      - `metadata` (jsonb)
      - `resolved_at` (timestamptz)
      - `resolution` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE refund_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE dispute_reason AS ENUM ('fraudulent', 'duplicate', 'product_not_received', 'product_unacceptable', 'subscription_cancelled', 'other');
CREATE TYPE dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL,
  reason text NOT NULL,
  status refund_status NOT NULL DEFAULT 'pending',
  payment_id uuid NOT NULL REFERENCES payments(id),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reason dispute_reason NOT NULL,
  description text NOT NULL,
  status dispute_status NOT NULL DEFAULT 'open',
  payment_id uuid NOT NULL REFERENCES payments(id),
  metadata jsonb,
  resolved_at timestamptz,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Create policies for refunds
CREATE POLICY "Merchants can view their own refunds"
  ON refunds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = refunds.payment_id
      AND p.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create refunds for their payments"
  ON refunds
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_id
      AND p.merchant_id = auth.uid()
    )
  );

-- Create policies for disputes
CREATE POLICY "Merchants can view their own disputes"
  ON disputes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = disputes.payment_id
      AND p.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can create disputes for their payments"
  ON disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_id
      AND p.merchant_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX refunds_payment_id_idx ON refunds(payment_id);
CREATE INDEX refunds_status_idx ON refunds(status);
CREATE INDEX disputes_payment_id_idx ON disputes(payment_id);
CREATE INDEX disputes_status_idx ON disputes(status);