import { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ToastContainer } from 'react-toastify';
import { ActionNode, ReactionNode } from '../../components/blueprint';
import { ConfigModal } from '../../components/blueprint/ConfigModal';
import 'react-toastify/dist/ReactToastify.css';
import type {
  ActionNodeData,
  ReactionNodeData,
  ServiceType,
} from '../../shared/src/types';
import { useConnectionQuery, useGetServicesQuery } from '../../shared/src/web';
import { getReactionId, REACTION_ICONS, SERVICE_ICONS } from './constants';
import { useBlueprintData } from './hooks/useBlueprintData';
import { useBlueprintGraph } from './hooks/useBlueprintGraph';
import './BlueprintEditor.css';

const nodeTypes: NodeTypes = {
  action: ActionNode,
  reaction: ReactionNode,
};

function BlueprintEditorContent() {
  // UI State
  const [selectedNode, setSelectedNode] = useState<Node<
    ActionNodeData | ReactionNodeData
  > | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 1. Data Hook
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    isLoading,
    webhooks,
  } = useBlueprintData();

  // 2. Graph Actions Hook
  const {
    onConnect,
    onEdgesDelete,
    handleNodeDelete,
    onKeyDown,
    handleConfigSave,
    onDragStart,
    onDragOver,
    onDrop,
    addNode,
  } = useBlueprintGraph(
    nodes,
    setNodes,
    setEdges,
    webhooks,
    setSelectedNode,
    setShowConfigModal
  );

  // Sidebar Data
  const { data: servicesData } = useGetServicesQuery();
  const availableServices = useMemo(
    () => servicesData?.server?.services ?? [],
    [servicesData?.server?.services]
  );

  // Canvas Ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  const handleSidebarDoubleClick = useCallback(
    (type: 'action' | 'reaction', data: ActionNodeData | ReactionNodeData) => {
      if (!canvasRef.current) return;

      const { width, height } = canvasRef.current.getBoundingClientRect();
      const position = project({ x: width / 2, y: height / 2 });

      addNode(type, data, position);
    },
    [addNode, project]
  );

  // Connection Guards
  const githubConnection = useConnectionQuery({ provider: 'github' });
  const microsoftConnection = useConnectionQuery({ provider: 'microsoft' });
  const gmailConnection = useConnectionQuery({ provider: 'gmail' });
  const discordConnection = useConnectionQuery({ provider: 'discord' });
  const jiraConnection = useConnectionQuery({ provider: 'jira' });
  const twitchConnection = useConnectionQuery({ provider: 'twitch' });

  // Memoize connected services to prevent re-renders
  const connectedServices = useMemo(
    () => ({
      github: githubConnection.data?.connected ?? false,
      microsoft: microsoftConnection.data?.connected ?? false,
      gmail: gmailConnection.data?.connected ?? false,
      discord: discordConnection.data?.connected ?? false,
      jira: jiraConnection.data?.connected ?? false,
      twitch: twitchConnection.data?.connected ?? false,
    }),
    [
      githubConnection.data?.connected,
      microsoftConnection.data?.connected,
      gmailConnection.data?.connected,
      discordConnection.data?.connected,
      jiraConnection.data?.connected,
      twitchConnection.data?.connected,
    ]
  );

  const nodeColor = useCallback(
    (node: Node<ActionNodeData | ReactionNodeData>) => {
      return node.type === 'action' ? '#4caf50' : '#2196f3';
    },
    []
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, n: Node<ActionNodeData | ReactionNodeData>) => {
      setSelectedNode(n);
    },
    []
  );

  const handleNodeDoubleClick = useCallback(
    (_: React.MouseEvent, n: Node<ActionNodeData | ReactionNodeData>) => {
      setSelectedNode(n);
      setShowConfigModal(true);
    },
    []
  );

  const handleModalClose = useCallback(() => {
    setShowConfigModal(false);
    setSelectedNode(null);
  }, []);

  const handleModalSave = useCallback(
    (data: ActionNodeData | ReactionNodeData) => {
      if (selectedNode) {
        handleConfigSave(data, selectedNode);
      }
    },
    [selectedNode, handleConfigSave]
  );

  const handleModalDelete = useCallback(() => {
    if (selectedNode) {
      handleNodeDelete(selectedNode);
    }
  }, [selectedNode, handleNodeDelete]);

  const defaultEdgeOptions = useMemo(
    () => ({
      animated: true,
      style: { stroke: '#9e9e9e', strokeWidth: 2 },
    }),
    []
  );

  if (isLoading) {
    return (
      <div
        className='blueprint-editor'
        style={{ justifyContent: 'center', alignItems: 'center' }}
      >
        <p>Loading automations...</p>
      </div>
    );
  }

  return (
    <div className='blueprint-editor' onKeyDown={onKeyDown} role='application'>
      {/* Toast Notification Container */}
      <ToastContainer
        position='bottom-right'
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light'
      />

      {/* Mobile Toggle Button */}
      <button
        type='button'
        className='mobile-sidebar-toggle'
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        aria-label='Toggle Sidebar'
      >
        {isMobileSidebarOpen ? '✕' : '☰'}
      </button>

      {/* Sidebar */}
      <aside
        className={`blueprint-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}
      >
        <h2>Blocks</h2>
        <section className='sidebar-section'>
          <h3>⚡ Actions</h3>
          <p className='sidebar-hint'>
            Drag to canvas, double-click to configure
          </p>
          {availableServices.map((service) => (
            <div key={service.name} className='sidebar-service'>
              <h4>
                <span className='service-icon'>
                  {SERVICE_ICONS[service.name] || '📦'}
                </span>
                {service.name.charAt(0).toUpperCase() + service.name.slice(1)}
              </h4>
              {service.actions.map((action) => {
                const isConnected =
                  connectedServices[
                    service.name as keyof typeof connectedServices
                  ] ?? false;
                return (
                  <button
                    type='button'
                    key={`${service.name}-${action.name}`}
                    className={`sidebar-block action ${!isConnected ? 'disabled-block' : ''}`}
                    draggable={isConnected}
                    onDragStart={(e) =>
                      isConnected &&
                      onDragStart(e, 'action', {
                        label: action.description,
                        service: service.name as ServiceType,
                        eventType: action.name,
                        config: {},
                        isConfigured: false,
                      })
                    }
                    onDoubleClick={() =>
                      isConnected &&
                      handleSidebarDoubleClick('action', {
                        label: action.description,
                        service: service.name as ServiceType,
                        eventType: action.name,
                        config: {},
                        isConfigured: false,
                      })
                    }
                    title={
                      isConnected
                        ? action.description
                        : `Link ${service.name} in Profile`
                    }
                    style={
                      !isConnected
                        ? {
                            opacity: 0.5,
                            cursor: 'not-allowed',
                            filter: 'grayscale(100%)',
                          }
                        : {}
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        // Logic for selecting or activating via keyboard if needed
                      }
                    }}
                  >
                    <span className='block-icon'>
                      {SERVICE_ICONS[service.name] || '📦'}
                    </span>
                    {action.name.replace(/_/g, ' ').replace(/\./g, ' ')}
                    {!isConnected && (
                      <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>
                        {' '}
                        (Unlinked)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </section>
        <section className='sidebar-section'>
          <h3>🎯 Reactions</h3>
          <p className='sidebar-hint'>Drag to canvas, connect to actions</p>
          {availableServices
            .filter((s) => s.reactions.length > 0)
            .map((service) => (
              <div
                key={`reactions-${service.name}`}
                className='sidebar-service'
              >
                <h4>
                  <span className='service-icon'>
                    {SERVICE_ICONS[service.name] || '📦'}
                  </span>
                  {service.name.charAt(0).toUpperCase() + service.name.slice(1)}
                </h4>
                {service.reactions.map((reaction) => {
                  const isConnected =
                    connectedServices[
                      service.name as keyof typeof connectedServices
                    ] ?? false;
                  return (
                    <button
                      type='button'
                      key={`${service.name}-reaction-${reaction.name}`}
                      className={`sidebar-block reaction ${!isConnected ? 'disabled-block' : ''}`}
                      draggable={isConnected}
                      onDragStart={(e) =>
                        isConnected &&
                        onDragStart(e, 'reaction', {
                          label:
                            reaction.description ||
                            reaction.name.replace(/_/g, ' '),
                          reactionType: getReactionId(
                            service.name,
                            reaction.name
                          ),
                          reactionName: reaction.name,
                          serviceName: service.name,
                          config: {},
                          isConfigured: false,
                        })
                      }
                      onDoubleClick={() =>
                        isConnected &&
                        handleSidebarDoubleClick('reaction', {
                          label:
                            reaction.description ||
                            reaction.name.replace(/_/g, ' '),
                          reactionType: getReactionId(
                            service.name,
                            reaction.name
                          ),
                          reactionName: reaction.name,
                          serviceName: service.name,
                          config: {},
                          isConfigured: false,
                        })
                      }
                      title={
                        isConnected
                          ? reaction.description
                          : `Link ${service.name} in Profile`
                      }
                      style={
                        !isConnected
                          ? {
                              opacity: 0.5,
                              cursor: 'not-allowed',
                              filter: 'grayscale(100%)',
                            }
                          : {}
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          // Logic
                        }
                      }}
                    >
                      <span className='block-icon'>
                        {REACTION_ICONS[reaction.name] || '⚡'}
                      </span>
                      {reaction.name.replace(/_/g, ' ')}
                      {!isConnected && (
                        <span style={{ fontSize: '0.8em', marginLeft: '5px' }}>
                          {' '}
                          (Unlinked)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
        </section>
      </aside>

      {/* Canvas */}
      <section
        className='blueprint-canvas'
        ref={canvasRef}
        onDrop={onDrop}
        onDragOver={onDragOver}
        aria-label='Blueprint Canvas'
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={defaultEdgeOptions}
          minZoom={0.1}
          maxZoom={1.5}
        >
          <Background color='#aaa' gap={16} />
          <Controls />
          <MiniMap
            nodeColor={nodeColor}
            maskColor='rgba(240, 240, 240, 0.6)'
            style={{ background: '#fff' }}
          />
        </ReactFlow>
      </section>

      {/* Config Modal */}
      {showConfigModal && selectedNode && (
        <ConfigModal
          nodeType={selectedNode.type as 'action' | 'reaction'}
          nodeData={selectedNode.data}
          onSave={handleModalSave}
          onClose={handleModalClose}
          onDelete={handleModalDelete}
          availableServices={availableServices}
        />
      )}
    </div>
  );
}

function BlueprintEditor() {
  return (
    <ReactFlowProvider>
      <BlueprintEditorContent />
    </ReactFlowProvider>
  );
}

export { BlueprintEditor };
export default BlueprintEditor;
