## Database Structure Overview
The PostgreSQL database for the AREA project is designed to manage the relationships between users, services, flows, triggers, and actions efficiently. The architecture uses a template-based approach where services define available triggers and actions, which are then instantiated by users in their flows.

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

### 2. **Services**
- **Table Name**: `services`
- **Purpose**: Defines the available services (Discord, Slack, Google, etc.) that can be used in the AREA platform.
- **Primary Key**: `id`
- **Key Columns**:
  - `id`: Unique identifier for each service.
  - `name`: The name of the service.
  - `description`: Description of the service.
  - `icon_url`: URL to the service icon.
  - `created_at`: Timestamp for when the service was created.

### 3. **Service Trigger Templates**
- **Table Name**: `service_trigger_templates`
- **Purpose**: Defines the available trigger types for each service (e.g., "message received", "user joined").
- **Primary Key**: `id`
- **Foreign Key**: `service_id` (references `services.id`)
- **Key Columns**:
  - `id`: Unique identifier for each trigger template.
  - `service_id`: Links the trigger template to its service.
  - `name`: The name of the trigger (e.g., 'message_received').
  - `description`: Description of what the trigger does.
  - `config_schema`: JSONB schema defining required configuration parameters.
  - `created_at`: Timestamp for when the template was created.

### 4. **Service Action Templates**
- **Table Name**: `service_action_templates`
- **Purpose**: Defines the available action types for each service (e.g., "send message", "change status").
- **Primary Key**: `id`
- **Foreign Key**: `service_id` (references `services.id`)
- **Key Columns**:
  - `id`: Unique identifier for each action template.
  - `service_id`: Links the action template to its service.
  - `name`: The name of the action (e.g., 'change_status').
  - `description`: Description of what the action does.
  - `config_schema`: JSONB schema defining required configuration parameters.
  - `created_at`: Timestamp for when the template was created.

### 5. **Flows**
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

### 6. **Triggers**
- **Table Name**: `triggers`
- **Purpose**: Defines the events that initiate actions within a flow. Each trigger is an instance of a trigger template.
- **Primary Key**: `id`
- **Foreign Keys**:
  - `flow_id` (references `flows.id`)
  - `template_id` (references `service_trigger_templates.id`)
- **Key Columns**:
  - `id`: Unique identifier for each trigger.
  - `flow_id`: Links the trigger to its parent flow.
  - `template_id`: Links to the trigger template being used.
  - `config`: JSONB column storing instance-specific configuration.
  - `created_at`: Timestamp for when the trigger was created.

### 7. **Actions**
- **Table Name**: `actions`
- **Purpose**: Represents the actions executed as part of a flow. Each action is an instance of an action template.
- **Primary Key**: `id`
- **Foreign Keys**:
  - `flow_id` (references `flows.id`)
  - `template_id` (references `service_action_templates.id`)
- **Key Columns**:
  - `id`: Unique identifier for each action.
  - `flow_id`: Links the action to its parent flow.
  - `ordinal`: Integer representing the order of execution for actions within a flow.
  - `template_id`: Links to the action template being used.
  - `config`: JSONB column storing instance-specific configuration.
  - `created_at`: Timestamp for when the action was created.

## Data Flow and Management

### How the Template System Works

The database uses a **template-based architecture** where:
1. **Services** define what integrations are available (Discord, Slack, etc.)
2. **Templates** define what triggers and actions each service provides
3. **Instances** are created when users build their flows

### Flow Creation Process
1. User selects a service (e.g., Discord)
2. User chooses a trigger template from available templates for that service
3. User configures the trigger with specific parameters (stored in `config`)
4. User chooses one or more action templates
5. User configures each action with specific parameters
6. The flow is saved with all instances linked via foreign keys

### Trigger Execution
1. When a trigger condition is met (e.g., a message containing "hello" is received in #general)
2. The system looks up the trigger instance via `template_id` to understand what type of trigger it is
3. The `config` column provides the specific parameters for this instance
4. The trigger activates and looks up associated actions

### Action Execution
1. Once a trigger is activated, the system retrieves actions via `flow_id`
2. Actions are executed in order based on the `ordinal` field
3. Each action's `template_id` indicates what type of action to perform
4. The `config` column provides the specific parameters (e.g., status to set, message to send)

### Data Integrity
- **Cascading Deletes**: When a flow is deleted, all associated triggers and actions are automatically removed using `ON DELETE CASCADE` constraints.
- **Foreign Key Constraints**: Ensure that triggers and actions cannot exist without a parent flow, and that service templates cannot be deleted if they're in use.
