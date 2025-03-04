-- Create enum types
CREATE TYPE currency_code AS ENUM (
  'PI',
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CNY'
);

CREATE TYPE payment_method AS ENUM (
  'pi_network',
  'card',
  'bank_transfer',
  'crypto'
);

CREATE TYPE invoice_status AS ENUM (
  'draft',
  'sent',
  'paid',
  'overdue',
  'cancelled'
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  email text NOT NULL,
  name text,
  phone text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  type payment_method NOT NULL,
  details jsonb NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  customer_id uuid NOT NULL REFERENCES customers(id),
  number text NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  amount numeric NOT NULL,
  currency currency_code NOT NULL,
  due_date timestamptz NOT NULL,
  items jsonb NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create batch_payments table
CREATE TABLE IF NOT EXISTS batch_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  file_name text NOT NULL,
  total_amount numeric NOT NULL,
  currency currency_code NOT NULL,
  status text NOT NULL,
  processed_count int NOT NULL DEFAULT 0,
  total_count int NOT NULL,
  errors jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create marketplace_sellers table
CREATE TABLE IF NOT EXISTS marketplace_sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  seller_id uuid NOT NULL REFERENCES merchants(id),
  commission_rate numeric NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, seller_id)
);

-- Create checkout_templates table
CREATE TABLE IF NOT EXISTS checkout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id),
  name text NOT NULL,
  description text,
  template jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add currency support to existing tables
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency currency_code NOT NULL DEFAULT 'PI';
ALTER TABLE refunds ADD COLUMN IF NOT EXISTS currency currency_code NOT NULL DEFAULT 'PI';
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS currency currency_code NOT NULL DEFAULT 'PI';

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Merchants can view their own customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can manage their customers' payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM customers c
      WHERE c.id = customer_id
      AND c.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can manage their invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can manage their batch payments"
  ON batch_payments
  FOR ALL
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can manage their marketplace sellers"
  ON marketplace_sellers
  FOR ALL
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can manage their checkout templates"
  ON checkout_templates
  FOR ALL
  TO authenticated
  USING (merchant_id = auth.uid());

-- Create indexes
CREATE INDEX customers_merchant_id_idx ON customers(merchant_id);
CREATE INDEX customers_email_idx ON customers(email);
CREATE INDEX payment_methods_customer_id_idx ON payment_methods(customer_id);
CREATE INDEX invoices_merchant_id_idx ON invoices(merchant_id);
CREATE INDEX invoices_customer_id_idx ON invoices(customer_id);
CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX batch_payments_merchant_id_idx ON batch_payments(merchant_id);
CREATE INDEX batch_payments_status_idx ON batch_payments(status);
CREATE INDEX marketplace_sellers_merchant_id_idx ON marketplace_sellers(merchant_id);
CREATE INDEX marketplace_sellers_seller_id_idx ON marketplace_sellers(seller_id);
CREATE INDEX checkout_templates_merchant_id_idx ON checkout_templates(merchant_id);