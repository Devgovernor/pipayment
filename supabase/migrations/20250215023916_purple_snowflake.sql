-- Create monitoring tables
CREATE TABLE IF NOT EXISTS system_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  value float NOT NULL,
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message text NOT NULL,
  stack_trace text NOT NULL,
  user_id uuid REFERENCES users(id),
  metadata jsonb,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  user_id uuid REFERENCES users(id),
  resource_id text,
  changes jsonb,
  ip_address inet,
  user_agent text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create fraud prevention tables
CREATE TYPE fraud_alert_type AS ENUM (
  'suspicious_amount',
  'multiple_failed_attempts',
  'unusual_location',
  'velocity_check'
);

CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type fraud_alert_type NOT NULL,
  description text NOT NULL,
  payment_id uuid REFERENCES payments(id),
  metadata jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_by uuid REFERENCES users(id),
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid REFERENCES payments(id),
  score float NOT NULL,
  factors jsonb NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_scores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage monitoring data"
  ON system_metrics
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage error logs"
  ON error_logs
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage fraud alerts"
  ON fraud_alerts
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Merchants can view their own risk scores"
  ON risk_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments p
      WHERE p.id = risk_scores.payment_id
      AND p.merchant_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX system_metrics_timestamp_idx ON system_metrics(timestamp);
CREATE INDEX error_logs_timestamp_idx ON error_logs(timestamp);
CREATE INDEX audit_logs_timestamp_idx ON audit_logs(timestamp);
CREATE INDEX fraud_alerts_created_at_idx ON fraud_alerts(created_at);
CREATE INDEX risk_scores_payment_id_idx ON risk_scores(payment_id);