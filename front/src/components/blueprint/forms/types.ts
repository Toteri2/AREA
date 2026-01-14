export interface ConfigFormProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
  actions?: { name: string; description: string }[];
}
