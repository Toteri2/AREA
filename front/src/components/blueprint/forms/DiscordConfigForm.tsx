import { useEffect, useState } from 'react';
import {
  useListDiscordChannelsQuery,
  useListDiscordGuildsQuery,
} from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

interface DiscordConfigProps extends ConfigFormProps {
  eventType: string;
}

export function DiscordConfigForm({
  config,
  onChange,
  eventType,
}: DiscordConfigProps) {
  const [selectedGuild, setSelectedGuild] = useState<string>(
    (config.guildId as string) || ''
  );
  const [selectedChannel, setSelectedChannel] = useState<string>(
    (config.channelId as string) || ''
  );

  const { data: guilds = [], isLoading: isLoadingGuilds } =
    useListDiscordGuildsQuery();

  const { data: channels = [] } = useListDiscordChannelsQuery(
    { guildId: selectedGuild },
    { skip: !selectedGuild }
  );

  useEffect(() => {
    const newConfig: Record<string, unknown> = {
      guildId: selectedGuild,
    };

    if (selectedChannel) {
      newConfig.channelId = selectedChannel;
    }

    onChange(newConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGuild, selectedChannel]);

  const needsChannel =
    eventType === 'new_message_in_channel' || eventType === 'reaction_added';

  return (
    <>
      <div className='config-form-group'>
        <label htmlFor='discord-guild'>Server (Guild)</label>
        {isLoadingGuilds ? (
          <div className='loading-spinner'>Loading servers...</div>
        ) : (
          <select
            id='discord-guild'
            value={selectedGuild}
            onChange={(e) => {
              setSelectedGuild(e.target.value);
              setSelectedChannel('');
            }}
          >
            <option value=''>-- Select a Server --</option>
            {guilds.map((guild) => (
              <option key={guild.id} value={guild.id}>
                {guild.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {needsChannel && (
        <div className='config-form-group'>
          <label htmlFor='discord-channel'>Channel</label>
          <select
            id='discord-channel'
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            disabled={!selectedGuild}
          >
            <option value=''>-- Select a Channel --</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.type === 0 ? '#' : '🔊'} {channel.name}
              </option>
            ))}
          </select>
          {!selectedGuild && (
            <p className='helper-text'>Select a server first.</p>
          )}
        </div>
      )}
    </>
  );
}
