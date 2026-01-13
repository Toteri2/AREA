# AREA - Action-REAction Platform

Automation platform similar to IFTTT/Zapier, allowing users to create workflows by connecting Actions to REActions.

## Project Structure

- **Server** (NestJS + PostgreSQL) - API on port 8080
- **Web Client** (React + Vite) - UI on port 8081
- **Mobile Client** (React Native) - Android/iOS app

All business logic resides on the server. Clients are stateless interfaces.

## Quick Start

```bash
docker compose up
```

- Web: http://localhost:8081
- API: http://localhost:8080
- API Docs: http://localhost:8080/api-docs
- APK: http://localhost:8081/client.apk

## Requirements

- Docker 20.10+
- Docker Compose v2+

## Configuration

Create `.env` at project root:

```env
DB_HOST=postgres
DB_USERNAME=area_user
DB_PASSWORD=your_password
DB_DATABASE=area_db

JWT_SECRET=your-jwt-secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

FRONTEND_URL=http://localhost:8081
VITE_API_URL=http://localhost:8080
```

See [docs/SETUP.md](docs/SETUP.md) for detailed configuration.

## Stack

| Component | Technology      |
| --------- | --------------- |
| Server    | NestJS 11 + TS  |
| Database  | PostgreSQL 16   |
| Web       | React 19 + Vite |
| Mobile    | React Native    |

## Services Supported

- **GitHub** - Push, issues, pull requests, releases
- **Discord** - Messages, roles, channels
- **Gmail** - Email notifications and sending
- **Microsoft** - Outlook emails and Graph notifications
- **Jira** - Issue tracking and management
- **Twitch** - Stream events and channel updates

See [API.md](docs/API.md) for complete actions and reactions list.

## API

REST API documented with Swagger: http://localhost:8080/api-docs

Key endpoint: `GET /about.json` (server metadata)

## Documentation

- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [How to Contribute](docs/HOWTOCONTRIBUTE.md)
- [Architecture](docs/ARCHITECTURE.md)

## Contributing

See [HOWTOCONTRIBUTE.md](docs/HOWTOCONTRIBUTE.md) for adding services, actions, and reactions.

## Authors

- Mattéo Milin
- Nathan Callegari
- Corentin Bergaentzle
- Thomas Richalet
- Axel Battigelli
