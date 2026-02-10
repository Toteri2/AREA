import type { ConfigFormProps } from './types';

interface ConfigDefinition {
  label: string;
  fields: string[];
}

export function ReactionEmailConfigForm({
  config,
  onChange,
  configDef,
}: ConfigFormProps & { configDef: ConfigDefinition }) {
  const updateConfigField = (field: string, value: string) => {
    onChange({ ...config, [field]: value });
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
    </>
  );
}
