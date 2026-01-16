import { createSelector } from '@reduxjs/toolkit';
import type { Edge, Node } from 'reactflow';
import { apiSlice } from '../../shared/src/services/api';
import type {
  ActionNodeData,
  ReactionNodeData,
  ServiceType,
} from '../../shared/src/types';
import { REACTION_ID_MAP } from './constants';
import {
  generateActionNodeId,
  generateEdgeId,
  generateReactionNodeId,
} from './utils';

type Webhook = {
  id: number;
  config?: Record<string, unknown>;
  service: string;
  eventType?: number | string;
  webhookId?: string;
};

// Input selectors for each service's webhooks
const selectGithubWebhooks =
  apiSlice.endpoints.listGithubWebhooks.select(undefined);
const selectGmailWebhooks =
  apiSlice.endpoints.listGmailWebhooks.select(undefined);
const selectMicrosoftWebhooks =
  apiSlice.endpoints.listMicrosoftWebhooks.select(undefined);
const selectDiscordWebhooks =
  apiSlice.endpoints.listDiscordWebhooks.select(undefined);
const selectTwitchWebhooks =
  apiSlice.endpoints.listTwitchWebhooks.select(undefined);
const selectReactions = apiSlice.endpoints.listReactions.select(undefined);

// Aggregating selector that returns the graph { nodes, edges }
export const selectBlueprintGraph = createSelector(
  [
    selectGithubWebhooks,
    selectGmailWebhooks,
    selectMicrosoftWebhooks,
    selectDiscordWebhooks,
    selectTwitchWebhooks,
    selectReactions,
  ],
  (
    githubResult,
    gmailResult,
    microsoftResult,
    discordResult,
    twitchResult,
    reactionsResult
  ) => {
    const webhooks: Webhook[] = [
      ...(githubResult.data || []),
      ...(gmailResult.data || []),
      ...(microsoftResult.data || []),
      ...(discordResult.data || []),
      ...(twitchResult.data || []),
    ];
    const reactions = reactionsResult.data || [];

    if (webhooks.length === 0 && reactions.length === 0) {
      return { nodes: [], edges: [] };
    }

    const actionNodes: Node<ActionNodeData>[] = [];
    const reactionNodes: Node<ReactionNodeData>[] = [];
    const newEdges: Edge[] = [];
    const actionNodeIdSet = new Set<string>();

    const webhookMap = new Map<number, Webhook>();
    webhooks.forEach((hook) => {
      webhookMap.set(hook.id, hook);
    });

    let yOffset = 100;

    webhooks.forEach((hook) => {
      let nodeId = '';
      let nodeData: ActionNodeData | undefined;

      if (hook.service === 'github') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        const repoName = hook.config?.repo || '';
        const owner = hook.config?.owner || '';
        const events = (hook.config?.events as string[]) || ['push'];
        nodeData = {
          label: repoName
            ? `GitHub: ${owner ? `${owner}/` : ''}${repoName}`
            : `GitHub Webhook #${hook.id}`,
          service: 'github',
          eventType: events[0] || 'push',
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: !!repoName,
        };
      } else if (hook.service === 'microsoft') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        nodeData = {
          label: `Microsoft: ${hook.config?.resource || 'Email'}`,
          service: 'microsoft',
          eventType: 'email_received',
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: true,
        };
      } else if (hook.service === 'gmail') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        const eventType = Number(hook.eventType);
        const eventLabel =
          eventType === 2
            ? 'Any Email'
            : eventType === 3
              ? 'Email Deleted'
              : eventType
                ? 'Inbox Email'
                : 'New Email';
        nodeData = {
          label: `Gmail: ${eventLabel}`,
          service: 'gmail',
          eventType: 'email_received',
          webhookId: hook.id,
          config: hook.config || { eventType: hook.eventType },
          isConfigured: true,
        };
      } else if (hook.service === 'discord') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        const event =
          (hook.config?.events as string[])?.[0] || 'new_message_in_channel';
        let label = `Discord: ${hook.config?.channelName || hook.config?.guildName || 'Unknown'}`;

        if (event === 'reaction_added') {
          label = `Discord: Reaction in ${hook.config?.channelName || 'Channel'}`;
        } else if (event === 'new_message_in_channel') {
          label = `Discord: Message in ${hook.config?.channelName || 'Channel'}`;
        }

        nodeData = {
          label,
          service: 'discord',
          eventType: event,
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: true,
        };
      } else if (hook.service === 'jira') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        nodeData = {
          label: `Jira Webhook`,
          service: 'jira',
          eventType: 'issue_created',
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: true,
        };
      } else if (hook.service === 'twitch') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        const event = (hook.config?.events as string[])?.[0] || 'stream.online';
        const broadcasterName =
          hook.config?.broadcasterName ||
          hook.config?.broadcasterUserId ||
          'Channel';
        nodeData = {
          label: `Twitch: ${event.replace(/\./g, ' ')} (${broadcasterName})`,
          service: 'twitch' as ServiceType,
          eventType: event,
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: true,
        };
      }

      if (nodeId && nodeData) {
        actionNodeIdSet.add(nodeId);
        actionNodes.push({
          id: nodeId,
          type: 'action',
          position: { x: 100, y: yOffset },
          data: nodeData,
        });
        yOffset += 150;
      }
    });

    // Generate Reaction Nodes & Edges
    reactions.forEach((reaction, index) => {
      const nodeId = generateReactionNodeId(reaction.id);

      let foundService = '';
      let foundName = '';
      for (const [service, reactionsMap] of Object.entries(REACTION_ID_MAP)) {
        for (const [name, id] of Object.entries(reactionsMap)) {
          if (id === reaction.reactionType) {
            foundService = service;
            foundName = name;
            break;
          }
        }
        if (foundService) break;
      }

      reactionNodes.push({
        id: nodeId,
        type: 'reaction',
        position: { x: 500, y: 100 + index * 150 },
        data: {
          label: reaction.config?.name as string,
          reactionType: reaction.reactionType,
          reactionName: foundName || (reaction.config?.name as string),
          serviceName: foundService,
          config: reaction.config,
          isConfigured: true,
        },
      });

      let sourceNodeId = '';
      const hook = webhookMap.get(reaction.hookId);

      if (hook) {
        sourceNodeId = generateActionNodeId(hook.service, hook.id);
      } else {
        sourceNodeId = generateActionNodeId('github', reaction.hookId);
      }

      if (actionNodeIdSet.has(sourceNodeId)) {
        newEdges.push({
          id: generateEdgeId(reaction.hookId, reaction.id),
          source: sourceNodeId,
          target: generateReactionNodeId(reaction.id),
          animated: true,
          style: { stroke: '#9e9e9e', strokeWidth: 2 },
        });
      }
    });

    return {
      nodes: [...actionNodes, ...reactionNodes],
      edges: newEdges,
      webhooks,
    };
  }
);
