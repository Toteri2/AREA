import { memo } from 'react';
import { Handle, type NodeProps, Position } from 'reactflow';
import {
  REACTION_ICONS,
  REACTION_ID_MAP,
} from '../../pages/BlueprintEditor/constants';
import type { ReactionNodeData } from '../../shared/src/types';

function ReactionNodeComponent({
  data,
  selected,
}: NodeProps<ReactionNodeData>) {
  // Find key for this reaction type
  const getReactionKey = (type: number): string | null => {
    for (const reactions of Object.values(REACTION_ID_MAP)) {
      for (const [name, id] of Object.entries(reactions)) {
        if (id === type) return name;
      }
    }
    return null;
  };

  const reactionKey = getReactionKey(data.reactionType);
  const icon =
    (reactionKey && REACTION_ICONS[reactionKey]) || REACTION_ICONS.send_message; // Fallback

  const typeLabel = reactionKey ? reactionKey.replace(/_/g, ' ') : 'Unknown';
  const borderColor = '#2196f3';

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
