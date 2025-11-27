import { useState, useEffect } from 'react'
import { githubApi } from '../api'
import type { Repository, Webhook, CreateWebhookDto } from '../types'

export function GitHub() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>(['push'])
  const [webhookSecret, setWebhookSecret] = useState('')

  useEffect(() => {
    loadRepositories()
  }, [])

  const loadRepositories = async () => {
    try {
      setIsLoading(true)
      const repos = await githubApi.listRepositories()
      setRepositories(Array.isArray(repos) ? repos : [])
    } catch (err) {
      setError('Failed to load repositories. Make sure your GitHub account is linked.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWebhooks = async (owner: string, repo: string) => {
    try {
      const hooks = await githubApi.listWebhooks(owner, repo)
      setWebhooks(hooks)
    } catch (err) {
      setWebhooks([])
    }
  }

  const handleSelectRepo = async (repo: Repository) => {
    setSelectedRepo(repo)
    await loadWebhooks(repo.owner.login, repo.name)
  }

  const handleCreateWebhook = async () => {
    if (!selectedRepo) return

    try {
      const dto: CreateWebhookDto = {
        owner: selectedRepo.owner.login,
        repo: selectedRepo.name,
        events: webhookEvents,
        secret: webhookSecret || undefined,
      }
      await githubApi.createWebhook(dto)
      await loadWebhooks(selectedRepo.owner.login, selectedRepo.name)
      setShowCreateForm(false)
      setWebhookUrl('')
      setWebhookSecret('')
      setWebhookEvents(['push'])
    } catch (err) {
      setError('Failed to create webhook')
    }
  }

  const availableEvents = ['push', 'pull_request', 'issues', 'create', 'delete', 'release']

  const toggleEvent = (event: string) => {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  if (isLoading) {
    return <div className="loading">Loading repositories...</div>
  }

  if (error && repositories.length === 0) {
    return (
      <div className="github-page">
        <h1>GitHub Integration</h1>
        <div className="error-message">{error}</div>
        <p>Please link your GitHub account from your profile page.</p>
      </div>
    )
  }

  return (
    <div className="github-page">
      <h1>GitHub Integration</h1>

      <div className="github-content">
        <div className="repositories-section">
          <h2>Your Repositories</h2>
          <ul className="repo-list">
            {repositories.map((repo) => (
              <li
                key={repo.id}
                className={`repo-item ${selectedRepo?.id === repo.id ? 'selected' : ''}`}
                onClick={() => handleSelectRepo(repo)}
              >
                <span className="repo-name">{repo.full_name}</span>
                {repo.private && <span className="badge private">Private</span>}
              </li>
            ))}
          </ul>
        </div>

        {selectedRepo && (
          <div className="webhooks-section">
            <h2>Webhooks for {selectedRepo.full_name}</h2>
            <button onClick={() => setShowCreateForm(true)} className="btn-primary">
              Create Webhook
            </button>

            {showCreateForm && (
              <div className="webhook-form">
                <h3>Create New Webhook</h3>
                <div className="form-group">
                  <label>Secret (optional)</label>
                  <input
                    type="text"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder="Webhook secret"
                  />
                </div>
                <div className="form-group">
                  <label>Events</label>
                  <div className="events-checkboxes">
                    {availableEvents.map((event) => (
                      <label key={event} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={webhookEvents.includes(event)}
                          onChange={() => toggleEvent(event)}
                        />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button onClick={handleCreateWebhook} className="btn-primary">
                    Create
                  </button>
                  <button onClick={() => setShowCreateForm(false)} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <ul className="webhook-list">
              {webhooks.length === 0 ? (
                <li className="no-webhooks">No webhooks configured</li>
              ) : (
                webhooks.map((webhook) => (
                  <li key={webhook.id} className="webhook-item">
                    <div className="webhook-info">
                      <span className="webhook-url">{webhook.config.url}</span>
                      <span className={`badge ${webhook.active ? 'active' : 'inactive'}`}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="webhook-events">
                      {webhook.events.map((event) => (
                        <span key={event} className="event-badge">
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
  )
}
