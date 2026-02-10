import { Injectable } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Welcome to AREA, but please use the frontend. If you want to see the API docs, go to /api-docs';
  }

  getAbout(request: Request) {
    let clientHost =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string);

    if (clientHost.startsWith('::ffff:')) {
      clientHost = clientHost.substring(7);
    }

    const currentTime = Math.floor(Date.now() / 1000);

    return {
      client: {
        host: clientHost,
      },
      server: {
        current_time: currentTime,
        services: [
          {
            name: 'discord',
            actions: [
              {
                name: 'new_message_in_channel',
                description:
                  'Triggered when a new message is posted in a Discord channel',
              },
              {
                name: 'reaction_added',
                description: 'Triggered when a reaction is added to a message',
              },
            ],
            reactions: [
              {
                name: 'send_message',
                description: 'Sends a message to a Discord channel',
              },
              {
                name: 'add_role_to_user',
                description: 'Adds a role to a user in a Discord server',
              },
              {
                name: 'create_private_channel',
                description: 'Creates a private channel in a Discord server',
              },
            ],
          },
          {
            name: 'github',
            actions: [
              {
                name: 'push',
                description:
                  'Triggered when code is pushed to a GitHub repository',
              },
              {
                name: 'issues',
                description:
                  'Triggered when an issue event occurs in a repository',
              },
              {
                name: 'pull_request',
                description: 'Triggered when a pull request event occurs',
              },
              {
                name: 'create',
                description: 'Triggered when a branch or tag is created',
              },
              {
                name: 'delete',
                description: 'Triggered when a branch or tag is deleted',
              },
              {
                name: 'release',
                description:
                  'Triggered when a release is published in a repository',
              },
            ],
            reactions: [],
          },
          {
            name: 'gmail',
            actions: [
              {
                name: 'message_added_inbox',
                description:
                  'Triggered when a new message is added to the inbox',
              },
              {
                name: 'message_added',
                description:
                  'Triggered when a new message is added to any folder',
              },
              {
                name: 'message_deleted',
                description: 'Triggered when a message is deleted',
              },
            ],
            reactions: [
              {
                name: 'send_email',
                description: 'Send an email via Gmail',
              },
            ],
          },
          {
            name: 'jira',
            actions: [
              {
                name: 'jira_issue_created',
                description: 'Triggered when an issue is created in Jira',
              },
              {
                name: 'jira_issue_updated',
                description: 'Triggered when an issue is updated in Jira',
              },
              {
                name: 'jira_issue_deleted',
                description: 'Triggered when an issue is deleted in Jira',
              },
            ],
            reactions: [
              {
                name: 'create_issue',
                description: 'Create a new issue in Jira',
              },
              {
                name: 'add_comment',
                description: 'Add a comment to a Jira issue',
              },
              {
                name: 'update_status',
                description: 'Update the status of a Jira issue',
              },
            ],
          },
          {
            name: 'microsoft',
            actions: [
              {
                name: 'subscription_notification',
                description:
                  'Triggered when a Microsoft Graph subscription notification is received',
              },
            ],
            reactions: [
              {
                name: 'send_email',
                description: 'Send an email via Microsoft Outlook',
              },
            ],
          },
          {
            name: 'twitch',
            actions: [
              {
                name: 'stream.online',
                description: 'Triggered when a channel goes live',
              },
              {
                name: 'stream.offline',
                description: 'Triggered when a stream ends',
              },
              {
                name: 'channel.update',
                description: 'Triggered when channel information is updated',
              },
              {
                name: 'channel.follow',
                description: 'Triggered when someone follows a channel',
              },
            ],
            reactions: [],
          },
        ],
      },
    };
  }
}
