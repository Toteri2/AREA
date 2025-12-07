import { useState } from 'react';
import {
  useCreateReactionMutation,
  useDeleteReactionMutation,
  useListReactionsQuery,
  useListUserWebhooksQuery,
} from '../shared/src/web';

interface Reaction {
  id: number;
  hookId: number;
  reactionType: number;
  config: {
    to?: string;
    subject?: string;
    body?: string;
    [key: string]: any;
  };
}

const REACTION_TYPES = [
  {
    value: 1,
    label: 'Email Notification',
    requiresConfig: ['to', 'subject', 'body'],
  },
  {
    value: 2,
    label: 'Slack Message',
    requiresConfig: ['webhookUrl', 'message'],
  },
  {
    value: 3,
    label: 'Discord Webhook',
    requiresConfig: ['webhookUrl', 'message'],
  },
  { value: 4, label: 'HTTP POST', requiresConfig: ['url', 'body'] },
];

export function Reactions() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [selectedHookId, setSelectedHookId] = useState<number | ''>('');
  const [selectedReactionType, setSelectedReactionType] = useState<number | ''>(
    ''
  );
  const [configFields, setConfigFields] = useState<Record<string, string>>({
    to: '',
    subject: '',
    body: '',
  });

  const { data: webhooks = [], isLoading: isLoadingWebhooks } =
    useListUserWebhooksQuery();
  const { data: reactions = [], isLoading: isLoadingReactions } =
    useListReactionsQuery();
  const [createReaction, { isLoading: isCreatingReaction }] =
    useCreateReactionMutation();
  const [deleteReaction] = useDeleteReactionMutation();

  const handleCreateReaction = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedHookId || !selectedReactionType) {
      setErrorMessage('Please select a webhook and reaction type');
      return;
    }

    try {
      await createReaction({
        hookId: selectedHookId as number,
        reactionType: selectedReactionType as number,
        config: configFields,
      }).unwrap();

      setSuccessMessage('Reaction created successfully!');
      setShowCreateForm(false);
      resetForm();
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'Failed to create reaction';
      setErrorMessage(message);
      console.error('Failed to create reaction:', err);
    }
  };

  const handleDeleteReaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this reaction?')) return;

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteReaction(id).unwrap();
      setSuccessMessage('Reaction deleted successfully!');
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'Failed to delete reaction';
      setErrorMessage(message);
      console.error('Failed to delete reaction:', err);
    }
  };

  const handleReactionTypeChange = (typeValue: number) => {
    setSelectedReactionType(typeValue);
    const type = REACTION_TYPES.find((t) => t.value === typeValue);

    if (type) {
      const newConfig: Record<string, string> = {};
      type.requiresConfig.forEach((field) => {
        newConfig[field] = '';
      });
      setConfigFields(newConfig);
    }
  };

  const resetForm = () => {
    setSelectedHookId('');
    setSelectedReactionType('');
    setConfigFields({});
  };

  const getReactionTypeName = (typeValue: number) => {
    return (
      REACTION_TYPES.find((t) => t.value === typeValue)?.label || 'Unknown'
    );
  };

  return (
    <div className='github-page'>
      <h1>Reactions</h1>
      <p>Configure automated reactions to webhook events</p>

      {errorMessage && <div className='error-message'>{errorMessage}</div>}

      {successMessage && (
        <div className='success-message'>{successMessage}</div>
      )}

      <div className='github-content'>
        <div className='webhooks-section'>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2>Your Reactions</h2>
            <button
              type='button'
              onClick={() => setShowCreateForm(!showCreateForm)}
              className='btn-primary'
            >
              {showCreateForm ? 'Cancel' : 'Create Reaction'}
            </button>
          </div>

          {showCreateForm && (
            <div className='webhook-form'>
              <h3>Create New Reaction</h3>

              <div className='form-group'>
                <label htmlFor='webhook-select'>Select Webhook</label>
                <select
                  id='webhook-select'
                  value={selectedHookId}
                  onChange={(e) => setSelectedHookId(Number(e.target.value))}
                  required
                >
                  <option value=''>-- Select a webhook --</option>
                  {webhooks.map((webhook) => (
                    <option key={webhook.id} value={webhook.id}>
                      Webhook #{webhook.id} - {webhook.config.url}
                    </option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label htmlFor='reaction-type'>Reaction Type</label>
                <select
                  id='reaction-type'
                  value={selectedReactionType}
                  onChange={(e) =>
                    handleReactionTypeChange(Number(e.target.value))
                  }
                  required
                >
                  <option value=''>-- Select a reaction type --</option>
                  {REACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedReactionType && (
                <fieldset className='form-group'>
                  <legend>Configuration</legend>

                  {selectedReactionType === 1 && (
                    <>
                      <div className='form-group'>
                        <label htmlFor='config-to'>To (Email)</label>
                        <input
                          id='config-to'
                          type='email'
                          value={configFields.to || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              to: e.target.value,
                            })
                          }
                          placeholder='user@example.com'
                          required
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='config-subject'>Subject</label>
                        <input
                          id='config-subject'
                          type='text'
                          value={configFields.subject || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              subject: e.target.value,
                            })
                          }
                          placeholder='New issue on {{repo}}'
                          required
                        />
                        <small>
                          You can use placeholders like {'{{repo}}'},{' '}
                          {'{{event}}'}
                        </small>
                      </div>
                      <div className='form-group'>
                        <label htmlFor='config-body'>Body</label>
                        <textarea
                          id='config-body'
                          value={configFields.body || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              body: e.target.value,
                            })
                          }
                          placeholder='New issue created!'
                          rows={4}
                          required
                        />
                      </div>
                    </>
                  )}

                  {(selectedReactionType === 2 ||
                    selectedReactionType === 3) && (
                    <>
                      <div className='form-group'>
                        <label htmlFor='config-webhookUrl'>Webhook URL</label>
                        <input
                          id='config-webhookUrl'
                          type='url'
                          value={configFields.webhookUrl || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              webhookUrl: e.target.value,
                            })
                          }
                          placeholder='https://hooks.slack.com/services/...'
                          required
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='config-message'>Message</label>
                        <textarea
                          id='config-message'
                          value={configFields.message || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              message: e.target.value,
                            })
                          }
                          placeholder='New event received!'
                          rows={4}
                          required
                        />
                      </div>
                    </>
                  )}

                  {selectedReactionType === 4 && (
                    <>
                      <div className='form-group'>
                        <label htmlFor='config-url'>URL</label>
                        <input
                          id='config-url'
                          type='url'
                          value={configFields.url || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              url: e.target.value,
                            })
                          }
                          placeholder='https://api.example.com/endpoint'
                          required
                        />
                      </div>
                      <div className='form-group'>
                        <label htmlFor='config-body-http'>Body (JSON)</label>
                        <textarea
                          id='config-body-http'
                          value={configFields.body || ''}
                          onChange={(e) =>
                            setConfigFields({
                              ...configFields,
                              body: e.target.value,
                            })
                          }
                          placeholder='{"key": "value"}'
                          rows={4}
                          required
                        />
                      </div>
                    </>
                  )}
                </fieldset>
              )}

              <div className='form-actions'>
                <button
                  type='button'
                  onClick={handleCreateReaction}
                  className='btn-primary'
                  disabled={isCreatingReaction}
                >
                  {isCreatingReaction ? 'Creating...' : 'Create Reaction'}
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className='btn-secondary'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <ul className='webhook-list'>
            {isLoadingReactions && reactions.length === 0 ? (
              <li className='no-webhooks'>Loading reactions...</li>
            ) : reactions.length === 0 ? (
              <li className='no-webhooks'>No reactions configured</li>
            ) : (
              reactions.map((reaction) => (
                <li key={reaction.id} className='webhook-item'>
                  <div className='webhook-info'>
                    <div>
                      <strong>Reaction #{reaction.id}</strong>
                      <span
                        className='badge active'
                        style={{ marginLeft: '10px' }}
                      >
                        {getReactionTypeName(reaction.reactionType)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.9em',
                        color: '#666',
                        marginTop: '5px',
                      }}
                    >
                      Webhook ID: {reaction.hookId}
                    </div>
                  </div>
                  <div className='webhook-events'>
                    {Object.entries(reaction.config).map(([key, value]) => (
                      <div
                        key={key}
                        style={{ fontSize: '0.85em', marginBottom: '3px' }}
                      >
                        <strong>{key}:</strong> {String(value).substring(0, 50)}
                        {String(value).length > 50 && '...'}
                      </div>
                    ))}
                  </div>
                  <button
                    type='button'
                    onClick={() => handleDeleteReaction(reaction.id)}
                    className='btn-secondary'
                    style={{ marginTop: '10px' }}
                  >
                    Delete
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
