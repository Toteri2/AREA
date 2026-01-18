import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { describe, expect, it } from 'vitest';
import type { ReactionNodeData } from '../../shared/src/types';
import { ReactionNode } from './ReactionNode';

describe('ReactionNode', () => {
  const mockData: ReactionNodeData = {
    reactionType: 2,
    label: 'Send Discord Message',
    isConfigured: true,
    config: { to: '#general', message: 'Hello!' },
  };

  const renderNode = (data: ReactionNodeData, selected = false) => {
    return render(
      <ReactFlowProvider>
        <ReactionNode
          id='test-node'
          type='reaction'
          data={data}
          selected={selected}
          isConnectable={true}
          zIndex={0}
          xPos={0}
          yPos={0}
          dragging={false}
        />
      </ReactFlowProvider>
    );
  };

  it('renders reaction node with correct type and label', () => {
    renderNode(mockData);

    expect(screen.getByText('Discord Message')).toBeInTheDocument();
    expect(screen.getByText('💬')).toBeInTheDocument();
    expect(screen.getByText('✓ Configured')).toBeInTheDocument();
  });

  it('shows to preview when config has to field', () => {
    renderNode(mockData);

    expect(screen.getByText('To: #general')).toBeInTheDocument();
  });

  it('shows not configured badge when not configured', () => {
    const unconfiguredData: ReactionNodeData = {
      ...mockData,
      isConfigured: false,
      config: {},
    };

    renderNode(unconfiguredData);

    expect(screen.getByText('Double-click to configure')).toBeInTheDocument();
  });

  it('renders with selected class when selected', () => {
    const { container } = renderNode(mockData, true);

    const nodeElement = container.querySelector('.blueprint-node');
    expect(nodeElement).toHaveClass('selected');
  });

  it('displays correct icon for Gmail reaction', () => {
    const gmailData: ReactionNodeData = {
      reactionType: 5,
      label: 'Send Gmail',
      isConfigured: false,
      config: {},
    };

    renderNode(gmailData);

    expect(screen.getByText('Gmail Email')).toBeInTheDocument();
    expect(screen.getByText('📧')).toBeInTheDocument();
  });

  it('displays correct icon for Jira Issue reaction', () => {
    const jiraData: ReactionNodeData = {
      reactionType: 6,
      label: 'Create Jira Issue',
      isConfigured: true,
      config: { summary: 'Test issue' },
    };

    renderNode(jiraData);

    expect(screen.getByText('Jira Issue')).toBeInTheDocument();
    expect(screen.getByText('🎫')).toBeInTheDocument();
  });

  it('uses default icon for unknown reaction type', () => {
    const unknownData: ReactionNodeData = {
      reactionType: 999,
      label: 'Unknown Reaction',
      isConfigured: false,
      config: {},
    };

    renderNode(unknownData);

    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
