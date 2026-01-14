import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import type { ReactionNodeData } from '../../shared/src/types';

const REACTION_ICONS: Record<number, string> = {
  1: '✉️', // Outlook
  2: '💬', // Discord Send Message
  3: '📁', // Discord Create Channel
  4: '🏷️', // Discord Add Role
  5: '📧', // Gmail
  6: '🎫', // Jira Create Issue
  7: '💭', // Jira Add Comment
  8: '📋', // Jira Update Status
};

const REACTION_LABELS: Record<number, string> = {
  1: 'Outlook Email',
  2: 'Discord Message',
  3: 'Discord Channel',
  4: 'Discord Role',
  5: 'Gmail Email',
  6: 'Jira Issue',
  7: 'Jira Comment',
  8: 'Jira Status',
};

const REACTION_COLORS: Record<number, string> = {
  1: '#0078d4', // Microsoft Blue
  2: '#5865f2', // Discord Blurple
  3: '#5865f2', // Discord Blurple
  4: '#5865f2', // Discord Blurple
  5: '#ea4335', // Gmail Red
  6: '#0052cc', // Jira Blue
  7: '#0052cc', // Jira Blue
  8: '#0052cc', // Jira Blue
};

function ReactionNodeComponent({
  data,
  selected,
}: NodeProps<ReactionNodeData>) {
  const icon = REACTION_ICONS[data.reactionType] || '⚡';
  const typeLabel = REACTION_LABELS[data.reactionType] || 'Unknown';
  const borderColor = REACTION_COLORS[data.reactionType] || '#2196f3';

  // Get preview text based on config
  const getPreview = () => {
    if (data.config.to) {
      return `To: ${data.config.to}`;
    }
    if (data.config.webhookUrl) {
      const url = data.config.webhookUrl as string;
      return `URL: ${url.substring(0, 30)}...`;
    }
    if (data.config.url) {
      const url = data.config.url as string;
      return `URL: ${url.substring(0, 30)}...`;
    }
    return null;
  };

  const preview = getPreview();

  return (
    <div
      className={`blueprint-node reaction ${selected ? 'selected' : ''}`}
      style={{
        borderColor,
      }}
    >
      <Handle
        type='target'
        position={Position.Left}
        className='node-handle target'
      />
      <div className='node-header'>
        <span className='node-icon'>{icon}</span>
        <span className='node-type'>{typeLabel}</span>
      </div>
      <div
        className='node-content'
        style={{
          position: 'relative',
          minHeight: '60px',
          paddingBottom: '30px',
        }}
      >
        {data.isConfigured && preview ? (
          <span
            className='node-config-preview'
            style={{ fontSize: '0.85rem', color: '#333', display: 'block' }}
          >
            {preview}
          </span>
        ) : (
          !data.isConfigured && (
            <span className='node-badge unconfigured'>
              Double-click to configure
            </span>
          )
        )}

        {data.isConfigured && (
          <div style={{ position: 'absolute', bottom: '10px', left: '14px' }}>
            <span className='node-badge configured'>✓ Configured</span>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReactionNode = memo(ReactionNodeComponent);
