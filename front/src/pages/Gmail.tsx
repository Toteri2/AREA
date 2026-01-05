import { useState } from 'react';
import {
  type GmailSubscription,
  useCreateGmailSubscriptionMutation,
  useDeleteGmailSubscriptionMutation,
  useListGmailWebhooksQuery,
} from '../shared/src/web';

function CreateSubscriptionForm({ onClose }: { onClose: () => void }) {
  const [resource, setResource] = useState('me/mailFolders/inbox/messages');
  const [changeType, setChangeType] = useState('created');
  const [createSubscription, { isLoading, error }] =
    useCreateGmailSubscriptionMutation();

  const handleCreate = async () => {
    try {
      await createSubscription({ resource, changeType }).unwrap();
      onClose();
    } catch (_err) {
      /* empty */
    }
  };

  const resourceOptions = [
    { value: 'me/mailFolders/inbox/messages', label: 'Inbox Messages' },
    { value: 'me/messages', label: 'All Messages' },
    { value: 'me/events', label: 'Calendar Events' },
    { value: 'me/contacts', label: 'Contacts' },
  ];

  const changeTypeOptions = [
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'deleted', label: 'Deleted' },
  ];

  return (
    <div className='webhook-form'>
      <h3>Create New Subscription</h3>
      <div className='form-group'>
        <label htmlFor='resource-select'>Resource</label>
        <select
          id='resource-select'
          value={resource}
          onChange={(e) => setResource(e.target.value)}
        >
          {resourceOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className='form-group'>
        <label htmlFor='changetype-select'>Change Type</label>
        <select
          id='changetype-select'
          value={changeType}
          onChange={(e) => setChangeType(e.target.value)}
        >
          {changeTypeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
                  <span className='webhook-url'>Resource: {sub.resource}</span>
                  <span>Changes: {sub.changeType}</span>
                  <span>
                    Expires: {new Date(sub.expirationDateTime).toLocaleString()}
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
