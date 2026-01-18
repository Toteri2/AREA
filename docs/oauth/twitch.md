# Twitch OAuth Setup

## Create Twitch Application

1. Go to [Twitch Developers Console](https://dev.twitch.tv/console/apps)
2. Click **"Register Your Application"**
3. Fill in the details:
   - **Name:** AREA
   - **OAuth Redirect URLs:** `http://localhost:8081/twitch/callback`
   - **Category:** Select Application Integration
4. Click **"Create"**

## Get Credentials

1. Click **"Manage"** on your application
2. Copy the **Client ID**
3. Click **"New Secret"** to generate a client secret
4. **Copy the secret immediately** (you won't be able to see it again!)

## Environment Variables

Add these to your `.env` file:

```env
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_CALLBACK_URL=http://localhost:8081/twitch/callback
TWITCH_WEBHOOK_CALLBACK_URL=http://localhost:8080/twitch/webhook
TWITCH_WEBHOOK_SECRET=your_twitch_webhook_secret_change_in_production
```

Generate a random webhook secret:

```bash
openssl rand -hex 32
```

## EventSub Webhook Configuration

For Twitch EventSub webhooks:

```env
TWITCH_WEBHOOK_URL=https://your-public-url/twitch/webhook
```

**Important:** Twitch requires HTTPS for EventSub webhooks. Use [ngrok](https://ngrok.com/) for local development:

```bash
ngrok http 8080
# Use the HTTPS URL provided by ngrok
```

## Required Scopes

The app requests these scopes:
- `user:read:email` - Read user email
- `moderator:read:followers` - Read user's followed channels
- `channel:read:subscriptions` - Read channel subscriptions
