# AREA Documentation

Complete documentation for the AREA project.

## Quick Links

- [Setup Guide](SETUP.md) - Installation and configuration
- [API Reference](API.md) - REST API endpoints
- [How to Contribute](HOWTOCONTRIBUTE.md) - Adding services and features
- [Architecture](ARCHITECTURE.md) - System design and components

### OAuth Setup Guides

- [GitHub OAuth](oauth/github.md)
- [Discord OAuth](oauth/discord.md)
- [Microsoft OAuth](oauth/microsoft.md)
- [Gmail OAuth](oauth/gmail.md)
- [Jira OAuth](oauth/jira.md)
- [Twitch OAuth](oauth/twitch.md)

## Getting Started

1. **Install:** Follow [SETUP.md](SETUP.md)
2. **Run:** `docker compose up`
3. **Access:** http://localhost:8081

## Key Concepts

### AREA
A workflow connecting an **Action** (trigger) to a **REAction** (task).

Example: When GitHub issue created → Send Teams message

### Services
External platforms (GitHub, Gmail, Jira, etc.) providing Actions and REActions.

### Hook Engine
Automated system that monitors Actions and executes REActions.

**Required Docker services:**
- `server` on port 8080
- `client_web` on port 8081
- `client_mobile` for APK build

## Documentation Structure

```
docs/
├── README.md              # This file
├── SETUP.md               # Installation guide
├── API.md                 # API reference
├── HOWTOCONTRIBUTE.md     # Contribution guide
├── ARCHITECTURE.md        # System architecture
├── index.html             # Docsify viewer
├── _sidebar.md            # Navigation
└── oauth/                 # OAuth setup guides
    ├── github.md
    ├── discord.md
    ├── microsoft.md
    ├── gmail.md
    ├── jira.md
    └── twitch.md
```

## Viewing Documentation

**With Docsify (recommended):**
```bash
cd docs
npx docsify-cli serve .
```

Then open http://localhost:3000

## Contributing

See [HOWTOCONTRIBUTE.md](HOWTOCONTRIBUTE.md) for detailed instructions on adding:
- New services
- New actions
- New reactions
- OAuth integrations

## Support

- **Swagger API:** https://api.mambokara.dev/api-docs
- **GitHub Issues:** Create an issue for bugs or questions
