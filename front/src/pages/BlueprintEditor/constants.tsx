import { BiLogoGmail } from 'react-icons/bi';
import {
  MdAddComment,
  MdAddTask,
  MdAssignment,
  MdEmail,
  MdFolder,
  MdLabel,
  MdMessage,
  MdWindow,
} from 'react-icons/md';
import { SiDiscord, SiGithub, SiJira, SiTwitch } from 'react-icons/si';

// Service icons for visual display
export const SERVICE_ICONS: Record<string, React.ReactNode> = {
  discord: <SiDiscord color='#5865f2' />,
  github: <SiGithub color='black' />,
  gmail: <BiLogoGmail color='#ea4335' />,
  jira: <SiJira color='#0052cc' />,
  microsoft: <MdWindow color='#0078d4' />,
  twitch: <SiTwitch color='#9146ff' />,
};

// Reaction icons
export const REACTION_ICONS: Record<string, React.ReactNode> = {
  // Discord
  send_message: <MdMessage color='#5865f2' />,
  add_role_to_user: <MdLabel color='#5865f2' />,
  create_private_channel: <MdFolder color='#5865f2' />,

  // Microsoft/Gmail
  send_email: <MdEmail color='#ea4335' />,

  // Jira
  create_issue: <MdAddTask color='#0052cc' />,
  add_comment: <MdAddComment color='#0052cc' />,
  update_status: <MdAssignment color='#0052cc' />,
};

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
