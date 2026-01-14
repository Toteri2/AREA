import { useEffect, useState } from 'react';
import type { ConfigFormProps } from './types';

// Microsoft event types
const MICROSOFT_RESOURCES = [
  { id: 'me/messages', label: 'Email Messages' },
  { id: 'me/events', label: 'Calendar Events' },
  { id: 'me/contacts', label: 'Contacts' },
];

export function MicrosoftConfigForm({ config, onChange }: ConfigFormProps) {
  const [selectedResource, setSelectedResource] = useState<string>(
    (config.resource as string) || 'me/messages'
  );
  const [selectedChangeType, setSelectedChangeType] = useState<string>(
    (config.changeType as string) || 'created'
  );

  useEffect(() => {
    onChange({
      resource: selectedResource,
      changeType: selectedChangeType,
    });
  }, [selectedResource, selectedChangeType, onChange]);

  return (
    <>
      <div className='config-form-group'>
        <label htmlFor='ms-resource'>Resource Type</label>
        <select
          id='ms-resource'
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
        >
          {MICROSOFT_RESOURCES.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.label}
            </option>
          ))}
        </select>
      </div>

      <div className='config-form-group'>
        <label htmlFor='ms-change-type'>Trigger When</label>
        <select
          id='ms-change-type'
          value={selectedChangeType}
          onChange={(e) => setSelectedChangeType(e.target.value)}
        >
          <option value='created'>Created</option>
          <option value='updated'>Updated</option>
          <option value='deleted'>Deleted</option>
        </select>
      </div>

      <div className='config-form-group'>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          This will create a subscription to receive notifications when the
          selected resource changes. Make sure your Microsoft account is
          connected.
        </p>
      </div>
    </>
  );
}
