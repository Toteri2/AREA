# Jira OAuth Setup

## Create Jira OAuth App

1. Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
2. Click **"Create"** > **"OAuth 2.0 integration"**
3. Enter an app name (e.g., "AREA")
4. Check the agreement and click **"Create"**

## Configure OAuth Settings

1. Click on your newly created app
2. Click **"Authorization"** in the left sidebar
3. Click **"Add"** under **OAuth 2.0 (3LO)**
4. Enter the **Callback URL:** `http://localhost:8081/jira/callback`
5. Click **"Save changes"**

## Configure Permissions

1. Click **"Permissions"** in the left sidebar
2. Click **"Add"** next to Jira API
3. Configure scopes:
   - `read:jira-work` - View Jira issue data
   - `write:jira-work` - Create and manage issues
   - `read:jira-user` - View user profiles
   - `manage:jira-webhook` - Manage Jira webhooks
4. Click **"Save"**

## Get Credentials

1. Go to **"Settings"** in the left sidebar
2. Copy the **Client ID**
3. Copy the **Secret** (keep it secure!)

## Environment Variables

Add these to your `.env` file:

```env
JIRA_CLIENT_ID=your_client_id_here
JIRA_CLIENT_SECRET=your_client_secret_here
JIRA_CALLBACK_URL=http://localhost:8081/jira/callback
```

## Webhook Configuration

For Jira webhooks, you need to configure them per Jira instance:

```env
JIRA_WEBHOOK_URL=https://your-public-url/jira/webhook
```

**Note:** Jira requires HTTPS for webhooks in cloud instances. Use [ngrok](https://ngrok.com/) for local development.
