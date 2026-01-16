import { useEffect } from 'react';
import { useGetTwitchProfileQuery } from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

export function TwitchConfigForm({
  config,
  onChange,
}: ConfigFormProps & { eventType?: string }) {
  const { data: twitchProfile } = useGetTwitchProfileQuery();

  useEffect(() => {
    if (
      twitchProfile?.data?.[0]?.id &&
      config.broadcasterUserId === undefined
    ) {
      onChange({ ...config, broadcasterUserId: twitchProfile.data[0].id });
    }
  }, [twitchProfile, config.broadcasterUserId, onChange, config]);

  const updateConfigField = (field: string, value: string) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className='config-form-group'>
      <label htmlFor='config-broadcaster-id'>Broadcaster User ID</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <input
          id='config-broadcaster-id'
          type='text'
          value={(config.broadcasterUserId as string) || ''}
          onChange={(e) =>
            updateConfigField('broadcasterUserId', e.target.value)
          }
          placeholder={
            twitchProfile?.data?.[0]?.id
              ? `Defaults to your ID (${twitchProfile.data[0].id})`
              : 'e.g., 12345678'
          }
        />
        <small style={{ color: '#666' }}>
          Enter the Twitch User ID of the channel to monitor.
          <br />
          (Not the username - use a tool to find the numeric ID)
        </small>
      </div>
    </div>
  );
}
