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

-- Create marketplace_products table
CREATE TABLE IF NOT EXISTS marketplace_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES marketplace_sellers(id),
  name text NOT NULL,
  description text,
  price numeric NOT NULL,
  currency text NOT NULL,
  sku text,
  inventory_count int,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create marketplace_orders table
CREATE TABLE IF NOT EXISTS marketplace_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES payments(id),
  seller_id uuid NOT NULL REFERENCES marketplace_sellers(id),
  status text NOT NULL,
  total_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  seller_amount numeric NOT NULL,
  currency text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create marketplace_order_items table
CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES marketplace_orders(id),
  product_id uuid NOT NULL REFERENCES marketplace_products(id),
  quantity int NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE marketplace_sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Merchants can manage their marketplace sellers"
  ON marketplace_sellers
  FOR ALL
  TO authenticated
  USING (merchant_id = auth.uid());

CREATE POLICY "Sellers can view their own marketplace entries"
  ON marketplace_sellers
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can manage their products"
  ON marketplace_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_sellers ms
      WHERE ms.id = seller_id
      AND (ms.merchant_id = auth.uid() OR ms.seller_id = auth.uid())
    )
  );

CREATE POLICY "Merchants can view marketplace orders"
  ON marketplace_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_sellers ms
      WHERE ms.id = seller_id
      AND (ms.merchant_id = auth.uid() OR ms.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can view their order items"
  ON marketplace_order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_orders mo
      JOIN marketplace_sellers ms ON mo.seller_id = ms.id
      WHERE mo.id = order_id
      AND (ms.merchant_id = auth.uid() OR ms.seller_id = auth.uid())
    )
  );

-- Create indexes
CREATE INDEX marketplace_sellers_merchant_id_idx ON marketplace_sellers(merchant_id);
CREATE INDEX marketplace_sellers_seller_id_idx ON marketplace_sellers(seller_id);
CREATE INDEX marketplace_products_seller_id_idx ON marketplace_products(seller_id);
CREATE INDEX marketplace_products_sku_idx ON marketplace_products(sku);
CREATE INDEX marketplace_orders_payment_id_idx ON marketplace_orders(payment_id);
CREATE INDEX marketplace_orders_seller_id_idx ON marketplace_orders(seller_id);
CREATE INDEX marketplace_orders_status_idx ON marketplace_orders(status);
CREATE INDEX marketplace_order_items_order_id_idx ON marketplace_order_items(order_id);
CREATE INDEX marketplace_order_items_product_id_idx ON marketplace_order_items(product_id);