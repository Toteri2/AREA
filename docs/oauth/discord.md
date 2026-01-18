# Discord OAuth Setup

## Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter an application name (e.g., "AREA")
4. Click **"Create"**

## Configure OAuth2

1. In the left sidebar, click **"OAuth2"**
2. Click **"Add Redirect"** under **Redirects**
3. Add: `http://localhost:8081/discord/callback`
4. Click **"Save Changes"**

## Get Credentials

1. Copy the **Client ID** from the OAuth2 page
2. Click **"Reset Secret"** and copy the **Client Secret**

## Environment Variables

Add these to your `.env` file:

```env
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_CALLBACK_URL=http://localhost:8081/discord/callback
DISCORD_WEBHOOK_URL=http://localhost:8080/discord/webhook
```

## Bot Setup

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"**
3. Enable these **Privileged Gateway Intents:**
   - Server Members Intent
   - Message Content Intent
4. Click **"Reset Token"** and copy the bot token

Add to `.env`:

```env
DISCORD_BOT_TOKEN=your-discord-bot-token
```

## Required Scopes

The app requests these OAuth2 scopes:
- `identify` - Read user information
- `guilds` - Read user's guilds (servers)
- `messages.read` - Read messages
- `bot` - Add bot to servers
