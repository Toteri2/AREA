import { useState } from 'react';
import {
  useListDiscordChannelsQuery,
  useListDiscordGuildsQuery,
  useListDiscordMembersQuery,
  useListDiscordRolesQuery,
} from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

interface ConfigDefinition {
  label: string;
  fields: string[];
}

export function ReactionConfigForm({
  config,
  onChange,
  configDef,
}: ConfigFormProps & { configDef: ConfigDefinition }) {
  const [selectedGuild, setSelectedGuild] = useState<string>(
    (config.guildId as string) || ''
  );

  const { data: discordGuilds = [], isLoading: isLoadingGuilds } =
    useListDiscordGuildsQuery(undefined, {
      skip: !configDef.fields.includes('guildId'),
    });

  const { data: discordChannels = [], isLoading: isLoadingChannels } =
    useListDiscordChannelsQuery(
      { guildId: selectedGuild },
      { skip: !selectedGuild || !configDef.fields.includes('channelId') }
    );

  const { data: discordRoles = [], isLoading: isLoadingRoles } =
    useListDiscordRolesQuery(
      { guildId: selectedGuild },
      { skip: !selectedGuild || !configDef.fields.includes('roleId') }
    );

  const { data: discordMembers = [], isLoading: isLoadingMembers } =
    useListDiscordMembersQuery(
      { guildId: selectedGuild },
      { skip: !selectedGuild || !configDef.fields.includes('targetUserId') }
    );

  const updateConfigField = (field: string, value: string) => {
    onChange({ ...config, [field]: value });
    if (field === 'guildId') {
      setSelectedGuild(value);
    }
  };

  return (
    <>
      {configDef.fields.includes('to') && (
        <div className='config-form-group'>
          <label htmlFor='config-to'>To (Email Address)</label>
          <input
            id='config-to'
            type='email'
            value={(config.to as string) || ''}
            onChange={(e) => updateConfigField('to', e.target.value)}
            placeholder='recipient@example.com'
          />
        </div>
      )}

      {configDef.fields.includes('subject') && (
        <div className='config-form-group'>
          <label htmlFor='config-subject'>Subject</label>
          <input
            id='config-subject'
            type='text'
            value={(config.subject as string) || ''}
            onChange={(e) => updateConfigField('subject', e.target.value)}
            placeholder='New event: {{event}}'
          />
        </div>
      )}

      {configDef.fields.includes('body') && (
        <div className='config-form-group'>
          <label htmlFor='config-body'>Body</label>
          <textarea
            id='config-body'
            value={(config.body as string) || ''}
            onChange={(e) => updateConfigField('body', e.target.value)}
            placeholder='Enter email body...'
          />
        </div>
      )}

      {configDef.fields.includes('guildId') && (
        <div className='config-form-group'>
          <label htmlFor='config-guild'>Discord Server</label>
          {isLoadingGuilds ? (
            <div className='loading-spinner'>Loading servers...</div>
          ) : (
            <select
              id='config-guild'
              value={selectedGuild}
              onChange={(e) => updateConfigField('guildId', e.target.value)}
            >
              <option value=''>-- Select a Server --</option>
              {discordGuilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {configDef.fields.includes('channelId') && selectedGuild && (
        <div className='config-form-group'>
          <label htmlFor='config-channel-id'>Channel</label>
          {isLoadingChannels ? (
            <div className='loading-spinner'>Loading channels...</div>
          ) : (
            <select
              id='config-channel-id'
              value={(config.channelId as string) || ''}
              onChange={(e) => updateConfigField('channelId', e.target.value)}
            >
              <option value=''>-- Select a Channel --</option>
              {discordChannels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {configDef.fields.includes('roleId') && selectedGuild && (
        <div className='config-form-group'>
          <label htmlFor='config-role-id'>Role</label>
          {isLoadingRoles ? (
            <div className='loading-spinner'>Loading roles...</div>
          ) : (
            <select
              id='config-role-id'
              value={(config.roleId as string) || ''}
              onChange={(e) => updateConfigField('roleId', e.target.value)}
            >
              <option value=''>-- Select a Role --</option>
              {discordRoles.map((role) => (
                <option
                  key={role.id}
                  value={role.id}
                  style={{
                    color: role.color
                      ? `#${role.color.toString(16)}`
                      : 'inherit',
                  }}
                >
                  {role.name}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {configDef.fields.includes('targetUserId') && selectedGuild && (
        <div className='config-form-group'>
          <label htmlFor='config-target-user-id'>Target User</label>
          {isLoadingMembers ? (
            <div className='loading-spinner'>Loading members...</div>
          ) : (
            <select
              id='config-target-user-id'
              value={(config.targetUserId as string) || ''}
              onChange={(e) =>
                updateConfigField('targetUserId', e.target.value)
              }
            >
              <option value=''>-- Select a User --</option>
              {discordMembers.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.username}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {configDef.fields.includes('name') && (
        <div className='config-form-group'>
          <label htmlFor='config-name'>Channel Name</label>
          <input
            id='config-name'
            type='text'
            value={(config.name as string) || ''}
            onChange={(e) => updateConfigField('name', e.target.value)}
            placeholder='new-channel-name'
          />
        </div>
      )}

      {configDef.fields.includes('type') && (
        <div className='config-form-group'>
          <label htmlFor='config-type'>Channel Type</label>
          <select
            id='config-type'
            value={(config.type as string) || '0'}
            onChange={(e) => updateConfigField('type', e.target.value)}
          >
            <option value='0'>Text Channel</option>
            <option value='2'>Voice Channel</option>
          </select>
        </div>
      )}

      {configDef.fields.includes('content') && (
        <div className='config-form-group'>
          <label htmlFor='config-content'>Message Content</label>
          <textarea
            id='config-content'
            value={(config.content as string) || ''}
            onChange={(e) => updateConfigField('content', e.target.value)}
            placeholder='Hello from AREA!'
          />
        </div>
      )}

      {configDef.fields.includes('projectKey') && (
        <div className='config-form-group'>
          <label htmlFor='config-project-key'>Project Key</label>
          <input
            id='config-project-key'
            type='text'
            value={(config.projectKey as string) || ''}
            onChange={(e) => updateConfigField('projectKey', e.target.value)}
            placeholder='PROJ'
          />
        </div>
      )}

      {configDef.fields.includes('summary') && (
        <div className='config-form-group'>
          <label htmlFor='config-summary'>Summary</label>
          <input
            id='config-summary'
            type='text'
            value={(config.summary as string) || ''}
            onChange={(e) => updateConfigField('summary', e.target.value)}
            placeholder='Issue summary'
          />
        </div>
      )}

      {configDef.fields.includes('issueKey') && (
        <div className='config-form-group'>
          <label htmlFor='config-issue-key'>Issue Key</label>
          <input
            id='config-issue-key'
            type='text'
            value={(config.issueKey as string) || ''}
            onChange={(e) => updateConfigField('issueKey', e.target.value)}
            placeholder='PROJ-123'
          />
        </div>
      )}
      {configDef.fields.includes('comment') && (
        <div className='config-form-group'>
          <label htmlFor='config-comment'>Comment</label>
          <textarea
            id='config-comment'
            value={(config.comment as string) || ''}
            onChange={(e) => updateConfigField('comment', e.target.value)}
            placeholder='Comment...'
          />
        </div>
      )}
    </>
  );
}
