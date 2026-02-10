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
  useListJiraWebhooksQuery,
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
  const { data: jiraConn, isLoading: isLoadingJiraConn } = useConnectionQuery({
    provider: 'jira',
  });

  const isGithubConnected = githubConn?.connected ?? false;
  const isGmailConnected = gmailConn?.connected ?? false;
  const isMicrosoftConnected = microsoftConn?.connected ?? false;
  const isDiscordConnected = discordConn?.connected ?? false;
  const isTwitchConnected = twitchConn?.connected ?? false;
  const isJiraConnected = jiraConn?.connected ?? false;

  // Trigger fetches (subscriptions)
  const { isLoading: isLoadingGithub, isFetching: isFetchingGithub } =
    useListGithubWebhooksQuery(undefined, {
      skip: !isGithubConnected,
    });
  const { isLoading: isLoadingGmail, isFetching: isFetchingGmail } =
    useListGmailWebhooksQuery(undefined, {
      skip: !isGmailConnected,
    });
  const { isLoading: isLoadingMicrosoft, isFetching: isFetchingMicrosoft } =
    useListMicrosoftWebhooksQuery(undefined, { skip: !isMicrosoftConnected });
  const { isLoading: isLoadingDiscord, isFetching: isFetchingDiscord } =
    useListDiscordWebhooksQuery(undefined, { skip: !isDiscordConnected });
  const { isLoading: isLoadingTwitch, isFetching: isFetchingTwitch } =
    useListTwitchWebhooksQuery(undefined, {
      skip: !isTwitchConnected,
    });
  const { isLoading: isLoadingJira, isFetching: isFetchingJira } =
    useListJiraWebhooksQuery(undefined, {
      skip: !isJiraConnected,
    });
  const { isLoading: isLoadingReactions, isFetching: isFetchingReactions } =
    useListReactionsQuery();

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
    isLoadingTwitchConn ||
    isLoadingTwitch ||
    isLoadingJiraConn ||
    isLoadingJira ||
    isLoadingReactions;

  const isSyncing =
    isFetchingGithub ||
    isFetchingGmail ||
    isFetchingMicrosoft ||
    isFetchingDiscord ||
    isFetchingDiscord ||
    isFetchingTwitch ||
    isFetchingJira ||
    isFetchingReactions;

  const {
    nodes: computedNodes,
    edges: computedEdges,
    webhooks,
  } = useSelector(selectBlueprintGraph);

  useEffect(() => {
    // Block sync if initial loading OR if syncing (background refetch)
    if (isLoading || isSyncing) return;

    setNodes((currentNodes) => {
      const mergedNodes = [...currentNodes];
      const incomingNodeMap = new Map(computedNodes.map((n) => [n.id, n]));
      const processedIncomingIds = new Set<string>();
      const idRedirects = new Map<string, string>();

      for (let i = 0; i < mergedNodes.length; i++) {
        const currentNode = mergedNodes[i];
        let match: Node<ActionNodeData | ReactionNodeData> | undefined;

        if (incomingNodeMap.has(currentNode.id)) {
          match = incomingNodeMap.get(currentNode.id);
        } else if (currentNode.id.startsWith('node_')) {
          const actionData = currentNode.data as ActionNodeData;
          const reactionData = currentNode.data as ReactionNodeData;

          // Match Action Nodes
          if (currentNode.type === 'action' && actionData.webhookId) {
            match = computedNodes.find(
              (n) =>
                n.type === 'action' &&
                (n.data as ActionNodeData).webhookId === actionData.webhookId &&
                (n.data as ActionNodeData).service === actionData.service
            );
          }
          // Match Reaction Nodes
          else if (currentNode.type === 'reaction' && reactionData.reactionId) {
            match = computedNodes.find(
              (n) =>
                n.type === 'reaction' &&
                (n.data as ReactionNodeData).reactionId ===
                  reactionData.reactionId
            );
          }
        }

        if (match) {
          processedIncomingIds.add(match.id);
          if (currentNode.id !== match.id) {
            idRedirects.set(currentNode.id, match.id);
          }
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

      setEdges((currentEdges) => {
        const mergedEdges = [...computedEdges];
        const computedTargetIds = new Set(computedEdges.map((e) => e.target));

        currentEdges.forEach((edge) => {
          if (edge.id.startsWith('edge_local_')) {
            const newSource = idRedirects.get(edge.source) || edge.source;
            const newTarget = idRedirects.get(edge.target) || edge.target;

            const updatedEdge = {
              ...edge,
              source: newSource,
              target: newTarget,
            };
            if (!computedTargetIds.has(updatedEdge.target)) {
              mergedEdges.push(updatedEdge);
            }
          }
        });
        return mergedEdges;
      });

      return validNodes;
    });

    hasLoadedRef.current = true;
  }, [computedNodes, computedEdges, isLoading, isSyncing, setNodes, setEdges]);

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
