# Gmail OAuth Setup

## Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** > **"New Project"**
3. Enter a project name (e.g., "AREA")
4. Click **"Create"**

## Enable Gmail API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. Search for **"Gmail API"**
3. Click on it and click **"Enable"**

## Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Select **"External"** (or Internal if using Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name:** AREA
   - **User support email:** Your email
   - **Developer contact information:** Your email
5. Click **"Save and Continue"**
6. Click **"Add or Remove Scopes"**
7. Add these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
8. Click **"Update"** and **"Save and Continue"**
9. Add test users if in testing mode
10. Click **"Save and Continue"**

## Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. Select **"Web application"**
4. Fill in the details:
   - **Name:** AREA OAuth Client
   - **Authorized redirect URIs:** `http://localhost:8081/gmail/callback`
5. Click **"Create"**
6. **Copy the Client ID and Client Secret**

## Setup Pub/Sub (for Gmail Push Notifications)

1. In Google Cloud Console, enable **"Cloud Pub/Sub API"**
2. Go to **"Pub/Sub"** > **"Topics"**
3. Click **"Create Topic"**
4. Name it (e.g., `gmail-notifications`)
5. Click **"Create"**
6. Grant Gmail permission to publish to this topic:
   ```
   Topic: projects/YOUR_PROJECT_ID/topics/gmail-notifications
   Member: serviceAccount:gmail-api-push@system.gserviceaccount.com
   Role: Pub/Sub Publisher
   ```

## Environment Variables

Add these to your `.env` file:

```env
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_CALLBACK_URL=http://localhost:8081/gmail/callback
GMAIL_PROJECT_ID=your_project_id
GMAIL_TOPIC_NAME=projects/your_project_id/topics/gmail-notifications
```

## Webhook Configuration

For Gmail push notifications:

```env
GMAIL_WEBHOOK_URL=https://your-public-url/gmail/webhook
```

**Note:** Gmail requires HTTPS for webhooks. Use [ngrok](https://ngrok.com/) for local development.
