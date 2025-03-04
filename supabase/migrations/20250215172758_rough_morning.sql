/*
  # Add Subscription Support

  1. New Tables
    - `subscriptions`
      - `id` (uuid, primary key)
      - `merchant_id` (uuid, foreign key)
      - `name` (text)
      - `description` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `interval` (enum)
      - `interval_count` (int)
      - `trial_period_days` (int, nullable)
      - `status` (enum)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `subscription_payments`
      - `id` (uuid, primary key)
      - `subscription_id` (uuid, foreign key)
      - `payment_id` (uuid, foreign key)
      - `billing_period_start` (timestamptz)
      - `billing_period_end` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for merchants to manage their subscriptions
*/

-- Create subscription interval enum
CREATE TYPE subscription_interval AS ENUM (
  'daily',
  'weekly',
  'monthly',
  'yearly'
);

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'active',
  'paused',
  'cancelled',
  'expired'
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  name text NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  interval subscription_interval NOT NULL,
  interval_count int NOT NULL,
  trial_period_days int,
  status subscription_status NOT NULL DEFAULT 'active',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create subscription_payments table
CREATE TABLE IF NOT EXISTS subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for subscriptions
CREATE POLICY "Merchants can view their own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update their own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (merchant_id = auth.uid());

-- Create policies for subscription_payments
CREATE POLICY "Merchants can view their subscription payments"
  ON subscription_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = subscription_id
      AND s.merchant_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX subscriptions_merchant_id_idx ON subscriptions(merchant_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscription_payments_subscription_id_idx ON subscription_payments(subscription_id);
CREATE INDEX subscription_payments_payment_id_idx ON subscription_payments(payment_id);