/*
  # Initial Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password` (text)
      - `role` (enum)
      - `is_active` (boolean)
      - `last_login_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `merchants`
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `is_verified` (boolean)
      - `is_active` (boolean)
      - `settings` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `api_keys`
      - `id` (uuid, primary key)
      - `name` (text)
      - `key` (text, unique)
      - `merchant_id` (uuid, foreign key)
      - `is_active` (boolean)
      - `expires_at` (timestamptz)
      - `last_used_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `merchant_id` (uuid, foreign key)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (enum)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transactions`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, foreign key)
      - `amount` (numeric)
      - `currency` (text)
      - `type` (enum)
      - `status` (enum)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'merchant');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'disputed');
CREATE TYPE transaction_type AS ENUM ('payment', 'refund', 'chargeback', 'settlement');
CREATE TYPE transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role user_role NOT NULL DEFAULT 'merchant',
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create merchants table
CREATE TABLE IF NOT EXISTS merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  is_verified boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  settings jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text UNIQUE NOT NULL,
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  amount numeric NOT NULL,
  currency text NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id),
  amount numeric NOT NULL,
  currency text NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'pending',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Merchants can read own data"
  ON merchants
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Merchants can view their own API keys"
  ON api_keys
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can view their own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can view their own transactions"
  ON transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = payment_id
      AND p.merchant_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX merchants_email_idx ON merchants(email);
CREATE INDEX api_keys_key_idx ON api_keys(key);
CREATE INDEX api_keys_merchant_id_idx ON api_keys(merchant_id);
CREATE INDEX payments_merchant_id_idx ON payments(merchant_id);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX transactions_payment_id_idx ON transactions(payment_id);
CREATE INDEX transactions_type_idx ON transactions(type);
CREATE INDEX transactions_status_idx ON transactions(status);