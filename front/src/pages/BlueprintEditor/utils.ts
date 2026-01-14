// Utility functions for the Blueprint Editor

// Generate a node ID for a webhook based on its service type
export const generateActionNodeId = (
  service: string,
  hookId: number
): string => {
  switch (service) {
    case 'microsoft':
      return `action_ms_${hookId}`;
    case 'gmail':
      return `action_gmail_${hookId}`;
    case 'jira':
      return `action_jira_${hookId}`;
    default:
      return `action_${hookId}`;
  }
};

export const generateReactionNodeId = (reactionId: number): string => {
  return `reaction_${reactionId}`;
};

let nodeIdCounter = 1000;
export const generateUniqueNodeId = (): string => {
  return `node_${nodeIdCounter++}`;
};

export const generateEdgeId = (
  sourceId: string | number,
  targetId: string | number
): string => {
  return `edge_${sourceId}_${targetId}`;
};
