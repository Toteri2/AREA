import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

/**
 * Valid Jira webhook events based on Atlassian documentation
 * @see https://developer.atlassian.com/cloud/jira/platform/webhooks/
 */
export const VALID_JIRA_EVENTS = [
  'jira:issue_created',
  'jira:issue_updated',
  'jira:issue_deleted',
  'comment_created',
  'comment_updated',
  'comment_deleted',
  'jira:worklog_updated',
  'issuelink_created',
  'issuelink_deleted',
  'worklog_created',
  'worklog_updated',
  'worklog_deleted',
  'project_created',
  'project_updated',
  'project_deleted',
  'jira:version_released',
  'jira:version_unreleased',
  'jira:version_created',
  'jira:version_moved',
  'jira:version_updated',
  'jira:version_deleted',
  'user_created',
  'user_updated',
  'user_deleted',
  'option_voting_changed',
  'option_watching_changed',
  'option_unassigned_issues_changed',
  'option_subtasks_changed',
  'option_attachments_changed',
  'option_issuelinks_changed',
  'option_timetracking_changed',
  'sprint_created',
  'sprint_deleted',
  'sprint_updated',
  'sprint_started',
  'sprint_closed',
  'board_created',
  'board_updated',
  'board_deleted',
  'board_configuration_changed',
] as const;

export class CreateJiraWebhookDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The Jira project key to filter webhook events',
    example: 'AREA',
    required: true,
  })
  projectKey: string;

  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    description: 'List of Jira webhook events to subscribe to',
    example: ['jira:issue_created', 'jira:issue_updated', 'comment_created'],
    type: [String],
    required: true,
    isArray: true,
  })
  events: string[];
}
