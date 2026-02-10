# AREA - Action-REAction Platform (FORK)

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-blue.svg)](https://nestjs.com/)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.82.1-blue.svg)](https://reactnative.dev/)

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

- [Web Documentation](https://mamborea.github.io/Deployment/#)
- [Setup Guide](docs/SETUP.md)
- [API Reference](docs/API.md)
- [Frontend Architecture](docs/FRONTEND.md)
- [Mobile Architecture](docs/MOBILE.md)
- [How to Contribute](docs/HOWTOCONTRIBUTE.md)
- [Architecture](docs/ARCHITECTURE.md)

## Contributing

See [HOWTOCONTRIBUTE.md](docs/HOWTOCONTRIBUTE.md) for adding services, actions, and reactions.

## Useful Links

- [Official status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status)
- [Github documentation](https://docs.github.com/en/rest)
- [Oauth documentation](https://auth0.com/docs)
- [PostgreSQL documentation](https://www.postgresql.org/docs)
- [NestJS documentation](https://docs.nestjs.com)
- [React documentation](https://react.dev/reference/react)
- [React Native](https://reactnative.dev/docs/getting-started)

## Security

Security documentation and audit reports:
- [Security Audit](docs/SECURITY_AUDIT.md) - OWASP Top 10 2025 analysis
- [Security Watch](docs/SECURITY_WATCH.md) - CVE monitoring and updates

## Authors

- **Mattéo Milin** - matteo.milin@epitech.eu
- **Nathan Callegari** - nathan.callegari@epitech.eu
- **Corentin Bergaentzle** - corentin.bergaentzle@epitech.eu
- **Thomas Richalet** - thomas.richalet@epitech.eu
- **Axel Battigelli** - axel.battigelli@epitech.eu

## License

This project is developed for educational purposes as part of the EPITECH curriculum.
See LICENSE for more informations
