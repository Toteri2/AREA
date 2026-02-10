import { useEffect, useState } from 'react';
import { useListJiraProjectsQuery } from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

const JIRA_EVENTS = [
  { value: 'jira:issue_created', label: 'Issue Created' },
  { value: 'jira:issue_updated', label: 'Issue Updated' },
  { value: 'jira:issue_deleted', label: 'Issue Deleted' },
];

export function JiraConfigForm({ config, onChange }: ConfigFormProps) {
  const [selectedProject, setSelectedProject] = useState<string>(
    (config.projectKey as string) || ''
  );
  const [selectedEvents, setSelectedEvents] = useState<string[]>(
    (config.events as string[]) || []
  );

  const { data: projects = [], isLoading: isLoadingProjects } =
    useListJiraProjectsQuery();

  useEffect(() => {
    onChange({
      projectKey: selectedProject,
      events: selectedEvents,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject, selectedEvents]);

  const handleEventChange = (eventValue: string) => {
    setSelectedEvents((prev) => {
      if (prev.includes(eventValue)) {
        return prev.filter((e) => e !== eventValue);
      }
      return [...prev, eventValue];
    });
  };

  return (
    <>
      <div className='config-form-group'>
        <label htmlFor='jira-project'>Project</label>
        {isLoadingProjects ? (
          <div className='loading-spinner'>Loading projects...</div>
        ) : (
          <select
            id='jira-project'
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value=''>-- Select a Project --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.key}>
                {project.name} ({project.key})
              </option>
            ))}
          </select>
        )}
      </div>

      <div className='config-form-group'>
        <span>Events to Trigger On</span>
        <div className='checkbox-group'>
          {JIRA_EVENTS.map((event) => (
            <label key={event.value} className='checkbox-label'>
              <input
                type='checkbox'
                value={event.value}
                checked={selectedEvents.includes(event.value)}
                onChange={() => handleEventChange(event.value)}
              />
              {event.label}
            </label>
          ))}
        </div>
      </div>

      <style>{`
        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
