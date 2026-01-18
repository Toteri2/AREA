import { memo, useCallback, useState } from 'react';
import type {
  AboutResponse,
  ActionNodeData,
  ReactionNodeData,
} from '../../shared/src/types';
import { DiscordConfigForm } from './forms/DiscordConfigForm';
import { GithubConfigForm } from './forms/GithubConfigForm';
import { GmailConfigForm } from './forms/GmailConfigForm';
import { JiraConfigForm } from './forms/JiraConfigForm';
import { MicrosoftConfigForm } from './forms/MicrosoftConfigForm';
import { ReactionConfigForm } from './forms/ReactionConfigForm';
import { TwitchConfigForm } from './forms/TwitchConfigForm';

interface ConfigModalProps {
  nodeType: 'action' | 'reaction';
  nodeData: ActionNodeData | ReactionNodeData;
  onSave: (data: ActionNodeData | ReactionNodeData) => void;
  onClose: () => void;
  onDelete: () => void;
  availableServices: AboutResponse['server']['services'];
}

// Reaction types with their required fields
const REACTION_CONFIGS: Record<
  string,
  { label: string; fields: string[]; service: string }
> = {
  'microsoft.send_email': {
    label: 'Email (Outlook)',
    fields: ['to', 'subject', 'body'],
    service: 'microsoft',
  },
  'discord.send_message': {
    label: 'Discord Message',
    fields: ['guildId', 'channelId', 'content'],
    service: 'discord',
  },
  'discord.create_private_channel': {
    label: 'Discord Channel',
    fields: ['guildId', 'name', 'type'],
    service: 'discord',
  },
  'discord.add_role_to_user': {
    label: 'Discord Role',
    fields: ['guildId', 'targetUserId', 'roleId'],
    service: 'discord',
  },
  'gmail.send_email': {
    label: 'Email (Gmail)',
    fields: ['to', 'subject', 'body'],
    service: 'gmail',
  },
  'jira.create_issue': {
    label: 'Jira Issue',
    fields: [
      'projectKey',
      'summary',
      'issueType',
      'description',
      'priority',
      'labels',
    ],
    service: 'jira',
  },
  'jira.add_comment': {
    label: 'Jira Comment',
    fields: ['issueKey', 'comment'],
    service: 'jira',
  },
  'jira.update_status': {
    label: 'Jira Status',
    fields: ['issueKey', 'transitionName'],
    service: 'jira',
  },
};

function ConfigModalComponent({
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
  const [config, setConfig] = useState<Record<string, unknown>>(
    nodeData.config || {}
  );

  const handleConfigChange = useCallback(
    (newConfig: Record<string, unknown>) => {
      setConfig((prev) => ({ ...prev, ...newConfig }));
    },
    []
  );

  const handleSave = useCallback(() => {
    const updatedData = {
      ...nodeData,
      config,
      isConfigured: true,
    };
    onSave(updatedData);
  }, [nodeData, config, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  const handleOverlayClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleModalClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  let reactionConfig = null;
  if (reactionData?.serviceName && reactionData.reactionName) {
    const key = `${reactionData.serviceName}.${reactionData.reactionName}`;
    reactionConfig = REACTION_CONFIGS[key];
  }

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
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
    >
      <div
        className='config-modal'
        onClick={handleModalClick}
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
          {/* Service Specific Forms */}
          {isAction && actionData?.service === 'github' && (
            <GithubConfigForm
              config={config}
              onChange={handleConfigChange}
              eventType={actionData.eventType}
            />
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
              eventType={actionData.eventType}
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

          {isAction && actionData?.service === 'twitch' && (
            <TwitchConfigForm
              config={config}
              onChange={handleConfigChange}
              eventType={actionData.eventType}
            />
          )}

          {isAction && actionData?.service === 'jira' && (
            <JiraConfigForm config={config} onChange={handleConfigChange} />
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

export const ConfigModal = memo(ConfigModalComponent);
