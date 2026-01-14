import { useEffect, useState } from 'react';
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

export function GithubConfigForm({ config, onChange }: ConfigFormProps) {
  const [selectedRepo, setSelectedRepo] = useState<string>(
    (config.repo as string) || ''
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    (config.events as string[]) || ['push']
  );

  const { data: repositories = [], isLoading: isLoadingRepos } =
    useListRepositoriesQuery();

  useEffect(() => {
    onChange({
      repo: selectedRepo,
      events: selectedEvents,
    });
  }, [selectedRepo, selectedEvents]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
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
            onChange={(e) => setSelectedRepo(e.target.value)}
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
