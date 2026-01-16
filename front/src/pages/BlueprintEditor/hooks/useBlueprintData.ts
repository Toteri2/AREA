import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { type Node, useEdgesState, useNodesState } from 'reactflow';
import type {
  ActionNodeData,
  ReactionNodeData,
} from '../../../shared/src/types';
import {
  useConnectionQuery,
  useListDiscordWebhooksQuery,
  useListGithubWebhooksQuery,
  useListGmailWebhooksQuery,
  useListMicrosoftWebhooksQuery,
  useListReactionsQuery,
  useListTwitchWebhooksQuery,
} from '../../../shared/src/web';
import { selectBlueprintGraph } from '../blueprintSelectors';

export function useBlueprintData() {
  const [nodes, setNodes, onNodesChange] = useNodesState<
    ActionNodeData | ReactionNodeData
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const hasLoadedRef = useRef(false);

  // Check connections first (to skip queries if needed)
  const { data: githubConn, isLoading: isLoadingGithubConn } =
    useConnectionQuery({ provider: 'github' });
  const { data: gmailConn, isLoading: isLoadingGmailConn } = useConnectionQuery(
    { provider: 'gmail' }
  );
  const { data: microsoftConn, isLoading: isLoadingMicrosoftConn } =
    useConnectionQuery({ provider: 'microsoft' });
  const { data: discordConn, isLoading: isLoadingDiscordConn } =
    useConnectionQuery({ provider: 'discord' });
  const { data: twitchConn, isLoading: isLoadingTwitchConn } =
    useConnectionQuery({ provider: 'twitch' });

  const isGithubConnected = githubConn?.connected ?? false;
  const isGmailConnected = gmailConn?.connected ?? false;
  const isMicrosoftConnected = microsoftConn?.connected ?? false;
  const isDiscordConnected = discordConn?.connected ?? false;
  const isTwitchConnected = twitchConn?.connected ?? false;

  // Trigger fetches (subscriptions)
  const { isLoading: isLoadingGithub } = useListGithubWebhooksQuery(undefined, {
    skip: !isGithubConnected,
  });
  const { isLoading: isLoadingGmail } = useListGmailWebhooksQuery(undefined, {
    skip: !isGmailConnected,
  });
  const { isLoading: isLoadingMicrosoft } = useListMicrosoftWebhooksQuery(
    undefined,
    { skip: !isMicrosoftConnected }
  );
  const { isLoading: isLoadingDiscord } = useListDiscordWebhooksQuery(
    undefined,
    { skip: !isDiscordConnected }
  );
  const { isLoading: isLoadingTwitch } = useListTwitchWebhooksQuery(undefined, {
    skip: !isTwitchConnected,
  });
  const { isLoading: isLoadingReactions } = useListReactionsQuery();

  const isLoading =
    isLoadingGithubConn ||
    isLoadingGmailConn ||
    isLoadingMicrosoftConn ||
    isLoadingDiscordConn ||
    isLoadingGithub ||
    isLoadingGmail ||
    isLoadingMicrosoft ||
    isLoadingDiscord ||
    isLoadingTwitchConn ||
    isLoadingTwitch ||
    isLoadingReactions;

  const {
    nodes: computedNodes,
    edges: computedEdges,
    webhooks,
  } = useSelector(selectBlueprintGraph);

  useEffect(() => {
    if (isLoading) return;

    setNodes((currentNodes) => {
      const mergedNodes = [...currentNodes];
      const incomingNodeMap = new Map(computedNodes.map((n) => [n.id, n]));
      const processedIncomingIds = new Set<string>();

      for (let i = 0; i < mergedNodes.length; i++) {
        const currentNode = mergedNodes[i];
        let match: Node<ActionNodeData | ReactionNodeData> | undefined;

        if (incomingNodeMap.has(currentNode.id)) {
          match = incomingNodeMap.get(currentNode.id);
        } else if (currentNode.id.startsWith('node_')) {
          const currentWebhookId = (currentNode.data as ActionNodeData)
            ?.webhookId;
          const currentService = (currentNode.data as ActionNodeData)?.service;

          if (currentWebhookId) {
            match = computedNodes.find(
              (n) =>
                n.type === 'action' &&
                (n.data as ActionNodeData).webhookId === currentWebhookId &&
                (n.data as ActionNodeData).service === currentService
            );
          }
        }

        if (match) {
          processedIncomingIds.add(match.id);
          mergedNodes[i] = {
            ...match,
            id: match.id,
            position: currentNode.position,
            selected: currentNode.selected,
          };
        } else if (!currentNode.id.startsWith('node_')) {
          mergedNodes[i] = null as unknown as Node<
            ActionNodeData | ReactionNodeData
          >;
        }
      }

      const validNodes = mergedNodes.filter(Boolean);

      computedNodes.forEach((node) => {
        if (!processedIncomingIds.has(node.id)) {
          if (!validNodes.find((n) => n.id === node.id)) {
            validNodes.push(node);
          }
        }
      });

      return validNodes;
    });
    setEdges(computedEdges);

    hasLoadedRef.current = true;
  }, [computedNodes, computedEdges, isLoading, setNodes, setEdges]);

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    isLoading,
    webhooks: webhooks || [],
  };
}
