import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from 'reactflow';
import { describe, expect, it } from 'vitest';
import type { ActionNodeData } from '../../shared/src/types';
import { ActionNode } from './ActionNode';

describe('ActionNode', () => {
  const mockData: ActionNodeData = {
    service: 'github',
    eventType: 'push',
    label: 'On Push',
    isConfigured: true,
    config: { repo: 'test/repo' },
  };

  const renderNode = (data: ActionNodeData, selected = false) => {
    return render(
      <ReactFlowProvider>
        <ActionNode
          id='test-node'
          type='action'
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

  it('renders action node with correct service and label', () => {
    renderNode(mockData);

    expect(screen.getByText('github')).toBeInTheDocument();
    expect(screen.getByText('On Push')).toBeInTheDocument();
    expect(screen.getByText('✓ Configured')).toBeInTheDocument();
  });

  it('shows repo preview when config has repo', () => {
    renderNode(mockData);

    expect(screen.getByText('Repo: test/repo')).toBeInTheDocument();
  });

  it('shows not configured badge when not configured', () => {
    const unconfiguredData: ActionNodeData = {
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

  it('displays correct icon for different services', () => {
    const gmailData: ActionNodeData = {
      service: 'gmail',
      eventType: 'new_email',
      label: 'New Email',
      isConfigured: false,
      config: {},
    };

    renderNode(gmailData);

    expect(screen.getByText('gmail')).toBeInTheDocument();
    expect(screen.getByText('📧')).toBeInTheDocument();
  });

  it('uses default icon for unknown service', () => {
    const unknownData: ActionNodeData = {
      service: 'unknown',
      eventType: 'test',
      label: 'Test Action',
      isConfigured: false,
      config: {},
    };

    renderNode(unknownData);

    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('shows eventType as fallback when label is not provided', () => {
    const dataWithoutLabel: ActionNodeData = {
      service: 'github',
      eventType: 'pull_request',
      label: '',
      isConfigured: false,
      config: {},
    };

    renderNode(dataWithoutLabel);

    expect(screen.getByText('pull_request')).toBeInTheDocument();
  });
});
