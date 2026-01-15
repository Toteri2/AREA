import { useState } from 'react';
import type {
  AboutResponse,
  ActionNodeData,
  ReactionNodeData,
} from '../../shared/src/types';
import { DiscordConfigForm } from './forms/DiscordConfigForm';
import { GithubConfigForm } from './forms/GithubConfigForm';
import { GmailConfigForm } from './forms/GmailConfigForm';
import { MicrosoftConfigForm } from './forms/MicrosoftConfigForm';
import { ReactionConfigForm } from './forms/ReactionConfigForm';

interface ConfigModalProps {
  nodeType: 'action' | 'reaction';
  nodeData: ActionNodeData | ReactionNodeData;
  onSave: (data: ActionNodeData | ReactionNodeData) => void;
  onClose: () => void;
  onDelete: () => void;
  availableServices: AboutResponse['server']['services'];
}

// Reaction types with their required fields
const REACTION_CONFIGS: Record<number, { label: string; fields: string[] }> = {
  1: { label: 'Email (Outlook)', fields: ['to', 'subject', 'body'] },
  2: { label: 'Discord Message', fields: ['guildId', 'channelId', 'content'] },
  3: { label: 'Discord Channel', fields: ['guildId', 'name', 'type'] },
  4: { label: 'Discord Role', fields: ['guildId', 'targetUserId', 'roleId'] },
  5: { label: 'Email (Gmail)', fields: ['to', 'subject', 'body'] },
  6: {
    label: 'Jira Issue',
    fields: ['projectKey', 'summary', 'issueType', 'description', 'priority'],
  },
  7: { label: 'Jira Comment', fields: ['issueKey', 'comment'] },
  8: { label: 'Jira Status', fields: ['issueKey', 'transitionName'] },
};

export function ConfigModal({
  nodeType,
  nodeData,
  onSave,
  onClose,
  onDelete,
  availableServices,
}: ConfigModalProps) {
  const isAction = nodeType === 'action';
  const actionData = isAction ? (nodeData as ActionNodeData) : null;
  const reactionData = !isAction ? (nodeData as ReactionNodeData) : null;

  // Local state for form
  const [label, setLabel] = useState(nodeData.label || '');
  const [config, setConfig] = useState<Record<string, unknown>>(
    nodeData.config || {}
  );

  const handleConfigChange = (newConfig: Record<string, unknown>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleSave = () => {
    const updatedData = {
      ...nodeData,
      label: label || nodeData.label,
      config,
      isConfigured: true,
    };
    onSave(updatedData);
  };

  const reactionConfig = reactionData
    ? REACTION_CONFIGS[reactionData.reactionType]
    : null;

  // determine sub-label
  let subTitle = '';
  if (isAction && actionData)
    subTitle = `Configure ${actionData.service} Action`;
  else if (reactionConfig) subTitle = `Configure ${reactionConfig.label}`;
  else subTitle = 'Configuration';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Overlay click-to-close is intentional UX pattern
    <div
      className='config-modal-overlay'
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className='config-modal'
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role='dialog'
        aria-modal='true'
      >
        <div className='config-modal-header'>
          <h2>{subTitle}</h2>
          <button
            type='button'
            className='config-modal-close'
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className='config-modal-body'>
          {/* Common Label Field */}
          <div className='config-form-group'>
            <label htmlFor='node-label'>Label</label>
            <input
              id='node-label'
              type='text'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder='Give this block a name...'
            />
          </div>

          {/* Service Specific Forms */}
          {isAction && actionData?.service === 'github' && (
            <GithubConfigForm config={config} onChange={handleConfigChange} />
          )}

          {isAction && actionData?.service === 'microsoft' && (
            <MicrosoftConfigForm
              config={config}
              onChange={handleConfigChange}
            />
          )}

          {isAction && actionData?.service === 'gmail' && (
            <GmailConfigForm
              config={config}
              onChange={handleConfigChange}
              actions={
                availableServices.find((s) => s.name === 'gmail')?.actions || []
              }
            />
          )}

          {isAction && actionData?.service === 'discord' && (
            <DiscordConfigForm
              config={config}
              onChange={handleConfigChange}
              eventType={actionData.eventType}
            />
          )}

          {!isAction && reactionData && reactionConfig && (
            <ReactionConfigForm
              config={config}
              onChange={handleConfigChange}
              configDef={reactionConfig}
            />
          )}
        </div>

        <div className='config-modal-footer'>
          <button type='button' className='btn-danger' onClick={onDelete}>
            Delete
          </button>
          <button type='button' className='btn-secondary' onClick={onClose}>
            Cancel
          </button>
          <button type='button' className='btn-primary' onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
