## Database Structure Overview

The PostgreSQL database for the AREA project is designed to manage the relationships between users, flows, triggers, and actions efficiently. This section explains how the data is structured and how the relationships between entities are handled.

## Main Entities and Relationships

### 1. **Users**
- **Table Name**: `users`
- **Purpose**: Stores information about the users of the AREA platform.
- **Primary Key**: `id`
- **Key Columns**:
  - `id`: Unique identifier for each user.
  - `email`: The email address of the user.
  - `name`: The name of the user.
  - `password`: The hashed password of the user.
  - `created_at`: Timestamp for when the user was created.

### 2. **Flows**
- **Table Name**: `flows`
- **Purpose**: Represents workflows created by users. Each flow is a collection of triggers and actions.
- **Primary Key**: `id`
- **Foreign Key**: `user_id` (references `users.id`)
- **Key Columns**:
  - `id`: Unique identifier for each flow.
  - `user_id`: Links the flow to its creator (a user).
  - `name`: The name of the flow.
  - `description`: Optional description of the flow.
  - `created_at`: Timestamp for when the flow was created.

### 3. **Triggers**
- **Table Name**: `triggers`
- **Purpose**: Defines the events that initiate actions within a flow.
- **Primary Key**: `id`
- **Foreign Key**: `flow_id` (references `flows.id`)
- **Key Columns**:
  - `id`: Unique identifier for each trigger.
  - `flow_id`: Links the trigger to its parent flow.
  - `type`: The type of trigger (e.g., time-based, event-based).
  - `config`: JSONB column storing trigger-specific configurations (e.g., schedule, event details).
  - `created_at`: Timestamp for when the trigger was created.

### 4. **Actions**
- **Table Name**: `actions`
- **Purpose**: Represents the actions executed as part of a flow.
- **Primary Key**: `id`
- **Foreign Key**: `flow_id` (references `flows.id`)
- **Key Columns**:
  - `id`: Unique identifier for each action.
  - `flow_id`: Links the action to its parent flow.
  - `ordinal`: Integer representing the order of execution for actions within a flow.
  - `service`: The service associated with the action (e.g., Slack, Discord).
  - `config`: JSONB column storing action-specific configurations (e.g., webhook URL, message content).
  - `created_at`: Timestamp for when the action was created.

## Data Flow and Management

### Flow Creation
1. A user creates a new flow, which is stored in the `flows` table.
2. Triggers and actions associated with the flow are added to the `triggers` and `actions` tables, respectively.
3. The `flow_id` foreign key ensures that triggers and actions are linked to the correct flow.

### Trigger Execution
1. When a trigger condition is met (e.g., a scheduled time or an external event), the system queries the `triggers` table to retrieve the relevant configuration.
2. The `config` column (JSONB) is used to store and retrieve dynamic trigger settings.

### Action Execution
1. Once a trigger is activated, the system retrieves the associated actions from the `actions` table.
2. The `config` column (JSONB) is used to execute the action with the appropriate parameters (e.g., sending a message to a specific Slack channel).

### Data Integrity
- **Cascading Deletes**: When a flow is deleted, all associated triggers and actions are automatically removed using `ON DELETE CASCADE` constraints to avoid orphaned data.
- **Foreign Key Constraints**: Ensure that triggers and actions cannot exist without a parent flow.
