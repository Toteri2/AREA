import {
  useAppSelector,
  useGetGithubAuthUrlQuery,
  useGetGmailAuthUrlQuery,
  useGetMicrosoftAuthUrlQuery,
  useListMicrosoftWebhooksQuery,
  useListRepositoriesQuery,
} from '../shared/src/web';

function GitHubLinker() {
  const { refetch: getAuthUrl } = useGetGithubAuthUrlQuery(undefined);
  const { isLoading, isSuccess, isError } = useListRepositoriesQuery();

  const handleLinkGithub = async () => {
    try {
      const result = await getAuthUrl();
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else if (result.error) {
        console.error('Failed to fetch GitHub auth URL:', result.error);
        alert('Failed to connect to GitHub. Please try again later.');
      } else {
        console.warn('No URL returned from GitHub auth endpoint');
        alert('Unable to initiate GitHub authentication. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during GitHub auth:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div className='loading-spinner'>Loading...</div>;
  }

  if (isError) {
    return (
      <button type='button' onClick={handleLinkGithub} className='btn-github'>
        Link GitHub Account
      </button>
    );
  }

  if (isSuccess) {
    return (
      <div className='service-linked'>
        <p className='linked-status'>✓ GitHub Account Linked</p>
        <button
          type='button'
          onClick={handleLinkGithub}
          className='btn-github-change'
        >
          Change Account
        </button>
      </div>
    );
  }
  return null;
}

function GmailLinker() {
  const { refetch: getAuthUrl } = useGetGmailAuthUrlQuery(undefined);
  const { isLoading, isSuccess, isError } = useListRepositoriesQuery();

  const handleLinkGmail = async () => {
    try {
      const result = await getAuthUrl();
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else if (result.error) {
        console.error('Failed to fetch Gmail auth URL:', result.error);
        alert('Failed to connect to Gmail. Please try again later.');
      } else {
        console.warn('No URL returned from Gmail auth endpoint');
        alert('Unable to initiate Gmail authentication. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during Gmail auth:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div className='loading-spinner'>Loading...</div>;
  }

  if (isError) {
    return (
      <button type='button' onClick={handleLinkGmail} className='btn-gmail'>
        Link Gmail Account
      </button>
    );
  }

  if (isSuccess) {
    return (
      <div className='service-linked'>
        <p className='linked-status'>✓ Gmail Account Linked</p>
        <button
          type='button'
          onClick={handleLinkGmail}
          className='btn-gmail-change'
        >
          Change Account
        </button>
      </div>
    );
  }
  return null;
}

function MicrosoftLinker() {
  const { refetch: getAuthUrl } = useGetMicrosoftAuthUrlQuery(undefined);
  const { isLoading, isSuccess, isError } = useListMicrosoftWebhooksQuery();

  const handleLinkMicrosoft = async () => {
    try {
      const result = await getAuthUrl();
      if (result.data?.url) {
        window.location.href = result.data.url;
      } else if (result.error) {
        console.error('Failed to fetch Microsoft auth URL:', result.error);
        alert('Failed to connect to Microsoft. Please try again later.');
      } else {
        console.warn('No URL returned from Microsoft auth endpoint');
        alert('Unable to initiate Microsoft authentication. Please try again.');
      }
    } catch (error) {
      console.error('Unexpected error during Microsoft auth:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  if (isLoading) {
    return <div className='loading-spinner'>Loading...</div>;
  }

  if (isError) {
    return (
      <button
        type='button'
        onClick={handleLinkMicrosoft}
        className='btn-microsoft'
      >
        Link Microsoft Account
      </button>
    );
  }

  if (isSuccess) {
    return (
      <div className='service-linked'>
        <p className='linked-status'>✓ Microsoft Account Linked</p>
        <button
          type='button'
          onClick={handleLinkMicrosoft}
          className='btn-microsoft-change'
        >
          Change Account
        </button>
      </div>
    );
  }

  return null;
}

export function Profile() {
  const { user } = useAppSelector((state) => state.auth);

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
          <GitHubLinker />
          <GmailLinker />
          <MicrosoftLinker />
        </div>
      </div>
    </div>
  );
}
