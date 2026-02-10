export class JiraWebhookDto {
  webhookEvent: string;
  timestamp: number;
  issue?: {
    id: string;
    key: string;
    fields: {
      summary: string;
      description?: any;
      status?: {
        name: string;
      };
      assignee?: {
        accountId: string;
        displayName: string;
        emailAddress: string;
      };
      priority?: {
        name: string;
      };
      labels?: string[];
      issuetype?: {
        name: string;
      };
    };
  };
  user?: {
    accountId: string;
    displayName: string;
    emailAddress: string;
  };
  changelog?: {
    items: Array<{
      field: string;
      fieldtype: string;
      from: string;
      fromString: string;
      to: string;
      toString: string;
    }>;
  };
  comment?: {
    id: string;
    author: {
      accountId: string;
      displayName: string;
      emailAddress: string;
    };
    body: any;
    created: string;
  };
}
