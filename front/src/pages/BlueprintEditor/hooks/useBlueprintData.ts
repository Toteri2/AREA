import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useEdgesState, useNodesState } from 'reactflow';
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
    setNodes(computedNodes);
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
