import { ReactionDiscordConfigForm } from './ReactionDiscordConfigForm';
import { ReactionEmailConfigForm } from './ReactionEmailConfigForm';
import { ReactionJiraConfigForm } from './ReactionJiraConfigForm';
import type { ConfigFormProps } from './types';

interface ConfigDefinition {
  label: string;
  fields: string[];
  service?: string;
}

export function ReactionConfigForm({
  config,
  onChange,
  configDef,
}: ConfigFormProps & { configDef: ConfigDefinition }) {
  if (configDef.service === 'discord') {
    return (
      <ReactionDiscordConfigForm
        config={config}
        onChange={onChange}
        configDef={configDef}
      />
    );
  }

  if (configDef.service === 'jira') {
    return (
      <ReactionJiraConfigForm
        config={config}
        onChange={onChange}
        configDef={configDef}
      />
    );
  }

  if (configDef.service === 'gmail' || configDef.service === 'microsoft') {
    return (
      <ReactionEmailConfigForm
        config={config}
        onChange={onChange}
        configDef={configDef}
      />
    );
  }
  return <div>Configuration not available for this service.</div>;
}
