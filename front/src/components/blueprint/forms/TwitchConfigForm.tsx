import { useEffect } from 'react';
import { useGetTwitchProfileQuery } from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

export function TwitchConfigForm({
  config,
  onChange,
}: ConfigFormProps & { eventType?: string }) {
  const { data: twitchProfile, isLoading, error } = useGetTwitchProfileQuery();

  useEffect(() => {
    if (
      twitchProfile?.data?.[0]?.id &&
      (config.broadcasterUserId === undefined ||
        config.broadcasterUserId === '')
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
        <div style={{ display: 'flex', gap: '8px' }}>
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
            style={{ flex: 1 }}
          />
          <button
            type='button'
            className='btn-secondary'
            disabled={isLoading || !twitchProfile?.data?.[0]?.id}
            onClick={() => {
              if (twitchProfile?.data?.[0]?.id) {
                updateConfigField(
                  'broadcasterUserId',
                  twitchProfile.data[0].id
                );
              }
            }}
            title={
              isLoading
                ? 'Loading profile...'
                : !twitchProfile?.data?.[0]?.id
                  ? 'No Twitch profile found. Please ensure you are connected.'
                  : `Use my ID (${twitchProfile.data[0].id})`
            }
          >
            {isLoading ? '...' : 'Use my ID'}
          </button>
        </div>
        <small style={{ color: '#666' }}>
          Enter the Twitch User ID of the channel to monitor.
          <br />
          (Not the username - use a tool to find the numeric ID)
        </small>
        {error && (
          <small style={{ color: 'var(--danger-color)' }}>
            Failed to load Twitch profile. Please check your connection.
          </small>
        )}
      </div>
    </div>
  );
}
