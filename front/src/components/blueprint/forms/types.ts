export interface ConfigFormProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
  eventType?: string;
  actions?: { name: string; description: string }[];
}
