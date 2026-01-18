import { useEffect, useState } from 'react';
import {
  useLazyListJiraProjectIssuesQuery,
  useListJiraProjectsQuery,
} from '../../../shared/src/web';
import type { ConfigFormProps } from './types';

interface ConfigDefinition {
  label: string;
  fields: string[];
}

const STANDARD_ISSUE_TYPES = ['Task', 'Bug', 'Story'];
const STANDARD_PRIORITIES = ['High', 'Medium', 'Low'];

export function ReactionJiraConfigForm({
  config,
  onChange,
  configDef,
}: ConfigFormProps & { configDef: ConfigDefinition }) {
  const { data: jiraProjects = [], isLoading: isLoadingJiraProjects } =
    useListJiraProjectsQuery(undefined);

  const [
    triggerGetIssues,
    { data: projectIssues = [], isFetching: isLoadingIssues },
  ] = useLazyListJiraProjectIssuesQuery();

  const [selectedProjectForIssue, setSelectedProjectForIssue] = useState('');

  const updateConfigField = useCallback(
    (field: string, value: string) => {
      onChange({ ...config, [field]: value });
    },
    [config, onChange]
  );

  useEffect(() => {
    if (!config.issueType) {
      updateConfigField('issueType', 'Task');
    }
    if (!config.priority) {
      updateConfigField('priority', 'Medium');
    }
  }, [config.issueType, config.priority, updateConfigField]);


  const handleProjectSelectForIssue = (projectKey: string) => {
    setSelectedProjectForIssue(projectKey);
    if (projectKey) {
      triggerGetIssues({ projectKey });
    }
  };

  return (
    <>
      {configDef.fields.includes('projectKey') && (
        <div className='config-form-group'>
          <label htmlFor='config-project-key'>Project Key</label>
          {isLoadingJiraProjects ? (
            <div className='loading-spinner'>Loading projects...</div>
          ) : (
            <select
              id='config-project-key'
              value={(config.projectKey as string) || ''}
              onChange={(e) => updateConfigField('projectKey', e.target.value)}
            >
              <option value=''>-- Select a Project --</option>
              {jiraProjects.map((project) => (
                <option key={project.id} value={project.key}>
                  {project.name} ({project.key})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {configDef.fields.includes('description') && (
        <div className='config-form-group'>
          <label htmlFor='config-description'>Description</label>
          <textarea
            id='config-description'
            value={(config.description as string) || ''}
            onChange={(e) => updateConfigField('description', e.target.value)}
            placeholder='Issue description...'
          />
        </div>
      )}

      {configDef.fields.includes('issueType') && (
        <div className='config-form-group'>
          <label htmlFor='config-issue-type'>Issue Type</label>
          <select
            id='config-issue-type-select'
            value={(config.issueType as string) || 'Task'}
            onChange={(e) => updateConfigField('issueType', e.target.value)}
          >
            {STANDARD_ISSUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      )}

      {configDef.fields.includes('priority') && (
        <div className='config-form-group'>
          <label htmlFor='config-priority'>Priority</label>
          <select
            id='config-priority-select'
            value={(config.priority as string) || 'Medium'}
            onChange={(e) => updateConfigField('priority', e.target.value)}
          >
            {STANDARD_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      )}

      {configDef.fields.includes('labels') && (
        <div className='config-form-group'>
          <label htmlFor='config-labels'>Labels</label>
          <input
            id='config-labels'
            type='text'
            value={(config.labels as string) || ''}
            onChange={(e) => updateConfigField('labels', e.target.value)}
            placeholder='bug, frontend, (comma separated)'
          />
        </div>
      )}

      {configDef.fields.includes('summary') && (
        <div className='config-form-group'>
          <label htmlFor='config-summary'>Summary</label>
          <input
            id='config-summary'
            type='text'
            value={(config.summary as string) || ''}
            onChange={(e) => updateConfigField('summary', e.target.value)}
            placeholder='Issue summary'
          />
        </div>
      )}

      {configDef.fields.includes('issueKey') && (
        <div className='config-form-group'>
          <label htmlFor='config-issue-key'>Issue Key</label>

          {/* Helper to find issue key */}
          <div
            style={{
              marginBottom: '0.5rem',
              padding: '0.5rem',
              background: '#f5f5f5',
              borderRadius: '4px',
            }}
          >
            <small
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#666',
              }}
            >
              Helper: Select existing issue
            </small>
            <select
              value={selectedProjectForIssue}
              onChange={(e) => handleProjectSelectForIssue(e.target.value)}
              style={{ marginBottom: '0.5rem' }}
            >
              <option value=''>-- 1. Select Project --</option>
              {jiraProjects.map((project) => (
                <option key={project.id} value={project.key}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              disabled={!selectedProjectForIssue || isLoadingIssues}
              onChange={(e) => {
                if (e.target.value)
                  updateConfigField('issueKey', e.target.value);
              }}
              value={''}
            >
              <option value=''>-- 2. Select Issue --</option>
              {isLoadingIssues ? (
                <option disabled>Loading...</option>
              ) : (
                projectIssues.map((issue) => (
                  <option key={issue.id} value={issue.key}>
                    {issue.key}: {issue.fields?.summary || 'No Summary'}
                  </option>
                ))
              )}
            </select>
          </div>

          <input
            id='config-issue-key'
            type='text'
            value={(config.issueKey as string) || ''}
            onChange={(e) => updateConfigField('issueKey', e.target.value)}
            placeholder='PROJ-123'
          />
        </div>
      )}

      {configDef.fields.includes('transitionName') && (
        <div className='config-form-group'>
          <label htmlFor='config-transition-name'>Transition Name</label>
          <input
            id='config-transition-name'
            type='text'
            value={(config.transitionName as string) || ''}
            onChange={(e) =>
              updateConfigField('transitionName', e.target.value)
            }
            placeholder='Done, In Progress...'
          />
        </div>
      )}

      {configDef.fields.includes('comment') && (
        <div className='config-form-group'>
          <label htmlFor='config-comment'>Comment</label>
          <textarea
            id='config-comment'
            value={(config.comment as string) || ''}
            onChange={(e) => updateConfigField('comment', e.target.value)}
            placeholder='Comment...'
          />
        </div>
      )}
    </>
  );
}
