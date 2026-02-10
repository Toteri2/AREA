CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE flows (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_flows_user_id ON flows(user_id);

CREATE TABLE `triggers` (
  id CHAR(36) PRIMARY KEY,
  flow_id CHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
);

CREATE INDEX idx_triggers_flow_id ON `triggers`(flow_id);

CREATE TABLE actions (
  id CHAR(36) PRIMARY KEY,
  flow_id CHAR(36) NOT NULL,
  ordinal INT NOT NULL DEFAULT 0,
  service VARCHAR(50) NOT NULL,
  config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE
);

CREATE INDEX idx_actions_flow_id ON actions(flow_id);
