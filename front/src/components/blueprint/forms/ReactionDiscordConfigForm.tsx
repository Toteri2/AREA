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

export function ReactionDiscordConfigForm({
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
    </>
  );
}
