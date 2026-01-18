import { useEffect } from 'react';
import { useListRepositoriesQuery } from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

// GitHub events
const GITHUB_EVENTS = [
  { id: 'push', label: 'Push' },
  { id: 'pull_request', label: 'Pull Request' },
  { id: 'issues', label: 'Issues' },
  { id: 'create', label: 'Create (branch/tag)' },
  { id: 'delete', label: 'Delete (branch/tag)' },
  { id: 'release', label: 'Release' },
];

export function GithubConfigForm({
  config,
  onChange,
  eventType,
}: ConfigFormProps) {
  const { data: repositories = [], isLoading: isLoadingRepos } =
    useListRepositoriesQuery();

  const selectedRepo = (config.repo as string) || '';
  const selectedEvents = (config.events as string[]) || ['push'];

  useEffect(() => {
    if (!config.events) {
      const initialEvent = config.eventType || eventType || 'push';
      const eventId = String(initialEvent).replace('github.', '');
      const isValidEvent = GITHUB_EVENTS.some((e) => e.id === eventId);
      onChange({ ...config, events: [isValidEvent ? eventId : 'push'] });
    }
  }, [config.events, onChange, config, eventType]);

  const handleRepoChange = (repo: string) => {
    onChange({ ...config, repo });
  };

  const toggleEvent = (eventId: string) => {
    const currentEvents = (config.events as string[]) || ['push'];
    const newEvents = currentEvents.includes(eventId)
      ? currentEvents.filter((e) => e !== eventId)
      : [...currentEvents, eventId];

    onChange({ ...config, events: newEvents });
  };

  return (
    <>
      <div className='config-form-group'>
        <label htmlFor='github-repo'>Repository</label>
        {config.repo ? (
          <input
            type='text'
            value={selectedRepo}
            disabled
            className='config-input'
          />
        ) : isLoadingRepos ? (
          <div className='loading-spinner'>Loading repositories...</div>
        ) : (
          <select
            id='github-repo'
            value={selectedRepo}
            onChange={(e) => handleRepoChange(e.target.value)}
          >
            <option value=''>-- Select a repository --</option>
            {repositories.map((repo) => (
              <option key={repo.id} value={repo.full_name}>
                {repo.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className='config-form-group'>
        <label htmlFor='github-events'>Events to trigger on</label>
        <div id='github-events' className='checkbox-group'>
          {GITHUB_EVENTS.map((event) => (
            <label key={event.id} className='checkbox-label'>
              <input
                type='checkbox'
                checked={selectedEvents.includes(event.id)}
                onChange={() => toggleEvent(event.id)}
              />
              {event.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
