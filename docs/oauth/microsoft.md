# Microsoft OAuth Setup

## Create Azure AD Application

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **"New registration"**
4. Fill in the details:
   - **Name:** AREA (or your preferred name)
   - **Supported account types:** Select appropriate option
   - **Redirect URI:**
     - Platform: **Web**
     - URL: `http://localhost:8081/microsoft/callback`
5. Click **"Register"**

## Get Credentials

1. On the app's **Overview** page, copy the **Application (client) ID**
2. Click **"Certificates & secrets"** in the left sidebar
3. Click **"New client secret"**
4. Add a description and select expiration
5. Click **"Add"**
6. **Copy the secret value immediately** (you won't be able to see it again!)

## API Permissions

1. Click **"API permissions"** in the left sidebar
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Select **"Delegated permissions"**
5. Add these permissions:
   - `User.Read` - Read user profile
   - `Mail.Read` - Read user mail
   - `Mail.Send` - Send mail as user
   - `Calendars.Read` - Read user calendars
6. Click **"Add permissions"**
7. Click **"Grant admin consent"** if you're an admin

## Environment Variables

Add these to your `.env` file:

```env
MICROSOFT_CLIENT_ID=your_application_id_here
MICROSOFT_CLIENT_SECRET=your_client_secret_here
MICROSOFT_CALLBACK_URL=http://localhost:8080/auth/microsoft/validate
```

## Webhook Subscription

For Microsoft Graph webhooks, you need a publicly accessible endpoint:

```env
MICROSOFT_WEBHOOK_URL=https://your-public-url/microsoft/webhook
```

Use [ngrok](https://ngrok.com/) for local development.
