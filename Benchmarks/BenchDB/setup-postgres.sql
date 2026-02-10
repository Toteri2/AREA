CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_trigger_templates (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config_schema JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trigger_templates_service ON service_trigger_templates(service_id);

CREATE TABLE service_action_templates (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  config_schema JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_action_templates_service ON service_action_templates(service_id);

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
  template_id UUID REFERENCES service_trigger_templates(id),
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_triggers_flow_id ON triggers(flow_id);
CREATE INDEX idx_triggers_template_id ON triggers(template_id);

CREATE TABLE actions (
  id UUID PRIMARY KEY,
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  ordinal INT NOT NULL DEFAULT 0,
  template_id UUID REFERENCES service_action_templates(id),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_actions_flow_id ON actions(flow_id);
CREATE INDEX idx_actions_template_id ON actions(template_id);
