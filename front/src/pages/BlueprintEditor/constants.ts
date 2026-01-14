// Constants and configuration for the Blueprint Editor

// Service icons for visual display
export const SERVICE_ICONS: Record<string, string> = {
  discord: '🎮',
  github: '🐙',
  gmail: '📧',
  jira: '🎫',
  microsoft: '✉️',
  twitch: '📺',
};

// Reaction icons
export const REACTION_ICONS: Record<string, string> = {
  send_message: '💬',
  add_role_to_user: '🏷️',
  create_private_channel: '📁',
  send_email: '✉️',
  create_issue: '🎫',
  add_comment: '💭',
  update_status: '📋',
};

// Mapping of service names and reaction types to their numeric IDs
export const REACTION_ID_MAP: Record<string, Record<string, number>> = {
  microsoft: { send_email: 1 },
  discord: { send_message: 2, create_private_channel: 3, add_role_to_user: 4 },
  gmail: { send_email: 5 },
  jira: { create_issue: 6, add_comment: 7, update_status: 8 },
};

export const getReactionId = (
  serviceName: string,
  reactionName: string
): number => {
  const serviceMap = REACTION_ID_MAP[serviceName];
  if (serviceMap?.[reactionName]) return serviceMap[reactionName];
  console.warn(
    `Unknown reaction ID for ${serviceName}:${reactionName}, defaulting to 0`
  );
  return 0;
};
