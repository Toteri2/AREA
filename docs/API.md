# API Reference

Complete REST API documentation is available via Swagger UI at [http://localhost:8080/api-docs](http://localhost:8080/api-docs) when the server is running.

## Authentication

All endpoints except `/auth/register`, `/auth/login`, and OAuth endpoints require a Bearer token:

```
Authorization: Bearer <token>
```

## Base URL

```
http://localhost:8080
```

## Core Endpoints

### Application

- `GET /` - API health check
- `GET /about.json` - Server metadata with services, actions, and reactions

### Authentication

**Register & Login:**
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get authenticated user profile

**OAuth URLs (get authorization URL):**
- `GET /auth/github/url?mobile=false` - Get GitHub OAuth URL
- `GET /auth/microsoft/url?mobile=false` - Get Microsoft OAuth URL
- `GET /auth/discord/url` - Get Discord OAuth URL
- `GET /auth/twitch/url` - Get Twitch OAuth URL
- `GET /auth/gmail/url?mobile=false` - Get Gmail OAuth URL
- `GET /auth/google/url?mobile=false` - Get Google OAuth URL (for login/register)
- `GET /auth/jira/url?mobile=false` - Get Jira OAuth URL

**OAuth Validation (link account):**
- `POST /auth/github/validate` - Link GitHub account
- `POST /auth/microsoft/validate` - Link Microsoft account
- `POST /auth/discord/validate` - Link Discord account
- `POST /auth/twitch/validate` - Link Twitch account
- `POST /auth/gmail/validate` - Link Gmail account
- `POST /auth/google/validate` - Register/login with Google
- `POST /auth/jira/validate` - Link Jira account

### Users

- `GET /users/webhooks` - Get user's webhooks
- `GET /users/connection?provider=<service>` - Check if user is connected to a provider

### Reactions

- `POST /reactions` - Create new reaction attached to a webhook
- `GET /reactions` - Get all user reactions
- `DELETE /reactions/:id` - Delete reaction

**Reaction Types:**
1. `SEND_EMAIL_OUTLOOK` - Send email via Microsoft Outlook
2. `DISCORD_SEND_MESSAGE` - Send message to Discord channel
3. `DISCORD_CREATE_CHANNEL` - Create private Discord channel
4. `DISCORD_ADD_ROLE` - Add role to Discord user
5. `SEND_EMAIL_GMAIL` - Send email via Gmail
6. `JIRA_CREATE_ISSUE` - Create Jira issue
7. `JIRA_ADD_COMMENT` - Add comment to Jira issue
8. `JIRA_UPDATE_STATUS` - Update Jira issue status

## Service Endpoints

Chaque service (GitHub, Discord, Microsoft, Gmail, Jira, Twitch) propose les endpoints suivants :

**Webhooks communs :**
- `POST /<service>/create-webhook` - Créer un webhook
- `GET /<service>/webhooks` - Lister les webhooks de l'utilisateur
- `DELETE /<service>/webhook?id=<id>` - Supprimer un webhook
- `POST /<service>/webhook` - Réception des événements webhook (appelé par le service)

**Endpoints spécifiques :**

- **GitHub:** `GET /github/repositories` - Liste des dépôts
- **Discord:** `GET /discord/guilds` - Liste des serveurs, `GET /discord/guilds/:id/channels` - Canaux, `POST /discord/messages` - Envoyer un message
- **Jira:** `GET /jira/projects` - Liste des projets
- **Twitch:** `GET /twitch/followed-channels` - Chaînes suivies

## Actions & Reactions by Service

### Discord

**Actions:**
- `new_message_in_channel` - Triggered when a message is posted
- `reaction_added` - Triggered when a reaction is added to a message

**Reactions:**
- `send_message` - Send message to a channel
- `add_role_to_user` - Add role to a server member
- `create_private_channel` - Create a private channel

### GitHub

**Actions:**
- `push` - Triggered on repository push
- `issues` - Triggered on issue events
- `pull_request` - Triggered on PR events
- `create` - Triggered when branch/tag is created
- `delete` - Triggered when branch/tag is deleted
- `release` - Triggered when release is published

**Reactions:** None

### Gmail

**Actions:**
- `message_added_inbox` - New message in inbox
- `message_added` - New message in any folder
- `message_deleted` - Message deleted

**Reactions:**
- `send_email` - Send an email

### Jira

**Actions:**
- `jira_issue_created` - Issue created
- `jira_issue_updated` - Issue updated
- `jira_issue_deleted` - Issue deleted

**Reactions:**
- `create_issue` - Create new issue
- `add_comment` - Add comment to issue
- `update_status` - Update issue status

### Microsoft

**Actions:**
- `subscription_notification` - Microsoft Graph notification received

**Reactions:**
- `send_email` - Send email via Outlook

### Twitch

**Actions:**
- `stream.online` - Channel goes live
- `stream.offline` - Stream ends
- `channel.update` - Channel info updated
- `channel.follow` - Someone follows channel

**Reactions:** None

## Example: Create Reaction

```json
POST /reactions
{
  "hookId": 1,
  "reactionType": 2,
  "config": {
    "channelId": "123456789",
    "content": "New issue: {{title}} in {{repo}}"
  }
}
```

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error
