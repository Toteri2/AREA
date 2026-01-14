import { useEffect, useMemo, useRef } from 'react';
import type { Edge, Node } from 'reactflow';
import { useEdgesState, useNodesState } from 'reactflow';
import type {
  ActionNodeData,
  ReactionNodeData,
  ServiceType,
} from '../../../shared/src/types';
import {
  useConnectionQuery,
  useListGithubWebhooksQuery,
  useListGmailWebhooksQuery,
  useListMicrosoftWebhooksQuery,
  useListReactionsQuery,
} from '../../../shared/src/web';
import {
  generateActionNodeId,
  generateEdgeId,
  generateReactionNodeId,
} from '../utils';

type Webhook = {
  id: number;
  webhookId?: string;
  service: string;
  eventType?: number;
  config?: {
    owner?: string;
    repo?: string;
    events?: string[];
    resource?: string;
    changeType?: string;
  };
};

export function useBlueprintData() {
  const [nodes, setNodes, onNodesChange] = useNodesState<
    ActionNodeData | ReactionNodeData
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const hasLoadedRef = useRef(false);

  // Check connections first
  const { data: githubConn } = useConnectionQuery({ provider: 'github' });
  const { data: gmailConn } = useConnectionQuery({ provider: 'gmail' });
  const { data: microsoftConn } = useConnectionQuery({ provider: 'microsoft' });

  const isGithubConnected = githubConn?.connected ?? false;
  const isGmailConnected = gmailConn?.connected ?? false;
  const isMicrosoftConnected = microsoftConn?.connected ?? false;

  const { data: githubWebhooks, isLoading: isLoadingGithub } =
    useListGithubWebhooksQuery(undefined, { skip: !isGithubConnected });
  const { data: gmailWebhooks, isLoading: isLoadingGmail } =
    useListGmailWebhooksQuery(undefined, { skip: !isGmailConnected });
  const { data: microsoftWebhooks, isLoading: isLoadingMicrosoft } =
    useListMicrosoftWebhooksQuery(undefined, { skip: !isMicrosoftConnected });
  const { data: reactions, isLoading: isLoadingReactions } =
    useListReactionsQuery();

  const isLoading =
    isLoadingGithub ||
    isLoadingGmail ||
    isLoadingMicrosoft ||
    isLoadingReactions;

  // Aggregate all webhooks for unified processing
  const webhooks = useMemo(
    () => [
      ...(githubWebhooks || []),
      ...(gmailWebhooks || []),
      ...(microsoftWebhooks || []),
    ],
    [githubWebhooks, gmailWebhooks, microsoftWebhooks]
  );

  useEffect(() => {
    if (isLoading) return;
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const actionNodes: Node<ActionNodeData>[] = [];
    const reactionNodes: Node<ReactionNodeData>[] = [];
    const newEdges: Edge[] = [];
    let yOffset = 100;

    webhooks.forEach((hook: Webhook) => {
      let nodeId = '';
      let nodeData: ActionNodeData | undefined;

      if (hook.service === 'github') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        const repoName = hook.config?.repo || '';
        const owner = hook.config?.owner || '';
        const events = hook.config?.events || ['push'];
        nodeData = {
          label: repoName
            ? `GitHub: ${owner ? `${owner}/` : ''}${repoName}`
            : `GitHub Webhook #${hook.id}`,
          service: 'github',
          eventType: events[0] || 'push',
          webhookId: hook.id,
          config: { repo: repoName, owner: owner, events: events },
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
        const eventLabel = eventType
          ? eventType === 2
            ? 'Any Email'
            : eventType === 3
              ? 'Email Deleted'
              : 'Inbox Email'
          : 'New Email';
        nodeData = {
          label: `Gmail: ${eventLabel}`,
          service: 'gmail',
          eventType: 'email_received',
          webhookId: hook.id,
          config: hook.config || { eventType: hook.eventType },
          isConfigured: true,
        };
      } else if (hook.service === 'jira') {
        nodeId = generateActionNodeId(hook.service, hook.id);
        nodeData = {
          label: `Jira Webhook`,
          service: 'jira' as ServiceType,
          eventType: 'issue_created',
          webhookId: hook.id,
          config: hook.config || {},
          isConfigured: true,
        };
      }

      if (nodeId && nodeData) {
        actionNodes.push({
          id: nodeId,
          type: 'action',
          position: { x: 100, y: yOffset },
          data: nodeData,
        });
        yOffset += 150;
      }
    });

    // Reactions
    (reactions || []).forEach((reaction, index) => {
      const nodeId = generateReactionNodeId(reaction.id);
      reactionNodes.push({
        id: nodeId,
        type: 'reaction',
        position: { x: 500, y: 100 + index * 150 },
        data: {
          label:
            (reaction.config?.name as string) ||
            `Reaction #${reaction.reactionType}`,
          reactionType: reaction.reactionType,
          reactionName: reaction.config?.name as string,
          config: reaction.config,
          isConfigured: true,
        },
      });

      // Edges
      let sourceNodeId = '';
      const hook = webhooks.find((h: Webhook) => h.id === reaction.hookId);
      if (hook) {
        sourceNodeId = generateActionNodeId(hook.service, hook.id);
      } else {
        sourceNodeId = generateActionNodeId('github', reaction.hookId);
      }

      if (actionNodes.find((n) => n.id === sourceNodeId)) {
        newEdges.push({
          id: generateEdgeId(reaction.hookId, reaction.id),
          source: sourceNodeId,
          target: generateReactionNodeId(reaction.id),
          animated: true,
          style: { stroke: '#9e9e9e', strokeWidth: 2 },
        });
      }
    });

    setNodes([...actionNodes, ...reactionNodes]);
    setEdges(newEdges);
  }, [webhooks, reactions, isLoading, setNodes, setEdges]);

  // Sync ID upgrade effect
  useEffect(() => {
    if (!hasLoadedRef.current || isLoading) return;
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        if (node.type === 'action') {
          const actionData = node.data as ActionNodeData;
          if (typeof actionData.webhookId === 'string') {
            const matchingHook = webhooks.find(
              (h: Webhook) =>
                h.webhookId === actionData.webhookId &&
                h.service === actionData.service
            );
            if (matchingHook) {
              return {
                ...node,
                data: { ...node.data, webhookId: matchingHook.id },
              };
            }
          }
        }
        return node;
      })
    );
  }, [webhooks, setNodes, isLoading]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isLoading,
    webhooks,
  };
}
