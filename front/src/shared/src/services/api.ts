import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { persistToken } from '../features/authSlice';
import type { RootState } from '../store';
import type {
  AboutResponse,
  ApiAuthResponse,
  CreateReactionDto,
  CreateWebhookDto,
  Hook,
  MicrosoftSubscription,
  Reaction,
  Repository,
  User,
  Webhook,
} from '../types';

const baseQueryCache = new Map<string, ReturnType<typeof fetchBaseQuery>>();

const getCachedBaseQuery = (baseUrl: string) => {
  if (!baseQueryCache.has(baseUrl)) {
    baseQueryCache.set(
      baseUrl,
      fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers, { getState }) => {
          const token = (getState() as RootState).auth.token;
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        },
      })
    );
  }
  const cachedQuery = baseQueryCache.get(baseUrl);
  if (!cachedQuery) {
    throw new Error(`Failed to get cached base query for URL: ${baseUrl}`);
  }
  return cachedQuery;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const baseUrl = (api.getState() as RootState).config.baseUrl;
    const cachedBaseQuery = getCachedBaseQuery(baseUrl);
    return cachedBaseQuery(args, api, extraOptions);
  },
  tagTypes: [
    'User',
    'Repos',
    'Webhooks',
    'MicrosoftSubscriptions',
    'GmailSubscriptions',
    'Reactions',
  ],
  endpoints: (builder) => ({
    // --- Auth & User ---
    login: builder.mutation<
      ApiAuthResponse,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(persistToken(data.access_token));
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<
      { id: number; email: string; name: string; token: string },
      { email: string; password: string; name: string }
    >({
      query: (userInfo) => ({
        url: '/auth/register',
        method: 'POST',
        body: userInfo,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.token));
      },
    }),
    getProfile: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    connection: builder.query<{ connected: boolean }, { provider: string }>({
      query: ({ provider }) => ({
        url: '/users/connection',
        method: 'GET',
        params: { provider },
      }),
    }),
    getServices: builder.query<AboutResponse, void>({
      query: () => ({
        url: '/about.json',
        method: 'GET',
      }),
    }),

    // --- Google Auth ---
    googleAuthUrl: builder.query<{ url: string }, { mobile: string }>({
      query: ({ mobile }) => ({
        url: `/auth/google/url?mobile=${mobile}`,
        method: 'GET',
        responseHandler: 'text',
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    googleAuthValidate: builder.mutation<
      { access_token: string },
      { code: string; state?: string }
    >({
      query: (authData) => ({
        url: '/auth/google/validate',
        method: 'POST',
        body: authData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.access_token));
      },
    }),

    // --- GitHub ---
    getGithubAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/github/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateGithub: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/github/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    listRepositories: builder.query<Repository[], void>({
      query: () => '/github/repositories',
      providesTags: ['Repos'],
    }),
    listGithubWebhooks: builder.query<Hook[], void>({
      query: () => '/github/webhook',
      transformResponse: (hooks: Hook[]) =>
        hooks.map((hook) => ({
          ...hook,
          config: hook.additionalInfos,
        })),
      providesTags: ['Webhooks'],
    }),
    listWebhooks: builder.query<Webhook[], { owner: string; repo: string }>({
      // Legacy or Repo-specific?
      query: ({ owner, repo }) =>
        `/github/repositories/${owner}/${repo}/webhooks`,
      providesTags: (result, error, { repo }) => [
        { type: 'Webhooks', id: repo },
      ],
    }),
    createWebhook: builder.mutation<
      { result: unknown; hookId: number },
      CreateWebhookDto
    >({
      // GitHub
      query: (dto) => ({
        url: '/github/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, dto) => [
        'Webhooks',
        { type: 'Webhooks', id: dto.repo },
      ],
    }),
    deleteGithubWebhook: builder.mutation<void, { id: number }>({
      query: ({ id }) => ({
        url: `/github/webhook/${id}`,
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['Webhooks'],
    }),

    // --- Microsoft ---
    getMicrosoftAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/microsoft/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateMicrosoft: builder.mutation<{ success: boolean }, { code: string }>(
      {
        query: ({ code }) => ({
          url: '/auth/microsoft/validate',
          method: 'POST',
          body: { code },
        }),
      }
    ),
    listMicrosoftWebhooks: builder.query<Hook[], void>({
      query: () => '/microsoft/webhook',
      providesTags: ['MicrosoftSubscriptions', 'Webhooks'],
    }),
    createMicrosoftSubscription: builder.mutation<
      MicrosoftSubscription,
      { resource: string; changeType: string }
    >({
      query: (dto) => ({
        url: '/microsoft/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['MicrosoftSubscriptions', 'Webhooks'],
    }),
    deleteMicrosoftSubscription: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/microsoft/webhook/${id}`,
        method: 'DELETE',
        body: { id },
      }),
      invalidatesTags: ['MicrosoftSubscriptions', 'Webhooks'],
    }),

    // --- Gmail ---
    getGmailAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/gmail/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateGmail: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/gmail/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    listGmailWebhooks: builder.query<Hook[], void>({
      query: () => '/gmail/webhook',
      providesTags: ['GmailSubscriptions', 'Webhooks'],
    }),
    createGmailSubscription: builder.mutation<
      { hookId: number; valid: boolean },
      { eventType: number; topicName: string }
    >({
      query: (dto) => ({
        url: '/gmail/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['GmailSubscriptions', 'Webhooks'],
    }),
    deleteGmailSubscription: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/gmail/webhook/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GmailSubscriptions', 'Webhooks'],
    }),

    // --- Discord ---
    getDiscordAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/discord/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateDiscord: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/discord/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    listDiscordGuilds: builder.query<
      Array<{ id: string; name: string; icon: string | null }>,
      void
    >({
      query: () => '/discord/guilds',
    }),
    listDiscordChannels: builder.query<
      Array<{ id: string; name: string; type: number }>,
      { guildId: string }
    >({
      query: ({ guildId }) => `/discord/guilds/${guildId}/channels`,
    }),
    listDiscordWebhooks: builder.query<
      Array<{ id: string; guildId: string; channelId: string }>,
      { guildId: string }
    >({
      query: ({ guildId }) => `/discord/guilds/${guildId}/webhooks`,
    }),
    createDiscordWebhook: builder.mutation<
      { id: string },
      { guildId: string; channelId: string; events: string[] }
    >({
      query: (dto) => ({
        url: '/discord/create-webhook',
        method: 'POST',
        body: dto,
      }),
    }),

    // --- Jira ---
    getJiraAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/jira/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateJira: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/jira/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    listJiraProjects: builder.query<
      Array<{ id: string; key: string; name: string }>,
      void
    >({
      query: () => '/jira/projects',
    }),
    listJiraWebhooks: builder.query<
      Array<{ id: string; projectKey: string; events: string[] }>,
      void
    >({
      query: () => '/jira/webhooks',
    }),
    createJiraWebhook: builder.mutation<
      { id: string },
      { projectKey: string; events: string[] }
    >({
      query: (dto) => ({
        url: '/jira/create-webhook',
        method: 'POST',
        body: dto,
      }),
    }),
    deleteJiraWebhook: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/jira/webhook/${id}`,
        method: 'DELETE',
      }),
    }),

    // --- Reactions ---
    listReactions: builder.query<Reaction[], void>({
      query: () => '/reactions',
      providesTags: ['Reactions'],
    }),
    createReaction: builder.mutation<Reaction, CreateReactionDto>({
      query: (dto) => ({
        url: '/reactions',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Reactions'],
    }),
    deleteReaction: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reactions'],
    }),

    // --- Legacy / Generic ---
    listUserWebhooks: builder.query<Hook[], void>({
      query: () => '/users/webhooks',
      providesTags: ['Webhooks'],
    }),
  }),
});

export const {
  // Auth & User
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useConnectionQuery,
  useGetServicesQuery,

  // Google
  useGoogleAuthUrlQuery,
  useGoogleAuthValidateMutation,

  // GitHub
  useGetGithubAuthUrlQuery,
  useLazyGetGithubAuthUrlQuery,
  useValidateGithubMutation,
  useListRepositoriesQuery,
  useListGithubWebhooksQuery,
  useListWebhooksQuery,
  useCreateWebhookMutation,
  useDeleteGithubWebhookMutation,

  // Microsoft
  useGetMicrosoftAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  useValidateMicrosoftMutation,
  useListMicrosoftWebhooksQuery,
  useCreateMicrosoftSubscriptionMutation,
  useDeleteMicrosoftSubscriptionMutation,

  // Gmail
  useGetGmailAuthUrlQuery,
  useLazyGetGmailAuthUrlQuery,
  useValidateGmailMutation,
  useListGmailWebhooksQuery,
  useCreateGmailSubscriptionMutation,
  useDeleteGmailSubscriptionMutation,

  // Discord
  useGetDiscordAuthUrlQuery,
  useValidateDiscordMutation,
  useListDiscordGuildsQuery,
  useListDiscordChannelsQuery,
  useListDiscordWebhooksQuery,
  useCreateDiscordWebhookMutation,

  // Jira
  useGetJiraAuthUrlQuery,
  useValidateJiraMutation,
  useListJiraProjectsQuery,
  useListJiraWebhooksQuery,
  useCreateJiraWebhookMutation,
  useDeleteJiraWebhookMutation,

  // Reactions
  useListReactionsQuery,
  useCreateReactionMutation,
  useDeleteReactionMutation,

  // Legacy
  useListUserWebhooksQuery,
} = apiSlice;
