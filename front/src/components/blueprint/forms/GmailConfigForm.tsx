import { useEffect, useState } from 'react';
import type { ConfigFormProps } from './types';

export function GmailConfigForm({
  config,
  onChange,
  actions = [],
}: ConfigFormProps) {
  const [selectedGmailEventType, setSelectedGmailEventType] = useState<number>(
    (config.eventType as number) || 1
  );

  useEffect(() => {
    onChange({
      eventType: selectedGmailEventType,
    });
  }, [selectedGmailEventType, onChange]);

  // Generate options dynamically from actions list (index + 1 corresponds to enum ID)
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
          onChange={(e) => setSelectedGmailEventType(Number(e.target.value))}
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
