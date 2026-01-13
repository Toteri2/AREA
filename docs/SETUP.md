# Setup Guide

## Prerequisites

- Docker 20.10+
- Docker Compose v2+
- Git

## Installation

```bash
git clone git@github.com:EpitechPGE3-2025/G-DEV-500-MLH-5-2-area-2.git
cd G-DEV-500-MLH-5-2-area-2
```

## Environment Configuration

Create a `.env` file at the project root:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

### Database Configuration

```env
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=area_user
DB_PASSWORD=your_secure_password
DB_DATABASE=area_db
```

### Server Configuration

```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:8081
```

### Security

Generate secure secrets:

```bash
# JWT Secret (used for authentication tokens)
openssl rand -hex 32

# Session Secret
openssl rand -hex 32
```

Add them to `.env`:

```env
JWT_SECRET=your_generated_jwt_secret
SESSION_SECRET=your_generated_session_secret
```

### OAuth Configuration

Each service requires OAuth credentials. See the dedicated guides:

- [GitHub OAuth Setup](oauth/github.md)
- [Discord OAuth Setup](oauth/discord.md)
- [Microsoft OAuth Setup](oauth/microsoft.md)
- [Gmail OAuth Setup](oauth/gmail.md)
- [Jira OAuth Setup](oauth/jira.md)
- [Twitch OAuth Setup](oauth/twitch.md)

**Minimum required for basic setup (GitHub only):**

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/auth/github/validate
GITHUB_WEBHOOK_URL=http://localhost:8081/github/webhook
```

### Frontend Configuration

```env
VITE_API_URL=http://localhost:8080
```

### Mobile Build Configuration (optional)

If you want to build the Android APK:

```env
KEYSTORE_PASSWORD=your_keystore_password
KEY_ALIAS=your_key_alias
KEY_PASSWORD=your_key_password
```

## Launch

Start all services with Docker Compose:

```bash
docker compose up
```

Or run in detached mode:

```bash
docker compose up -d
```

## Access the Application

Once all services are running:

- **Web Client:** http://localhost:8081
- **API Server:** http://localhost:8080
- **API Documentation (Swagger):** http://localhost:8080/api-docs
- **Android APK:** http://localhost:8081/client.apk
- **About endpoint:** http://localhost:8080/about.json

## Verify Installation

Check that the server is running:

```bash
curl http://localhost:8080/about.json
```

You should see a JSON response with server information and available services.

## Development Mode

For development with hot reload:

### Backend

```bash
cd back
npm install
npm run start:dev
```

### Frontend

```bash
cd front
npm install
npm run dev
```

## Next Steps

- [Architecture Documentation](ARCHITECTURE.md) - Understand the system design
- [API Reference](API.md) - Explore available endpoints
- [How to Contribute](HOWTOCONTRIBUTE.md) - Add new services and features
