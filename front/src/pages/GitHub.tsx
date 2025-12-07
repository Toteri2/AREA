import { type FormEvent, useState } from 'react';
import type { CreateWebhookDto, Repository } from '../shared/src/web';
import {
  useCreateWebhookMutation,
  useListRepositoriesQuery,
  useListWebhooksQuery,
} from '../shared/src/web';

export function GitHub() {
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['push']);
  const [webhookSecret, setWebhookSecret] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: repositories = [],
    isLoading: isLoadingRepos,
    error: reposError,
  } = useListRepositoriesQuery();
  const { data: webhooks = [] } = useListWebhooksQuery(
    {
      owner: selectedRepo?.owner.login || '',
      repo: selectedRepo?.name || '',
    },
    { skip: !selectedRepo }
  );
  const [createWebhook, { isLoading: isCreatingWebhook }] =
    useCreateWebhookMutation();

  const handleSelectRepo = (repo: Repository) => {
    setSelectedRepo(repo);
    setShowCreateForm(false);
    setErrorMessage('');
  };

  const handleCreateWebhook = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedRepo) return;

    try {
      const dto: CreateWebhookDto = {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        webhookUrl,
        events: webhookEvents,
        secret: webhookSecret || undefined,
      };
      await createWebhook(dto).unwrap();
      setShowCreateForm(false);
      setWebhookUrl('');
      setWebhookSecret('');
      setWebhookEvents(['push']);
    } catch (err) {
      const apiError = err as { data?: { message: string } };
      const message = apiError.data?.message || 'Failed to create webhook.';
      setErrorMessage(message);
      console.error('Failed to create webhook:', err);
    }
  };

  const toggleEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  if (isLoadingRepos) {
    return <div className='loading'>Loading repositories...</div>;
  }

  if (reposError && repositories.length === 0) {
    return (
      <div className='github-page'>
        <h1>GitHub Integration</h1>
        <div className='error-message'>
          Failed to load repositories. Make sure your GitHub account is linked.
        </div>
        <p>Please link your GitHub account from your profile page.</p>
      </div>
    );
  }

  return (
    <div className='github-page'>
      <h1>GitHub Integration</h1>

      <div className='github-content'>
        <div className='repositories-section'>
          <h2>Your Repositories</h2>
          <ul className='repo-list'>
            {repositories.map((repo) => (
              <li key={repo.id}>
                <button
                  type='button'
                  className={`repo-item ${selectedRepo?.id === repo.id ? 'selected' : ''}`}
                  onClick={() => handleSelectRepo(repo)}
                >
                  <span className='repo-name'>{repo.full_name}</span>
                  {repo.private && (
                    <span className='badge private'>Private</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedRepo && (
          <div className='webhooks-section'>
            <h2>Webhooks for {selectedRepo.full_name}</h2>
            <button
              type='button'
              onClick={() => setShowCreateForm(true)}
              className='btn-primary'
            >
              Create Webhook
            </button>

            {showCreateForm && (
              <form className='webhook-form' onSubmit={handleCreateWebhook}>
                <h3>Create New Webhook</h3>
                {errorMessage && (
                  <div className='error-message'>{errorMessage}</div>
                )}
                <div className='form-group'>
                  <label htmlFor='webhook-url'>Payload URL</label>
                  <input
                    id='webhook-url'
                    type='url'
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder='https://example.com/webhook'
                    required
                  />
                </div>
                <div className='form-group'>
                  <label htmlFor='webhook-secret'>Secret (optional)</label>
                  <input
                    id='webhook-secret'
                    type='text'
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder='Webhook secret'
                  />
                </div>
                <fieldset className='form-group'>
                  <legend>Events</legend>
                  <div className='events-checkboxes'>
                    {[
                      'push',
                      'pull_request',
                      'issues',
                      'create',
                      'delete',
                      'release',
                    ].map((event) => (
                      <label key={event} className='checkbox-label'>
                        <input
                          type='checkbox'
                          checked={webhookEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className='form-actions'>
                  <button
                    type='submit'
                    className='btn-primary'
                    disabled={isCreatingWebhook}
                  >
                    {isCreatingWebhook ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type='button'
                    onClick={() => setShowCreateForm(false)}
                    className='btn-secondary'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <ul className='webhook-list'>
              {webhooks.length === 0 ? (
                <li className='no-webhooks'>No webhooks configured</li>
              ) : (
                webhooks.map((webhook) => (
                  <li key={webhook.id} className='webhook-item'>
                    <div className='webhook-info'>
                      <span className='webhook-url'>{webhook.config.url}</span>
                      <span
                        className={`badge ${webhook.active ? 'active' : 'inactive'}`}
                      >
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className='webhook-events'>
                      {webhook.events.map((event) => (
                        <span key={event} className='event-badge'>
                          {event}
                        </span>
                      ))}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
