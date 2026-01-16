import { skipToken } from '@reduxjs/toolkit/query';
import {
  useAppSelector,
  // useListDiscordWebhooksQuery,
  // useListMicrosoftWebhooksQuery,
  useConnectionQuery,
  useGetDiscordAuthUrlQuery,
  useGetGithubAuthUrlQuery,
  useGetGmailAuthUrlQuery,
  useGetJiraAuthUrlQuery,
  useGetMicrosoftAuthUrlQuery,
  useGetServicesQuery,
  useGetTwitchAuthUrlQuery,
} from '../shared/src/web';

type Service = {
  name: string;
  actions: { name: string; description: string }[];
  reactions: { name: string; description: string }[];
};

type ServiceLinkerProps = {
  label: string;
  isLoading: boolean;
  isLinked: boolean;
  onLink: () => void;
};

function ServiceLinker({
  label,
  isLoading,
  isLinked,
  onLink,
}: ServiceLinkerProps) {
  if (isLoading) {
    return <div className='loading-spinner'>Loading...</div>;
  }

  if (!isLinked) {
    return (
      <button
        type='button'
        onClick={onLink}
        className={`btn-${label.toLowerCase()}`}
      >
        Link {label} Account
      </button>
    );
  }

  return (
    <div className='service-linked'>
      <p className='linked-status'>✓ {label} Account Linked</p>
      <button
        type='button'
        onClick={onLink}
        className={`btn-${label.toLowerCase()}-change`}
      >
        Change Account
      </button>
    </div>
  );
}

function Profile() {
  const { user } = useAppSelector((state) => state.auth);

  const { data: servicesData } = useGetServicesQuery();
  const services: Service[] = servicesData?.server?.services ?? [];

  const serviceNames = new Set(services.map((s) => s.name));

  const { refetch: getGithubAuthUrl } = useGetGithubAuthUrlQuery(
    serviceNames.has('github') ? undefined : skipToken
  );

  const { refetch: getGmailAuthUrl } = useGetGmailAuthUrlQuery(
    serviceNames.has('gmail') ? undefined : skipToken
  );

  const { refetch: getMicrosoftAuthUrl } = useGetMicrosoftAuthUrlQuery(
    serviceNames.has('microsoft') ? undefined : skipToken
  );

  const { refetch: getDiscordAuthUrl } = useGetDiscordAuthUrlQuery(
    serviceNames.has('discord') ? undefined : skipToken
  );

  const { refetch: getJiraAuthUrl } = useGetJiraAuthUrlQuery(
    serviceNames.has('jira') ? undefined : skipToken
  );

  const { refetch: getTwitchAuthUrl } = useGetTwitchAuthUrlQuery(
    serviceNames.has('twitch') ? undefined : skipToken
  );

  const githubConnection = useConnectionQuery(
    serviceNames.has('github') ? { provider: 'github' } : skipToken
  );

  const gmailConnection = useConnectionQuery(
    serviceNames.has('gmail') ? { provider: 'gmail' } : skipToken
  );

  const microsoftConnection = useConnectionQuery(
    serviceNames.has('microsoft') ? { provider: 'microsoft' } : skipToken
  );

  const discordConnection = useConnectionQuery(
    serviceNames.has('discord') ? { provider: 'discord' } : skipToken
  );

  const jiraConnection = useConnectionQuery(
    serviceNames.has('jira') ? { provider: 'jira' } : skipToken
  );

  const twitchConnection = useConnectionQuery(
    serviceNames.has('twitch') ? { provider: 'twitch' } : skipToken
  );

  const handleOAuthRedirect = async (
    getUrl: () => Promise<{ data?: { url: string }; error?: unknown }>,
    label: string
  ) => {
    try {
      const result = await getUrl();
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else {
        console.error(`Failed to fetch ${label} auth URL`, result.error);
        alert(`Unable to connect to ${label}`);
      }
    } catch (err) {
      console.error(err);
      alert('Unexpected error occurred');
    }
  };

  return (
    <div className='profile'>
      <h1>Profile</h1>

      <div className='profile-card'>
        <div className='profile-info'>
          <div className='info-row'>
            <span className='info-label'>ID:</span>
            <span>{user?.id}</span>
          </div>
          <div className='info-row'>
            <span className='info-label'>Name:</span>
            <span>{user?.name}</span>
          </div>
          <div className='info-row'>
            <span className='info-label'>Email:</span>
            <span>{user?.email}</span>
          </div>
        </div>

        <div className='profile-actions'>
          <h3>Connected Services</h3>

          {services.map((service) => {
            switch (service.name) {
              case 'github':
                return (
                  <ServiceLinker
                    key='github'
                    label='GitHub'
                    isLoading={githubConnection.isLoading}
                    isLinked={githubConnection.data?.connected === true}
                    onLink={() =>
                      handleOAuthRedirect(getGithubAuthUrl, 'GitHub')
                    }
                  />
                );

              case 'gmail':
                return (
                  <ServiceLinker
                    key='gmail'
                    label='Gmail'
                    isLoading={gmailConnection.isLoading}
                    isLinked={gmailConnection.data?.connected === true}
                    onLink={() => handleOAuthRedirect(getGmailAuthUrl, 'Gmail')}
                  />
                );

              case 'microsoft':
                return (
                  <ServiceLinker
                    key='microsoft'
                    label='Microsoft'
                    isLoading={microsoftConnection.isLoading}
                    isLinked={microsoftConnection.data?.connected === true}
                    onLink={() =>
                      handleOAuthRedirect(getMicrosoftAuthUrl, 'Microsoft')
                    }
                  />
                );

              case 'discord':
                return (
                  <ServiceLinker
                    key='discord'
                    label='Discord'
                    isLoading={discordConnection.isLoading}
                    isLinked={discordConnection.data?.connected === true}
                    onLink={() =>
                      handleOAuthRedirect(getDiscordAuthUrl, 'Discord')
                    }
                  />
                );

              case 'jira':
                return (
                  <ServiceLinker
                    key='jira'
                    label='Jira'
                    isLoading={jiraConnection.isLoading}
                    isLinked={jiraConnection.data?.connected === true}
                    onLink={() => handleOAuthRedirect(getJiraAuthUrl, 'Jira')}
                  />
                );

              case 'twitch':
                return (
                  <ServiceLinker
                    key='twitch'
                    label='Twitch'
                    isLoading={twitchConnection.isLoading}
                    isLinked={twitchConnection.data?.connected === true}
                    onLink={() =>
                      handleOAuthRedirect(getTwitchAuthUrl, 'Twitch')
                    }
                  />
                );

              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}

export { Profile };
export default Profile;
