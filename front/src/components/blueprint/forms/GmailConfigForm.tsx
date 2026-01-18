import { useEffect } from 'react';
import type { ConfigFormProps } from './types';

export function GmailConfigForm({
  config,
  onChange,
  actions = [],
  eventType,
}: ConfigFormProps) {
  const selectedGmailEventType = (config.eventType as number) || 1;

  useEffect(() => {
    if (!config.eventType) {
      if (eventType && actions.length > 0) {
        const actionName = eventType.includes('.')
          ? eventType.split('.')[1]
          : eventType;
        const actionIndex = actions.findIndex((a) => a.name === actionName);
        if (actionIndex !== -1) {
          onChange({ ...config, eventType: actionIndex + 1 });
          return;
        }
      }
      onChange({ ...config, eventType: 1 });
    }
  }, [config.eventType, onChange, config, eventType, actions]);

  const options = actions.map(
    (action: { name: string; description: string }, index: number) => ({
      id: index + 1,
      label: action.description || action.name.replace(/_/g, ' '),
    })
  );

  return (
    <>
      <div className='config-form-group'>
        <label htmlFor='gmail-event'>Event Type</label>
        <select
          id='gmail-event'
          value={selectedGmailEventType}
          onChange={(e) =>
            onChange({ ...config, eventType: Number(e.target.value) })
          }
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className='config-form-group'>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          This will create a subscription to receive notifications when you get
          new emails. Make sure your Gmail account is connected.
        </p>
      </div>
    </>
  );
}
