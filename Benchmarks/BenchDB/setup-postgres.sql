CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE flows (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flows_user_id ON flows(user_id);

CREATE TABLE triggers (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_triggers_flow_id ON triggers(flow_id);

CREATE TABLE actions (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  ordinal INT NOT NULL DEFAULT 0,
  service TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actions_flow_id ON actions(flow_id);
