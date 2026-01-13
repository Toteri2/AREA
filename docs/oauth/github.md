# GitHub OAuth Setup

## Create OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:
   - **Application name:** AREA (or your preferred name)
   - **Homepage URL:** `http://localhost:8081`
   - **Authorization callback URL:** `http://localhost:8080/auth/github/validate`
4. Click **"Register application"**

## Get Credentials

After creating the app:

1. Copy the **Client ID**
2. Click **"Generate a new client secret"**
3. Copy the **Client Secret** (you won't be able to see it again!)

## Environment Variables

Add these to your `.env` file:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:8081/github/callback
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
- `user` - Read user profile data
- `admin:repo_hook` - Full control of repository hooks
