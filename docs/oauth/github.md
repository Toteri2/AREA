# GitHub OAuth Setup

## Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name:** AREA (or your preferred name)
   - **Homepage URL:** `http://localhost:8081`
   - **Authorization callback URL:** `http://localhost:8081/github/callback`
4. Click **"Register application"**

## Get Credentials

After creating the app:

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again!)

## Environment Variables

Add these to your `.env` file:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8081/github/callback
GITHUB_WEBHOOK_URL=http://localhost:8080/github/webhook
GITHUB_WEBHOOK_SECRET=your_github_webhook_secret_change_in_production
```

## Webhook Configuration

For GitHub webhooks, you'll also need:

```env
GITHUB_WEBHOOK_URL=http://your-public-url:8080/github/webhook
```

**Note:** For local development, you can use [ngrok](https://ngrok.com/) to expose your local server:

```bash
ngrok http 8080
# Use the HTTPS URL provided by ngrok for GITHUB_WEBHOOK_URL
```

## Required Scopes

The app requests these scopes:
- `repo` - Full control of private repositories
- `user:email` - Read user profile data
- `write:repo_hook` - Full control of repository hooks
