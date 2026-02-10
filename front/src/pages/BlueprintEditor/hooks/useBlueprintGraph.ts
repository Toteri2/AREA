import { useCallback } from 'react';
import { toast } from 'react-toastify';
import type { Connection, Edge, Node } from 'reactflow';
import { addEdge, useReactFlow } from 'reactflow';
import type {
  ActionNodeData,
  ReactionNodeData,
} from '../../../shared/src/types';
import {
  useCreateDiscordWebhookMutation,
  useCreateGmailSubscriptionMutation,
  useCreateJiraWebhookMutation,
  useCreateMicrosoftSubscriptionMutation,
  useCreateReactionMutation,
  useCreateTwitchWebhookMutation,
  useCreateWebhookMutation,
  useDeleteDiscordWebhookMutation,
  useDeleteGithubWebhookMutation,
  useDeleteGmailSubscriptionMutation,
  useDeleteJiraWebhookMutation,
  useDeleteMicrosoftSubscriptionMutation,
  useDeleteReactionMutation,
  useDeleteTwitchWebhookMutation,
  useUpdateReactionMutation,
} from '../../../shared/src/web';
import { generateUniqueNodeId } from '../utils';

type Webhook = {
  id: number;
  webhookId?: string;
  service: string;
  config?: { owner?: string; repo?: string; events?: string[] };
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;

    if ('data' in err && typeof err.data === 'object' && err.data !== null) {
      const errData = err.data as Record<string, unknown>;
      if ('message' in errData && typeof errData.message === 'string') {
        return errData.message;
      }
    }

    if ('message' in err && typeof err.message === 'string') {
      return err.message;
    }

    if ('error' in err && typeof err.error === 'string') {
      return err.error;
    }
  }
  return 'An unexpected error occurred';
};

export function useBlueprintGraph(
  nodes: Node<ActionNodeData | ReactionNodeData>[],
  setNodes: React.Dispatch<
    React.SetStateAction<Node<ActionNodeData | ReactionNodeData>[]>
  >,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  webhooks: Webhook[],
  setSelectedNode: (
    node: Node<ActionNodeData | ReactionNodeData> | null
  ) => void,
  setShowConfigModal: (show: boolean) => void
) {
  const { project } = useReactFlow();
  const [createWebhook] = useCreateWebhookMutation();
  const [createMicrosoftSubscription] =
    useCreateMicrosoftSubscriptionMutation();
  const [createGmailSubscription] = useCreateGmailSubscriptionMutation();
  const [createReaction] = useCreateReactionMutation();
  const [updateReaction] = useUpdateReactionMutation();
  const [deleteReaction] = useDeleteReactionMutation();
  const [deleteMicrosoftSubscription] =
    useDeleteMicrosoftSubscriptionMutation();
  const [deleteGmailSubscription] = useDeleteGmailSubscriptionMutation();
  const [createJiraWebhook] = useCreateJiraWebhookMutation();
  const [deleteJiraWebhook] = useDeleteJiraWebhookMutation();
  const [deleteGithubWebhook] = useDeleteGithubWebhookMutation();
  const [createDiscordWebhook] = useCreateDiscordWebhookMutation();
  const [deleteDiscordWebhook] = useDeleteDiscordWebhookMutation();
  const [createTwitchWebhook] = useCreateTwitchWebhookMutation();
  const [deleteTwitchWebhook] = useDeleteTwitchWebhookMutation();

  // --- Graph Actions ---

  // Connect (Create Reaction)
  const onConnect = useCallback(
    async (params: Connection) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode?.type === 'action' && targetNode?.type === 'reaction') {
        const actionData = sourceNode.data as ActionNodeData;
        const reactionData = targetNode.data as ReactionNodeData;

        if (!actionData.webhookId) {
          toast.error(
            'Please configure the action first (double-click to set up)'
          );
          return;
        }
        if (!reactionData.isConfigured) {
          toast.error(
            'Please configure the reaction first (double-click to set up)'
          );
          return;
        }

        let finalHookId = actionData.webhookId;
        if (
          typeof finalHookId === 'string' &&
          (actionData.service === 'microsoft' || actionData.service === 'gmail')
        ) {
          const matchingHook = webhooks.find(
            (h) =>
              h.webhookId === finalHookId && h.service === actionData.service
          );
          if (matchingHook) finalHookId = matchingHook.id;
        }

        try {
          const newReaction = await createReaction({
            hookId: Number(finalHookId),
            reactionType: reactionData.reactionType,
            config: reactionData.config,
            name: reactionData.label || `Reaction ${reactionData.reactionType}`,
          }).unwrap();

          setNodes((nds) =>
            nds.map((n) => {
              if (n.id === targetNode.id) {
                return {
                  ...n,
                  position: targetNode.position,
                  positionAbsolute: targetNode.positionAbsolute,
                  data: {
                    ...n.data,
                    reactionId: newReaction.id,
                    isConfigured: true,
                  },
                  selected: true,
                };
              }
              return n;
            })
          );

          setEdges((eds) =>
            addEdge(
              {
                ...params,
                target: params.target,
                id: `edge_local_${Date.now()}`,
                animated: true,
                style: { stroke: '#9e9e9e', strokeWidth: 2 },
              },
              eds
            )
          );

          toast.success('Automation created successfully!');
        } catch (error) {
          console.error('Failed to create reaction:', error);
          toast.error(getErrorMessage(error));
        }
      }
    },
    [nodes, setNodes, setEdges, createReaction, webhooks]
  );

  // Delete Node Logic (Shared)
  const deleteNode = useCallback(
    async (node: Node<ActionNodeData | ReactionNodeData>) => {
      if (node.type === 'reaction') {
        const reactionIdMatch = node.id.match(/reaction_(\d+)/);
        if (reactionIdMatch) {
          const reactionId = parseInt(reactionIdMatch[1], 10);
          await deleteReaction(reactionId).unwrap();
        }
      } else if (node.type === 'action') {
        const actionData = node.data as ActionNodeData;
        if (actionData.webhookId) {
          if (actionData.service === 'microsoft') {
            await deleteMicrosoftSubscription({
              id: String(actionData.webhookId),
            }).unwrap();
          } else if (actionData.service === 'gmail') {
            await deleteGmailSubscription({
              id: String(actionData.webhookId),
            }).unwrap();
          } else if (actionData.service === 'jira') {
            await deleteJiraWebhook({
              id: String(actionData.webhookId),
            }).unwrap();
          } else if (actionData.service === 'github') {
            const matchingHook = webhooks.find(
              (h) =>
                h.id === Number(actionData.webhookId) ||
                h.webhookId === String(actionData.webhookId)
            );
            let hookIdToDelete = Number(actionData.webhookId);

            if (matchingHook) {
              hookIdToDelete = matchingHook.id;
            }

            if (hookIdToDelete) {
              await deleteGithubWebhook({ id: hookIdToDelete }).unwrap();
            }
          } else if (actionData.service === 'discord') {
            await deleteDiscordWebhook({
              id: String(actionData.webhookId),
            }).unwrap();
          } else if (actionData.service === 'twitch') {
            await deleteTwitchWebhook({
              id: Number(actionData.webhookId),
            }).unwrap();
          }
        }
      }
    },
    [
      deleteReaction,
      deleteMicrosoftSubscription,
      deleteGmailSubscription,
      deleteJiraWebhook,
      deleteGithubWebhook,
      deleteDiscordWebhook,
      deleteTwitchWebhook,
      webhooks,
    ]
  );

  // Delete Handler (Toolbar)
  const handleNodeDelete = useCallback(
    async (nodeToDelete: Node<ActionNodeData | ReactionNodeData> | null) => {
      if (!nodeToDelete) return;
      try {
        await deleteNode(nodeToDelete);
        setNodes((nds) => nds.filter((n) => n.id !== nodeToDelete.id));
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== nodeToDelete.id && e.target !== nodeToDelete.id
          )
        );
        setShowConfigModal(false);
        setSelectedNode(null);
        setShowConfigModal(false);
        setSelectedNode(null);
        toast.success('Deleted successfully');
      } catch (error) {
        console.error('Delete failed', error);
        toast.error(getErrorMessage(error));
      }
    },
    [deleteNode, setNodes, setEdges, setShowConfigModal, setSelectedNode]
  );

  // Delete Handler (Keyboard)
  const onKeyDown = useCallback(
    async (event: React.KeyboardEvent) => {
      if (event.key === 'Delete') {
        const selectedNodes = nodes.filter((n) => n.selected);
        for (const node of selectedNodes) {
          try {
            await deleteNode(node);
          } catch (e) {
            console.error(e);
          }
        }
        setNodes((nds) => nds.filter((n) => !n.selected));
        setEdges((eds) => eds.filter((e) => !e.selected));
        toast.success('Deleted selected nodes');
      }
    },
    [nodes, deleteNode, setNodes, setEdges]
  );

  // Save Config
  const handleConfigSave = useCallback(
    async (
      updatedData: ActionNodeData | ReactionNodeData,
      selectedNode: Node<ActionNodeData | ReactionNodeData>
    ) => {
      let finalData = { ...updatedData };

      if (selectedNode.type === 'action') {
        const actionData = finalData as ActionNodeData;

        try {
          if (
            actionData.service === 'github' &&
            actionData.config.repo &&
            !actionData.webhookId
          ) {
            const [owner, repo] = (actionData.config.repo as string).split('/');
            const webhook = await createWebhook({
              owner,
              repo,
              webhookUrl: '',
              events: (actionData.config.events as string[]) || ['push'],
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: webhook.hookId,
              isConfigured: true,
            };
            toast.success('GitHub webhook created!');
          } else if (
            actionData.service === 'microsoft' &&
            !actionData.webhookId
          ) {
            const subscription = await createMicrosoftSubscription({
              resource: (actionData.config.resource as string) || 'me/messages',
              changeType: (actionData.config.changeType as string) || 'created',
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: subscription.id,
              isConfigured: true,
            };
            toast.success('Microsoft subscription created!');
          } else if (actionData.service === 'gmail' && !actionData.webhookId) {
            const subscription = await createGmailSubscription({
              eventType: (actionData.config.eventType as number) || 1,
              topicName: 'projects/capable-acrobat-479308-b5/topics/area',
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: subscription.hookId,
              isConfigured: true,
            };
            toast.success('Gmail subscription created!');
          } else if (
            actionData.service === 'discord' &&
            !actionData.webhookId
          ) {
            const webhook = await createDiscordWebhook({
              guildId: actionData.config.guildId as string,
              channelId: actionData.config.channelId as string,
              name: 'AREA Integration',
              events: (actionData.config.events as string[]) || [
                actionData.eventType,
              ],
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: webhook.hookId,
              isConfigured: true,
            };
            toast.success('Discord webhook created!');
          } else if (actionData.service === 'twitch' && !actionData.webhookId) {
            const webhook = await createTwitchWebhook({
              broadcasterUserId: actionData.config.broadcasterUserId as string,
              eventType: actionData.eventType,
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: webhook.hookId,
              isConfigured: true,
            };
            toast.success('Twitch webhook created!');
          } else if (actionData.service === 'jira' && !actionData.webhookId) {
            const webhook = await createJiraWebhook({
              projectKey: actionData.config.projectKey as string,
              events: (actionData.config.events as string[]) || [],
            }).unwrap();
            finalData = {
              ...actionData,
              webhookId: webhook.hookId,
              isConfigured: true,
            };
            toast.success('Jira webhook created!');
          }
        } catch (error) {
          console.error(error);
          toast.error(getErrorMessage(error));
          return;
        }
      } else if (selectedNode.type === 'reaction') {
        const reactionData = finalData as ReactionNodeData;
        if (reactionData.reactionId) {
          try {
            await updateReaction({
              id: reactionData.reactionId,
              config: reactionData.config,
            }).unwrap();
            toast.success('Reaction updated!');
          } catch (error) {
            console.error('Failed to update reaction:', error);
            toast.error(getErrorMessage(error));
            return;
          }
        }
      }

      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNode.id ? { ...n, data: finalData } : n
        )
      );
      setShowConfigModal(false);
      setSelectedNode(null);
    },
    [
      createWebhook,
      createMicrosoftSubscription,
      createGmailSubscription,
      createDiscordWebhook,
      createTwitchWebhook,
      updateReaction,
      setNodes,
      setShowConfigModal,
      setSelectedNode,
    ]
  );

  // DnD Handlers
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    data: ActionNodeData | ReactionNodeData
  ) => {
    event.dataTransfer.setData('application/reactflow-type', nodeType);
    event.dataTransfer.setData(
      'application/reactflow-data',
      JSON.stringify(data)
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  // Node Creation Helper
  const addNode = useCallback(
    (
      type: string,
      data: ActionNodeData | ReactionNodeData,
      position: { x: number; y: number }
    ) => {
      setNodes((nds) =>
        nds.concat({ id: generateUniqueNodeId(), type, position, data })
      );
    },
    [setNodes]
  );

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-type');
      const dataStr = event.dataTransfer.getData('application/reactflow-data');

      if (!type || !dataStr) return;
      const data: ActionNodeData | ReactionNodeData = JSON.parse(dataStr);

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      addNode(type, data, position);
    },
    [addNode, project]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Edge Deletion
  const onEdgesDelete = useCallback(
    async (deletedEdges: Edge[]) => {
      for (const edge of deletedEdges) {
        const reactionIdMatch = edge.target?.match(/reaction_(\d+)/);
        if (reactionIdMatch) {
          const reactionId = parseInt(reactionIdMatch[1], 10);
          try {
            await deleteReaction(reactionId).unwrap();
            toast.success('Automation removed');
          } catch (e) {
            console.error(e);
            toast.error(getErrorMessage(e));
          }
        }
      }
    },
    [deleteReaction]
  );

  return {
    onConnect,
    onEdgesDelete,
    handleNodeDelete,
    onKeyDown,
    handleConfigSave,
    onDragStart,
    onDragOver,
    onDrop,
    addNode,
  };
}
