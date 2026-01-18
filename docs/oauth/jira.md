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
   - `offline_access` - Maintain access to data you have given it access to
4. Click **"Save"**

## Get Credentials

1. Go to **"Settings"** in the left sidebar
2. Copy the **Client ID**
3. Copy the **Secret** (keep it secure!)

## Environment Variables

Add these to your `.env` file:

```env
JIRA_CLIENT_ID=your-jira-client-id
JIRA_CLIENT_SECRET=your-jira-client-secret
JIRA_CALLBACK_URL=http://localhost:8081/jira/callback
JIRA_WEBHOOK_URL=http://localhost:8080/jira/webhook
JIRA_WEBHOOK_SECRET=your_jira_webhook_secret_change_in_production
```

## Webhook Configuration

For Jira webhooks, you need to configure them per Jira instance:

```env
JIRA_WEBHOOK_URL=https://your-public-url/jira/webhook
```

**Note:** Jira requires HTTPS for webhooks in cloud instances. Use [ngrok](https://ngrok.com/) for local development.
