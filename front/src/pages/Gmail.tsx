import { useState } from 'react';
import {
  type GmailSubscription,
  useCreateGmailSubscriptionMutation,
  useDeleteGmailSubscriptionMutation,
  useListGmailWebhooksQuery,
} from '../shared/src/web';

export const GMAIL_EVENT_TYPES = {
  MESSAGE_IN_INBOX: 1,
  MESSAGE_RECEIVED: 2,
  MESSAGE_DELETED: 3,
} as const;

export const GMAIL_EVENT_TYPE_LABELS: Record<number, string> = {
  [GMAIL_EVENT_TYPES.MESSAGE_IN_INBOX]: 'Message received in inbox',
  [GMAIL_EVENT_TYPES.MESSAGE_RECEIVED]: 'Message received',
  [GMAIL_EVENT_TYPES.MESSAGE_DELETED]: 'Message deleted',
};

function CreateSubscriptionForm({ onClose }: { onClose: () => void }) {
  const [eventType, setEventType] = useState<number>(1);
  const [createSubscription, { isLoading, error }] =
    useCreateGmailSubscriptionMutation();

  const handleCreate = async () => {
    try {
      await createSubscription({
        eventType,
      }).unwrap();
      onClose();
    } catch (_err) {
      /* empty */
    }
  };

  return (
    <div className='webhook-form'>
      <h3>Create New Subscription</h3>
      <div className='form-group'>
        <label htmlFor='event-type'>Event Type</label>
        <select
          id='event-type'
          value={eventType}
          onChange={(e) => setEventType(Number(e.target.value))}
        >
          {Object.entries(GMAIL_EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className='error-message'>
          Failed to create subscription. See console for details.
        </div>
      )}
      <div className='form-actions'>
        <button
          type='button'
          onClick={handleCreate}
          className='btn-primary'
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </button>
        <button type='button' onClick={onClose} className='btn-secondary'>
          Cancel
        </button>
      </div>
    </div>
  );
}

export function Gmail() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const {
    data: subscriptions,
    isLoading,
    isError,
  } = useListGmailWebhooksQuery();
  const [deleteSubscription, { isLoading: isDeleting }] =
    useDeleteGmailSubscriptionMutation();

  const handleDelete = async (id: string) => {
    try {
      await deleteSubscription({ id }).unwrap();
    } catch (_err) {
      /* empty */
    }
  };

  return (
    <div className='Gmail-page'>
      <h1>Gmail Integration</h1>
      <div className='Gmail-content'>
        <div className='webhooks-section'>
          <h2>Gmail Graph Subscriptions</h2>
          {!showCreateForm && (
            <button
              type='button'
              onClick={() => setShowCreateForm(true)}
              className='btn-primary'
            >
              Create Subscription
            </button>
          )}

          {showCreateForm && (
            <CreateSubscriptionForm onClose={() => setShowCreateForm(false)} />
          )}

          {isLoading && <p>Loading subscriptions...</p>}
          {isError && (
            <div className='error-message'>
              Failed to load subscriptions. Is your Gmail account linked?
            </div>
          )}

          <ul className='webhook-list'>
            {subscriptions && subscriptions.length === 0 && (
              <li className='no-webhooks'>No subscriptions configured.</li>
            )}
            {subscriptions?.map((sub: GmailSubscription) => (
              <li key={sub.id} className='webhook-item'>
                <div className='webhook-info'>
                  <span>
                    Action :{' '}
                    {GMAIL_EVENT_TYPE_LABELS[sub.eventType] ??
                      'Unknown event type'}
                  </span>
                </div>
                <button
                  type='button'
                  onClick={() => handleDelete(sub.id)}
                  className='btn-delete'
                  disabled={isDeleting}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
