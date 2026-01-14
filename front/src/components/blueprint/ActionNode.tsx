import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { ActionNodeData } from '../../shared/src/types';

const SERVICE_ICONS: Record<string, string> = {
  github: '📂',
  gmail: '📧',
  microsoft: '📬',
  jira: '🎫',
  discord: '💬',
};

const SERVICE_COLORS: Record<string, string> = {
  github: '#238636',
  gmail: '#ea4335',
  microsoft: '#0078d4',
  jira: '#0052cc',
  discord: '#5865f2',
};

function ActionNodeComponent({ data, selected }: NodeProps<ActionNodeData>) {
  const icon = SERVICE_ICONS[data.service] || '⚡';
  const borderColor = SERVICE_COLORS[data.service] || '#4caf50';

  // Get preview text based on config
  const getPreview = () => {
    if (data.config.repo) {
      return `Repo: ${data.config.repo}`;
    }
    return null;
  };

  const preview = getPreview();

  return (
    <div
      className={`blueprint-node action ${selected ? 'selected' : ''}`}
      style={{
        borderColor,
      }}
    >
      <div className='node-header'>
        <span className='node-icon'>{icon}</span>
        <span className='node-service'>{data.service}</span>
      </div>
      <div className='node-content'>
        <span className='node-label'>{data.label || data.eventType}</span>
        {data.isConfigured ? (
          <>
            <span className='node-badge configured'>✓ Configured</span>
            {preview && <span className='node-config-preview'>{preview}</span>}
          </>
        ) : (
          <span className='node-badge unconfigured'>
            Double-click to configure
          </span>
        )}
      </div>
      <Handle
        type='source'
        position={Position.Right}
        className='node-handle source'
      />
    </div>
  );
}

export const ActionNode = memo(ActionNodeComponent);
